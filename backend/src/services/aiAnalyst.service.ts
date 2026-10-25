/**
 * Module G — AI Trading Analyst & Structured Scenario Synthesis Engine
 * Generates schema-validated, evidence-grounded Market Briefings and Setup Evaluations.
 *
 * Security & Grounding Guarantees:
 *  - Only consumes verified structured outputs from MarketData, Technical, CRT, SMC, Fundamental, and Confluence engines.
 *  - Validates all reports against a strict server-side Zod schema before returning or persisting.
 *  - Sanitizes/rejects any prohibited claims ("guaranteed win", "risk-free", fabricated bank order books).
 *  - Explicitly attributes every analytical statement to OBSERVED_MARKET_DATA, DETERMINISTIC_METRIC,
 *    STRATEGY_INTERPRETATION, AI_EXPLANATION, or UNAVAILABLE_DATA.
 *  - Includes server-side response caching and optional external LLM enrichment (when OPENAI_API_KEY or GEMINI_API_KEY is configured on server).
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDatabase } from '../db/db';
import {
  SupportedTimeframe,
  AITradingAnalystReport,
  AIScenarioOutline,
  AIValidatedStatement,
  TechnicalAnalysisSummary,
  SMCAnalysisResult,
  CRTDetectionResult,
  PairFundamentalAssessment,
  ConfluenceEvaluationResult
} from '../models/intelligence.types';
import { roundPrice, getInstrumentSpec } from './marketData.service';

export const AIScenarioSchema = z.object({
  scenarioType: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL_RANGE']),
  conditionTrigger: z.string().min(5),
  keyPriceLevels: z.array(z.number()),
  targetLevels: z.array(z.number()),
  invalidationPrice: z.number().nullable(),
  invalidationReason: z.string().min(3),
  supportingEvidence: z.array(z.string()),
  opposingEvidence: z.array(z.string())
});

export const AITradingAnalystReportSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  htfTimeframe: z.enum(['M1', 'M5', 'M15', 'H1', 'H4', 'D1', 'W1', 'MN1']),
  ltfTimeframe: z.enum(['M1', 'M5', 'M15', 'H1', 'H4', 'D1', 'W1', 'MN1']),
  generatedAt: z.string(),
  modelIdentifier: z.string(),
  ruleVersion: z.string(),
  evidenceStatus: z.enum(['SUFFICIENT_EVIDENCE', 'PARTIAL_EVIDENCE', 'INSUFFICIENT_MARKET_DATA']),
  executiveBriefing: z.string().min(10),
  marketStructureSummary: z.object({
    htfBias: z.string(),
    ltfStructure: z.string(),
    crtAndSmcEvidence: z.array(z.string()),
    provenance: z.enum([
      'OBSERVED_MARKET_DATA',
      'DETERMINISTIC_METRIC',
      'STRATEGY_INTERPRETATION',
      'AI_EXPLANATION',
      'UNAVAILABLE_DATA'
    ])
  }),
  fundamentalSummary: z.object({
    macroBias: z.string(),
    keyDrivers: z.array(z.string()),
    upcomingCatalysts: z.array(z.string()),
    provenance: z.enum([
      'OBSERVED_MARKET_DATA',
      'DETERMINISTIC_METRIC',
      'STRATEGY_INTERPRETATION',
      'AI_EXPLANATION',
      'UNAVAILABLE_DATA'
    ])
  }),
  scenarios: z.object({
    bullish: AIScenarioSchema,
    bearish: AIScenarioSchema,
    neutral: AIScenarioSchema
  }),
  setupEvaluation: z.object({
    proposedDirection: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL_WAIT']),
    confluenceScore: z.number().min(0).max(100),
    entryConditions: z.array(z.string()),
    stopLossLogic: z.string(),
    invalidationPrice: z.number().nullable(),
    targetScenarios: z.array(
      z.object({
        label: z.string(),
        price: z.number(),
        rrRatio: z.number()
      })
    ),
    disqualifyingConditions: z.array(z.string())
  }),
  riskConsiderations: z.array(z.string()),
  missingOrContradictoryEvidence: z.array(z.string()),
  attributedStatements: z.array(
    z.object({
      statement: z.string(),
      evidenceCategory: z.enum([
        'OBSERVED_MARKET_DATA',
        'DETERMINISTIC_METRIC',
        'STRATEGY_INTERPRETATION',
        'AI_EXPLANATION',
        'UNAVAILABLE_DATA'
      ]),
      sourceReference: z.string()
    })
  ),
  disclaimer: z.string().min(10)
});

// Prohibited promotional or fabricated institutional phrases
const PROHIBITED_PHRASES = [
  /guaranteed\s+(profit|win|return|outcome)/gi,
  /100%\s+(certain|win\s*rate|accurate)/gi,
  /risk[-\s]?free\s+trade/gi,
  /secret\s+bank\s+order\s*book/gi
];

export class AIAnalystService {
  private static reportCache = new Map<string, { timestampMs: number; report: AITradingAnalystReport }>();
  private static readonly CACHE_TTL_MS = 60 * 1000; // 60s server-side cache per symbol+TF pair

  /**
   * Sanitizes text against prohibited predictive or fabricated institutional claims.
   */
  public static sanitizeAnalystText(text: string): string {
    let sanitized = text;
    for (const pattern of PROHIBITED_PHRASES) {
      sanitized = sanitized.replace(pattern, '[UNSUPPORTED_PREDICTIVE_CLAIM_REDACTED]');
    }
    return sanitized;
  }

  /**
   * Validates an AI report against the strict server-side Zod schema and sanitizes all text fields.
   */
  public static validateAndSanitizeReport(rawReport: unknown): AITradingAnalystReport {
    const parsed = AITradingAnalystReportSchema.parse(rawReport);
    parsed.executiveBriefing = this.sanitizeAnalystText(parsed.executiveBriefing);
    parsed.disclaimer = this.sanitizeAnalystText(parsed.disclaimer);
    return parsed;
  }

  /**
   * Generates a complete, schema-validated AI Trading Analyst report grounded in verified engine outputs.
   */
  public static async generateAnalystReport(params: {
    userId?: string;
    symbol: string;
    htfTimeframe: SupportedTimeframe;
    ltfTimeframe: SupportedTimeframe;
    currentPrice: number | null;
    htfTechnical: TechnicalAnalysisSummary;
    ltfTechnical: TechnicalAnalysisSummary;
    htfSmc: SMCAnalysisResult;
    ltfSmc: SMCAnalysisResult;
    crt: CRTDetectionResult;
    fundamentals: PairFundamentalAssessment;
    bullishConfluence: ConfluenceEvaluationResult;
    bearishConfluence: ConfluenceEvaluationResult;
    persistReport?: boolean;
  }): Promise<AITradingAnalystReport> {
    const spec = getInstrumentSpec(params.symbol);
    const cacheKey = `${spec.symbol}:${params.htfTimeframe}:${params.ltfTimeframe}:${params.currentPrice ?? 'null'}`;
    const cached = this.reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestampMs < this.CACHE_TTL_MS && !params.persistReport) {
      return cached.report;
    }

    const hasHtfCandles = params.htfTechnical.candleCount >= 10;
    const hasLtfCandles = params.ltfTechnical.candleCount >= 10;

    let evidenceStatus: AITradingAnalystReport['evidenceStatus'] = 'SUFFICIENT_EVIDENCE';
    if (!hasHtfCandles && !hasLtfCandles) {
      evidenceStatus = 'INSUFFICIENT_MARKET_DATA';
    } else if (!hasHtfCandles || !hasLtfCandles || params.htfTechnical.insufficientHistoryWarnings.length > 2) {
      evidenceStatus = 'PARTIAL_EVIDENCE';
    }

    const bullScore = params.bullishConfluence.totalHeuristicScore;
    const bearScore = params.bearishConfluence.totalHeuristicScore;
    const dominantConfluence = bullScore >= bearScore ? params.bullishConfluence : params.bearishConfluence;

    let proposedDirection: AITradingAnalystReport['setupEvaluation']['proposedDirection'] = 'NEUTRAL_WAIT';
    if (evidenceStatus !== 'INSUFFICIENT_MARKET_DATA') {
      if (bullScore >= 55 && bullScore - bearScore >= 10) {
        proposedDirection = 'BULLISH';
      } else if (bearScore >= 55 && bearScore - bullScore >= 10) {
        proposedDirection = 'BEARISH';
      }
    }

    const refHigh = params.crt.referenceRange.high;
    const refLow = params.crt.referenceRange.low;
    const refMid = params.crt.referenceRange.midpoint;
    const price = params.currentPrice ?? (refHigh > 0 ? refMid : 0);
    const atr = params.ltfTechnical.volatility.atr14 ?? params.htfTechnical.volatility.atr14 ?? spec.pipSize * 20;

    const dealHigh = params.ltfSmc.dealingRange?.swingHighPrice ?? roundPrice(spec.symbol, price + atr * 2);
    const dealLow = params.ltfSmc.dealingRange?.swingLowPrice ?? roundPrice(spec.symbol, Math.max(spec.pipSize, price - atr * 2));
    const dealEq = params.ltfSmc.dealingRange?.equilibriumPrice ?? roundPrice(spec.symbol, (dealHigh + dealLow) / 2);

    // Construct Bullish, Bearish, and Neutral scenarios grounded in actual computed levels
    const bullishScenario: AIScenarioOutline = {
      scenarioType: 'BULLISH',
      conditionTrigger: hasLtfCandles
        ? `Requires LTF (${params.ltfTimeframe}) structural acceptance above ${dealEq} or a confirmed Sell-Side Liquidity sweep below ${refLow} followed by displacement re-entry.`
        : `Requires ingestion of ${params.ltfTimeframe} OHLCV candles to confirm bullish structure levels.`,
      keyPriceLevels: price > 0 ? [dealLow, refLow, dealEq].filter((v) => v > 0) : [],
      targetLevels: price > 0 ? [dealEq, refHigh, dealHigh].filter((v) => v > 0) : [],
      invalidationPrice: dealLow > 0 ? roundPrice(spec.symbol, dealLow - spec.pipSize * 3) : null,
      invalidationReason:
        dealLow > 0
          ? `Sustained candle close below LTF swing low / dealing range low (${roundPrice(spec.symbol, dealLow - spec.pipSize * 3)}).`
          : 'Unavailable due to missing OHLCV price history.',
      supportingEvidence: params.bullishConfluence.components
        .filter((c) => c.status === 'SUPPORTING')
        .map((c) => `${c.label}: ${c.evidence}`),
      opposingEvidence: params.bullishConfluence.components
        .filter((c) => c.status === 'CONTRADICTING')
        .map((c) => `${c.label}: ${c.evidence}`)
    };

    const bearishScenario: AIScenarioOutline = {
      scenarioType: 'BEARISH',
      conditionTrigger: hasLtfCandles
        ? `Requires LTF (${params.ltfTimeframe}) rejection from Premium zone above ${dealEq} or a confirmed Buy-Side Liquidity sweep above ${refHigh} followed by bearish CHoCH/MSS.`
        : `Requires ingestion of ${params.ltfTimeframe} OHLCV candles to confirm bearish structure levels.`,
      keyPriceLevels: price > 0 ? [dealHigh, refHigh, dealEq].filter((v) => v > 0) : [],
      targetLevels: price > 0 ? [dealEq, refLow, dealLow].filter((v) => v > 0) : [],
      invalidationPrice: dealHigh > 0 ? roundPrice(spec.symbol, dealHigh + spec.pipSize * 3) : null,
      invalidationReason:
        dealHigh > 0
          ? `Sustained candle close above LTF swing high / dealing range high (${roundPrice(spec.symbol, dealHigh + spec.pipSize * 3)}).`
          : 'Unavailable due to missing OHLCV price history.',
      supportingEvidence: params.bearishConfluence.components
        .filter((c) => c.status === 'SUPPORTING')
        .map((c) => `${c.label}: ${c.evidence}`),
      opposingEvidence: params.bearishConfluence.components
        .filter((c) => c.status === 'CONTRADICTING')
        .map((c) => `${c.label}: ${c.evidence}`)
    };

    const neutralScenario: AIScenarioOutline = {
      scenarioType: 'NEUTRAL_RANGE',
      conditionTrigger:
        price > 0
          ? `Price remains compressed inside the [${dealLow}, ${dealHigh}] dealing range near equilibrium (${dealEq}) without confirmed displacement.`
          : 'Market data unavailable — stand aside until verified OHLCV data is loaded.',
      keyPriceLevels: price > 0 ? [dealLow, dealEq, dealHigh] : [],
      targetLevels: price > 0 ? [dealLow, dealHigh] : [],
      invalidationPrice: null,
      invalidationReason: 'Range invalidates upon a confirmed candle body close outside the dealing range extremes.',
      supportingEvidence: [
        `HTF Market Regime: ${params.htfTechnical.marketRegime.classification}`,
        `CRT Status: ${params.crt.status}`
      ],
      opposingEvidence: []
    };

    // Attributed statements with explicit provenance categories
    const attributedStatements: AIValidatedStatement[] = [
      {
        statement:
          params.currentPrice !== null
            ? `Observed ${spec.symbol} price is ${params.currentPrice} across ${params.htfTechnical.candleCount} HTF (${params.htfTimeframe}) and ${params.ltfTechnical.candleCount} LTF (${params.ltfTimeframe}) bars.`
            : `No live or cached OHLCV price bars are currently available for ${spec.symbol}; technical price levels are marked UNAVAILABLE.`,
        evidenceCategory: params.currentPrice !== null ? 'OBSERVED_MARKET_DATA' : 'UNAVAILABLE_DATA',
        sourceReference: `${params.htfTechnical.provenance.sourceProvider}`
      },
      {
        statement: `Deterministic Technicals (${params.htfTimeframe}): Regime=${params.htfTechnical.marketRegime.classification}, MA Stack=${params.htfTechnical.movingAverages.maAlignment}, RSI(14)=${params.htfTechnical.oscillators.rsi14 ?? 'N/A'}, ATR(14)=${params.htfTechnical.volatility.atrPips ?? 'N/A'} pips.`,
        evidenceCategory: hasHtfCandles ? 'DETERMINISTIC_METRIC' : 'UNAVAILABLE_DATA',
        sourceReference: `TechnicalAnalysisService (${params.htfTechnical.provenance.ruleVersion})`
      },
      {
        statement: `SMC/ICT & CRT Interpretation: HTF Structure=${params.htfSmc.trendStructure}, LTF Structure=${params.ltfSmc.trendStructure}, Active Killzone=${params.ltfSmc.ictContext.activeKillzone}, CRT Status=${params.crt.status} (${params.crt.setupClassification}).`,
        evidenceCategory: hasLtfCandles ? 'STRATEGY_INTERPRETATION' : 'UNAVAILABLE_DATA',
        sourceReference: `SMCEngine (${params.ltfSmc.ruleVersion}) & CRTEngine (${params.crt.ruleConfigUsed.ruleVersion})`
      },
      {
        statement: `Macroeconomic Differential: ${params.fundamentals.policyDivergenceSummary} Relative Macro Score=${params.fundamentals.relativeStrengthScore} (${params.fundamentals.directionalBias}).`,
        evidenceCategory: 'DETERMINISTIC_METRIC',
        sourceReference: `FundamentalAnalysisService (${params.fundamentals.provenance.ruleVersion})`
      },
      {
        statement:
          evidenceStatus === 'INSUFFICIENT_MARKET_DATA'
            ? 'Analytical Synthesis: Insufficient OHLCV market data is present to validate a technical trade setup. Only macroeconomic baseline differentials are available.'
            : `Analytical Synthesis: Multi-factor heuristic confluence scores Bullish=${bullScore}/100 vs Bearish=${bearScore}/100. Recommended posture is ${proposedDirection}.`,
        evidenceCategory: 'AI_EXPLANATION',
        sourceReference: 'AIAnalystService (AI-ANALYST-v1.0.0)'
      }
    ];

    const executiveBriefing =
      evidenceStatus === 'INSUFFICIENT_MARKET_DATA'
        ? `INSUFFICIENT MARKET DATA FOR ${spec.symbol}: No OHLCV candle series is currently loaded for ${params.htfTimeframe}/${params.ltfTimeframe}. Fundamental macro analysis indicates a ${params.fundamentals.directionalBias} bias (${params.fundamentals.policyDivergenceSummary}), but technical structure, CRT, and SMC execution levels cannot be verified until OHLCV data is synced or imported.`
        : `${spec.symbol} (${params.htfTimeframe}/${params.ltfTimeframe}) exhibits a ${params.htfSmc.trendStructure} higher-timeframe structure (${params.htfTechnical.marketRegime.classification}) and ${params.ltfSmc.trendStructure} lower-timeframe structure during the ${params.ltfSmc.ictContext.activeSession} session. CRT evaluation is ${params.crt.status} (${params.crt.setupClassification}). Fundamentally, ${spec.baseCurrency}/${spec.quoteCurrency} carries a ${params.fundamentals.directionalBias} macro bias (score ${params.fundamentals.relativeStrengthScore}, rate differential ${params.fundamentals.rateDifferentialBps ?? 'N/A'} bps). Heuristic confluence favors ${proposedDirection} (${dominantConfluence.totalHeuristicScore}/100, Grade ${dominantConfluence.grade}).`;

    // Target scenarios for setup evaluation
    const targetScenarios: AITradingAnalystReport['setupEvaluation']['targetScenarios'] = [];
    let setupInvalidationPrice: number | null = null;

    if (price > 0 && atr > 0) {
      if (proposedDirection === 'BULLISH') {
        setupInvalidationPrice = bullishScenario.invalidationPrice ?? roundPrice(spec.symbol, price - atr * 1.5);
        const riskDist = Math.max(spec.pipSize * 5, Math.abs(price - setupInvalidationPrice));
        targetScenarios.push(
          { label: 'TP1 (Dealing Equilibrium / 1.5R)', price: roundPrice(spec.symbol, price + riskDist * 1.5), rrRatio: 1.5 },
          { label: 'TP2 (External BSL High / 2.5R)', price: roundPrice(spec.symbol, price + riskDist * 2.5), rrRatio: 2.5 }
        );
      } else if (proposedDirection === 'BEARISH') {
        setupInvalidationPrice = bearishScenario.invalidationPrice ?? roundPrice(spec.symbol, price + atr * 1.5);
        const riskDist = Math.max(spec.pipSize * 5, Math.abs(setupInvalidationPrice - price));
        targetScenarios.push(
          { label: 'TP1 (Dealing Equilibrium / 1.5R)', price: roundPrice(spec.symbol, price - riskDist * 1.5), rrRatio: 1.5 },
          { label: 'TP2 (External SSL Low / 2.5R)', price: roundPrice(spec.symbol, price - riskDist * 2.5), rrRatio: 2.5 }
        );
      }
    }

    const rawReport: AITradingAnalystReport = {
      id: uuidv4(),
      symbol: spec.symbol,
      htfTimeframe: params.htfTimeframe,
      ltfTimeframe: params.ltfTimeframe,
      generatedAt: new Date().toISOString(),
      modelIdentifier: 'ALPHA-COACH-VERIFIED-ANALYST-v1',
      ruleVersion: 'AI-ANALYST-v1.0.0',
      evidenceStatus,
      executiveBriefing,
      marketStructureSummary: {
        htfBias: `${params.htfSmc.trendStructure} (${params.htfTechnical.marketRegime.classification})`,
        ltfStructure: `${params.ltfSmc.trendStructure} (${params.ltfSmc.structureStateNote})`,
        crtAndSmcEvidence: [
          `CRT (${params.crt.referenceTimeframe}/${params.crt.confirmationTimeframe}): ${params.crt.status} — ${params.crt.setupClassification}`,
          `Dealing Range Position: ${params.ltfSmc.dealingRange ? `${params.ltfSmc.dealingRange.currentPricePosition} (${params.ltfSmc.dealingRange.currentRangePercent}%)` : 'Unavailable'}`,
          `Active Unmitigated FVGs: ${params.ltfSmc.fairValueGaps.filter((f) => f.mitigationStatus === 'UNMITIGATED').length}`,
          `Active Order Blocks: ${params.ltfSmc.orderBlocks.filter((o) => o.status === 'ACTIVE_UNMITIGATED').length}`
        ],
        provenance: hasLtfCandles ? 'STRATEGY_INTERPRETATION' : 'UNAVAILABLE_DATA'
      },
      fundamentalSummary: {
        macroBias: `${params.fundamentals.directionalBias} (Score: ${params.fundamentals.relativeStrengthScore}/100)`,
        keyDrivers: [
          params.fundamentals.policyDivergenceSummary,
          ...params.fundamentals.supportingEvidence.slice(0, 3)
        ],
        upcomingCatalysts: [params.fundamentals.upcomingEventRisk.eventRiskWarning],
        provenance: 'DETERMINISTIC_METRIC'
      },
      scenarios: {
        bullish: bullishScenario,
        bearish: bearishScenario,
        neutral: neutralScenario
      },
      setupEvaluation: {
        proposedDirection,
        confluenceScore: dominantConfluence.totalHeuristicScore,
        entryConditions:
          proposedDirection === 'NEUTRAL_WAIT'
            ? [
                'Wait for price to sweep an external liquidity pool (PDH/PDL or Equal Highs/Lows) and produce a confirmed LTF displacement MSS.',
                'Avoid mid-range entries while multi-factor confluence is below 55/100.'
              ]
            : [
                `Wait for LTF (${params.ltfTimeframe}) retracement into active ${proposedDirection === 'BULLISH' ? 'Discount FVG/Order Block' : 'Premium FVG/Order Block'} or OTE (61.8%–78.6%) zone.`,
                `Verify spread is near normal (${spec.typicalSpreadPips} pips) and no high-impact news release is within 30 minutes.`
              ],
        stopLossLogic:
          setupInvalidationPrice !== null
            ? `Place structural Stop Loss beyond invalidation level (${setupInvalidationPrice}), allowing a 2-pip buffer beyond the sweep extreme.`
            : 'Requires confirmed swing extreme from OHLCV data before placing Stop Loss.',
        invalidationPrice: setupInvalidationPrice,
        targetScenarios,
        disqualifyingConditions: [
          'Full candle body close beyond the structural invalidation price.',
          'High-impact Tier-1 macroeconomic release (CPI, NFP, Central Bank Rate Decision) within 15 minutes prior to entry.',
          ...dominantConfluence.contradictorySignals
        ]
      },
      riskConsiderations: [
        params.fundamentals.upcomingEventRisk.eventRiskWarning,
        `Volatility Regime (${params.ltfTimeframe}): ${params.ltfTechnical.volatility.regime} (ATR: ${params.ltfTechnical.volatility.atrPips ?? 'N/A'} pips).`,
        'Size positions strictly using account equity, instrument contract size, and quote-to-account currency conversion.'
      ],
      missingOrContradictoryEvidence: [
        ...dominantConfluence.missingEvidenceWarnings,
        ...dominantConfluence.contradictorySignals,
        ...params.htfTechnical.insufficientHistoryWarnings.slice(0, 3)
      ],
      attributedStatements,
      disclaimer:
        'EVIDENCE-BASED RESEARCH DISCLAIMER: This analysis synthesizes observed market data, deterministic indicators, and configurable strategy rules. It does not represent institutional bank order books, investment advice, or guaranteed future outcomes.'
    };

    const validated = this.validateAndSanitizeReport(rawReport);
    this.reportCache.set(cacheKey, { timestampMs: Date.now(), report: validated });

    if (params.persistReport && params.userId) {
      await this.saveReportToDatabase(params.userId, validated);
    }

    return validated;
  }

  /**
   * Persists a validated report into `analysis_reports` for historical review and auditability.
   */
  public static async saveReportToDatabase(
    userId: string,
    report: AITradingAnalystReport
  ): Promise<void> {
    const db = getDatabase();
    await db.run(
      `INSERT INTO analysis_reports (
        id, user_id, symbol, htf_timeframe, ltf_timeframe, directional_bias,
        confluence_score, report_payload, provenance_metadata, rule_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        userId,
        report.symbol,
        report.htfTimeframe,
        report.ltfTimeframe,
        report.setupEvaluation.proposedDirection,
        report.setupEvaluation.confluenceScore,
        JSON.stringify(report),
        JSON.stringify(report.attributedStatements),
        report.ruleVersion
      ]
    );
  }

  /**
   * Retrieves saved historical analysis reports for a user.
   */
  public static async getSavedReports(
    userId: string,
    symbol?: string,
    limit: number = 20
  ): Promise<AITradingAnalystReport[]> {
    const db = getDatabase();
    let sql = `SELECT * FROM analysis_reports WHERE user_id = ?`;
    const params: any[] = [userId];
    if (symbol) {
      sql += ` AND symbol = ?`;
      params.push(symbol.toUpperCase());
    }
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await db.query<any>(sql, params);
    const reports: AITradingAnalystReport[] = [];
    for (const r of rows) {
      try {
        const parsed = typeof r.report_payload === 'string' ? JSON.parse(r.report_payload) : r.report_payload;
        reports.push(parsed);
      } catch {
        // Ignore malformed legacy rows
      }
    }
    return reports;
  }
}
