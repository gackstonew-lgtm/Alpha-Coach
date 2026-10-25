/**
 * Module B — Candle Range Theory (CRT) Analysis Engine
 * Evaluates Higher-Timeframe (HTF) Reference Candle Ranges against subsequent HTF or LTF confirmation candles.
 *
 * Strictly distinguishes:
 *  - CONFIRMED_CRT: Valid liquidity sweep beyond reference extreme + range re-entry close + optional displacement + session rule satisfied
 *  - PROVISIONAL_SWEEP_INCOMPLETE: Wick/excursion occurred, but range re-entry close or displacement/session criteria are incomplete
 *  - RANGE_EXPANSION_BREAKOUT: Strong body acceptance outside the reference range (not a sweep reversal)
 *  - INSIDE_RANGE_NO_SWEEP: Price remained inside reference range
 */

import {
  OHLCVCandle,
  SupportedTimeframe,
  CRTRuleConfiguration,
  CRTReferenceRange,
  CRTDetectionResult
} from '../models/intelligence.types';
import { getInstrumentSpec, roundPrice, priceDiffInPips } from './marketData.service';
import { TechnicalAnalysisService } from './technicalAnalysis.service';

export const DEFAULT_CRT_RULE_CONFIG: CRTRuleConfiguration = {
  ruleVersion: 'CRT-ENGINE-v1.0.0',
  referenceTimeframe: 'H4',
  confirmationTimeframe: 'M15',
  requireSweepBeyondWick: true,
  minSweepPips: 1.5,
  maxSweepBodyRatio: 0.45,
  requireCloseInsideRange: true,
  requireDisplacementAfterSweep: true,
  displacementMinAtrMultiplier: 0.8,
  allowedSessions: ['London', 'New York', 'London/NY Overlap', 'Asia']
};

export class CRTAnalysisService {
  /**
   * Determines active Forex trading session from UTC timestamp.
   */
  public static getSessionFromUtcTimestamp(isoTimestamp: string): 'London' | 'New York' | 'London/NY Overlap' | 'Asia' | 'Off-Hours' {
    const dt = new Date(isoTimestamp);
    if (isNaN(dt.getTime())) {
      return 'Off-Hours';
    }
    const hour = dt.getUTCHours();
    if (hour >= 13 && hour < 17) {
      return 'London/NY Overlap';
    }
    if (hour >= 7 && hour < 16) {
      return 'London';
    }
    if (hour >= 13 && hour < 22) {
      return 'New York';
    }
    if (hour >= 0 && hour < 9) {
      return 'Asia';
    }
    return 'Off-Hours';
  }

  /**
   * Computes reference range metrics for a given reference candle.
   */
  public static buildReferenceRange(symbol: string, candle: OHLCVCandle): CRTReferenceRange {
    const rangeSpan = candle.high - candle.low;
    const midpoint = candle.low + rangeSpan * 0.5;
    const quarter25 = candle.low + rangeSpan * 0.25;
    const quarter75 = candle.low + rangeSpan * 0.75;

    return {
      candleTimestamp: candle.timestamp,
      timeframe: candle.timeframe,
      high: roundPrice(symbol, candle.high),
      low: roundPrice(symbol, candle.low),
      open: roundPrice(symbol, candle.open),
      close: roundPrice(symbol, candle.close),
      midpoint: roundPrice(symbol, midpoint),
      rangePips: priceDiffInPips(symbol, rangeSpan),
      quarter25: roundPrice(symbol, quarter25),
      quarter75: roundPrice(symbol, quarter75)
    };
  }

  /**
   * Evaluates CRT setup given a reference candle (or HTF series) and subsequent confirmation candles (LTF or HTF).
   * Zero look-ahead bias: only inspects candles present in the input arrays.
   */
  public static analyzeCRT(
    symbol: string,
    htfCandles: OHLCVCandle[],
    ltfCandles: OHLCVCandle[],
    customConfig?: Partial<CRTRuleConfiguration>,
    selectedReferenceCandleTimestamp?: string
  ): CRTDetectionResult {
    const config: CRTRuleConfiguration = {
      ...DEFAULT_CRT_RULE_CONFIG,
      ...customConfig
    };
    const spec = getInstrumentSpec(symbol);

    const ruleDefinitionSummary = [
      `Rule ${config.ruleVersion}: Reference TF=${config.referenceTimeframe}, Confirmation TF=${config.confirmationTimeframe}.`,
      `1) Excursion beyond reference High/Low >= ${config.minSweepPips} pips.`,
      `2) Max body acceptance outside range <= ${(config.maxSweepBodyRatio * 100).toFixed(0)}% of candle range (otherwise classified as RANGE_EXPANSION_BREAKOUT).`,
      `3) Re-entry close back inside [Ref Low, Ref High]: ${config.requireCloseInsideRange ? 'Required' : 'Optional'}.`,
      `4) Displacement candle confirmation (>= ${config.displacementMinAtrMultiplier}x ATR opposite to sweep): ${config.requireDisplacementAfterSweep ? 'Required' : 'Optional'}.`,
      `5) Allowed Sessions: ${config.allowedSessions.join(', ')}.`
    ].join(' ');

    if (htfCandles.length < 2) {
      const fallbackCandle: OHLCVCandle = htfCandles[0] || {
        symbol,
        timeframe: config.referenceTimeframe,
        timestamp: new Date().toISOString(),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
        isClosed: false,
        sourceProvider: 'UNAVAILABLE'
      };

      return {
        id: `crt-${symbol}-${Date.now()}`,
        symbol,
        referenceTimeframe: config.referenceTimeframe,
        confirmationTimeframe: config.confirmationTimeframe,
        referenceRange: this.buildReferenceRange(symbol, fallbackCandle),
        sweepType: 'NONE',
        status: 'INSIDE_RANGE_NO_SWEEP',
        sweepExtremePrice: null,
        sweepTimestamp: null,
        sweepExcursionPips: 0,
        reEntryConfirmed: false,
        reEntryCandleTimestamp: null,
        reEntryClosePrice: null,
        displacementConfirmed: false,
        sessionAtSweep: 'Off-Hours',
        sessionRuleSatisfied: false,
        directionalBias: 'NEUTRAL',
        setupClassification: 'INSUFFICIENT_CANDLE_HISTORY',
        entryZone: null,
        invalidationPrice: null,
        invalidationCondition: 'Requires at least 2 HTF candles to establish reference range and subsequent price action.',
        targets: null,
        ruleDefinitionSummary,
        ruleConfigUsed: config,
        provenance: {
          category: 'UNAVAILABLE_DATA',
          sourceProvider: 'UNAVAILABLE',
          retrievedAt: new Date().toISOString(),
          timezone: 'UTC',
          freshnessStatus: 'UNAVAILABLE',
          ruleVersion: config.ruleVersion,
          notes: 'Insufficient HTF candles for CRT evaluation.'
        }
      };
    }

    // Select reference candle: either user-specified timestamp or the penultimate closed HTF candle
    // (or up to 4 candles back if a recent HTF range is actively being traded)
    let refIndex = htfCandles.length - 2;
    if (selectedReferenceCandleTimestamp) {
      const foundIdx = htfCandles.findIndex((c) => c.timestamp === selectedReferenceCandleTimestamp);
      if (foundIdx !== -1 && foundIdx < htfCandles.length - 1) {
        refIndex = foundIdx;
      }
    } else {
      // Check if an earlier HTF candle (within last 3 bars) has a cleaner range being swept by subsequent bars
      for (let idx = htfCandles.length - 2; idx >= Math.max(0, htfCandles.length - 5); idx--) {
        const candidate = htfCandles[idx];
        const subsequent = htfCandles.slice(idx + 1);
        const touchedExtreme = subsequent.some(
          (s) => s.high > candidate.high || s.low < candidate.low
        );
        if (touchedExtreme) {
          refIndex = idx;
          break;
        }
      }
    }

    const referenceCandle = htfCandles[refIndex];
    const refRange = this.buildReferenceRange(symbol, referenceCandle);
    const refTimeMs = new Date(referenceCandle.timestamp).getTime();

    // Filter confirmation candles strictly after the reference candle timestamp
    const subsequentHtf = htfCandles.slice(refIndex + 1);
    const subsequentLtf = ltfCandles.filter(
      (c) => new Date(c.timestamp).getTime() > refTimeMs
    );

    const evaluationCandles =
      subsequentLtf.length > 0 ? subsequentLtf : subsequentHtf;

    const atrSource = ltfCandles.length >= 15 ? ltfCandles : htfCandles;
    const atrVal =
      TechnicalAnalysisService.calculateATR(atrSource, 14) ||
      (referenceCandle.high - referenceCandle.low) * 0.35;

    let highestAboveRef = -Infinity;
    let highestAboveTimestamp: string | null = null;
    let lowestBelowRef = Infinity;
    let lowestBelowTimestamp: string | null = null;

    let highSweepIdx = -1;
    let lowSweepIdx = -1;
    let breakoutOutsideRange = false;

    for (let i = 0; i < evaluationCandles.length; i++) {
      const c = evaluationCandles[i];
      const candleSpan = Math.max(c.high - c.low, spec.pointSize);

      if (c.high > referenceCandle.high) {
        if (c.high > highestAboveRef) {
          highestAboveRef = c.high;
          highestAboveTimestamp = c.timestamp;
          highSweepIdx = i;
        }
        // Check if body closed strongly outside range (expansion breakout rather than sweep)
        if (c.close > referenceCandle.high) {
          const bodyOutside = c.close - Math.max(c.open, referenceCandle.high);
          if (bodyOutside / candleSpan > config.maxSweepBodyRatio) {
            breakoutOutsideRange = true;
          }
        }
      }

      if (c.low < referenceCandle.low) {
        if (c.low < lowestBelowRef) {
          lowestBelowRef = c.low;
          lowestBelowTimestamp = c.timestamp;
          lowSweepIdx = i;
        }
        if (c.close < referenceCandle.low) {
          const bodyOutside = Math.min(c.open, referenceCandle.low) - c.close;
          if (bodyOutside / candleSpan > config.maxSweepBodyRatio) {
            breakoutOutsideRange = true;
          }
        }
      }
    }

    const highSweepPips =
      highestAboveRef > referenceCandle.high
        ? priceDiffInPips(symbol, highestAboveRef - referenceCandle.high)
        : 0;
    const lowSweepPips =
      lowestBelowRef < referenceCandle.low
        ? priceDiffInPips(symbol, referenceCandle.low - lowestBelowRef)
        : 0;

    const validHighExcursion = highSweepPips >= config.minSweepPips;
    const validLowExcursion = lowSweepPips >= config.minSweepPips;

    let sweepType: CRTDetectionResult['sweepType'] = 'NONE';
    let sweepExtremePrice: number | null = null;
    let sweepTimestamp: string | null = null;
    let sweepExcursionPips = 0;
    let primarySweepIdx = -1;

    if (validHighExcursion && validLowExcursion) {
      sweepType = 'BOTH_SIDES_SWEPT';
      // Prioritize the more recent sweep for directional evaluation
      if (highSweepIdx >= lowSweepIdx) {
        sweepExtremePrice = roundPrice(symbol, highestAboveRef);
        sweepTimestamp = highestAboveTimestamp;
        sweepExcursionPips = highSweepPips;
        primarySweepIdx = highSweepIdx;
      } else {
        sweepExtremePrice = roundPrice(symbol, lowestBelowRef);
        sweepTimestamp = lowestBelowTimestamp;
        sweepExcursionPips = lowSweepPips;
        primarySweepIdx = lowSweepIdx;
      }
    } else if (validHighExcursion) {
      sweepType = 'HIGH_SWEEP_BEARISH_CRT';
      sweepExtremePrice = roundPrice(symbol, highestAboveRef);
      sweepTimestamp = highestAboveTimestamp;
      sweepExcursionPips = highSweepPips;
      primarySweepIdx = highSweepIdx;
    } else if (validLowExcursion) {
      sweepType = 'LOW_SWEEP_BULLISH_CRT';
      sweepExtremePrice = roundPrice(symbol, lowestBelowRef);
      sweepTimestamp = lowestBelowTimestamp;
      sweepExcursionPips = lowSweepPips;
      primarySweepIdx = lowSweepIdx;
    }

    // Check re-entry and displacement after the primary sweep
    let reEntryConfirmed = false;
    let reEntryCandleTimestamp: string | null = null;
    let reEntryClosePrice: number | null = null;
    let displacementConfirmed = false;

    const isBearishSweepCandidate =
      sweepType === 'HIGH_SWEEP_BEARISH_CRT' ||
      (sweepType === 'BOTH_SIDES_SWEPT' && highSweepIdx >= lowSweepIdx);
    const isBullishSweepCandidate =
      sweepType === 'LOW_SWEEP_BULLISH_CRT' ||
      (sweepType === 'BOTH_SIDES_SWEPT' && lowSweepIdx > highSweepIdx);

    if (primarySweepIdx !== -1) {
      for (let i = primarySweepIdx; i < evaluationCandles.length; i++) {
        const c = evaluationCandles[i];
        const bodySize = Math.abs(c.close - c.open);

        if (isBearishSweepCandidate) {
          if (!reEntryConfirmed && c.close < referenceCandle.high && c.close >= referenceCandle.low) {
            reEntryConfirmed = true;
            reEntryCandleTimestamp = c.timestamp;
            reEntryClosePrice = roundPrice(symbol, c.close);
          }
          if (
            c.close < c.open &&
            c.close < referenceCandle.high &&
            bodySize >= atrVal * config.displacementMinAtrMultiplier
          ) {
            displacementConfirmed = true;
          }
        } else if (isBullishSweepCandidate) {
          if (!reEntryConfirmed && c.close > referenceCandle.low && c.close <= referenceCandle.high) {
            reEntryConfirmed = true;
            reEntryCandleTimestamp = c.timestamp;
            reEntryClosePrice = roundPrice(symbol, c.close);
          }
          if (
            c.close > c.open &&
            c.close > referenceCandle.low &&
            bodySize >= atrVal * config.displacementMinAtrMultiplier
          ) {
            displacementConfirmed = true;
          }
        }
      }
    }

    const latestEvalCandle = evaluationCandles[evaluationCandles.length - 1];
    const currentlyOutsideRange =
      latestEvalCandle &&
      (latestEvalCandle.close > referenceCandle.high || latestEvalCandle.close < referenceCandle.low);

    if (breakoutOutsideRange && currentlyOutsideRange && !reEntryConfirmed) {
      sweepType = 'BREAKOUT_EXPANSION';
    }

    const sessionAtSweep = sweepTimestamp
      ? this.getSessionFromUtcTimestamp(sweepTimestamp)
      : 'Off-Hours';
    const sessionRuleSatisfied =
      sweepTimestamp !== null &&
      (config.allowedSessions.includes(sessionAtSweep) || config.allowedSessions.includes('ALL'));

    // Determine final status and bias without fabricating confirmation
    let status: CRTDetectionResult['status'] = 'INSIDE_RANGE_NO_SWEEP';
    let directionalBias: CRTDetectionResult['directionalBias'] = 'NEUTRAL';
    let setupClassification = 'INSIDE_REFERENCE_RANGE';
    let entryZone: { min: number; max: number } | null = null;
    let invalidationPrice: number | null = null;
    let invalidationCondition = 'No active CRT setup triggered.';
    let targets: { tp1Midpoint: number; tp2OppositeExtreme: number } | null = null;

    if (sweepType === 'BREAKOUT_EXPANSION') {
      status = 'RANGE_EXPANSION_BREAKOUT';
      directionalBias =
        latestEvalCandle.close > referenceCandle.high ? 'BULLISH' : 'BEARISH';
      setupClassification = 'RANGE_EXPANSION_BREAKOUT_NOT_SWEEP';
      invalidationCondition =
        'Price closed strongly outside the reference candle range (> maxSweepBodyRatio), indicating expansion breakout rather than a CRT reversal sweep.';
    } else if (isBearishSweepCandidate && sweepExtremePrice !== null) {
      const reEntryOk = !config.requireCloseInsideRange || reEntryConfirmed;
      const dispOk = !config.requireDisplacementAfterSweep || displacementConfirmed;

      if (reEntryOk && dispOk && sessionRuleSatisfied) {
        status = 'CONFIRMED_CRT';
        directionalBias = 'BEARISH';
        setupClassification = 'BEARISH_CRT_HIGH_SWEEP_REENTRY';
      } else {
        status = 'PROVISIONAL_SWEEP_INCOMPLETE';
        directionalBias = 'NEUTRAL';
        const missing: string[] = [];
        if (!reEntryOk) missing.push('range re-entry close below reference high');
        if (!dispOk) missing.push('bearish displacement candle');
        if (!sessionRuleSatisfied) missing.push(`allowed session (${sessionAtSweep} not in configured sessions)`);
        setupClassification = `PROVISIONAL_HIGH_SWEEP_AWAITING_${missing.length}_CRITERIA`;
      }

      entryZone = {
        min: refRange.quarter75,
        max: refRange.high
      };
      invalidationPrice = roundPrice(symbol, sweepExtremePrice + spec.pipSize * 2);
      invalidationCondition = `Bearish CRT invalidated on a sustained candle close above the sweep high (${invalidationPrice}).`;
      targets = {
        tp1Midpoint: refRange.midpoint,
        tp2OppositeExtreme: refRange.low
      };
    } else if (isBullishSweepCandidate && sweepExtremePrice !== null) {
      const reEntryOk = !config.requireCloseInsideRange || reEntryConfirmed;
      const dispOk = !config.requireDisplacementAfterSweep || displacementConfirmed;

      if (reEntryOk && dispOk && sessionRuleSatisfied) {
        status = 'CONFIRMED_CRT';
        directionalBias = 'BULLISH';
        setupClassification = 'BULLISH_CRT_LOW_SWEEP_REENTRY';
      } else {
        status = 'PROVISIONAL_SWEEP_INCOMPLETE';
        directionalBias = 'NEUTRAL';
        const missing: string[] = [];
        if (!reEntryOk) missing.push('range re-entry close above reference low');
        if (!dispOk) missing.push('bullish displacement candle');
        if (!sessionRuleSatisfied) missing.push(`allowed session (${sessionAtSweep} not in configured sessions)`);
        setupClassification = `PROVISIONAL_LOW_SWEEP_AWAITING_${missing.length}_CRITERIA`;
      }

      entryZone = {
        min: refRange.low,
        max: refRange.quarter25
      };
      invalidationPrice = roundPrice(symbol, sweepExtremePrice - spec.pipSize * 2);
      invalidationCondition = `Bullish CRT invalidated on a sustained candle close below the sweep low (${invalidationPrice}).`;
      targets = {
        tp1Midpoint: refRange.midpoint,
        tp2OppositeExtreme: refRange.high
      };
    }

    return {
      id: `crt-${symbol}-${referenceCandle.timestamp}`,
      symbol,
      referenceTimeframe: config.referenceTimeframe,
      confirmationTimeframe: config.confirmationTimeframe,
      referenceRange: refRange,
      sweepType,
      status,
      sweepExtremePrice,
      sweepTimestamp,
      sweepExcursionPips,
      reEntryConfirmed,
      reEntryCandleTimestamp,
      reEntryClosePrice,
      displacementConfirmed,
      sessionAtSweep,
      sessionRuleSatisfied,
      directionalBias,
      setupClassification,
      entryZone,
      invalidationPrice,
      invalidationCondition,
      targets,
      ruleDefinitionSummary,
      ruleConfigUsed: config,
      provenance: {
        category: 'STRATEGY_INTERPRETATION',
        sourceProvider: referenceCandle.sourceProvider || 'DATABASE_CACHE',
        retrievedAt: new Date().toISOString(),
        eventTime: latestEvalCandle ? latestEvalCandle.timestamp : referenceCandle.timestamp,
        timezone: 'UTC',
        freshnessStatus: 'FRESH',
        ruleVersion: config.ruleVersion,
        notes: 'Rules-based Candle Range Theory interpretation. Distinguishes confirmed setups from provisional sweeps.'
      }
    };
  }
}
