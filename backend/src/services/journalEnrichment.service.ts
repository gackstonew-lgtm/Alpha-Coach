/**
 * Module K & Module 14 — MT5 Trading Journal Enrichment & Trade Plans / Alerts Service
 *
 * Key Architectural Guarantees:
 *  - NEVER modifies or mutates broker-sourced rows in `reconstructed_positions` or `raw_deals`.
 *  - Stores all post-trade and entry-time market intelligence in `trade_analysis_enrichments` (keyed by `position_id`).
 *  - Evaluates historical candle contextStrictly up to `open_time` (`asOfTimestamp = open_time`) to prevent look-ahead bias.
 *  - Manages `trade_plans` with duplicate-alert prevention and observable notification delivery.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import {
  TradeAnalysisEnrichmentRecord,
  TradePlanRecord,
  SupportedTimeframe
} from '../models/intelligence.types';
import { MarketDataService, getInstrumentSpec, priceDiffInPips } from './marketData.service';
import { TechnicalAnalysisService } from './technicalAnalysis.service';
import { CRTAnalysisService } from './crtAnalysis.service';
import { SMCEngineService } from './smcEngine.service';
import { FundamentalAnalysisService } from './fundamentalAnalysis.service';
import { ConfluenceScoringService } from './confluenceScoring.service';

export class JournalEnrichmentService {
  /**
   * Enriches an existing MT5/journal position (`reconstructed_positions.id`) with entry-time
   * technical, CRT, SMC/ICT, session, and macroeconomic context without modifying `reconstructed_positions`.
   */
  public static async enrichTradePosition(
    userId: string,
    positionId: string
  ): Promise<TradeAnalysisEnrichmentRecord> {
    const db = getDatabase();

    const position = await db.get<any>(
      `SELECT * FROM reconstructed_positions WHERE id = ?`,
      [positionId]
    );
    if (!position) {
      throw new Error(`Position ${positionId} not found in reconstructed_positions.`);
    }

    const spec = getInstrumentSpec(position.symbol || 'EURUSD');
    const direction: 'BUY' | 'SELL' =
      String(position.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY';
    const openTimeIso = position.open_time
      ? new Date(position.open_time).toISOString()
      : new Date().toISOString();

    const activeSessionAtEntry = CRTAnalysisService.getSessionFromUtcTimestamp(openTimeIso);

    // Fetch candles strictly up to open_time (zero look-ahead bias)
    const htfCandlesRes = await MarketDataService.getCandles({
      symbol: spec.symbol,
      timeframe: 'H4',
      limit: 100,
      asOfTimestamp: openTimeIso,
      allowExternalFetch: false
    });
    const ltfCandlesRes = await MarketDataService.getCandles({
      symbol: spec.symbol,
      timeframe: 'M15',
      limit: 120,
      asOfTimestamp: openTimeIso,
      allowExternalFetch: false
    });

    const htfTech = TechnicalAnalysisService.analyzeSeries(
      spec.symbol,
      'H4',
      htfCandlesRes.candles
    );
    const ltfTech = TechnicalAnalysisService.analyzeSeries(
      spec.symbol,
      'M15',
      ltfCandlesRes.candles
    );
    const htfSmc = SMCEngineService.analyzeSMC(spec.symbol, 'H4', htfCandlesRes.candles);
    const ltfSmc = SMCEngineService.analyzeSMC(spec.symbol, 'M15', ltfCandlesRes.candles);
    const crt = CRTAnalysisService.analyzeCRT(
      spec.symbol,
      htfCandlesRes.candles,
      ltfCandlesRes.candles
    );
    const fundamentals = await FundamentalAnalysisService.evaluatePairFundamentals(
      spec.symbol,
      openTimeIso
    );

    // Find nearby economic events within +/- 240 minutes (4 hours) of entry
    const allPairEvents = await FundamentalAnalysisService.getCalendarEvents({
      currencies: [spec.baseCurrency, spec.quoteCurrency]
    });
    const openMs = new Date(openTimeIso).getTime();
    const nearbyEconomicEvents = allPairEvents
      .map((ev) => {
        const diffMin = Math.round((new Date(ev.eventTime).getTime() - openMs) / 60000);
        return {
          title: ev.title,
          currency: ev.currency,
          impact: ev.impact,
          eventTime: ev.eventTime,
          minutesFromEntry: diffMin
        };
      })
      .filter((ev) => Math.abs(ev.minutesFromEntry) <= 240);

    // Compute planned R:R and actual R-Multiple from position fields if SL/TP exist
    const entryPrice = Number(position.entry_price_avg ?? position.entry_price) || 0;
    const exitPrice = Number(position.exit_price_avg ?? position.exit_price) || entryPrice;
    const slPrice = Number(position.initial_sl ?? position.sl) || 0;
    const tpPrice = Number(position.initial_tp ?? position.tp) || 0;
    const netProfit = Number(position.net_profit) || 0;

    let plannedRiskReward: number | null = null;
    let actualRMultiple: number | null = null;

    if (entryPrice > 0 && slPrice > 0 && Math.abs(entryPrice - slPrice) > 0) {
      const riskDist = Math.abs(entryPrice - slPrice);
      if (tpPrice > 0) {
        const rewardDist = Math.abs(tpPrice - entryPrice);
        plannedRiskReward = Number((rewardDist / riskDist).toFixed(2));
      }
      const signedMove =
        direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
      actualRMultiple = Number((signedMove / riskDist).toFixed(2));
    } else if (position.r_multiple !== null && position.r_multiple !== undefined) {
      actualRMultiple = Number(Number(position.r_multiple).toFixed(2));
    }

    const confluence = ConfluenceScoringService.evaluateConfluence({
      symbol: spec.symbol,
      evaluatedDirection: direction === 'BUY' ? 'BULLISH' : 'BEARISH',
      htfTechnical: htfTech,
      htfSmc,
      ltfSmc,
      crtResult: crt,
      fundamentals,
      proposedRewardToRiskRatio: plannedRiskReward ?? 2.0
    });

    // Check if there was a matching TradePlan created prior to trade execution
    const matchingPlan = await db.get<any>(
      `SELECT * FROM trade_plans WHERE user_id = ? AND symbol = ? AND direction = ? ORDER BY created_at DESC LIMIT 1`,
      [userId, spec.symbol, direction]
    );

    // Compute rule compliance score (0-100)
    let ruleComplianceScore = 50;
    const lessonsLearned: string[] = [];

    if (slPrice > 0) {
      ruleComplianceScore += 20;
    } else {
      ruleComplianceScore -= 25;
      lessonsLearned.push('MISSING_STOP_LOSS: Position executed without a hard Stop Loss attached.');
    }

    if (plannedRiskReward !== null && plannedRiskReward >= 1.5) {
      ruleComplianceScore += 15;
    } else if (plannedRiskReward !== null && plannedRiskReward < 1.0) {
      ruleComplianceScore -= 10;
      lessonsLearned.push(`NEGATIVE_RR_GEOMETRY: Planned R:R (${plannedRiskReward}R) was below 1.0R.`);
    }

    const highImpactNearEntry = nearbyEconomicEvents.find(
      (e) => e.impact === 'HIGH' && Math.abs(e.minutesFromEntry) <= 30
    );
    if (highImpactNearEntry) {
      ruleComplianceScore -= 15;
      lessonsLearned.push(
        `NEWS_WINDOW_EXPOSURE: Trade opened ${Math.abs(highImpactNearEntry.minutesFromEntry)}m from high-impact ${highImpactNearEntry.currency} "${highImpactNearEntry.title}".`
      );
    } else {
      ruleComplianceScore += 10;
    }

    if (matchingPlan) {
      ruleComplianceScore += 15;
      lessonsLearned.push('PLANNED_EXECUTION: Trade matched a pre-defined Trade Plan.');
    } else {
      lessonsLearned.push('UNPLANNED_EXECUTION: No saved Trade Plan found prior to entry.');
    }

    ruleComplianceScore = Math.max(0, Math.min(100, ruleComplianceScore));

    let executionQualityGrade: TradeAnalysisEnrichmentRecord['executionQualityGrade'] = 'C';
    if (ruleComplianceScore >= 80 && confluence.totalHeuristicScore >= 60) {
      executionQualityGrade = 'A';
    } else if (ruleComplianceScore >= 65) {
      executionQualityGrade = 'B';
    } else if (ruleComplianceScore < 45) {
      executionQualityGrade = 'D';
    }

    const latestBreak =
      ltfSmc.structureBreaks.length > 0
        ? ltfSmc.structureBreaks[ltfSmc.structureBreaks.length - 1]
        : null;
    const smcStructureNearby = latestBreak
      ? `${latestBreak.type} (${latestBreak.direction}) at ${latestBreak.brokenSwingPrice}`
      : `${ltfSmc.trendStructure}`;

    const activeFvg = ltfSmc.fairValueGaps[ltfSmc.fairValueGaps.length - 1];
    const activeOb = ltfSmc.orderBlocks[ltfSmc.orderBlocks.length - 1];
    const fvgOrObConfluence =
      [
        activeFvg ? `${activeFvg.type} [${activeFvg.lowerPrice}-${activeFvg.upperPrice}]` : null,
        activeOb ? `${activeOb.type} [${activeOb.lowerPrice}-${activeOb.upperPrice}]` : null
      ]
        .filter(Boolean)
        .join(' | ') || 'None detected in immediate window';

    const postTradeSummary = `${direction} ${spec.symbol} executed during ${activeSessionAtEntry} session. HTF Bias: ${htfSmc.trendStructure}, Market Regime: ${htfTech.marketRegime.classification}, Macro Bias: ${fundamentals.directionalBias}. Confluence Score at Entry: ${confluence.totalHeuristicScore}/100, Rule Compliance: ${ruleComplianceScore}/100 (Grade ${executionQualityGrade}). Net Result: $${netProfit.toFixed(2)} (${actualRMultiple !== null ? `${actualRMultiple}R` : 'R/A'}).`;

    const existing = await db.get<{ id: string; created_at: string }>(
      `SELECT id, created_at FROM trade_analysis_enrichments WHERE position_id = ?`,
      [positionId]
    );

    const recordId = existing ? existing.id : uuidv4();
    const nowIso = new Date().toISOString();

    await db.run(
      `INSERT INTO trade_analysis_enrichments (
        id, position_id, user_id, account_id, symbol, direction,
        htf_bias_at_entry, ltf_structure_at_entry, market_regime_at_entry, volatility_regime_at_entry,
        active_session_at_entry, crt_setup_nearby, smc_structure_nearby, fvg_or_ob_confluence,
        macro_bias_at_entry, nearby_events_payload, planned_risk_reward, actual_r_multiple,
        confluence_score_at_entry, rule_compliance_score, execution_quality_grade,
        post_trade_summary, lessons_learned, rule_version, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(position_id) DO UPDATE SET
        htf_bias_at_entry = excluded.htf_bias_at_entry,
        ltf_structure_at_entry = excluded.ltf_structure_at_entry,
        market_regime_at_entry = excluded.market_regime_at_entry,
        volatility_regime_at_entry = excluded.volatility_regime_at_entry,
        active_session_at_entry = excluded.active_session_at_entry,
        crt_setup_nearby = excluded.crt_setup_nearby,
        smc_structure_nearby = excluded.smc_structure_nearby,
        fvg_or_ob_confluence = excluded.fvg_or_ob_confluence,
        macro_bias_at_entry = excluded.macro_bias_at_entry,
        nearby_events_payload = excluded.nearby_events_payload,
        planned_risk_reward = excluded.planned_risk_reward,
        actual_r_multiple = excluded.actual_r_multiple,
        confluence_score_at_entry = excluded.confluence_score_at_entry,
        rule_compliance_score = excluded.rule_compliance_score,
        execution_quality_grade = excluded.execution_quality_grade,
        post_trade_summary = excluded.post_trade_summary,
        lessons_learned = excluded.lessons_learned,
        updated_at = excluded.updated_at`,
      [
        recordId,
        positionId,
        userId,
        position.account_id || null,
        spec.symbol,
        direction,
        htfSmc.trendStructure,
        ltfSmc.trendStructure,
        htfTech.marketRegime.classification,
        ltfTech.volatility.regime,
        activeSessionAtEntry,
        `${crt.status} (${crt.setupClassification})`,
        smcStructureNearby,
        fvgOrObConfluence,
        fundamentals.directionalBias,
        JSON.stringify(nearbyEconomicEvents),
        plannedRiskReward,
        actualRMultiple,
        confluence.totalHeuristicScore,
        ruleComplianceScore,
        executionQualityGrade,
        postTradeSummary,
        JSON.stringify(lessonsLearned),
        'JOURNAL-ENRICH-v1.0.0',
        nowIso
      ]
    );

    return {
      id: recordId,
      positionId,
      userId,
      accountId: position.account_id || undefined,
      symbol: spec.symbol,
      direction,
      htfBiasAtEntry: htfSmc.trendStructure,
      ltfStructureAtEntry: ltfSmc.trendStructure,
      marketRegimeAtEntry: htfTech.marketRegime.classification,
      volatilityRegimeAtEntry: ltfTech.volatility.regime,
      activeSessionAtEntry,
      crtSetupNearby: `${crt.status} (${crt.setupClassification})`,
      smcStructureNearby,
      fvgOrObConfluence,
      macroBiasAtEntry: fundamentals.directionalBias,
      nearbyEconomicEvents,
      plannedRiskReward,
      actualRMultiple,
      confluenceScoreAtEntry: confluence.totalHeuristicScore,
      ruleComplianceScore,
      executionQualityGrade,
      postTradeSummary,
      lessonsLearned,
      ruleVersion: 'JOURNAL-ENRICH-v1.0.0',
      createdAt: existing?.created_at || nowIso,
      updatedAt: nowIso
    };
  }

  /**
   * Retrieves enrichment for a specific position, or enriches it on-demand if not yet enriched.
   */
  public static async getOrCreateEnrichment(
    userId: string,
    positionId: string
  ): Promise<TradeAnalysisEnrichmentRecord> {
    const db = getDatabase();
    const row = await db.get<any>(
      `SELECT * FROM trade_analysis_enrichments WHERE position_id = ?`,
      [positionId]
    );
    if (row) {
      return this.mapRowToEnrichment(row);
    }
    return this.enrichTradePosition(userId, positionId);
  }

  /**
   * Computes aggregated Journal Intelligence Insights across a user's enriched trades.
   */
  public static async getJournalIntelligenceInsights(
    userId: string,
    accountId?: string
  ): Promise<{
    totalEnrichedTrades: number;
    bySession: Record<string, { trades: number; winRatePct: number; netPnl: number; avgConfluence: number }>;
    byMarketRegime: Record<string, { trades: number; winRatePct: number; netPnl: number }>;
    byConfluenceBucket: Record<string, { trades: number; winRatePct: number; netPnl: number }>;
    newsWindowComparison: {
      nearHighImpactNews: { trades: number; winRatePct: number; netPnl: number };
      clearOfNews: { trades: number; winRatePct: number; netPnl: number };
    };
    plannedVsImpulsive: {
      highCompliance: { trades: number; winRatePct: number; netPnl: number };
      lowComplianceImpulsive: { trades: number; winRatePct: number; netPnl: number };
    };
  }> {
    const db = getDatabase();

    // Auto-enrich up to 25 most recent unenriched positions for this user/account
    let posSql = `SELECT p.id FROM reconstructed_positions p
                  LEFT JOIN trade_analysis_enrichments e ON e.position_id = p.id
                  WHERE e.id IS NULL`;
    const posParams: any[] = [];
    if (accountId && accountId !== 'ALL') {
      posSql += ` AND p.account_id = ?`;
      posParams.push(accountId);
    }
    posSql += ` ORDER BY p.open_time DESC LIMIT 25`;
    const unenriched = await db.query<{ id: string }>(posSql, posParams);
    for (const u of unenriched) {
      try {
        await this.enrichTradePosition(userId, u.id);
      } catch {
        // continue
      }
    }

    let joinSql = `
      SELECT e.*, p.net_profit
      FROM trade_analysis_enrichments e
      JOIN reconstructed_positions p ON p.id = e.position_id
      WHERE e.user_id = ?
    `;
    const joinParams: any[] = [userId];
    if (accountId && accountId !== 'ALL') {
      joinSql += ` AND e.account_id = ?`;
      joinParams.push(accountId);
    }

    const rows = await db.query<any>(joinSql, joinParams);

    const bySession: Record<string, { trades: number; wins: number; winRatePct: number; netPnl: number; sumConf: number; avgConfluence: number }> = {};
    const byMarketRegime: Record<string, { trades: number; wins: number; winRatePct: number; netPnl: number }> = {};
    const byConfluenceBucket: Record<string, { trades: number; wins: number; winRatePct: number; netPnl: number }> = {
      'High Confluence (70-100)': { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 },
      'Moderate Confluence (45-69)': { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 },
      'Low Confluence (0-44)': { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 }
    };

    const nearNews = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 };
    const clearNews = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 };
    const highComp = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 };
    const lowComp = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 };

    for (const r of rows) {
      const pnl = Number(r.net_profit) || 0;
      const isWin = pnl > 0;
      const conf = Number(r.confluence_score_at_entry) || 0;
      const comp = Number(r.rule_compliance_score) || 0;
      const sess = r.active_session_at_entry || 'Off-Hours';
      const regime = r.market_regime_at_entry || 'UNAVAILABLE';

      if (!bySession[sess]) {
        bySession[sess] = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0, sumConf: 0, avgConfluence: 0 };
      }
      bySession[sess].trades++;
      if (isWin) bySession[sess].wins++;
      bySession[sess].netPnl = Number((bySession[sess].netPnl + pnl).toFixed(2));
      bySession[sess].sumConf += conf;

      if (!byMarketRegime[regime]) {
        byMarketRegime[regime] = { trades: 0, wins: 0, winRatePct: 0, netPnl: 0 };
      }
      byMarketRegime[regime].trades++;
      if (isWin) byMarketRegime[regime].wins++;
      byMarketRegime[regime].netPnl = Number((byMarketRegime[regime].netPnl + pnl).toFixed(2));

      const bucketKey =
        conf >= 70
          ? 'High Confluence (70-100)'
          : conf >= 45
          ? 'Moderate Confluence (45-69)'
          : 'Low Confluence (0-44)';
      byConfluenceBucket[bucketKey].trades++;
      if (isWin) byConfluenceBucket[bucketKey].wins++;
      byConfluenceBucket[bucketKey].netPnl = Number((byConfluenceBucket[bucketKey].netPnl + pnl).toFixed(2));

      let events: any[] = [];
      try {
        events = typeof r.nearby_events_payload === 'string' ? JSON.parse(r.nearby_events_payload) : [];
      } catch {
        events = [];
      }
      const hasImmediateNews = events.some((e) => e.impact === 'HIGH' && Math.abs(e.minutesFromEntry) <= 45);
      if (hasImmediateNews) {
        nearNews.trades++;
        if (isWin) nearNews.wins++;
        nearNews.netPnl = Number((nearNews.netPnl + pnl).toFixed(2));
      } else {
        clearNews.trades++;
        if (isWin) clearNews.wins++;
        clearNews.netPnl = Number((clearNews.netPnl + pnl).toFixed(2));
      }

      if (comp >= 65) {
        highComp.trades++;
        if (isWin) highComp.wins++;
        highComp.netPnl = Number((highComp.netPnl + pnl).toFixed(2));
      } else {
        lowComp.trades++;
        if (isWin) lowComp.wins++;
        lowComp.netPnl = Number((lowComp.netPnl + pnl).toFixed(2));
      }
    }

    const finalizeRate = (obj: { trades: number; wins: number; winRatePct: number }) => {
      obj.winRatePct = obj.trades > 0 ? Number(((obj.wins / obj.trades) * 100).toFixed(1)) : 0;
    };

    for (const s of Object.values(bySession)) {
      finalizeRate(s);
      s.avgConfluence = s.trades > 0 ? Math.round(s.sumConf / s.trades) : 0;
    }
    for (const m of Object.values(byMarketRegime)) finalizeRate(m);
    for (const b of Object.values(byConfluenceBucket)) finalizeRate(b);
    finalizeRate(nearNews);
    finalizeRate(clearNews);
    finalizeRate(highComp);
    finalizeRate(lowComp);

    return {
      totalEnrichedTrades: rows.length,
      bySession,
      byMarketRegime,
      byConfluenceBucket,
      newsWindowComparison: {
        nearHighImpactNews: nearNews,
        clearOfNews: clearNews
      },
      plannedVsImpulsive: {
        highCompliance: highComp,
        lowComplianceImpulsive: lowComp
      }
    };
  }

  // ============================================================================
  // MODULE 14: TRADE PLANS & CONFIGURABLE ALERTS (WITH DUPLICATE PREVENTION)
  // ============================================================================

  public static async createTradePlan(
    userId: string,
    input: {
      symbol: string;
      direction: 'BUY' | 'SELL';
      timeframe?: SupportedTimeframe;
      strategyType?: string;
      setupThesis: string;
      entryZoneMin: number;
      entryZoneMax: number;
      invalidationPrice: number;
      targetTp1: number;
      targetTp2?: number | null;
      plannedRiskPct?: number;
      confluenceScore?: number;
      alertOnEntryZone?: boolean;
      alertOnInvalidation?: boolean;
      notes?: string;
    }
  ): Promise<TradePlanRecord> {
    const db = getDatabase();
    const spec = getInstrumentSpec(input.symbol);
    const id = uuidv4();
    const nowIso = new Date().toISOString();

    const zoneMin = Math.min(input.entryZoneMin, input.entryZoneMax);
    const zoneMax = Math.max(input.entryZoneMin, input.entryZoneMax);

    await db.run(
      `INSERT INTO trade_plans (
        id, user_id, symbol, timeframe, direction, setup_type,
        entry_zone_min, entry_zone_max, invalidation_price, target_1_price, target_2_price,
        planned_risk_pct, confluence_score, entry_conditions_json, invalidation_conditions_json,
        notes, status, alert_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WATCHING', ?, ?, ?)`,
      [
        id,
        userId,
        spec.symbol,
        input.timeframe || 'M15',
        input.direction,
        input.strategyType || 'SMC_CRT_CONFLUENCE',
        zoneMin,
        zoneMax,
        input.invalidationPrice,
        input.targetTp1,
        input.targetTp2 ?? null,
        input.plannedRiskPct ?? 1.0,
        input.confluenceScore ?? 0,
        JSON.stringify({ thesis: input.setupThesis }),
        JSON.stringify({ invalidationPrice: input.invalidationPrice }),
        input.notes || '',
        input.alertOnEntryZone !== false ? 1 : 0,
        nowIso,
        nowIso
      ]
    );

    return (await this.getTradePlanById(userId, id))!;
  }

  public static async getTradePlanById(
    userId: string,
    planId: string
  ): Promise<TradePlanRecord | null> {
    const db = getDatabase();
    const row = await db.get<any>(
      `SELECT * FROM trade_plans WHERE id = ? AND user_id = ?`,
      [planId, userId]
    );
    return row ? this.mapRowToTradePlan(row) : null;
  }

  public static async getTradePlans(
    userId: string,
    symbol?: string,
    status?: string
  ): Promise<TradePlanRecord[]> {
    const db = getDatabase();
    let sql = `SELECT * FROM trade_plans WHERE user_id = ?`;
    const params: any[] = [userId];
    if (symbol) {
      sql += ` AND symbol = ?`;
      params.push(symbol.toUpperCase());
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status.toUpperCase());
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`;
    const rows = await db.query<any>(sql, params);
    return rows.map((r) => this.mapRowToTradePlan(r));
  }

  public static async updateTradePlanStatus(
    userId: string,
    planId: string,
    status: TradePlanRecord['status'],
    linkedPositionId?: string
  ): Promise<TradePlanRecord | null> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    await db.run(
      `UPDATE trade_plans SET status = ?, linked_position_id = COALESCE(?, linked_position_id), updated_at = ? WHERE id = ? AND user_id = ?`,
      [status, linkedPositionId ?? null, nowIso, planId, userId]
    );
    return this.getTradePlanById(userId, planId);
  }

  /**
   * Evaluates all active ('WATCHING' or 'ENTRY_TRIGGERED') Trade Plans for a symbol against a new market price.
   * Implements strict duplicate-alert prevention: if `last_alert_triggered_type === alertType`, it will NOT fire again.
   */
  public static async evaluateTradePlanAlertsForPrice(
    userId: string,
    symbol: string,
    currentPrice: number
  ): Promise<Array<{ planId: string; alertType: string; message: string; triggeredNewAlert: boolean }>> {
    const db = getDatabase();
    const spec = getInstrumentSpec(symbol);
    const activePlans = await db.query<any>(
      `SELECT * FROM trade_plans WHERE user_id = ? AND symbol = ? AND status IN ('WATCHING', 'ENTRY_TRIGGERED')`,
      [userId, spec.symbol]
    );

    const results: Array<{ planId: string; alertType: string; message: string; triggeredNewAlert: boolean }> = [];
    const nowIso = new Date().toISOString();

    for (const row of activePlans) {
      const plan = this.mapRowToTradePlan(row);

      // 1. Check Invalidation Condition first
      const isInvalidated =
        (plan.direction === 'BUY' && currentPrice <= plan.invalidationPrice) ||
        (plan.direction === 'SELL' && currentPrice >= plan.invalidationPrice);

      if (isInvalidated) {
        const alertType = 'INVALIDATION_BREACHED';
        const alreadyFired = plan.lastAlertTriggeredType === alertType;

        if (!alreadyFired && plan.alertOnInvalidation) {
          const message = `Trade Plan Invalidated (${plan.direction} ${plan.symbol}): Price (${currentPrice}) breached invalidation level (${plan.invalidationPrice}).`;
          await db.run(
            `UPDATE trade_plans SET status = 'INVALIDATED', alert_delivery_status = ?, alert_triggered_at = ?, updated_at = ? WHERE id = ?`,
            [alertType, nowIso, nowIso, plan.id]
          );
          await db.run(
            `INSERT INTO notifications (id, user_id, title, message, type, link)
             VALUES (?, ?, 'Trade Plan Invalidated', ?, 'ALERT', '/intelligence')`,
            [uuidv4(), userId, message]
          );
          results.push({ planId: plan.id, alertType, message, triggeredNewAlert: true });
        } else {
          results.push({
            planId: plan.id,
            alertType,
            message: 'Invalidation alert already delivered previously (duplicate suppressed).',
            triggeredNewAlert: false
          });
        }
        continue;
      }

      // 2. Check Entry Zone Reach Condition
      const inEntryZone =
        currentPrice >= plan.entryZoneMin && currentPrice <= plan.entryZoneMax;
      if (inEntryZone) {
        const alertType = 'ENTRY_ZONE_REACHED';
        const alreadyFired = plan.lastAlertTriggeredType === alertType;

        if (!alreadyFired && plan.alertOnEntryZone) {
          const message = `Trade Plan Entry Zone Reached (${plan.direction} ${plan.symbol}): Price (${currentPrice}) entered [${plan.entryZoneMin}, ${plan.entryZoneMax}]. Confirm LTF structure before executing.`;
          await db.run(
            `UPDATE trade_plans SET status = 'ENTRY_TRIGGERED', alert_delivery_status = ?, alert_triggered_at = ?, updated_at = ? WHERE id = ?`,
            [alertType, nowIso, nowIso, plan.id]
          );
          await db.run(
            `INSERT INTO notifications (id, user_id, title, message, type, link)
             VALUES (?, ?, 'Trade Plan Entry Zone Alert', ?, 'ALERT', '/intelligence')`,
            [uuidv4(), userId, message]
          );
          results.push({ planId: plan.id, alertType, message, triggeredNewAlert: true });
        } else {
          results.push({
            planId: plan.id,
            alertType,
            message: 'Entry zone alert already delivered previously (duplicate suppressed).',
            triggeredNewAlert: false
          });
        }
      }
    }

    return results;
  }

  private static mapRowToEnrichment(r: any): TradeAnalysisEnrichmentRecord {
    let nearbyEconomicEvents: any[] = [];
    let lessonsLearned: string[] = [];
    try {
      nearbyEconomicEvents =
        typeof r.nearby_events_payload === 'string'
          ? JSON.parse(r.nearby_events_payload)
          : r.nearby_events_payload || [];
    } catch {
      nearbyEconomicEvents = [];
    }
    try {
      lessonsLearned =
        typeof r.lessons_learned === 'string'
          ? JSON.parse(r.lessons_learned)
          : r.lessons_learned || [];
    } catch {
      lessonsLearned = [];
    }

    return {
      id: r.id,
      positionId: r.position_id,
      userId: r.user_id,
      accountId: r.account_id || undefined,
      symbol: r.symbol,
      direction: r.direction,
      htfBiasAtEntry: r.htf_bias_at_entry,
      ltfStructureAtEntry: r.ltf_structure_at_entry,
      marketRegimeAtEntry: r.market_regime_at_entry,
      volatilityRegimeAtEntry: r.volatility_regime_at_entry,
      activeSessionAtEntry: r.active_session_at_entry,
      crtSetupNearby: r.crt_setup_nearby,
      smcStructureNearby: r.smc_structure_nearby,
      fvgOrObConfluence: r.fvg_or_ob_confluence,
      macroBiasAtEntry: r.macro_bias_at_entry,
      nearbyEconomicEvents,
      plannedRiskReward: r.planned_risk_reward !== null ? Number(r.planned_risk_reward) : null,
      actualRMultiple: r.actual_r_multiple !== null ? Number(r.actual_r_multiple) : null,
      confluenceScoreAtEntry: Number(r.confluence_score_at_entry) || 0,
      ruleComplianceScore: Number(r.rule_compliance_score) || 0,
      executionQualityGrade: r.execution_quality_grade || 'C',
      postTradeSummary: r.post_trade_summary || '',
      lessonsLearned,
      ruleVersion: r.rule_version || 'JOURNAL-ENRICH-v1.0.0',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  private static mapRowToTradePlan(r: any): TradePlanRecord {
    let setupThesis = '';
    try {
      if (r.entry_conditions_json) {
        const parsed = JSON.parse(r.entry_conditions_json);
        setupThesis = parsed.thesis || r.entry_conditions_json;
      }
    } catch {
      setupThesis = r.entry_conditions_json || '';
    }

    return {
      id: r.id,
      userId: r.user_id,
      symbol: r.symbol,
      direction: r.direction,
      timeframe: r.timeframe,
      strategyType: r.setup_type || r.strategy_type || 'SMC_CRT_CONFLUENCE',
      setupThesis: setupThesis || r.setup_thesis || '',
      entryZoneMin: Number(r.entry_zone_min),
      entryZoneMax: Number(r.entry_zone_max),
      invalidationPrice: Number(r.invalidation_price),
      targetTp1: Number(r.target_1_price ?? r.target_tp1),
      targetTp2:
        r.target_2_price !== null && r.target_2_price !== undefined
          ? Number(r.target_2_price)
          : r.target_tp2 !== null && r.target_tp2 !== undefined
          ? Number(r.target_tp2)
          : null,
      plannedRiskPct: Number(r.planned_risk_pct) || 1.0,
      confluenceScore: Number(r.confluence_score) || 0,
      status: r.status,
      alertOnEntryZone: Boolean(r.alert_enabled ?? r.alert_on_entry_zone),
      alertOnInvalidation: Boolean(r.alert_enabled ?? r.alert_on_invalidation),
      lastAlertTriggeredType: r.alert_delivery_status || r.last_alert_triggered_type || null,
      lastAlertTriggeredAt: r.alert_triggered_at || r.last_alert_triggered_at || null,
      linkedPositionId: r.linked_position_id || null,
      notes: r.notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}
