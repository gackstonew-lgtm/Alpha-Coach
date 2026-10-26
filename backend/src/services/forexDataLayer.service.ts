/**
 * Arcade Fx — Live Forex Data Layer Service
 * Provides historical OHLCV data backfill, multi-timeframe candle aggregation,
 * real-time quote streaming, market conditions (sessions, ATR, trend), and
 * institutional price levels (pivots, previous H/L/C, swing S/R).
 */

import { getDatabase } from '../db/db';
import {
  SupportedTimeframe,
  MarketDataProviderId,
  OHLCVCandle
} from '../models/intelligence.types';
import {
  MarketDataService,
  TIMEFRAME_SECONDS,
  getInstrumentSpec
} from './marketData.service';
import { Response } from 'express';

export interface LightweightChartBar {
  time: number; // UTC unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LiveQuote {
  symbol: string;
  bid: number;
  ask: number;
  spreadPips: number;
  spreadRaw: number;
  lastUpdated: string;
  sourceProvider: string;
}

export interface ForexSessionInfo {
  name: string;
  utcOpenHour: number;
  utcCloseHour: number;
  isActive: boolean;
  status: 'OPEN' | 'CLOSED';
}

export interface MarketConditionsResult {
  symbol: string;
  isMarketOpen: boolean;
  marketStatusText: string;
  utcTime: string;
  activeSessions: string[];
  isSessionOverlap: boolean;
  sessions: ForexSessionInfo[];
  daily: {
    currentPrice: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    changePips: number;
  };
  atr: {
    atr14: number;
    atr14Pips: number;
    todayRange: number;
    todayRangePips: number;
    rangeRatioPercent: number;
  };
  trend: {
    state: 'STRONG_BULLISH' | 'BULLISH' | 'STRONG_BEARISH' | 'BEARISH' | 'NEUTRAL_CONSOLIDATING';
    summary: string;
    ema50: number | null;
    ema200: number | null;
    priceVsEma50Percent: number | null;
    priceVsEma200Percent: number | null;
  };
}

export interface PriceLevelsResult {
  symbol: string;
  currentPrice: number;
  today: {
    open: number;
    high: number;
    low: number;
  };
  previousDay: {
    high: number;
    low: number;
    close: number;
    rangePips: number;
  } | null;
  previousWeek: {
    high: number;
    low: number;
    close: number;
  } | null;
  previousMonth: {
    high: number;
    low: number;
    close: number;
  } | null;
  classicPivots: {
    P: number;
    R1: number;
    R2: number;
    R3: number;
    S1: number;
    S2: number;
    S3: number;
  } | null;
  swingLevels: Array<{
    price: number;
    type: 'SUPPORT' | 'RESISTANCE';
    strength: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
    description: string;
  }>;
}

export class ForexDataLayerService {
  // In-memory quote cache to prevent excessive provider calls
  private static quoteCache = new Map<string, { quote: LiveQuote; cachedAt: number }>();
  // Connected SSE clients by symbol
  private static sseClients = new Map<string, Set<Response>>();
  // Polling ticker timer
  private static tickerInterval: NodeJS.Timeout | null = null;

  /**
   * Normalizes symbol (EURUSD, EUR/USD, EURUSD.raw -> EURUSD)
   */
  public static cleanSymbol(raw: string): string {
    return (raw || 'EURUSD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  /**
   * Normalizes timeframe string to standard SupportedTimeframe
   */
  public static normalizeTimeframe(tf: string): SupportedTimeframe {
    const upper = (tf || 'H1').toUpperCase();
    if (upper === 'M1' || upper === '1M' || upper === '1MIN') return 'M1';
    if (upper === 'M5' || upper === '5M' || upper === '5MIN') return 'M5';
    if (upper === 'M15' || upper === '15M' || upper === '15MIN') return 'M15';
    if (upper === 'M30' || upper === '30M' || upper === '30MIN') return 'M30';
    if (upper === 'H1' || upper === '1H' || upper === '60M') return 'H1';
    if (upper === 'H4' || upper === '4H' || upper === '240M') return 'H4';
    if (upper === 'D1' || upper === '1D' || upper === 'D') return 'D1';
    if (upper === 'W1' || upper === '1W' || upper === 'W') return 'W1';
    if (upper === 'MN' || upper === 'MN1' || upper === '1MTH') return 'MN1';
    return 'H1';
  }

  /**
   * Checks whether the Forex market is currently open.
   * Standard Forex trading hours: Sunday 22:00 UTC through Friday 22:00 UTC.
   */
  public static isForexMarketOpen(now: Date = new Date()): boolean {
    const day = now.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const hour = now.getUTCHours();
    const min = now.getUTCMinutes();
    const timeDec = hour + min / 60;

    // Saturday: completely closed
    if (day === 6) return false;
    // Sunday: closed before 22:00 UTC
    if (day === 0 && timeDec < 22) return false;
    // Friday: closes at 22:00 UTC
    if (day === 5 && timeDec >= 22) return false;

    return true;
  }

  /**
   * Computes active Forex trading sessions in UTC, including overlaps.
   * - Sydney:   21:00 - 06:00 UTC
   * - Tokyo:    00:00 - 09:00 UTC
   * - London:   07:00 - 16:00 UTC
   * - New York: 12:00 - 21:00 UTC
   */
  public static getActiveSessions(now: Date = new Date()): {
    activeSessions: string[];
    isOverlap: boolean;
    sessions: ForexSessionInfo[];
  } {
    const hour = now.getUTCHours();

    const checkSession = (utcOpen: number, utcClose: number): boolean => {
      if (utcOpen < utcClose) {
        return hour >= utcOpen && hour < utcClose;
      } else {
        // Wraps midnight (e.g. Sydney 21:00 to 06:00)
        return hour >= utcOpen || hour < utcClose;
      }
    };

    const sydneyActive = checkSession(21, 6);
    const tokyoActive = checkSession(0, 9);
    const londonActive = checkSession(7, 16);
    const newYorkActive = checkSession(12, 21);

    const sessions: ForexSessionInfo[] = [
      { name: 'Sydney', utcOpenHour: 21, utcCloseHour: 6, isActive: sydneyActive, status: sydneyActive ? 'OPEN' : 'CLOSED' },
      { name: 'Tokyo', utcOpenHour: 0, utcCloseHour: 9, isActive: tokyoActive, status: tokyoActive ? 'OPEN' : 'CLOSED' },
      { name: 'London', utcOpenHour: 7, utcCloseHour: 16, isActive: londonActive, status: londonActive ? 'OPEN' : 'CLOSED' },
      { name: 'New York', utcOpenHour: 12, utcCloseHour: 21, isActive: newYorkActive, status: newYorkActive ? 'OPEN' : 'CLOSED' }
    ];

    const activeSessions = sessions.filter(s => s.isActive).map(s => s.name);
    const isOverlap = activeSessions.length >= 2;

    return { activeSessions, isOverlap, sessions };
  }

  /**
   * Aggregates lower-timeframe candles into higher-timeframe candles deterministically.
   * Groups by interval boundary in UTC seconds.
   */
  public static aggregateCandles(
    candles: LightweightChartBar[],
    targetSeconds: number
  ): LightweightChartBar[] {
    if (!candles || candles.length === 0 || targetSeconds <= 0) return [];

    // Ensure sorted ascending
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const buckets = new Map<number, LightweightChartBar[]>();

    for (const c of sorted) {
      if (!isFinite(c.open) || !isFinite(c.high) || !isFinite(c.low) || !isFinite(c.close)) continue;
      const bucketTime = Math.floor(c.time / targetSeconds) * targetSeconds;
      const list = buckets.get(bucketTime) || [];
      list.push(c);
      buckets.set(bucketTime, list);
    }

    const aggregated: LightweightChartBar[] = [];
    const sortedTimes = Array.from(buckets.keys()).sort((a, b) => a - b);

    for (const bucketTime of sortedTimes) {
      const bars = buckets.get(bucketTime)!;
      if (bars.length === 0) continue;

      const open = bars[0].open;
      const close = bars[bars.length - 1].close;
      let high = -Infinity;
      let low = Infinity;
      let volume = 0;

      for (const b of bars) {
        if (b.high > high) high = b.high;
        if (b.low < low) low = b.low;
        volume += b.volume || 0;
      }

      aggregated.push({
        time: bucketTime,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return aggregated;
  }

  /**
   * Resolves Yahoo Finance ticker symbol for a given pair.
   */
  public static getYahooTicker(symbol: string): string {
    const clean = this.cleanSymbol(symbol);
    if (clean === 'XAUUSD') return 'GC=F';
    if (clean === 'XAGUSD') return 'SI=F';
    return `${clean}=X`;
  }

  /**
   * Fetches historical OHLCV candles from Yahoo Finance.
   * Supports M1, M5, M15, M30, H1, D1, W1, MN1 with up to 500+ bars.
   */
  public static async fetchYahooFinanceCandles(
    symbol: string,
    timeframe: SupportedTimeframe,
    limit: number = 500
  ): Promise<LightweightChartBar[]> {
    const clean = this.cleanSymbol(symbol);
    const ticker = this.getYahooTicker(clean);

    let interval = '1h';
    let range = '1mo';

    switch (timeframe) {
      case 'M1':
        interval = '1m';
        range = '7d';
        break;
      case 'M5':
        interval = '5m';
        range = '1mo';
        break;
      case 'M15':
        interval = '15m';
        range = '1mo';
        break;
      case 'M30':
        interval = '30m';
        range = '1mo';
        break;
      case 'H1':
        interval = '1h';
        range = '3mo';
        break;
      case 'H4':
        // Yahoo doesn't support 4h directly; fetch 1h and aggregate into 4h
        interval = '1h';
        range = '6mo';
        break;
      case 'D1':
        interval = '1d';
        range = '2y';
        break;
      case 'W1':
        interval = '1wk';
        range = '5y';
        break;
      case 'MN':
      case 'MN1':
        interval = '1mo';
        range = '10y';
        break;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return [];
      }

      const json: any = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
        return [];
      }

      const timestamps: number[] = result.timestamp;
      const quote = result.indicators.quote[0];
      const opens: (number | null)[] = quote.open || [];
      const highs: (number | null)[] = quote.high || [];
      const lows: (number | null)[] = quote.low || [];
      const closes: (number | null)[] = quote.close || [];
      const volumes: (number | null)[] = quote.volume || [];

      const rawBars: LightweightChartBar[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const o = opens[i];
        const h = highs[i];
        const l = lows[i];
        const c = closes[i];
        const t = timestamps[i];

        if (
          t &&
          o !== null && !isNaN(o) &&
          h !== null && !isNaN(h) &&
          l !== null && !isNaN(l) &&
          c !== null && !isNaN(c) &&
          o > 0 && h > 0 && l > 0 && c > 0
        ) {
          rawBars.push({
            time: t,
            open: Number(o.toFixed(5)),
            high: Number(h.toFixed(5)),
            low: Number(l.toFixed(5)),
            close: Number(c.toFixed(5)),
            volume: Number(volumes[i] || 0)
          });
        }
      }

      // If H4 requested, aggregate 1h bars into 4h (14400s)
      if (timeframe === 'H4') {
        const aggregated = this.aggregateCandles(rawBars, 14400);
        return aggregated.slice(-limit);
      }

      // If M30 requested and Yahoo interval was 15m/1m, aggregate to 1800s
      if (timeframe === 'M30' && interval !== '30m') {
        const aggregated = this.aggregateCandles(rawBars, 1800);
        return aggregated.slice(-limit);
      }

      return rawBars.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Ingests bars into database `market_candles` table.
   */
  public static async persistCandles(
    symbol: string,
    timeframe: SupportedTimeframe,
    bars: LightweightChartBar[],
    provider: string = 'YAHOO_FINANCE'
  ): Promise<void> {
    if (!bars || bars.length === 0) return;
    const clean = this.cleanSymbol(symbol);

    try {
      const db = getDatabase();
      const insertSql = `
        INSERT INTO market_candles (id, symbol, timeframe, candle_time, open_price, high_price, low_price, close_price, volume, is_closed, source_provider)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(symbol, timeframe, candle_time, source_provider)
        DO UPDATE SET
          open_price = excluded.open_price,
          high_price = excluded.high_price,
          low_price = excluded.low_price,
          close_price = excluded.close_price,
          volume = excluded.volume
      `;

      for (const bar of bars) {
        const iso = new Date(bar.time * 1000).toISOString();
        const id = `${clean}_${timeframe}_${bar.time}_${provider}`;
        await db.run(insertSql, [
          id,
          clean,
          timeframe,
          iso,
          bar.open,
          bar.high,
          bar.low,
          bar.close,
          bar.volume,
          provider
        ]);
      }
    } catch {
      // Ignore DB write errors if table schema differs
    }
  }

  /**
   * Retrieves OHLCV candles with automatic fallback & multi-timeframe backfill.
   */
  public static async getCandles(params: {
    symbol: string;
    timeframe: string;
    limit?: number;
  }): Promise<{
    symbol: string;
    timeframe: SupportedTimeframe;
    candles: LightweightChartBar[];
    sourceProvider: string;
    count: number;
    currentPrice: number | null;
  }> {
    const symbol = this.cleanSymbol(params.symbol);
    const timeframe = this.normalizeTimeframe(params.timeframe);
    const limit = Math.max(10, Math.min(params.limit || 500, 1000));

    // 1. Try Yahoo Finance live historical candles
    let bars = await this.fetchYahooFinanceCandles(symbol, timeframe, limit);
    let provider = 'YAHOO_FINANCE';

    // 2. If Yahoo returned fewer than 20 bars, try existing MarketDataService (TwelveData / Frankfurter / Deals)
    if (bars.length < 20) {
      try {
        const mRes = await MarketDataService.getCandles({
          symbol,
          timeframe,
          limit,
          allowExternalFetch: true
        });

        if (mRes && mRes.candles && mRes.candles.length > 0) {
          bars = mRes.candles.map(c => ({
            time: Math.floor(new Date(c.timestamp).getTime() / 1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume || 0
          }));
          provider = mRes.provenance?.sourceProvider || 'MARKET_DATA_SERVICE';
        }
      } catch {
        // Fall through
      }
    }

    // 3. If bars are still empty and timeframe is higher (M15, M30, H1, H4), try lower timeframe aggregation
    if (bars.length < 10 && ['M5', 'M15', 'M30', 'H1', 'H4'].includes(timeframe)) {
      const lowerTf: SupportedTimeframe = timeframe === 'H4' ? 'H1' : 'M5';
      const lowerBars = await this.fetchYahooFinanceCandles(symbol, lowerTf, 500);
      if (lowerBars.length > 0) {
        const targetSec = TIMEFRAME_SECONDS[timeframe] || 3600;
        bars = this.aggregateCandles(lowerBars, targetSec);
        provider = `AGGREGATED_${lowerTf}_TO_${timeframe}`;
      }
    }

    // Sort ascending, deduplicate
    bars.sort((a, b) => a.time - b.time);
    const deduplicated: LightweightChartBar[] = [];
    const seenTimes = new Set<number>();
    for (const b of bars) {
      if (!seenTimes.has(b.time)) {
        seenTimes.add(b.time);
        deduplicated.push(b);
      }
    }

    // Asynchronously cache in DB
    this.persistCandles(symbol, timeframe, deduplicated, provider).catch(() => {});

    const currentPrice = deduplicated.length > 0 ? deduplicated[deduplicated.length - 1].close : null;

    return {
      symbol,
      timeframe,
      candles: deduplicated,
      sourceProvider: provider,
      count: deduplicated.length,
      currentPrice
    };
  }

  /**
   * Retrieves real-time quote (Bid, Ask, Spread) for a symbol.
   */
  public static async getLiveQuote(symbolRaw: string): Promise<LiveQuote> {
    const symbol = this.cleanSymbol(symbolRaw);
    const now = Date.now();

    // Check memory cache (valid for 2 seconds)
    const cached = this.quoteCache.get(symbol);
    if (cached && now - cached.cachedAt < 2000) {
      return cached.quote;
    }

    const spec = getInstrumentSpec(symbol);
    const spreadPips = spec.typicalSpreadPips || 1.0;
    const spreadRaw = spec.pipSize * spreadPips;

    // Fetch latest 1m / 5m candle from Yahoo
    const bars = await this.fetchYahooFinanceCandles(symbol, 'M1', 2);
    let basePrice = 1.0850;
    let provider = 'DERIVED_MODEL';

    if (bars.length > 0) {
      basePrice = bars[bars.length - 1].close;
      provider = 'YAHOO_LIVE';
    }

    const halfSpread = spreadRaw / 2;
    const bid = Number((basePrice - halfSpread).toFixed(spec.digits));
    const ask = Number((basePrice + halfSpread).toFixed(spec.digits));

    const quote: LiveQuote = {
      symbol,
      bid,
      ask,
      spreadPips,
      spreadRaw: Number(spreadRaw.toFixed(spec.digits)),
      lastUpdated: new Date().toISOString(),
      sourceProvider: provider
    };

    this.quoteCache.set(symbol, { quote, cachedAt: now });
    return quote;
  }

  /**
   * Computes Classic Pivot Points (Daily).
   * P = (H + L + C) / 3
   * R1 = (2 * P) - L, S1 = (2 * P) - H
   * R2 = P + (H - L), S2 = P - (H - L)
   * R3 = H + 2 * (P - L), S3 = L - 2 * (H - P)
   */
  public static calculateClassicPivots(high: number, low: number, close: number) {
    const P = (high + low + close) / 3;
    const R1 = 2 * P - low;
    const S1 = 2 * P - high;
    const R2 = P + (high - low);
    const S2 = P - (high - low);
    const R3 = high + 2 * (P - low);
    const S3 = low - 2 * (high - P);

    return { P, R1, R2, R3, S1, S2, S3 };
  }

  /**
   * Computes ATR(14) using True Range.
   * TR = max(H - L, |H - Cprev|, |L - Cprev|)
   */
  public static calculateATR14(dailyBars: LightweightChartBar[]): number | null {
    if (!dailyBars || dailyBars.length < 2) return null;

    const trValues: number[] = [];
    for (let i = 1; i < dailyBars.length; i++) {
      const prevClose = dailyBars[i - 1].close;
      const current = dailyBars[i];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prevClose),
        Math.abs(current.low - prevClose)
      );
      trValues.push(tr);
    }

    if (trValues.length < 14) {
      // Use simple average if fewer than 14 bars
      const sum = trValues.reduce((acc, v) => acc + v, 0);
      return trValues.length > 0 ? sum / trValues.length : null;
    }

    // 14-period Wilder RMA
    let atr = trValues.slice(0, 14).reduce((acc, v) => acc + v, 0) / 14;
    for (let i = 14; i < trValues.length; i++) {
      atr = (atr * 13 + trValues[i]) / 14;
    }

    return atr;
  }

  /**
   * Computes EMA of a series.
   */
  public static calculateEMA(values: number[], period: number): number | null {
    if (!values || values.length < period) return null;
    const k = 2 / (period + 1);

    // Initial SMA
    let ema = values.slice(0, period).reduce((acc, v) => acc + v, 0) / period;
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    return ema;
  }

  /**
   * Identifies fractal swing highs & lows for Support/Resistance.
   */
  public static findSwingLevels(
    bars: LightweightChartBar[],
    specDigits: number,
    swingWindow: number = 3
  ): Array<{
    price: number;
    type: 'SUPPORT' | 'RESISTANCE';
    strength: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
    description: string;
  }> {
    if (!bars || bars.length < swingWindow * 2 + 1) return [];

    const levels: Array<{
      price: number;
      type: 'SUPPORT' | 'RESISTANCE';
      strength: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
      description: string;
    }> = [];

    for (let i = swingWindow; i < bars.length - swingWindow; i++) {
      const current = bars[i];
      let isHigh = true;
      let isLow = true;

      for (let j = 1; j <= swingWindow; j++) {
        if (bars[i - j].high >= current.high || bars[i + j].high >= current.high) {
          isHigh = false;
        }
        if (bars[i - j].low <= current.low || bars[i + j].low <= current.low) {
          isLow = false;
        }
      }

      if (isHigh) {
        levels.push({
          price: Number(current.high.toFixed(specDigits)),
          type: 'RESISTANCE',
          strength: i > bars.length - 20 ? 'MAJOR' : 'INTERMEDIATE',
          description: `Swing High @ ${current.high.toFixed(specDigits)}`
        });
      }
      if (isLow) {
        levels.push({
          price: Number(current.low.toFixed(specDigits)),
          type: 'SUPPORT',
          strength: i > bars.length - 20 ? 'MAJOR' : 'INTERMEDIATE',
          description: `Swing Low @ ${current.low.toFixed(specDigits)}`
        });
      }
    }

    // Keep the most recent / strongest 8 levels
    return levels.slice(-8);
  }

  /**
   * Computes comprehensive Market Conditions per symbol.
   */
  public static async getMarketConditions(symbolRaw: string): Promise<MarketConditionsResult> {
    const symbol = this.cleanSymbol(symbolRaw);
    const spec = getInstrumentSpec(symbol);
    const now = new Date();
    const isMarketOpen = this.isForexMarketOpen(now);
    const { activeSessions, isOverlap: isSessionOverlap, sessions } = this.getActiveSessions(now);

    // Fetch D1 daily bars for change and ATR
    const dailyBars = await this.fetchYahooFinanceCandles(symbol, 'D1', 30);
    // Fetch H1 bars for trend EMA
    const h1Bars = await this.fetchYahooFinanceCandles(symbol, 'H1', 250);

    const latestDaily = dailyBars[dailyBars.length - 1] || {
      open: 1.0850,
      high: 1.0880,
      low: 1.0820,
      close: 1.0850
    };
    const prevDaily = dailyBars.length >= 2 ? dailyBars[dailyBars.length - 2] : null;

    const currentPrice = latestDaily.close;
    const prevClose = prevDaily ? prevDaily.close : latestDaily.open;
    const change = Number((currentPrice - prevClose).toFixed(spec.digits));
    const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
    const changePips = spec.pipSize > 0 ? Number((change / spec.pipSize).toFixed(1)) : 0;

    // ATR(14)
    const rawAtr = this.calculateATR14(dailyBars);
    const atr14 = rawAtr ? Number(rawAtr.toFixed(spec.digits)) : Number((spec.pipSize * 65).toFixed(spec.digits));
    const atr14Pips = spec.pipSize > 0 ? Number((atr14 / spec.pipSize).toFixed(1)) : 65;

    const todayRange = Number((latestDaily.high - latestDaily.low).toFixed(spec.digits));
    const todayRangePips = spec.pipSize > 0 ? Number((todayRange / spec.pipSize).toFixed(1)) : 0;
    const rangeRatioPercent = atr14 > 0 ? Math.min(300, Math.round((todayRange / atr14) * 100)) : 100;

    // Trend: EMA 50 & EMA 200 on H1 closes
    const h1Closes = h1Bars.map(b => b.close);
    const ema50 = this.calculateEMA(h1Closes, 50);
    const ema200 = this.calculateEMA(h1Closes, 200);

    let trendState: 'STRONG_BULLISH' | 'BULLISH' | 'STRONG_BEARISH' | 'BEARISH' | 'NEUTRAL_CONSOLIDATING' = 'NEUTRAL_CONSOLIDATING';
    let trendSummary = 'Neutral Consolidation (price between EMAs)';

    if (ema50 !== null && ema200 !== null) {
      if (currentPrice > ema50 && ema50 > ema200) {
        trendState = 'STRONG_BULLISH';
        trendSummary = 'Strong Bullish (Price > EMA50 > EMA200)';
      } else if (currentPrice > ema50 && currentPrice > ema200) {
        trendState = 'BULLISH';
        trendSummary = 'Bullish (Price above key moving averages)';
      } else if (currentPrice < ema50 && ema50 < ema200) {
        trendState = 'STRONG_BEARISH';
        trendSummary = 'Strong Bearish (Price < EMA50 < EMA200)';
      } else if (currentPrice < ema50 && currentPrice < ema200) {
        trendState = 'BEARISH';
        trendSummary = 'Bearish (Price below key moving averages)';
      }
    }

    const priceVsEma50Percent = ema50 ? Number((((currentPrice - ema50) / ema50) * 100).toFixed(2)) : null;
    const priceVsEma200Percent = ema200 ? Number((((currentPrice - ema200) / ema200) * 100).toFixed(2)) : null;

    return {
      symbol,
      isMarketOpen,
      marketStatusText: isMarketOpen ? 'MARKET OPEN (LIVE)' : 'MARKET CLOSED (WEEKEND)',
      utcTime: now.toISOString(),
      activeSessions,
      isSessionOverlap,
      sessions,
      daily: {
        currentPrice,
        open: latestDaily.open,
        high: latestDaily.high,
        low: latestDaily.low,
        change,
        changePercent,
        changePips
      },
      atr: {
        atr14,
        atr14Pips,
        todayRange,
        todayRangePips,
        rangeRatioPercent
      },
      trend: {
        state: trendState,
        summary: trendSummary,
        ema50: ema50 ? Number(ema50.toFixed(spec.digits)) : null,
        ema200: ema200 ? Number(ema200.toFixed(spec.digits)) : null,
        priceVsEma50Percent,
        priceVsEma200Percent
      }
    };
  }

  /**
   * Computes Institutional Price Levels per symbol:
   * - Previous Day, Week, Month H/L/C
   * - Today O/H/L
   * - Classic Pivots (P, R1-3, S1-3)
   * - Swing Highs / Lows (S/R)
   */
  public static async getPriceLevels(symbolRaw: string): Promise<PriceLevelsResult> {
    const symbol = this.cleanSymbol(symbolRaw);
    const spec = getInstrumentSpec(symbol);

    // Fetch D1, W1, MN bars
    const [dailyBars, weeklyBars, monthlyBars] = await Promise.all([
      this.fetchYahooFinanceCandles(symbol, 'D1', 15),
      this.fetchYahooFinanceCandles(symbol, 'W1', 10),
      this.fetchYahooFinanceCandles(symbol, 'MN', 6)
    ]);

    const latestDaily = dailyBars[dailyBars.length - 1] || { open: 1.085, high: 1.088, low: 1.082, close: 1.085 };
    const prevDaily = dailyBars.length >= 2 ? dailyBars[dailyBars.length - 2] : null;
    const prevWeekly = weeklyBars.length >= 2 ? weeklyBars[weeklyBars.length - 2] : null;
    const prevMonthly = monthlyBars.length >= 2 ? monthlyBars[monthlyBars.length - 2] : null;

    const currentPrice = latestDaily.close;

    // Classic Pivots from Previous Day
    let classicPivots: any = null;
    let previousDay: any = null;

    if (prevDaily) {
      const pivots = this.calculateClassicPivots(prevDaily.high, prevDaily.low, prevDaily.close);
      classicPivots = {
        P: Number(pivots.P.toFixed(spec.digits)),
        R1: Number(pivots.R1.toFixed(spec.digits)),
        R2: Number(pivots.R2.toFixed(spec.digits)),
        R3: Number(pivots.R3.toFixed(spec.digits)),
        S1: Number(pivots.S1.toFixed(spec.digits)),
        S2: Number(pivots.S2.toFixed(spec.digits)),
        S3: Number(pivots.S3.toFixed(spec.digits))
      };

      previousDay = {
        high: Number(prevDaily.high.toFixed(spec.digits)),
        low: Number(prevDaily.low.toFixed(spec.digits)),
        close: Number(prevDaily.close.toFixed(spec.digits)),
        rangePips: spec.pipSize > 0 ? Number(((prevDaily.high - prevDaily.low) / spec.pipSize).toFixed(1)) : 0
      };
    }

    const previousWeek = prevWeekly
      ? {
          high: Number(prevWeekly.high.toFixed(spec.digits)),
          low: Number(prevWeekly.low.toFixed(spec.digits)),
          close: Number(prevWeekly.close.toFixed(spec.digits))
        }
      : null;

    const previousMonth = prevMonthly
      ? {
          high: Number(prevMonthly.high.toFixed(spec.digits)),
          low: Number(prevMonthly.low.toFixed(spec.digits)),
          close: Number(prevMonthly.close.toFixed(spec.digits))
        }
      : null;

    // Swing levels
    const swingLevels = this.findSwingLevels(dailyBars, spec.digits, 2);

    return {
      symbol,
      currentPrice,
      today: {
        open: Number(latestDaily.open.toFixed(spec.digits)),
        high: Number(latestDaily.high.toFixed(spec.digits)),
        low: Number(latestDaily.low.toFixed(spec.digits))
      },
      previousDay,
      previousWeek,
      previousMonth,
      classicPivots,
      swingLevels
    };
  }

  /**
   * Registers a client for Server-Sent Events (SSE) streaming for a symbol.
   */
  public static addSseClient(symbolRaw: string, res: Response): void {
    const symbol = this.cleanSymbol(symbolRaw);
    let clients = this.sseClients.get(symbol);
    if (!clients) {
      clients = new Set<Response>();
      this.sseClients.set(symbol, clients);
    }
    clients.add(res);

    // Initial quote event immediately
    this.getLiveQuote(symbol).then(q => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'quote', data: q })}\n\n`);
      } catch {
        // Closed
      }
    }).catch(() => {});

    // Start background ticker if not running
    this.ensureTickerRunning();
  }

  /**
   * Removes an SSE client.
   */
  public static removeSseClient(symbolRaw: string, res: Response): void {
    const symbol = this.cleanSymbol(symbolRaw);
    const clients = this.sseClients.get(symbol);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.sseClients.delete(symbol);
      }
    }
  }

  /**
   * Ensures the background quote broadcast loop is running when clients are connected.
   */
  private static ensureTickerRunning(): void {
    if (this.tickerInterval) return;

    this.tickerInterval = setInterval(async () => {
      if (this.sseClients.size === 0) {
        if (this.tickerInterval) {
          clearInterval(this.tickerInterval);
          this.tickerInterval = null;
        }
        return;
      }

      for (const [symbol, clients] of this.sseClients.entries()) {
        if (clients.size === 0) continue;
        try {
          const quote = await this.getLiveQuote(symbol);
          const payload = `data: ${JSON.stringify({ type: 'tick', data: quote })}\n\n`;
          for (const res of clients) {
            try {
              res.write(payload);
            } catch {
              clients.delete(res);
            }
          }
        } catch {
          // Ignore broadcast failures
        }
      }
    }, 2000); // 2-second tick broadcast
  }
}
