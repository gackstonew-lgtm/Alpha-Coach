/**
 * Mathematical Indicators & Candle Transformers
 * Pure, deterministic functions with zero side-effects.
 * Formulations adhere to standard financial market conventions (Wilder, Bollinger, Appel).
 */

export interface OHLCVBar {
  time: number | string; // Unix timestamp in seconds or YYYY-MM-DD string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LinePoint {
  time: number | string;
  value: number;
}

export interface BollingerBandsPoint {
  time: number | string;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDPoint {
  time: number | string;
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Transforms standard OHLC candles to Heikin-Ashi bars.
 * HA Close = (Open + High + Low + Close) / 4
 * HA Open = (Prev HA Open + Prev HA Close) / 2
 * HA High = Max(High, HA Open, HA Close)
 * HA Low = Min(Low, HA Open, HA Close)
 */
export function calculateHeikinAshi(bars: OHLCVBar[]): OHLCVBar[] {
  if (!bars || bars.length === 0) return [];

  const result: OHLCVBar[] = [];
  let prevHaOpen = bars[0].open;
  let prevHaClose = (bars[0].open + bars[0].high + bars[0].low + bars[0].close) / 4;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const haClose = (b.open + b.high + b.low + b.close) / 4;
    const haOpen = i === 0 ? (b.open + b.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(b.high, haOpen, haClose);
    const haLow = Math.min(b.low, haOpen, haClose);

    result.push({
      time: b.time,
      open: Number(haOpen.toFixed(5)),
      high: Number(haHigh.toFixed(5)),
      low: Number(haLow.toFixed(5)),
      close: Number(haClose.toFixed(5)),
      volume: b.volume
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return result;
}

/**
 * Calculates Simple Moving Average (SMA).
 */
export function calculateSMA(bars: OHLCVBar[], period: number = 20): LinePoint[] {
  if (!bars || bars.length < period) return [];
  const points: LinePoint[] = [];

  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= period) {
      sum -= bars[i - period].close;
    }
    if (i >= period - 1) {
      points.push({
        time: bars[i].time,
        value: Number((sum / period).toFixed(5))
      });
    }
  }

  return points;
}

/**
 * Calculates Exponential Moving Average (EMA).
 */
export function calculateEMA(bars: OHLCVBar[], period: number = 20): LinePoint[] {
  if (!bars || bars.length < period) return [];
  const points: LinePoint[] = [];
  const multiplier = 2 / (period + 1);

  // Initial SMA for first period
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += bars[i].close;
  }
  let prevEma = initialSum / period;
  points.push({
    time: bars[period - 1].time,
    value: Number(prevEma.toFixed(5))
  });

  for (let i = period; i < bars.length; i++) {
    const currentPrice = bars[i].close;
    const currentEma = (currentPrice - prevEma) * multiplier + prevEma;
    points.push({
      time: bars[i].time,
      value: Number(currentEma.toFixed(5))
    });
    prevEma = currentEma;
  }

  return points;
}

/**
 * Calculates Bollinger Bands (Upper, Middle, Lower).
 */
export function calculateBollingerBands(
  bars: OHLCVBar[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsPoint[] {
  if (!bars || bars.length < period) return [];
  const result: BollingerBandsPoint[] = [];

  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, b) => sum + b.close, 0) / period;
    const variance = slice.reduce((sum, b) => sum + Math.pow(b.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    result.push({
      time: bars[i].time,
      middle: Number(mean.toFixed(5)),
      upper: Number((mean + stdDev * stdDevMultiplier).toFixed(5)),
      lower: Number((mean - stdDev * stdDevMultiplier).toFixed(5))
    });
  }

  return result;
}

/**
 * Calculates Wilder's Relative Strength Index (RSI).
 */
export function calculateRSI(bars: OHLCVBar[], period: number = 14): LinePoint[] {
  if (!bars || bars.length <= period) return [];
  const result: LinePoint[] = [];

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

  result.push({
    time: bars[period].time,
    value: Number(rsi.toFixed(2))
  });

  for (let i = period + 1; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    result.push({
      time: bars[i].time,
      value: Number(rsi.toFixed(2))
    });
  }

  return result;
}

/**
 * Calculates MACD (12, 26, 9 standard defaults).
 */
export function calculateMACD(
  bars: OHLCVBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDPoint[] {
  if (!bars || bars.length < slowPeriod + signalPeriod) return [];

  const fastEma = calculateEMA(bars, fastPeriod);
  const slowEma = calculateEMA(bars, slowPeriod);

  // Align slow EMA and fast EMA by time
  const slowMap = new Map(slowEma.map((p) => [p.time, p.value]));
  const macdLinePoints: LinePoint[] = [];

  for (const f of fastEma) {
    if (slowMap.has(f.time)) {
      const slowVal = slowMap.get(f.time)!;
      macdLinePoints.push({
        time: f.time,
        value: Number((f.value - slowVal).toFixed(5))
      });
    }
  }

  // Calculate Signal Line (EMA of MACD line)
  // Use dummy bars with close = macd value
  const macdBars: OHLCVBar[] = macdLinePoints.map((m) => ({
    time: m.time,
    open: m.value,
    high: m.value,
    low: m.value,
    close: m.value
  }));

  const signalLine = calculateEMA(macdBars, signalPeriod);
  const signalMap = new Map(signalLine.map((s) => [s.time, s.value]));

  const result: MACDPoint[] = [];
  for (const m of macdLinePoints) {
    if (signalMap.has(m.time)) {
      const sig = signalMap.get(m.time)!;
      result.push({
        time: m.time,
        macd: m.value,
        signal: sig,
        histogram: Number((m.value - sig).toFixed(5))
      });
    }
  }

  return result;
}

/**
 * Calculates Average True Range (ATR).
 */
export function calculateATR(bars: OHLCVBar[], period: number = 14): LinePoint[] {
  if (!bars || bars.length <= period) return [];
  const result: LinePoint[] = [];

  const trs: number[] = [bars[0].high - bars[0].low];
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close)
    );
    trs.push(tr);
  }

  // Initial ATR (SMA of TR)
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result.push({
    time: bars[period - 1].time,
    value: Number(atr.toFixed(5))
  });

  for (let i = period; i < bars.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({
      time: bars[i].time,
      value: Number(atr.toFixed(5))
    });
  }

  return result;
}

/**
 * Calculates Volume-Weighted Average Price (VWAP).
 */
export function calculateVWAP(bars: OHLCVBar[]): LinePoint[] {
  if (!bars || bars.length === 0) return [];
  const result: LinePoint[] = [];

  let cumulativeTypicalVol = 0;
  let cumulativeVol = 0;

  for (const b of bars) {
    const typicalPrice = (b.high + b.low + b.close) / 3;
    const vol = b.volume && b.volume > 0 ? b.volume : 1;
    cumulativeTypicalVol += typicalPrice * vol;
    cumulativeVol += vol;

    const vwap = cumulativeTypicalVol / Math.max(1, cumulativeVol);
    result.push({
      time: b.time,
      value: Number(vwap.toFixed(5))
    });
  }

  return result;
}
