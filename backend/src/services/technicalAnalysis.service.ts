/**
 * Module D — Advanced Technical Analysis Engine
 * Deterministic calculations for SMA, EMA, Wilder's RSI, MACD, Wilder's ATR,
 * ADX, Bollinger Bands, Support/Resistance clustering, Fibonacci levels,
 * Candlestick patterns, and Market/Volatility regime classification.
 *
 * Strictly returns null + explicit warnings when underlying candle history is insufficient.
 */

import {
  OHLCVCandle,
  SupportedTimeframe,
  TechnicalIndicatorConfig,
  TechnicalAnalysisSummary,
  SupportResistanceZone,
  CandlestickPatternMatch
} from '../models/intelligence.types';
import { getInstrumentSpec, roundPrice, priceDiffInPips } from './marketData.service';

export const DEFAULT_TECHNICAL_CONFIG: TechnicalIndicatorConfig = {
  smaPeriods: [20, 50, 200],
  emaPeriods: [9, 21, 50, 200],
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  atrPeriod: 14,
  adxPeriod: 14,
  bollingerPeriod: 20,
  bollingerStdDev: 2
};

export class TechnicalAnalysisService {
  /**
   * Computes Simple Moving Average (SMA) for the given period.
   * Returns null if series length < period.
   */
  public static calculateSMA(values: number[], period: number): number | null {
    if (period <= 0 || values.length < period) {
      return null;
    }
    const slice = values.slice(values.length - period);
    const sum = slice.reduce((acc, v) => acc + v, 0);
    return sum / period;
  }

  /**
   * Computes Exponential Moving Average (EMA) series and returns the latest value.
   * Seeded with the SMA of the first `period` elements.
   */
  public static calculateEMASeries(values: number[], period: number): number[] {
    if (period <= 0 || values.length < period) {
      return [];
    }
    const k = 2 / (period + 1);
    const emaSeries: number[] = [];
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    let prevEma = sum / period;
    emaSeries.push(prevEma);

    for (let i = period; i < values.length; i++) {
      const currentEma = values[i] * k + prevEma * (1 - k);
      emaSeries.push(currentEma);
      prevEma = currentEma;
    }
    return emaSeries;
  }

  public static calculateEMA(values: number[], period: number): number | null {
    const series = this.calculateEMASeries(values, period);
    return series.length > 0 ? series[series.length - 1] : null;
  }

  /**
   * Computes Wilder's Relative Strength Index (RSI).
   * Requires at least `period + 1` candles.
   */
  public static calculateRSI(closes: number[], period: number = 14): number | null {
    if (period <= 0 || closes.length < period + 1) {
      return null;
    }

    let gainSum = 0;
    let lossSum = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        gainSum += diff;
      } else {
        lossSum += Math.abs(diff);
      }
    }

    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) {
      return 100;
    }
    const rs = avgGain / avgLoss;
    return Number((100 - 100 / (1 + rs)).toFixed(2));
  }

  /**
   * Computes MACD (12, 26, 9) using EMA series.
   * Requires at least `slowPeriod + signalPeriod - 1` candles.
   */
  public static calculateMACD(
    closes: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macdLine: number | null; signalLine: number | null; histogram: number | null; state: string } {
    const minRequired = slowPeriod + signalPeriod - 1;
    if (closes.length < minRequired) {
      return {
        macdLine: null,
        signalLine: null,
        histogram: null,
        state: 'UNAVAILABLE_INSUFFICIENT_HISTORY'
      };
    }

    const fastEmaSeries = this.calculateEMASeries(closes, fastPeriod);
    const slowEmaSeries = this.calculateEMASeries(closes, slowPeriod);

    // Align fastEmaSeries with slowEmaSeries from index (slowPeriod - 1) of closes
    const offset = slowPeriod - fastPeriod;
    const macdSeries: number[] = [];
    for (let i = 0; i < slowEmaSeries.length; i++) {
      macdSeries.push(fastEmaSeries[i + offset] - slowEmaSeries[i]);
    }

    const signalSeries = this.calculateEMASeries(macdSeries, signalPeriod);
    if (signalSeries.length === 0) {
      return {
        macdLine: null,
        signalLine: null,
        histogram: null,
        state: 'UNAVAILABLE_INSUFFICIENT_HISTORY'
      };
    }

    const macdLine = macdSeries[macdSeries.length - 1];
    const signalLine = signalSeries[signalSeries.length - 1];
    const histogram = macdLine - signalLine;
    const prevHistogram =
      signalSeries.length >= 2
        ? macdSeries[macdSeries.length - 2] - signalSeries[signalSeries.length - 2]
        : histogram;

    let state = 'NEUTRAL';
    if (macdLine > signalLine && histogram > 0) {
      state = histogram >= prevHistogram ? 'BULLISH_EXPANDING' : 'BULLISH_DECELERATING';
    } else if (macdLine < signalLine && histogram < 0) {
      state = histogram <= prevHistogram ? 'BEARISH_EXPANDING' : 'BEARISH_DECELERATING';
    }

    return {
      macdLine: Number(macdLine.toFixed(6)),
      signalLine: Number(signalLine.toFixed(6)),
      histogram: Number(histogram.toFixed(6)),
      state
    };
  }

  /**
   * Computes Wilder's Average True Range (ATR).
   * Requires at least `period + 1` candles.
   */
  public static calculateATRSeries(candles: OHLCVCandle[], period: number = 14): number[] {
    if (period <= 0 || candles.length < period + 1) {
      return [];
    }

    const trueRanges: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const prevClose = candles[i - 1].close;
      const tr = Math.max(
        c.high - c.low,
        Math.abs(c.high - prevClose),
        Math.abs(c.low - prevClose)
      );
      trueRanges.push(tr);
    }

    let sumTr = 0;
    for (let i = 0; i < period; i++) {
      sumTr += trueRanges[i];
    }
    let prevAtr = sumTr / period;
    const atrSeries: number[] = [prevAtr];

    for (let i = period; i < trueRanges.length; i++) {
      const atr = (prevAtr * (period - 1) + trueRanges[i]) / period;
      atrSeries.push(atr);
      prevAtr = atr;
    }

    return atrSeries;
  }

  public static calculateATR(candles: OHLCVCandle[], period: number = 14): number | null {
    const series = this.calculateATRSeries(candles, period);
    return series.length > 0 ? series[series.length - 1] : null;
  }

  /**
   * Computes Wilder's ADX (Average Directional Index) for trend strength.
   * Requires at least `2 * period + 1` candles.
   */
  public static calculateADX(candles: OHLCVCandle[], period: number = 14): number | null {
    if (period <= 0 || candles.length < period * 2 + 1) {
      return null;
    }

    const trList: number[] = [];
    const plusDmList: number[] = [];
    const minusDmList: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const curr = candles[i];
      const prev = candles[i - 1];

      const upMove = curr.high - prev.high;
      const downMove = prev.low - curr.low;

      const plusDm = upMove > downMove && upMove > 0 ? upMove : 0;
      const minusDm = downMove > upMove && downMove > 0 ? downMove : 0;
      const tr = Math.max(
        curr.high - curr.low,
        Math.abs(curr.high - prev.close),
        Math.abs(curr.low - prev.close)
      );

      trList.push(tr);
      plusDmList.push(plusDm);
      minusDmList.push(minusDm);
    }

    let smoothedTr = trList.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothedPlusDm = plusDmList.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothedMinusDm = minusDmList.slice(0, period).reduce((a, b) => a + b, 0);

    const dxList: number[] = [];
    const computeDx = (tr: number, pDm: number, mDm: number): number => {
      if (tr === 0) return 0;
      const pDi = (pDm / tr) * 100;
      const mDi = (mDm / tr) * 100;
      const sumDi = pDi + mDi;
      return sumDi === 0 ? 0 : (Math.abs(pDi - mDi) / sumDi) * 100;
    };

    dxList.push(computeDx(smoothedTr, smoothedPlusDm, smoothedMinusDm));

    for (let i = period; i < trList.length; i++) {
      smoothedTr = smoothedTr - smoothedTr / period + trList[i];
      smoothedPlusDm = smoothedPlusDm - smoothedPlusDm / period + plusDmList[i];
      smoothedMinusDm = smoothedMinusDm - smoothedMinusDm / period + minusDmList[i];
      dxList.push(computeDx(smoothedTr, smoothedPlusDm, smoothedMinusDm));
    }

    if (dxList.length < period) {
      return null;
    }

    let adx = dxList.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dxList.length; i++) {
      adx = (adx * (period - 1) + dxList[i]) / period;
    }

    return Number(adx.toFixed(2));
  }

  /**
   * Computes Bollinger Bands (Middle SMA, Upper/Lower +/- StdDev, Bandwidth %).
   */
  public static calculateBollingerBands(
    closes: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    bandwidthPct: number | null;
  } {
    if (period <= 0 || closes.length < period) {
      return { upper: null, middle: null, lower: null, bandwidthPct: null };
    }
    const slice = closes.slice(closes.length - period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = mean + stdDevMultiplier * stdDev;
    const lower = mean - stdDevMultiplier * stdDev;
    const bandwidthPct = mean !== 0 ? ((upper - lower) / mean) * 100 : null;

    return {
      upper,
      middle: mean,
      lower,
      bandwidthPct: bandwidthPct !== null ? Number(bandwidthPct.toFixed(3)) : null
    };
  }

  /**
   * Clusters swing pivots into horizontal Support, Resistance, and Role-Reversal zones.
   */
  public static detectSupportResistanceZones(
    candles: OHLCVCandle[],
    symbol: string,
    atrValue: number | null
  ): SupportResistanceZone[] {
    if (candles.length < 10) {
      return [];
    }

    const spec = getInstrumentSpec(symbol);
    const currentClose = candles[candles.length - 1].close;
    const clusterTolerance = atrValue ? atrValue * 0.35 : spec.pipSize * 12;

    interface PivotCandidate {
      price: number;
      type: 'HIGH' | 'LOW';
      timestamp: string;
    }

    const pivots: PivotCandidate[] = [];
    const lookback = Math.min(candles.length, 150);
    const startIdx = candles.length - lookback;

    for (let i = startIdx + 2; i < candles.length - 2; i++) {
      const c = candles[i];
      if (
        c.high >= candles[i - 1].high &&
        c.high >= candles[i - 2].high &&
        c.high >= candles[i + 1].high &&
        c.high >= candles[i + 2].high
      ) {
        pivots.push({ price: c.high, type: 'HIGH', timestamp: c.timestamp });
      }
      if (
        c.low <= candles[i - 1].low &&
        c.low <= candles[i - 2].low &&
        c.low <= candles[i + 1].low &&
        c.low <= candles[i + 2].low
      ) {
        pivots.push({ price: c.low, type: 'LOW', timestamp: c.timestamp });
      }
    }

    const clusters: Array<{
      prices: number[];
      types: Set<'HIGH' | 'LOW'>;
      timestamps: string[];
    }> = [];

    for (const p of pivots) {
      let matched = false;
      for (const cluster of clusters) {
        const avg = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
        if (Math.abs(p.price - avg) <= clusterTolerance) {
          cluster.prices.push(p.price);
          cluster.types.add(p.type);
          cluster.timestamps.push(p.timestamp);
          matched = true;
          break;
        }
      }
      if (!matched) {
        clusters.push({
          prices: [p.price],
          types: new Set([p.type]),
          timestamps: [p.timestamp]
        });
      }
    }

    const zones: SupportResistanceZone[] = clusters
      .filter((c) => c.prices.length >= 2)
      .map((cluster) => {
        const center = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
        const zoneHalfWidth = Math.max(clusterTolerance * 0.5, spec.pipSize * 3);
        const zoneMin = roundPrice(symbol, center - zoneHalfWidth);
        const zoneMax = roundPrice(symbol, center + zoneHalfWidth);
        const isRoleReversal = cluster.types.has('HIGH') && cluster.types.has('LOW');

        let type: 'SUPPORT' | 'RESISTANCE' | 'ROLE_REVERSAL_FLIP' =
          center < currentClose ? 'SUPPORT' : 'RESISTANCE';
        if (isRoleReversal) {
          type = 'ROLE_REVERSAL_FLIP';
        }

        // Check breakout & retest status on recent 5 candles
        const recent = candles.slice(-5);
        const crossedRecently = recent.some(
          (rc) => (rc.open < zoneMin && rc.close > zoneMax) || (rc.open > zoneMax && rc.close < zoneMin)
        );
        const retestedRecently = recent.some(
          (rc) => rc.low <= zoneMax && rc.high >= zoneMin
        );

        let breakoutStatus: SupportResistanceZone['breakoutStatus'] = 'HOLDING';
        if (crossedRecently && retestedRecently) {
          breakoutStatus = 'BROKEN_AND_RETESTED';
        } else if (crossedRecently) {
          breakoutStatus = 'BROKEN_AWAITING_RETEST';
        }

        const strengthScore = Math.min(
          100,
          cluster.prices.length * 22 + (isRoleReversal ? 20 : 0)
        );

        return {
          type,
          centerPrice: roundPrice(symbol, center),
          zoneMin,
          zoneMax,
          touches: cluster.prices.length,
          strengthScore,
          firstTouchTimestamp: cluster.timestamps[0],
          lastTouchTimestamp: cluster.timestamps[cluster.timestamps.length - 1],
          breakoutStatus
        };
      })
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 8);

    return zones;
  }

  /**
   * Calculates Fibonacci retracements and extensions from the major swing anchor in the lookback window.
   */
  public static calculateFibonacciLevels(
    candles: OHLCVCandle[],
    symbol: string
  ): TechnicalAnalysisSummary['fibonacci'] {
    if (candles.length < 10) {
      return null;
    }

    const lookback = candles.slice(-Math.min(candles.length, 100));
    let highestHigh = -Infinity;
    let highestIdx = 0;
    let lowestLow = Infinity;
    let lowestIdx = 0;

    for (let i = 0; i < lookback.length; i++) {
      if (lookback[i].high > highestHigh) {
        highestHigh = lookback[i].high;
        highestIdx = i;
      }
      if (lookback[i].low < lowestLow) {
        lowestLow = lookback[i].low;
        lowestIdx = i;
      }
    }

    const range = highestHigh - lowestLow;
    if (range <= 0) {
      return null;
    }

    // If lowest low happened before highest high, the impulse is UP (retracements measured downward from high)
    const isUptrendImpulse = lowestIdx <= highestIdx;
    const direction = isUptrendImpulse ? 'UPTREND_RETRACEMENT' : 'DOWNTREND_RETRACEMENT';

    const retracementFibs = [0.236, 0.382, 0.5, 0.618, 0.705, 0.786];
    const extensionFibs = [1.272, 1.618, 2.0];

    const retracements: Record<string, number> = {};
    const extensions: Record<string, number> = {};

    for (const fib of retracementFibs) {
      const price = isUptrendImpulse
        ? highestHigh - range * fib
        : lowestLow + range * fib;
      retracements[fib.toFixed(3)] = roundPrice(symbol, price);
    }

    for (const ext of extensionFibs) {
      const price = isUptrendImpulse
        ? lowestLow + range * ext
        : highestHigh - range * ext;
      extensions[ext.toFixed(3)] = roundPrice(symbol, price);
    }

    return {
      anchorHigh: roundPrice(symbol, highestHigh),
      anchorLow: roundPrice(symbol, lowestLow),
      direction,
      retracements,
      extensions
    };
  }

  /**
   * Detects deterministic candlestick patterns on the last 10 candles and evaluates structural context.
   */
  public static detectCandlestickPatterns(
    candles: OHLCVCandle[],
    zones: SupportResistanceZone[],
    maAlignment: 'BULLISH_STACK' | 'BEARISH_STACK' | 'MIXED'
  ): CandlestickPatternMatch[] {
    if (candles.length < 3) {
      return [];
    }

    const patterns: CandlestickPatternMatch[] = [];
    const startIdx = Math.max(2, candles.length - 10);

    const isNearZone = (price: number): boolean =>
      zones.some((z) => price >= z.zoneMin && price <= z.zoneMax);

    for (let i = startIdx; i < candles.length; i++) {
      const curr = candles[i];
      const prev = candles[i - 1];
      const prev2 = candles[i - 2];

      const currRange = curr.high - curr.low;
      if (currRange <= 0) continue;

      const currBody = Math.abs(curr.close - curr.open);
      const upperWick = curr.high - Math.max(curr.open, curr.close);
      const lowerWick = Math.min(curr.open, curr.close) - curr.low;

      const prevBody = Math.abs(prev.close - prev.open);
      const nearSr = isNearZone(curr.low) || isNearZone(curr.high);

      const getSignificance = (dir: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): CandlestickPatternMatch['contextSignificance'] => {
        if (nearSr) return 'AT_SUPPORT_RESISTANCE';
        if (
          (dir === 'BULLISH' && maAlignment === 'BULLISH_STACK') ||
          (dir === 'BEARISH' && maAlignment === 'BEARISH_STACK')
        ) {
          return 'WITH_TREND';
        }
        return 'MID_RANGE_LOW_SIGNIFICANCE';
      };

      // 1. Bullish Engulfing
      if (
        prev.close < prev.open &&
        curr.close > curr.open &&
        curr.close >= prev.open &&
        curr.open <= prev.close &&
        currBody > prevBody
      ) {
        patterns.push({
          patternName: 'BULLISH_ENGULFING',
          timestamp: curr.timestamp,
          direction: 'BULLISH',
          contextSignificance: getSignificance('BULLISH'),
          description: 'Bullish body fully engulfs prior bearish body.'
        });
      }

      // 2. Bearish Engulfing
      if (
        prev.close > prev.open &&
        curr.close < curr.open &&
        curr.open >= prev.close &&
        curr.close <= prev.open &&
        currBody > prevBody
      ) {
        patterns.push({
          patternName: 'BEARISH_ENGULFING',
          timestamp: curr.timestamp,
          direction: 'BEARISH',
          contextSignificance: getSignificance('BEARISH'),
          description: 'Bearish body fully engulfs prior bullish body.'
        });
      }

      // 3. Hammer / Bullish Pinbar
      if (lowerWick >= currBody * 2 && upperWick <= currBody * 0.65 && currBody / currRange >= 0.1) {
        patterns.push({
          patternName: 'HAMMER_PINBAR',
          timestamp: curr.timestamp,
          direction: 'BULLISH',
          contextSignificance: getSignificance('BULLISH'),
          description: 'Long lower rejection wick (>= 2x body) indicating downside rejection.'
        });
      }

      // 4. Shooting Star / Bearish Pinbar
      if (upperWick >= currBody * 2 && lowerWick <= currBody * 0.65 && currBody / currRange >= 0.1) {
        patterns.push({
          patternName: 'SHOOTING_STAR',
          timestamp: curr.timestamp,
          direction: 'BEARISH',
          contextSignificance: getSignificance('BEARISH'),
          description: 'Long upper rejection wick (>= 2x body) indicating upside rejection.'
        });
      }

      // 5. Inside Bar
      if (curr.high < prev.high && curr.low > prev.low) {
        patterns.push({
          patternName: 'INSIDE_BAR',
          timestamp: curr.timestamp,
          direction: 'NEUTRAL',
          contextSignificance: getSignificance('NEUTRAL'),
          description: 'Candle high and low contained strictly within previous mother bar range.'
        });
      }

      // 6. Doji
      if (currBody / currRange <= 0.08) {
        patterns.push({
          patternName: 'DOJI',
          timestamp: curr.timestamp,
          direction: 'NEUTRAL',
          contextSignificance: getSignificance('NEUTRAL'),
          description: 'Open and close nearly identical (body <= 8% of total range), signaling indecision.'
        });
      }

      // 7. Morning Star (3-bar bullish reversal)
      const prev2Body = Math.abs(prev2.close - prev2.open);
      const prev2Mid = (prev2.open + prev2.close) / 2;
      if (
        prev2.close < prev2.open &&
        prevBody < prev2Body * 0.4 &&
        curr.close > curr.open &&
        curr.close > prev2Mid
      ) {
        patterns.push({
          patternName: 'MORNING_STAR',
          timestamp: curr.timestamp,
          direction: 'BULLISH',
          contextSignificance: getSignificance('BULLISH'),
          description: '3-candle bullish transition closing above the midpoint of candle 1.'
        });
      }

      // 8. Evening Star (3-bar bearish reversal)
      if (
        prev2.close > prev2.open &&
        prevBody < prev2Body * 0.4 &&
        curr.close < curr.open &&
        curr.close < prev2Mid
      ) {
        patterns.push({
          patternName: 'EVENING_STAR',
          timestamp: curr.timestamp,
          direction: 'BEARISH',
          contextSignificance: getSignificance('BEARISH'),
          description: '3-candle bearish transition closing below the midpoint of candle 1.'
        });
      }
    }

    return patterns.slice(-8);
  }

  /**
   * Runs the full deterministic Technical Analysis suite on an OHLCV candle series.
   */
  public static analyzeSeries(
    symbol: string,
    timeframe: SupportedTimeframe,
    candles: OHLCVCandle[],
    config: TechnicalIndicatorConfig = DEFAULT_TECHNICAL_CONFIG
  ): TechnicalAnalysisSummary {
    const warnings: string[] = [];
    const closes = candles.map((c) => c.close);
    const latestClose = closes.length > 0 ? closes[closes.length - 1] : null;
    const latestTimestamp = candles.length > 0 ? candles[candles.length - 1].timestamp : undefined;

    // 1. Moving Averages
    const sma: Record<number, number | null> = {};
    for (const p of config.smaPeriods) {
      const val = this.calculateSMA(closes, p);
      sma[p] = val !== null ? roundPrice(symbol, val) : null;
      if (val === null) {
        warnings.push(`SMA(${p}) unavailable: requires ${p} candles, found ${candles.length}.`);
      }
    }

    const ema: Record<number, number | null> = {};
    for (const p of config.emaPeriods) {
      const val = this.calculateEMA(closes, p);
      ema[p] = val !== null ? roundPrice(symbol, val) : null;
      if (val === null) {
        warnings.push(`EMA(${p}) unavailable: requires ${p} candles, found ${candles.length}.`);
      }
    }

    const ema20 = ema[21] ?? ema[20] ?? sma[20] ?? null;
    const ema50 = ema[50] ?? sma[50] ?? null;
    const ema200 = ema[200] ?? sma[200] ?? null;

    let maAlignment: 'BULLISH_STACK' | 'BEARISH_STACK' | 'MIXED' = 'MIXED';
    if (latestClose !== null && ema20 !== null && ema50 !== null) {
      if (latestClose > ema20 && ema20 > ema50 && (ema200 === null || ema50 > ema200)) {
        maAlignment = 'BULLISH_STACK';
      } else if (latestClose < ema20 && ema20 < ema50 && (ema200 === null || ema50 < ema200)) {
        maAlignment = 'BEARISH_STACK';
      }
    }

    let priceVs200Ema: 'ABOVE' | 'BELOW' | 'UNAVAILABLE' = 'UNAVAILABLE';
    if (latestClose !== null && ema200 !== null) {
      priceVs200Ema = latestClose >= ema200 ? 'ABOVE' : 'BELOW';
    }

    // 2. Oscillators (RSI & MACD)
    const rsi14 = this.calculateRSI(closes, config.rsiPeriod);
    if (rsi14 === null) {
      warnings.push(
        `RSI(${config.rsiPeriod}) unavailable: requires ${config.rsiPeriod + 1} candles, found ${candles.length}.`
      );
    }

    let rsiState: TechnicalAnalysisSummary['oscillators']['rsiState'] = 'UNAVAILABLE';
    if (rsi14 !== null) {
      if (rsi14 >= 70) rsiState = 'OVERBOUGHT';
      else if (rsi14 <= 30) rsiState = 'OVERSOLD';
      else if (rsi14 >= 55) rsiState = 'BULLISH_MOMENTUM';
      else if (rsi14 <= 45) rsiState = 'BEARISH_MOMENTUM';
      else rsiState = 'NEUTRAL';
    }

    const macd = this.calculateMACD(closes, config.macdFast, config.macdSlow, config.macdSignal);
    if (macd.macdLine === null) {
      const req = config.macdSlow + config.macdSignal - 1;
      warnings.push(`MACD(${config.macdFast},${config.macdSlow},${config.macdSignal}) unavailable: requires ${req} candles, found ${candles.length}.`);
    }

    // 3. Volatility (ATR & Bollinger Bands)
    const atrSeries = this.calculateATRSeries(candles, config.atrPeriod);
    const atrRaw = atrSeries.length > 0 ? atrSeries[atrSeries.length - 1] : null;
    if (atrRaw === null) {
      warnings.push(
        `ATR(${config.atrPeriod}) unavailable: requires ${config.atrPeriod + 1} candles, found ${candles.length}.`
      );
    }

    const atr14 = atrRaw !== null ? roundPrice(symbol, atrRaw) : null;
    const atrPips = atrRaw !== null ? priceDiffInPips(symbol, atrRaw) : null;

    const bb = this.calculateBollingerBands(closes, config.bollingerPeriod, config.bollingerStdDev);
    if (bb.middle === null) {
      warnings.push(
        `Bollinger Bands(${config.bollingerPeriod}) unavailable: requires ${config.bollingerPeriod} candles, found ${candles.length}.`
      );
    }

    // Volatility regime classification comparing current ATR to median ATR over series
    let volRegime: TechnicalAnalysisSummary['volatility']['regime'] = 'UNAVAILABLE';
    if (atrRaw !== null && atrSeries.length >= 5) {
      const avgAtr = atrSeries.reduce((a, b) => a + b, 0) / atrSeries.length;
      const ratio = avgAtr > 0 ? atrRaw / avgAtr : 1;
      if (ratio >= 1.65) {
        volRegime = 'EXTREME_VOLATILITY';
      } else if (ratio >= 1.2) {
        volRegime = 'HIGH_VOLATILITY_EXPANSION';
      } else if (ratio <= 0.75) {
        volRegime = 'LOW_VOLATILITY_SQUEEZE';
      } else {
        volRegime = 'NORMAL_VOLATILITY';
      }
    } else if (atrRaw !== null) {
      volRegime = 'NORMAL_VOLATILITY';
    }

    // 4. Market Regime (ADX + MA slope/stack)
    const adx14 = this.calculateADX(candles, config.adxPeriod);
    if (adx14 === null) {
      warnings.push(
        `ADX(${config.adxPeriod}) unavailable: requires ${config.adxPeriod * 2 + 1} candles, found ${candles.length}.`
      );
    }

    let regimeClassification: TechnicalAnalysisSummary['marketRegime']['classification'] = 'UNAVAILABLE';
    let trendStrengthScore: number | null = null;
    let regimeExplanation = 'Insufficient historical bars to classify market regime.';

    if (candles.length >= 20 && latestClose !== null) {
      const sma20Val = sma[20] ?? latestClose;
      const ema50Val = ema50 ?? sma20Val;

      if (adx14 !== null) {
        trendStrengthScore = Math.min(100, Math.round(adx14 * 2));
        if (adx14 >= 25) {
          if (latestClose >= sma20Val && sma20Val >= ema50Val) {
            regimeClassification = 'TRENDING_BULLISH';
            regimeExplanation = `ADX(${config.adxPeriod}) at ${adx14} (>= 25) with bullish moving average alignment.`;
          } else if (latestClose <= sma20Val && sma20Val <= ema50Val) {
            regimeClassification = 'TRENDING_BEARISH';
            regimeExplanation = `ADX(${config.adxPeriod}) at ${adx14} (>= 25) with bearish moving average alignment.`;
          } else {
            regimeClassification = 'TRANSITIONING';
            regimeExplanation = `ADX(${config.adxPeriod}) at ${adx14} indicates directional strength, but moving averages are mixed/crossing.`;
          }
        } else if (adx14 < 20) {
          regimeClassification = 'RANGE_BOUND';
          regimeExplanation = `ADX(${config.adxPeriod}) at ${adx14} (< 20) indicates low trend directional strength (range-bound equilibrium).`;
        } else {
          regimeClassification = 'TRANSITIONING';
          regimeExplanation = `ADX(${config.adxPeriod}) at ${adx14} (20–25) indicates market transitioning between consolidation and trend.`;
        }
      } else {
        // Fallback regime classification using MA stack and price range position when ADX needs more bars
        if (maAlignment === 'BULLISH_STACK') {
          regimeClassification = 'TRENDING_BULLISH';
          trendStrengthScore = 60;
          regimeExplanation = 'Bullish moving average stack (Price > Fast MA > Slow MA); ADX history still accumulating.';
        } else if (maAlignment === 'BEARISH_STACK') {
          regimeClassification = 'TRENDING_BEARISH';
          trendStrengthScore = 60;
          regimeExplanation = 'Bearish moving average stack (Price < Fast MA < Slow MA); ADX history still accumulating.';
        } else {
          regimeClassification = 'RANGE_BOUND';
          trendStrengthScore = 30;
          regimeExplanation = 'Mixed moving average alignment indicating consolidation range.';
        }
      }
    }

    // 5. Support & Resistance, Fibonacci, Candlestick Patterns
    const supportResistanceZones = this.detectSupportResistanceZones(candles, symbol, atrRaw);
    const fibonacci = this.calculateFibonacciLevels(candles, symbol);
    const candlestickPatterns = this.detectCandlestickPatterns(candles, supportResistanceZones, maAlignment);

    return {
      symbol,
      timeframe,
      candleCount: candles.length,
      insufficientHistoryWarnings: warnings,
      movingAverages: {
        sma,
        ema,
        maAlignment,
        priceVs200Ema
      },
      oscillators: {
        rsi14,
        rsiState,
        macd
      },
      volatility: {
        atr14,
        atrPips,
        bollingerUpper: bb.upper !== null ? roundPrice(symbol, bb.upper) : null,
        bollingerMiddle: bb.middle !== null ? roundPrice(symbol, bb.middle) : null,
        bollingerLower: bb.lower !== null ? roundPrice(symbol, bb.lower) : null,
        bollingerBandwidthPct: bb.bandwidthPct,
        regime: volRegime
      },
      marketRegime: {
        classification: regimeClassification,
        adx14,
        trendStrengthScore,
        explanation: regimeExplanation
      },
      supportResistanceZones,
      fibonacci,
      candlestickPatterns,
      provenance: {
        category: candles.length > 0 ? 'DETERMINISTIC_METRIC' : 'UNAVAILABLE_DATA',
        sourceProvider: candles.length > 0 ? candles[candles.length - 1].sourceProvider : 'UNAVAILABLE',
        retrievedAt: new Date().toISOString(),
        eventTime: latestTimestamp,
        timezone: 'UTC',
        freshnessStatus: candles.length > 0 ? 'FRESH' : 'UNAVAILABLE',
        ruleVersion: 'TECH-ENGINE-v1.0.0',
        notes: warnings.length > 0 ? `${warnings.length} indicator(s) omitted due to candle count (${candles.length}).` : 'All indicators computed deterministically.'
      }
    };
  }
}
