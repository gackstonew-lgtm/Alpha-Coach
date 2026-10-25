import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { RiskRule } from '../models/types';
import { PositionSizingInput, PositionSizingResult } from '../models/intelligence.types';
import { getInstrumentSpec, priceDiffInPips, roundPrice } from './marketData.service';

// Reference USD exchange rates (1 unit of currency in USD) used as fallback when live cross conversion is not supplied
const FALLBACK_CURRENCY_TO_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.085,
  GBP: 1.295,
  AUD: 0.665,
  NZD: 0.605,
  CAD: 0.725,
  CHF: 1.155,
  JPY: 1 / 150.0
};

export class RiskGuardianService {
  /**
   * Resolves conversion rate from `fromCurrency` (typically instrument quoteCurrency) into `toAccountCurrency`.
   */
  public static resolveQuoteToAccountRate(
    baseCurrency: string,
    quoteCurrency: string,
    accountCurrency: string,
    entryPrice: number,
    customRates?: Record<string, number>
  ): number {
    const quote = quoteCurrency.toUpperCase();
    const base = baseCurrency.toUpperCase();
    const acct = accountCurrency.toUpperCase();

    if (quote === acct) {
      return 1.0;
    }

    if (customRates) {
      const directKey = `${quote}${acct}`;
      const inverseKey = `${acct}${quote}`;
      if (customRates[quote] && customRates[quote] > 0) {
        return customRates[quote];
      }
      if (customRates[directKey] && customRates[directKey] > 0) {
        return customRates[directKey];
      }
      if (customRates[inverseKey] && customRates[inverseKey] > 0) {
        return 1 / customRates[inverseKey];
      }
    }

    // If the instrument itself has accountCurrency as baseCurrency (e.g., USDJPY for a USD account, or EURGBP for a EUR account),
    // then 1 unit of quoteCurrency = (1 / entryPrice) units of accountCurrency!
    if (base === acct && entryPrice > 0) {
      return 1 / entryPrice;
    }

    // Use USD reference bridge: (quote -> USD) / (acct -> USD)
    const quoteInUsd = FALLBACK_CURRENCY_TO_USD_RATES[quote] ?? 1.0;
    const acctInUsd = FALLBACK_CURRENCY_TO_USD_RATES[acct] ?? 1.0;
    return quoteInUsd / acctInUsd;
  }

  /**
   * Module I — Deterministic Position Size, Pip Value, Friction Cost, and Multi-Target R:R Calculator.
   */
  public static calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
    const warnings: string[] = [];
    const spec = getInstrumentSpec(input.symbol);
    const accountCurrency = (input.accountCurrency || 'USD').toUpperCase();
    const balance = Math.max(0, Number(input.accountBalance) || 0);
    const equity =
      input.accountEquity !== undefined && input.accountEquity !== null
        ? Math.max(0, Number(input.accountEquity))
        : balance;

    const sizingCapital = equity > 0 ? Math.min(balance, equity) : balance;
    const riskPct = Math.max(0, Number(input.riskPercentage) || 0);
    if (riskPct > 3.0) {
      warnings.push(
        `High per-trade risk warning: ${riskPct.toFixed(2)}% exceeds institutional 1%–2% risk guideline.`
      );
    }

    const entryPrice = Number(input.entryPrice);
    const stopLossPrice = Number(input.stopLossPrice);
    const stopDistancePrice = Math.abs(entryPrice - stopLossPrice);
    const stopDistancePips = priceDiffInPips(spec.symbol, stopDistancePrice);

    if (stopDistancePips <= 0) {
      warnings.push('Invalid Stop Loss: Stop Loss price must differ from Entry price.');
    } else if (stopDistancePips < spec.typicalSpreadPips * 2) {
      warnings.push(
        `Stop distance (${stopDistancePips} pips) is dangerously tight relative to typical spread (${spec.typicalSpreadPips} pips).`
      );
    }

    const inferredDirection: 'BUY' | 'SELL' =
      input.direction || (stopLossPrice <= entryPrice ? 'BUY' : 'SELL');

    if (inferredDirection === 'BUY' && stopLossPrice >= entryPrice) {
      warnings.push('Directional mismatch: BUY order requires Stop Loss below Entry Price.');
    } else if (inferredDirection === 'SELL' && stopLossPrice <= entryPrice) {
      warnings.push('Directional mismatch: SELL order requires Stop Loss above Entry Price.');
    }

    const pipValuePerStandardLotInQuote = spec.contractSize * spec.pipSize;
    const quoteToAccountRateUsed = this.resolveQuoteToAccountRate(
      spec.baseCurrency,
      spec.quoteCurrency,
      accountCurrency,
      entryPrice,
      input.conversionRatesToAccountCurrency
    );

    const pipValuePerStandardLotInAccountCurrency = Number(
      (pipValuePerStandardLotInQuote * quoteToAccountRateUsed).toFixed(4)
    );

    const spreadPipsAssumed =
      input.spreadPipsOverride !== undefined && input.spreadPipsOverride >= 0
        ? input.spreadPipsOverride
        : spec.typicalSpreadPips;
    const commissionPerLotCurrency = Math.max(0, Number(input.commissionPerLotRoundTurn) || 0);

    const spreadCostPerLotCurrency =
      spreadPipsAssumed * pipValuePerStandardLotInAccountCurrency;
    const totalFrictionCostPerLotCurrency = Number(
      (spreadCostPerLotCurrency + commissionPerLotCurrency).toFixed(2)
    );

    const riskAmountCurrency = Number(((sizingCapital * riskPct) / 100).toFixed(2));

    // Risk per 1.00 standard lot including stop loss + round-turn commission
    const lossPerStandardLotCurrency =
      stopDistancePips * pipValuePerStandardLotInAccountCurrency + commissionPerLotCurrency;

    let recommendedLotSizeRaw = 0;
    let recommendedLotSize = 0;

    if (lossPerStandardLotCurrency > 0 && riskAmountCurrency > 0 && stopDistancePips > 0) {
      recommendedLotSizeRaw = Number(
        (riskAmountCurrency / lossPerStandardLotCurrency).toFixed(4)
      );
      // Floor to lotStep so risk never exceeds target riskAmountCurrency
      const steps = Math.floor((recommendedLotSizeRaw + 1e-9) / spec.lotStep);
      const steppedLots = Number((steps * spec.lotStep).toFixed(2));

      if (steppedLots < spec.minLot) {
        warnings.push(
          `Calculated position size (${recommendedLotSizeRaw.toFixed(3)} lots) is below minimum broker lot size (${spec.minLot}). Executing ${spec.minLot} lot will exceed target risk %.`
        );
        recommendedLotSize = 0;
      } else if (steppedLots > spec.maxLot) {
        warnings.push(
          `Calculated position size (${steppedLots} lots) clamped to instrument maximum lot size (${spec.maxLot}).`
        );
        recommendedLotSize = spec.maxLot;
      } else {
        recommendedLotSize = steppedLots;
      }
    }

    const recommendedUnits = Math.round(recommendedLotSize * spec.contractSize);
    const effectiveRiskAmountWithFriction = Number(
      (
        recommendedLotSize *
        (stopDistancePips * pipValuePerStandardLotInAccountCurrency +
          totalFrictionCostPerLotCurrency)
      ).toFixed(2)
    );
    const effectiveRiskPercentage =
      sizingCapital > 0
        ? Number(((effectiveRiskAmountWithFriction / sizingCapital) * 100).toFixed(2))
        : 0;

    const tpList = input.takeProfitPrices || [];
    const targets = tpList.map((tp, idx) => {
      const rewardDistancePrice =
        inferredDirection === 'BUY' ? tp - entryPrice : entryPrice - tp;
      const rewardPips =
        rewardDistancePrice > 0
          ? priceDiffInPips(spec.symbol, rewardDistancePrice)
          : -priceDiffInPips(spec.symbol, Math.abs(rewardDistancePrice));

      const grossRewardCurrency = Number(
        (
          recommendedLotSize *
          rewardPips *
          pipValuePerStandardLotInAccountCurrency
        ).toFixed(2)
      );
      const frictionTotal = recommendedLotSize * totalFrictionCostPerLotCurrency;
      const netRewardCurrency = Number((grossRewardCurrency - frictionTotal).toFixed(2));

      const rewardToRiskRatioGross =
        stopDistancePips > 0 ? Number((rewardPips / stopDistancePips).toFixed(2)) : 0;
      const rewardToRiskRatioNet =
        effectiveRiskAmountWithFriction > 0
          ? Number((netRewardCurrency / effectiveRiskAmountWithFriction).toFixed(2))
          : rewardToRiskRatioGross;

      return {
        targetIndex: idx + 1,
        targetPrice: roundPrice(spec.symbol, tp),
        rewardPips,
        grossRewardCurrency,
        netRewardCurrency,
        rewardToRiskRatioGross,
        rewardToRiskRatioNet
      };
    });

    return {
      symbol: spec.symbol,
      accountCurrency,
      direction: inferredDirection,
      accountBalance: balance,
      accountEquity: equity,
      riskPercentage: riskPct,
      riskAmountCurrency,
      entryPrice: roundPrice(spec.symbol, entryPrice),
      stopLossPrice: roundPrice(spec.symbol, stopLossPrice),
      stopDistancePrice: roundPrice(spec.symbol, stopDistancePrice),
      stopDistancePips,
      pipSize: spec.pipSize,
      contractSize: spec.contractSize,
      pipValuePerStandardLotInQuote: Number(pipValuePerStandardLotInQuote.toFixed(4)),
      quoteToAccountRateUsed: Number(quoteToAccountRateUsed.toFixed(6)),
      pipValuePerStandardLotInAccountCurrency,
      spreadPipsAssumed,
      commissionPerLotCurrency,
      totalFrictionCostPerLotCurrency,
      recommendedLotSizeRaw,
      recommendedLotSize,
      recommendedUnits,
      effectiveRiskAmountWithFriction,
      effectiveRiskPercentage,
      targets,
      warnings,
      provenance: {
        category: 'DETERMINISTIC_METRIC',
        sourceProvider: 'RISK_GUARDIAN_CALCULATOR',
        retrievedAt: new Date().toISOString(),
        timezone: 'UTC',
        freshnessStatus: 'FRESH',
        ruleVersion: 'RISK-ENGINE-v1.0.0'
      }
    };
  }

  /**
   * Evaluates correlated currency exposure across open positions and a proposed new trade.
   */
  public static async evaluateOpenCurrencyExposure(
    accountId: string | undefined,
    proposedSymbol: string,
    proposedDirection: 'BUY' | 'SELL'
  ): Promise<{
    openPositionsCount: number;
    currencyNetExposure: Record<string, number>;
    correlatedExposureWarnings: string[];
  }> {
    const db = getDatabase();
    let openRows: any[] = [];
    if (accountId && accountId !== 'ALL') {
      openRows = await db.query(
        `SELECT symbol, position_type, total_volume FROM reconstructed_positions WHERE account_id = ? AND status = 'OPEN'`,
        [accountId]
      );
    } else {
      openRows = await db.query(
        `SELECT symbol, position_type, total_volume FROM reconstructed_positions WHERE status = 'OPEN' LIMIT 50`
      );
    }

    const currencyNetExposure: Record<string, number> = {};
    const addExposure = (sym: string, dir: string, lots: number) => {
      const spec = getInstrumentSpec(sym);
      const sign = dir.toUpperCase().includes('BUY') ? 1 : -1;
      currencyNetExposure[spec.baseCurrency] =
        Number(((currencyNetExposure[spec.baseCurrency] || 0) + sign * lots).toFixed(2));
      currencyNetExposure[spec.quoteCurrency] =
        Number(((currencyNetExposure[spec.quoteCurrency] || 0) - sign * lots).toFixed(2));
    };

    for (const r of openRows) {
      addExposure(r.symbol, r.position_type || 'BUY', Number(r.total_volume) || 0.1);
    }

    const proposedSpec = getInstrumentSpec(proposedSymbol);
    const propSign = proposedDirection === 'BUY' ? 1 : -1;
    const warnings: string[] = [];

    const existingBaseExp = currencyNetExposure[proposedSpec.baseCurrency] || 0;
    const existingQuoteExp = currencyNetExposure[proposedSpec.quoteCurrency] || 0;

    if (existingBaseExp * propSign > 0) {
      warnings.push(
        `Correlated ${proposedSpec.baseCurrency} Exposure: You already hold net ${
          existingBaseExp > 0 ? 'LONG' : 'SHORT'
        } ${Math.abs(existingBaseExp)} lots on ${proposedSpec.baseCurrency}. Adding ${proposedDirection} ${
          proposedSpec.symbol
        } compounds single-currency risk.`
      );
    }
    if (existingQuoteExp * -propSign > 0) {
      warnings.push(
        `Correlated ${proposedSpec.quoteCurrency} Exposure: You already hold net ${
          existingQuoteExp > 0 ? 'LONG' : 'SHORT'
        } ${Math.abs(existingQuoteExp)} lots on ${proposedSpec.quoteCurrency}. Adding ${proposedDirection} ${
          proposedSpec.symbol
        } compounds single-currency risk.`
      );
    }

    return {
      openPositionsCount: openRows.length,
      currencyNetExposure,
      correlatedExposureWarnings: warnings
    };
  }

  /**
   * Get or create default risk rule for user/account
   */
  public static async getRules(userId: string, accountId?: string): Promise<RiskRule> {
    const db = getDatabase();
    let rule: RiskRule | undefined;

    if (accountId && accountId !== 'ALL') {
      rule = await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE user_id = ? AND account_id = ?`, [userId, accountId]);
    }

    if (!rule) {
      rule = await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE user_id = ? AND account_id IS NULL`, [userId]);
    }

    if (!rule) {
      const ruleId = uuidv4();
      await db.run(
        `INSERT INTO risk_rules (
          id, user_id, account_id, max_daily_loss_amount, max_daily_loss_pct, max_weekly_loss_amount,
          max_trades_per_day, max_risk_per_trade_pct, max_consecutive_losses, max_drawdown_pct, max_position_size
        ) VALUES (?, ?, ?, 500.0, 2.0, 1500.0, 5, 1.0, 3, 5.0, 5.0)`,
        [ruleId, userId, accountId && accountId !== 'ALL' ? accountId : null]
      );
      rule = (await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE id = ?`, [ruleId]))!;
    }

    return rule;
  }

  /**
   * Update risk rules
   */
  public static async updateRules(userId: string, accountId: string | undefined, updates: Partial<RiskRule>): Promise<RiskRule> {
    const db = getDatabase();
    const existing = await this.getRules(userId, accountId);

    await db.run(
      `UPDATE risk_rules SET
        max_daily_loss_amount = ?,
        max_daily_loss_pct = ?,
        max_weekly_loss_amount = ?,
        max_trades_per_day = ?,
        max_risk_per_trade_pct = ?,
        max_consecutive_losses = ?,
        max_drawdown_pct = ?,
        max_position_size = ?,
        allowed_start_time = ?,
        allowed_end_time = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.max_daily_loss_amount ?? existing.max_daily_loss_amount,
        updates.max_daily_loss_pct ?? existing.max_daily_loss_pct,
        updates.max_weekly_loss_amount ?? existing.max_weekly_loss_amount,
        updates.max_trades_per_day ?? existing.max_trades_per_day,
        updates.max_risk_per_trade_pct ?? existing.max_risk_per_trade_pct,
        updates.max_consecutive_losses ?? existing.max_consecutive_losses,
        updates.max_drawdown_pct ?? existing.max_drawdown_pct,
        updates.max_position_size ?? existing.max_position_size,
        updates.allowed_start_time ?? existing.allowed_start_time,
        updates.allowed_end_time ?? existing.allowed_end_time,
        updates.is_active ?? existing.is_active,
        existing.id
      ]
    );

    return (await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE id = ?`, [existing.id]))!;
  }

  /**
   * Evaluate all risk rules for today's trading activity and record real-time alerts
   */
  public static async evaluateRules(userId: string, accountId: string): Promise<any> {
    const db = getDatabase();
    const rules = await this.getRules(userId, accountId);
    if (!rules || !rules.is_active) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    // Fetch today's closed positions
    const todayTrades = await db.query(
      `SELECT * FROM reconstructed_positions
       WHERE account_id = ? AND status = 'CLOSED' AND (CAST(close_time AS TEXT) LIKE ? OR CAST(open_time AS TEXT) LIKE ?)`,
      [accountId, `${todayStr}%`, `${todayStr}%`]
    );

    let todayNetProfit = 0;
    let todayLossCount = 0;
    let consecutiveLosses = 0;

    for (const t of todayTrades) {
      const net = Number(t.net_profit) || 0;
      todayNetProfit += net;
      if (net < 0) {
        todayLossCount++;
        consecutiveLosses++;
      } else if (net > 0) {
        consecutiveLosses = 0;
      }
    }

    const todayLoss = todayNetProfit < 0 ? Math.abs(todayNetProfit) : 0;
    const tradesUsed = todayTrades.length;

    // Check Daily Loss Threshold
    if (rules.max_daily_loss_amount > 0 && todayLoss >= rules.max_daily_loss_amount) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_DAILY_LOSS_EXCEEDED',
        'CRITICAL',
        `Daily loss limit breached: -$${todayLoss.toFixed(2)} exceeds configured limit of -$${rules.max_daily_loss_amount.toFixed(2)}.`,
        todayLoss,
        rules.max_daily_loss_amount
      );
    } else if (rules.max_daily_loss_amount > 0 && todayLoss >= rules.max_daily_loss_amount * 0.75) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_DAILY_LOSS_WARNING',
        'WARNING',
        `Daily loss is at ${( (todayLoss / rules.max_daily_loss_amount) * 100 ).toFixed(1)}% of your daily limit ($${todayLoss.toFixed(2)} / $${rules.max_daily_loss_amount.toFixed(2)}).`,
        todayLoss,
        rules.max_daily_loss_amount
      );
    }

    // Check Max Trades Per Day
    if (rules.max_trades_per_day > 0 && tradesUsed >= rules.max_trades_per_day) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_TRADES_EXCEEDED',
        'WARNING',
        `Daily trade limit reached: ${tradesUsed} of ${rules.max_trades_per_day} trades executed today.`,
        tradesUsed,
        rules.max_trades_per_day
      );
    }

    // Check Consecutive Losses
    if (rules.max_consecutive_losses > 0 && consecutiveLosses >= rules.max_consecutive_losses) {
      await this.createAlert(
        userId,
        accountId,
        'CONSECUTIVE_LOSS_LIMIT',
        'CRITICAL',
        `${consecutiveLosses} consecutive losses detected today. Step away from terminal to avoid revenge trading.`,
        consecutiveLosses,
        rules.max_consecutive_losses
      );
    }

    return {
      todayTrades: tradesUsed,
      todayNetProfit,
      todayLoss,
      consecutiveLosses,
      dailyLossLimit: rules.max_daily_loss_amount,
      dailyTradesLimit: rules.max_trades_per_day
    };
  }

  private static async createAlert(
    userId: string,
    accountId: string,
    ruleType: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    message: string,
    currentValue: number,
    thresholdValue: number
  ) {
    const db = getDatabase();
    // Prevent spamming identical unacknowledged alerts on the same day
    const existing = await db.get(
      `SELECT id FROM risk_alerts
       WHERE user_id = ? AND account_id = ? AND rule_type = ? AND is_acknowledged = 0
       AND triggered_at >= date('now')`,
      [userId, accountId, ruleType]
    );

    if (!existing) {
      const alertId = uuidv4();
      await db.run(
        `INSERT INTO risk_alerts (id, user_id, account_id, rule_type, severity, message, current_value, threshold_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [alertId, userId, accountId, ruleType, severity, message, currentValue, thresholdValue]
      );

      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link)
         VALUES (?, ?, 'Risk Guardian Alert', ?, 'RISK', '/risk-guardian')`,
        [uuidv4(), userId, message]
      );
    }
  }

  public static async getAlerts(userId: string, accountId?: string) {
    const db = getDatabase();
    let sql = `SELECT * FROM risk_alerts WHERE user_id = ?`;
    const params: any[] = [userId];
    if (accountId && accountId !== 'ALL') {
      sql += ` AND account_id = ?`;
      params.push(accountId);
    }
    sql += ` ORDER BY triggered_at DESC LIMIT 50`;
    return db.query(sql, params);
  }

  public static async acknowledgeAlert(alertId: string, userId: string) {
    const db = getDatabase();
    await db.run(`UPDATE risk_alerts SET is_acknowledged = 1 WHERE id = ? AND user_id = ?`, [alertId, userId]);
  }
}

