/**
 * Module J — Historical Strategy Backtesting & Research Engine
 * Evaluates CRT, SMC, ICT, and Technical strategies bar-by-bar with ZERO look-ahead bias.
 *
 * Key Guarantees:
 *  - At bar index `i`, signal detectors only inspect `candles.slice(0, i + 1)`.
 *  - Trade execution and exits are evaluated strictly on subsequent bars `j > i`.
 *  - Models configurable spread, commission per lot, and execution slippage in pips.
 *  - Computes win rate, profit factor, expectancy, R-multiples, max drawdown, equity curve, and session breakdown.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import {
  OHLCVCandle,
  BacktestConfiguration,
  SimulatedTradeRecord,
  BacktestRunResult
} from '../models/intelligence.types';
import { getInstrumentSpec, roundPrice } from './marketData.service';
import { TechnicalAnalysisService } from './technicalAnalysis.service';
import { CRTAnalysisService } from './crtAnalysis.service';
import { SMCEngineService } from './smcEngine.service';
import { RiskGuardianService } from './risk.service';

export const DEFAULT_BACKTEST_CONFIG: BacktestConfiguration = {
  strategyId: 'CRT_SWEEP_REENTRY',
  symbol: 'EURUSD',
  timeframe: 'H1',
  initialCapital: 10000,
  riskPerTradePct: 1.0,
  rewardToRiskTarget: 2.0,
  spreadPips: 1.0,
  commissionPerLot: 7.0,
  slippagePips: 0.3,
  maxBarsHold: 24,
  sessionFilter: ['London', 'New York', 'London/NY Overlap', 'Asia']
};

export class BacktestingService {
  /**
   * Runs a deterministic bar-by-bar historical backtest on the provided OHLCV series.
   * Zero look-ahead bias: signal generation at bar `i` only sees `candles.slice(0, i + 1)`.
   */
  public static async runBacktest(
    candles: OHLCVCandle[],
    partialConfig: Partial<BacktestConfiguration>,
    userId?: string,
    persistRun: boolean = false
  ): Promise<BacktestRunResult> {
    const config: BacktestConfiguration = {
      ...DEFAULT_BACKTEST_CONFIG,
      ...partialConfig
    };

    const spec = getInstrumentSpec(config.symbol);
    const warmupBars = 22;

    if (candles.length <= warmupBars + 2) {
      return {
        id: uuidv4(),
        config,
        ruleVersion: 'BACKTEST-ENGINE-v1.0.0',
        startTimestamp: candles[0]?.timestamp || new Date().toISOString(),
        endTimestamp: candles[candles.length - 1]?.timestamp || new Date().toISOString(),
        barsEvaluated: candles.length,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRatePct: 0,
        profitFactor: 0,
        expectancyCurrency: 0,
        expectancyR: 0,
        averageWinCurrency: 0,
        averageLossCurrency: 0,
        averageRMultiple: 0,
        netProfitCurrency: 0,
        netProfitPct: 0,
        maxDrawdownCurrency: 0,
        maxDrawdownPct: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        trades: [],
        equityCurve: [
          {
            timestamp: candles[0]?.timestamp || new Date().toISOString(),
            equity: config.initialCapital,
            drawdownPct: 0
          }
        ],
        breakdownBySession: {},
        assumptionsAndLimitations: [
          `Insufficient candle history (${candles.length} bars) for backtest warmup (requires > ${warmupBars + 2} bars).`
        ],
        createdAt: new Date().toISOString()
      };
    }

    let currentEquity = config.initialCapital;
    let peakEquity = config.initialCapital;
    let maxDrawdownCurrency = 0;
    let maxDrawdownPct = 0;

    const trades: SimulatedTradeRecord[] = [];
    const equityCurve: Array<{ timestamp: string; equity: number; drawdownPct: number }> = [
      { timestamp: candles[warmupBars].timestamp, equity: currentEquity, drawdownPct: 0 }
    ];

    let i = warmupBars;
    while (i < candles.length - 2) {
      // Strictly slice history up to bar `i` (no future candles)
      const visibleWindow = candles.slice(Math.max(0, i - 60), i + 1);
      const signalCandle = candles[i];
      const sessionAtEntry = CRTAnalysisService.getSessionFromUtcTimestamp(signalCandle.timestamp);

      const sessionAllowed =
        !config.sessionFilter ||
        config.sessionFilter.length === 0 ||
        config.sessionFilter.includes(sessionAllowedNormalize(sessionAtEntry)) ||
        config.sessionFilter.includes('ALL');

      let signal: {
        direction: 'BUY' | 'SELL';
        stopLossPrice: number;
        setupNote: string;
      } | null = null;

      if (sessionAllowed) {
        signal = this.evaluateStrategySignalAtBar(
          config.strategyId,
          spec.symbol,
          visibleWindow
        );
      }

      if (!signal) {
        i++;
        continue;
      }

      // Enter at the open of bar `i + 1` plus realistic spread/slippage
      const entryBar = candles[i + 1];
      const frictionPriceOffset =
        (config.spreadPips * 0.5 + config.slippagePips) * spec.pipSize;
      const entryPrice = roundPrice(
        spec.symbol,
        signal.direction === 'BUY'
          ? entryBar.open + frictionPriceOffset
          : entryBar.open - frictionPriceOffset
      );

      const rawSlDist = Math.abs(entryPrice - signal.stopLossPrice);
      const minStopDist = spec.pipSize * 6;
      const stopDist = Math.max(rawSlDist, minStopDist);

      const stopLossPrice = roundPrice(
        spec.symbol,
        signal.direction === 'BUY' ? entryPrice - stopDist : entryPrice + stopDist
      );
      const takeProfitPrice = roundPrice(
        spec.symbol,
        signal.direction === 'BUY'
          ? entryPrice + stopDist * config.rewardToRiskTarget
          : entryPrice - stopDist * config.rewardToRiskTarget
      );

      // Size position using RiskGuardianService
      const sizing = RiskGuardianService.calculatePositionSize({
        accountBalance: currentEquity,
        accountEquity: currentEquity,
        accountCurrency: 'USD',
        riskPercentage: config.riskPerTradePct,
        symbol: spec.symbol,
        direction: signal.direction,
        entryPrice,
        stopLossPrice,
        commissionPerLotRoundTurn: config.commissionPerLot,
        spreadPipsOverride: config.spreadPips
      });

      const lotSize = sizing.recommendedLotSize > 0 ? sizing.recommendedLotSize : spec.minLot;

      // Step forward bar-by-bar from `i + 1` up to `i + 1 + maxBarsHold` to resolve exit
      let exitIdx = Math.min(candles.length - 1, i + 1 + config.maxBarsHold);
      let exitPrice = candles[exitIdx].close;
      let outcome: SimulatedTradeRecord['outcome'] = 'TIME_EXIT';

      for (let j = i + 1; j <= exitIdx; j++) {
        const bar = candles[j];
        if (signal.direction === 'BUY') {
          // Conservative intra-bar assumption: check Stop Loss first if both SL and TP touched in same bar
          if (bar.low <= stopLossPrice) {
            exitIdx = j;
            exitPrice = stopLossPrice;
            outcome = 'LOSS';
            break;
          }
          if (bar.high >= takeProfitPrice) {
            exitIdx = j;
            exitPrice = takeProfitPrice;
            outcome = 'WIN';
            break;
          }
        } else {
          if (bar.high >= stopLossPrice) {
            exitIdx = j;
            exitPrice = stopLossPrice;
            outcome = 'LOSS';
            break;
          }
          if (bar.low <= takeProfitPrice) {
            exitIdx = j;
            exitPrice = takeProfitPrice;
            outcome = 'WIN';
            break;
          }
        }
      }

      const exitBar = candles[exitIdx];
      const priceDiffSigned =
        signal.direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
      const pipsCaptured = priceDiffSigned / spec.pipSize;

      const grossPnl = Number(
        (
          lotSize *
          pipsCaptured *
          sizing.pipValuePerStandardLotInAccountCurrency
        ).toFixed(2)
      );
      const frictionCost = Number(
        (
          lotSize *
          (config.commissionPerLot +
            (config.spreadPips + config.slippagePips) *
              sizing.pipValuePerStandardLotInAccountCurrency)
        ).toFixed(2)
      );
      const netPnl = Number((grossPnl - frictionCost).toFixed(2));

      const risk1R =
        sizing.effectiveRiskAmountWithFriction > 0
          ? sizing.effectiveRiskAmountWithFriction
          : (currentEquity * config.riskPerTradePct) / 100;
      const rMultipleNet = risk1R > 0 ? Number((netPnl / risk1R).toFixed(2)) : 0;

      if (outcome === 'TIME_EXIT') {
        if (netPnl > 0) outcome = 'WIN';
        else if (netPnl < 0) outcome = 'LOSS';
        else outcome = 'BREAKEVEN';
      }

      currentEquity = Number((currentEquity + netPnl).toFixed(2));
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const ddCurrency = Number((peakEquity - currentEquity).toFixed(2));
      const ddPct = peakEquity > 0 ? Number(((ddCurrency / peakEquity) * 100).toFixed(2)) : 0;
      if (ddCurrency > maxDrawdownCurrency) maxDrawdownCurrency = ddCurrency;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

      trades.push({
        tradeIndex: trades.length + 1,
        direction: signal.direction,
        entryTimestamp: entryBar.timestamp,
        exitTimestamp: exitBar.timestamp,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        exitPrice: roundPrice(spec.symbol, exitPrice),
        lotSize,
        grossPnl,
        frictionCost,
        netPnl,
        rMultipleNet,
        outcome,
        sessionAtEntry,
        setupTriggerNote: signal.setupNote
      });

      equityCurve.push({
        timestamp: exitBar.timestamp,
        equity: currentEquity,
        drawdownPct: ddPct
      });

      // Advance index `i` to `exitIdx` so we do not open overlapping positions on the same signal
      i = exitIdx + 1;
    }

    // Compute aggregate statistics
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.netPnl > 0);
    const losses = trades.filter((t) => t.netPnl < 0);
    const breakevens = trades.filter((t) => t.netPnl === 0);

    const winRatePct =
      totalTrades > 0 ? Number(((wins.length / totalTrades) * 100).toFixed(2)) : 0;
    const grossProfitSum = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLossAbs = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
    const profitFactor =
      grossLossAbs > 0
        ? Number((grossProfitSum / grossLossAbs).toFixed(2))
        : grossProfitSum > 0
        ? 99.99
        : 0;

    const netProfitCurrency = Number((currentEquity - config.initialCapital).toFixed(2));
    const netProfitPct =
      config.initialCapital > 0
        ? Number(((netProfitCurrency / config.initialCapital) * 100).toFixed(2))
        : 0;

    const expectancyCurrency =
      totalTrades > 0 ? Number((netProfitCurrency / totalTrades).toFixed(2)) : 0;
    const averageRMultiple =
      totalTrades > 0
        ? Number(
            (trades.reduce((s, t) => s + t.rMultipleNet, 0) / totalTrades).toFixed(2)
          )
        : 0;

    const averageWinCurrency =
      wins.length > 0 ? Number((grossProfitSum / wins.length).toFixed(2)) : 0;
    const averageLossCurrency =
      losses.length > 0 ? Number((-grossLossAbs / losses.length).toFixed(2)) : 0;

    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let curWins = 0;
    let curLosses = 0;
    for (const t of trades) {
      if (t.netPnl > 0) {
        curWins++;
        curLosses = 0;
        if (curWins > maxConsecutiveWins) maxConsecutiveWins = curWins;
      } else if (t.netPnl < 0) {
        curLosses++;
        curWins = 0;
        if (curLosses > maxConsecutiveLosses) maxConsecutiveLosses = curLosses;
      }
    }

    // Breakdown by session
    const breakdownBySession: BacktestRunResult['breakdownBySession'] = {};
    for (const t of trades) {
      if (!breakdownBySession[t.sessionAtEntry]) {
        breakdownBySession[t.sessionAtEntry] = {
          trades: 0,
          winRatePct: 0,
          netPnl: 0,
          avgR: 0
        };
      }
      const b = breakdownBySession[t.sessionAtEntry];
      b.trades++;
      b.netPnl = Number((b.netPnl + t.netPnl).toFixed(2));
      b.avgR += t.rMultipleNet;
      if (t.netPnl > 0) {
        b.winRatePct += 1; // temporarily store win count
      }
    }
    for (const k of Object.keys(breakdownBySession)) {
      const b = breakdownBySession[k];
      if (b.trades > 0) {
        b.winRatePct = Number(((b.winRatePct / b.trades) * 100).toFixed(1));
        b.avgR = Number((b.avgR / b.trades).toFixed(2));
      }
    }

    const result: BacktestRunResult = {
      id: uuidv4(),
      config,
      ruleVersion: 'BACKTEST-ENGINE-v1.0.0',
      startTimestamp: candles[0].timestamp,
      endTimestamp: candles[candles.length - 1].timestamp,
      barsEvaluated: candles.length,
      totalTrades,
      winningTrades: wins.length,
      losingTrades: losses.length,
      breakevenTrades: breakevens.length,
      winRatePct,
      profitFactor,
      expectancyCurrency,
      expectancyR: averageRMultiple,
      averageWinCurrency,
      averageLossCurrency,
      averageRMultiple,
      netProfitCurrency,
      netProfitPct,
      maxDrawdownCurrency,
      maxDrawdownPct,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      trades,
      equityCurve,
      breakdownBySession,
      assumptionsAndLimitations: [
        'Zero look-ahead bias: signals at bar i only inspect closed bars [0..i] and execute at bar i+1 open.',
        'Conservative intra-bar resolution: if both Stop Loss and Take Profit lie within the same candle high-low range, Stop Loss is assumed hit first.',
        `Friction modeled: Spread=${config.spreadPips} pips, Slippage=${config.slippagePips} pips, Round-Turn Commission=$${config.commissionPerLot.toFixed(2)}/lot.`,
        'Historical simulation performance does not guarantee future live execution results.'
      ],
      createdAt: new Date().toISOString()
    };

    if (persistRun && userId) {
      await this.saveBacktestRun(userId, result);
    }

    return result;
  }

  /**
   * Evaluates strategy entry conditions on the strictly visible window `[0..i]`.
   */
  private static evaluateStrategySignalAtBar(
    strategyId: BacktestConfiguration['strategyId'],
    symbol: string,
    visibleCandles: OHLCVCandle[]
  ): { direction: 'BUY' | 'SELL'; stopLossPrice: number; setupNote: string } | null {
    const spec = getInstrumentSpec(symbol);
    const len = visibleCandles.length;
    if (len < 15) return null;

    const curr = visibleCandles[len - 1];
    const prev = visibleCandles[len - 2];
    const atr =
      TechnicalAnalysisService.calculateATR(visibleCandles, 14) || spec.pipSize * 15;

    if (strategyId === 'CRT_SWEEP_REENTRY') {
      // Evaluate CRT on previous candle range vs current candle sweep + close back inside
      const ref = visibleCandles[len - 2];
      const sweptLowAndClosedInside =
        curr.low < ref.low - spec.pipSize * 1.0 &&
        curr.close > ref.low &&
        curr.close < ref.high &&
        curr.close > curr.open;
      if (sweptLowAndClosedInside) {
        return {
          direction: 'BUY',
          stopLossPrice: curr.low - spec.pipSize * 2,
          setupNote: `Bullish CRT Low Sweep (${roundPrice(symbol, curr.low)} < Ref Low ${roundPrice(symbol, ref.low)}) + Re-entry Close`
        };
      }

      const sweptHighAndClosedInside =
        curr.high > ref.high + spec.pipSize * 1.0 &&
        curr.close < ref.high &&
        curr.close > ref.low &&
        curr.close < curr.open;
      if (sweptHighAndClosedInside) {
        return {
          direction: 'SELL',
          stopLossPrice: curr.high + spec.pipSize * 2,
          setupNote: `Bearish CRT High Sweep (${roundPrice(symbol, curr.high)} > Ref High ${roundPrice(symbol, ref.high)}) + Re-entry Close`
        };
      }
      return null;
    }

    if (strategyId === 'SMC_FVG_ORDER_BLOCK') {
      const smc = SMCEngineService.analyzeSMC(symbol, curr.timeframe, visibleCandles);
      const bullFvg = smc.fairValueGaps.find(
        (g) =>
          g.type === 'BULLISH_FVG' &&
          (g.mitigationStatus === 'PARTIALLY_MITIGATED' ||
            g.mitigationStatus === 'CONSEQUENT_ENCROACHMENT_TESTED') &&
          curr.low <= g.upperPrice &&
          curr.close >= g.consequentEncroachment &&
          curr.close > curr.open
      );
      if (bullFvg && smc.trendStructure !== 'BEARISH') {
        return {
          direction: 'BUY',
          stopLossPrice: bullFvg.lowerPrice - spec.pipSize * 2,
          setupNote: `Bullish FVG Consequent Encroachment Reaction [${bullFvg.lowerPrice}-${bullFvg.upperPrice}]`
        };
      }

      const bearFvg = smc.fairValueGaps.find(
        (g) =>
          g.type === 'BEARISH_FVG' &&
          (g.mitigationStatus === 'PARTIALLY_MITIGATED' ||
            g.mitigationStatus === 'CONSEQUENT_ENCROACHMENT_TESTED') &&
          curr.high >= g.lowerPrice &&
          curr.close <= g.consequentEncroachment &&
          curr.close < curr.open
      );
      if (bearFvg && smc.trendStructure !== 'BULLISH') {
        return {
          direction: 'SELL',
          stopLossPrice: bearFvg.upperPrice + spec.pipSize * 2,
          setupNote: `Bearish FVG Consequent Encroachment Reaction [${bearFvg.lowerPrice}-${bearFvg.upperPrice}]`
        };
      }
      return null;
    }

    if (strategyId === 'ICT_KILLZONE_OTE') {
      const smc = SMCEngineService.analyzeSMC(symbol, curr.timeframe, visibleCandles);
      if (!smc.dealingRange || !smc.dealingRange.oteZone.isPriceInOte) {
        return null;
      }
      if (
        smc.dealingRange.direction === 'BULLISH_DEALING_RANGE' &&
        curr.close > curr.open
      ) {
        return {
          direction: 'BUY',
          stopLossPrice: smc.dealingRange.swingLowPrice - spec.pipSize * 2,
          setupNote: `ICT Bullish OTE (61.8%-78.6% Discount Retracement at ${roundPrice(symbol, curr.close)})`
        };
      }
      if (
        smc.dealingRange.direction === 'BEARISH_DEALING_RANGE' &&
        curr.close < curr.open
      ) {
        return {
          direction: 'SELL',
          stopLossPrice: smc.dealingRange.swingHighPrice + spec.pipSize * 2,
          setupNote: `ICT Bearish OTE (61.8%-78.6% Premium Retracement at ${roundPrice(symbol, curr.close)})`
        };
      }
      return null;
    }

    if (strategyId === 'MA_TREND_PULLBACK') {
      const closes = visibleCandles.map((c) => c.close);
      const ema20 = TechnicalAnalysisService.calculateEMA(closes, 20);
      const ema50 = TechnicalAnalysisService.calculateEMA(closes, 50);
      if (ema20 === null || ema50 === null) return null;

      if (
        ema20 > ema50 &&
        prev.low <= ema20 &&
        curr.close > ema20 &&
        curr.close > curr.open
      ) {
        return {
          direction: 'BUY',
          stopLossPrice: Math.min(curr.low, prev.low) - atr * 0.4,
          setupNote: `Bullish EMA(20/50) Trend Pullback Rejection`
        };
      }
      if (
        ema20 < ema50 &&
        prev.high >= ema20 &&
        curr.close < ema20 &&
        curr.close < curr.open
      ) {
        return {
          direction: 'SELL',
          stopLossPrice: Math.max(curr.high, prev.high) + atr * 0.4,
          setupNote: `Bearish EMA(20/50) Trend Pullback Rejection`
        };
      }
    }

    return null;
  }

  public static async saveBacktestRun(
    userId: string,
    run: BacktestRunResult
  ): Promise<void> {
    const db = getDatabase();
    await db.run(
      `INSERT INTO backtest_runs (
        id, user_id, strategy_name, symbol, timeframe, start_time, end_time,
        config_payload, metrics_payload, trades_payload, equity_curve_payload, rule_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        run.id,
        userId,
        run.config.strategyId,
        run.config.symbol,
        run.config.timeframe,
        run.startTimestamp,
        run.endTimestamp,
        JSON.stringify(run.config),
        JSON.stringify({
          totalTrades: run.totalTrades,
          winRatePct: run.winRatePct,
          profitFactor: run.profitFactor,
          expectancyR: run.expectancyR,
          netProfitCurrency: run.netProfitCurrency,
          maxDrawdownPct: run.maxDrawdownPct,
          breakdownBySession: run.breakdownBySession
        }),
        JSON.stringify(run.trades),
        JSON.stringify(run.equityCurve),
        run.ruleVersion
      ]
    );
  }

  public static async getSavedBacktestRuns(
    userId: string,
    limit: number = 15
  ): Promise<any[]> {
    const db = getDatabase();
    const rows = await db.query<any>(
      `SELECT * FROM backtest_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      strategyName: r.strategy_name,
      symbol: r.symbol,
      timeframe: r.timeframe,
      startTime: r.start_time,
      endTime: r.end_time,
      config: typeof r.config_payload === 'string' ? JSON.parse(r.config_payload) : r.config_payload,
      metrics: typeof r.metrics_payload === 'string' ? JSON.parse(r.metrics_payload) : r.metrics_payload,
      createdAt: r.created_at
    }));
  }
}

function sessionAllowedNormalize(session: string): string {
  return session;
}
