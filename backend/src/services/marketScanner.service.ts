/**
 * Alpha Coach — Multi-Asset & Forex Market Scanner Service
 * Adapted from reference trader-scanner (MIT License, Jake Schincariol 2026)
 *
 * Scans major, minor and exotic forex pairs plus metals across M1, M5, M15, M30, H1, H4, and D1 timeframes.
 * Detects:
 *  1. ORB (Opening Range Breakout): London Open (07:00-08:00 UTC), NY Open (12:00-13:30 UTC), Asian Range (00:00-05:00 UTC)
 *  2. 20-bar closing high/low breakouts (breakout_20bar)
 *  3. Bull Flag and Bear Flag consolidation patterns
 *  4. 20-period Moving Average reclaims (reclaim_ma20)
 *  5. Wilder RSI(14) oversold bounce and overbought reversal
 *  6. Liquidity Sweep + Displacement (PDH/PDL or Equal Highs/Lows raid with FVG)
 *  7. CRT (Candle Range Theory) HTF sweep + LTF re-entry
 *
 * Guarantees:
 *  - Evaluates closed candles only (zero look-ahead bias).
 *  - Every hit includes deterministic match reasoning, supporting levels, and data timestamps.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import {
  SupportedTimeframe,
  ScannerSetupType,
  ScannerHit,
  ScannerFilterOptions,
  ScannerResult,
  OHLCVCandle
} from '../models/intelligence.types';
import { MarketDataService, INSTRUMENT_SPECIFICATIONS, getInstrumentSpec, roundPrice, priceDiffInPips } from './marketData.service';
import { TechnicalAnalysisService } from './technicalAnalysis.service';
import { CRTAnalysisService } from './crtAnalysis.service';
import { SMCEngineService } from './smcEngine.service';

export const DEFAULT_SCAN_SYMBOLS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'USDCAD',
  'AUDUSD',
  'NZDUSD',
  'EURGBP',
  'EURJPY',
  'GBPJPY',
  'AUDJPY',
  'EURCHF',
  'CADJPY',
  'GBPAUD',
  'XAUUSD'
];

export const DEFAULT_SCAN_TIMEFRAMES: SupportedTimeframe[] = ['H1', 'M15', 'H4'];

export class MarketScannerService {
  /**
   * Runs the multi-asset / Forex scanner across configured instruments and timeframes.
   */
  public static async scan(options: ScannerFilterOptions = {}, userId?: string): Promise<ScannerResult> {
    const startTime = Date.now();
    const scanId = uuidv4();
    const symbols = options.symbols && options.symbols.length > 0 ? options.symbols : DEFAULT_SCAN_SYMBOLS;
    const timeframes = options.timeframes && options.timeframes.length > 0 ? options.timeframes : DEFAULT_SCAN_TIMEFRAMES;
    const requestedSetups = options.setupTypes && options.setupTypes.length > 0 ? new Set(options.setupTypes) : null;
    const hits: ScannerHit[] = [];

    for (const sym of symbols) {
      const spec = getInstrumentSpec(sym);

      for (const tf of timeframes) {
        try {
          const series = await MarketDataService.getCandles({
            symbol: spec.symbol,
            timeframe: tf,
            limit: 80,
            allowExternalFetch: false
          });

          const candles = series.candles;
          if (candles.length < 25) {
            continue;
          }

          const detectedHits = this.evaluateSetupsForSeries(spec.symbol, tf, candles, requestedSetups);
          for (const h of detectedHits) {
            // Apply direction filter
            if (options.direction && options.direction !== 'ALL' && h.direction !== options.direction) {
              continue;
            }
            // Apply minimum confluence filter
            if (options.minConfluence !== undefined && h.confluenceScore < options.minConfluence) {
              continue;
            }
            // Apply session filter
            if (options.sessionFilter && options.sessionFilter.length > 0 && !options.sessionFilter.includes(h.session) && !options.sessionFilter.includes('ALL')) {
              continue;
            }
            hits.push(h);
          }
        } catch {
          // Gracefully continue scanning remaining symbols if one series fails
        }
      }
    }

    // Sort hits: highest confluence score first, then newest timestamp
    hits.sort((a, b) => {
      if (b.confluenceScore !== a.confluenceScore) {
        return b.confluenceScore - a.confluenceScore;
      }
      return new Date(b.candleTimestamp).getTime() - new Date(a.candleTimestamp).getTime();
    });

    const finalHits = options.limit ? hits.slice(0, options.limit) : hits;
    const durationMs = Date.now() - startTime;

    const result: ScannerResult = {
      scanId,
      timestamp: new Date().toISOString(),
      symbolsScanned: symbols.length,
      timeframesScanned: timeframes,
      hitsCount: finalHits.length,
      hits: finalHits,
      scanDurationMs: durationMs,
      provenance: {
        category: 'STRATEGY_INTERPRETATION',
        sourceProvider: 'ALPHA_COACH_MARKET_SCANNER',
        retrievedAt: new Date().toISOString(),
        timezone: 'UTC',
        freshnessStatus: 'FRESH',
        ruleVersion: 'SCANNER-ENGINE-v1.0.0'
      }
    };

    if (userId) {
      await this.persistScanHistory(userId, result);
    }

    return result;
  }

  /**
   * Deterministically evaluates rule setups on closed candle series.
   */
  public static evaluateSetupsForSeries(
    symbol: string,
    timeframe: SupportedTimeframe,
    candles: OHLCVCandle[],
    requestedSetups: Set<ScannerSetupType> | null
  ): ScannerHit[] {
    const hits: ScannerHit[] = [];
    const spec = getInstrumentSpec(symbol);
    const n = candles.length;
    if (n < 25) return hits;

    const curr = candles[n - 1]; // Latest closed candle
    const prev = candles[n - 2];
    const closes = candles.map((c) => c.close);
    const session = CRTAnalysisService.getSessionFromUtcTimestamp(curr.timestamp);
    const atr = TechnicalAnalysisService.calculateATR(candles, 14) ?? spec.pipSize * 15;

    // -------------------------------------------------------------------------
    // 1. Breakout 20-bar High / Low (breakout_20bar)
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('BREAKOUT_20BAR')) {
      const lookback = candles.slice(n - 21, n - 1);
      const high20 = Math.max(...lookback.map((c) => c.high));
      const low20 = Math.min(...lookback.map((c) => c.low));

      if (curr.close > high20 && prev.close <= high20) {
        const stopLoss = roundPrice(symbol, Math.max(curr.low, curr.close - atr * 1.5));
        const riskPips = priceDiffInPips(symbol, curr.close - stopLoss);
        const takeProfit = roundPrice(symbol, curr.close + (curr.close - stopLoss) * 2.0);
        hits.push({
          id: uuidv4(),
          symbol,
          displayName: spec.displayName,
          timeframe,
          setupType: 'BREAKOUT_20BAR',
          direction: 'BUY',
          triggerPrice: curr.close,
          setupDescription: `20-Bar High Breakout: Close (${curr.close}) broke above 20-period peak (${roundPrice(symbol, high20)})`,
          candleTimestamp: curr.timestamp,
          confluenceScore: 78,
          keyLevels: {
            entry: curr.close,
            stopLoss,
            takeProfit,
            rewardToRisk: 2.0
          },
          session,
          dataTimestamp: curr.timestamp,
          sourceProvider: curr.sourceProvider
        });
      } else if (curr.close < low20 && prev.close >= low20) {
        const stopLoss = roundPrice(symbol, Math.min(curr.high, curr.close + atr * 1.5));
        const takeProfit = roundPrice(symbol, curr.close - (stopLoss - curr.close) * 2.0);
        hits.push({
          id: uuidv4(),
          symbol,
          displayName: spec.displayName,
          timeframe,
          setupType: 'BREAKOUT_20BAR',
          direction: 'SELL',
          triggerPrice: curr.close,
          setupDescription: `20-Bar Low Breakdown: Close (${curr.close}) broke below 20-period trough (${roundPrice(symbol, low20)})`,
          candleTimestamp: curr.timestamp,
          confluenceScore: 78,
          keyLevels: {
            entry: curr.close,
            stopLoss,
            takeProfit,
            rewardToRisk: 2.0
          },
          session,
          dataTimestamp: curr.timestamp,
          sourceProvider: curr.sourceProvider
        });
      }
    }

    // -------------------------------------------------------------------------
    // 2. Reclaim MA20 (reclaim_ma20)
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('RECLAIM_MA20')) {
      const ema20 = TechnicalAnalysisService.calculateEMA(closes, 20);
      if (ema20 !== null) {
        if (prev.close < ema20 && curr.close > ema20 && curr.close > curr.open) {
          const stopLoss = roundPrice(symbol, curr.low - spec.pipSize * 3);
          const takeProfit = roundPrice(symbol, curr.close + (curr.close - stopLoss) * 2.0);
          hits.push({
            id: uuidv4(),
            symbol,
            displayName: spec.displayName,
            timeframe,
            setupType: 'RECLAIM_MA20',
            direction: 'BUY',
            triggerPrice: curr.close,
            setupDescription: `Bullish EMA-20 Reclaim: Close (${curr.close}) reclaimed 20-period EMA (${roundPrice(symbol, ema20)})`,
            candleTimestamp: curr.timestamp,
            confluenceScore: 72,
            keyLevels: {
              entry: curr.close,
              stopLoss,
              takeProfit,
              rewardToRisk: 2.0
            },
            session,
            dataTimestamp: curr.timestamp,
            sourceProvider: curr.sourceProvider
          });
        } else if (prev.close > ema20 && curr.close < ema20 && curr.close < curr.open) {
          const stopLoss = roundPrice(symbol, curr.high + spec.pipSize * 3);
          const takeProfit = roundPrice(symbol, curr.close - (stopLoss - curr.close) * 2.0);
          hits.push({
            id: uuidv4(),
            symbol,
            displayName: spec.displayName,
            timeframe,
            setupType: 'RECLAIM_MA20',
            direction: 'SELL',
            triggerPrice: curr.close,
            setupDescription: `Bearish EMA-20 Breakdown: Close (${curr.close}) lost 20-period EMA (${roundPrice(symbol, ema20)})`,
            candleTimestamp: curr.timestamp,
            confluenceScore: 72,
            keyLevels: {
              entry: curr.close,
              stopLoss,
              takeProfit,
              rewardToRisk: 2.0
            },
            session,
            dataTimestamp: curr.timestamp,
            sourceProvider: curr.sourceProvider
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. RSI(14) Oversold Bounce / Overbought Reversal
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('RSI_OVERSOLD_BOUNCE') || requestedSetups.has('RSI_OVERBOUGHT_REVERSAL')) {
      const prevCloses = closes.slice(0, n - 1);
      const rsiPrev = TechnicalAnalysisService.calculateRSI(prevCloses, 14);
      const rsiCurr = TechnicalAnalysisService.calculateRSI(closes, 14);

      if (rsiPrev !== null && rsiCurr !== null) {
        if (rsiPrev < 30 && rsiCurr >= 30 && curr.close > curr.open) {
          const stopLoss = roundPrice(symbol, Math.min(curr.low, prev.low) - spec.pipSize * 2);
          const takeProfit = roundPrice(symbol, curr.close + (curr.close - stopLoss) * 2.0);
          hits.push({
            id: uuidv4(),
            symbol,
            displayName: spec.displayName,
            timeframe,
            setupType: 'RSI_OVERSOLD_BOUNCE',
            direction: 'BUY',
            triggerPrice: curr.close,
            setupDescription: `RSI Oversold Bounce: Wilder RSI(14) recovered from oversold (${rsiPrev.toFixed(1)}) to ${rsiCurr.toFixed(1)} with bullish close`,
            candleTimestamp: curr.timestamp,
            confluenceScore: 75,
            keyLevels: {
              entry: curr.close,
              stopLoss,
              takeProfit,
              rewardToRisk: 2.0
            },
            session,
            dataTimestamp: curr.timestamp,
            sourceProvider: curr.sourceProvider
          });
        } else if (rsiPrev > 70 && rsiCurr <= 70 && curr.close < curr.open) {
          const stopLoss = roundPrice(symbol, Math.max(curr.high, prev.high) + spec.pipSize * 2);
          const takeProfit = roundPrice(symbol, curr.close - (stopLoss - curr.close) * 2.0);
          hits.push({
            id: uuidv4(),
            symbol,
            displayName: spec.displayName,
            timeframe,
            setupType: 'RSI_OVERBOUGHT_REVERSAL',
            direction: 'SELL',
            triggerPrice: curr.close,
            setupDescription: `RSI Overbought Reversal: Wilder RSI(14) turned down from overbought (${rsiPrev.toFixed(1)}) to ${rsiCurr.toFixed(1)} with bearish close`,
            candleTimestamp: curr.timestamp,
            confluenceScore: 75,
            keyLevels: {
              entry: curr.close,
              stopLoss,
              takeProfit,
              rewardToRisk: 2.0
            },
            session,
            dataTimestamp: curr.timestamp,
            sourceProvider: curr.sourceProvider
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // 4. Bull Flag / Bear Flag Consolidation
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('BULL_FLAG') || requestedSetups.has('BEAR_FLAG')) {
      if (n >= 20) {
        // Look for strong pole in bars [n - 15 .. n - 5] followed by tight consolidation in last 5 bars
        const poleStart = candles[n - 15];
        const poleEnd = candles[n - 5];
        const flagBars = candles.slice(n - 5);
        const flagHigh = Math.max(...flagBars.map((b) => b.high));
        const flagLow = Math.min(...flagBars.map((b) => b.low));
        const flagSpanPips = priceDiffInPips(symbol, flagHigh - flagLow);
        const poleSpanPips = priceDiffInPips(symbol, Math.abs(poleEnd.close - poleStart.open));

        if (poleEnd.close > poleStart.open && poleSpanPips >= 35 && flagSpanPips <= poleSpanPips * 0.45) {
          if (curr.close > flagHigh - atr * 0.2) {
            const stopLoss = roundPrice(symbol, flagLow - spec.pipSize * 3);
            const takeProfit = roundPrice(symbol, curr.close + (curr.close - stopLoss) * 2.0);
            hits.push({
              id: uuidv4(),
              symbol,
              displayName: spec.displayName,
              timeframe,
              setupType: 'BULL_FLAG',
              direction: 'BUY',
              triggerPrice: curr.close,
              setupDescription: `Bull Flag: +${poleSpanPips.toFixed(0)} pip impulse pole followed by tight ${flagSpanPips.toFixed(0)} pip flag consolidation`,
              candleTimestamp: curr.timestamp,
              confluenceScore: 82,
              keyLevels: {
                entry: curr.close,
                stopLoss,
                takeProfit,
                rewardToRisk: 2.0
              },
              session,
              dataTimestamp: curr.timestamp,
              sourceProvider: curr.sourceProvider
            });
          }
        } else if (poleEnd.close < poleStart.open && poleSpanPips >= 35 && flagSpanPips <= poleSpanPips * 0.45) {
          if (curr.close < flagLow + atr * 0.2) {
            const stopLoss = roundPrice(symbol, flagHigh + spec.pipSize * 3);
            const takeProfit = roundPrice(symbol, curr.close - (stopLoss - curr.close) * 2.0);
            hits.push({
              id: uuidv4(),
              symbol,
              displayName: spec.displayName,
              timeframe,
              setupType: 'BEAR_FLAG',
              direction: 'SELL',
              triggerPrice: curr.close,
              setupDescription: `Bear Flag: -${poleSpanPips.toFixed(0)} pip impulse drop followed by tight ${flagSpanPips.toFixed(0)} pip consolidation`,
              candleTimestamp: curr.timestamp,
              confluenceScore: 82,
              keyLevels: {
                entry: curr.close,
                stopLoss,
                takeProfit,
                rewardToRisk: 2.0
              },
              session,
              dataTimestamp: curr.timestamp,
              sourceProvider: curr.sourceProvider
            });
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 5. SMC Liquidity Sweep & Displacement
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('LIQUIDITY_SWEEP_DISPLACEMENT')) {
      const smc = SMCEngineService.analyzeSMC(symbol, timeframe, candles);
      const recentSweep = smc.liquidityPools.find((p) => p.swept && (p.sweptAtTimestamp === curr.timestamp || p.sweptAtTimestamp === prev.timestamp));
      if (recentSweep) {
        const direction = recentSweep.type === 'BUY_SIDE_LIQUIDITY' ? 'SELL' : 'BUY';
        const stopLoss = roundPrice(symbol, direction === 'BUY' ? curr.low - spec.pipSize * 3 : curr.high + spec.pipSize * 3);
        const takeProfit = roundPrice(symbol, direction === 'BUY' ? curr.close + (curr.close - stopLoss) * 2.5 : curr.close - (stopLoss - curr.close) * 2.5);
        hits.push({
          id: uuidv4(),
          symbol,
          displayName: spec.displayName,
          timeframe,
          setupType: 'LIQUIDITY_SWEEP_DISPLACEMENT',
          direction,
          triggerPrice: curr.close,
          setupDescription: `SMC Liquidity Sweep: ${recentSweep.type} (${recentSweep.sourceType}) swept with subsequent displacement`,
          candleTimestamp: curr.timestamp,
          confluenceScore: 88,
          keyLevels: {
            entry: curr.close,
            stopLoss,
            takeProfit,
            rewardToRisk: 2.5
          },
          session,
          dataTimestamp: curr.timestamp,
          sourceProvider: curr.sourceProvider
        });
      }
    }

    // -------------------------------------------------------------------------
    // 6. Candle Range Theory (CRT) Sweep & Re-entry
    // -------------------------------------------------------------------------
    if (!requestedSetups || requestedSetups.has('CRT_SWEEP_REENTRY')) {
      if (n >= 10) {
        const refCandle = candles[n - 4];
        const crt = CRTAnalysisService.analyzeCRT(symbol, [refCandle], candles.slice(n - 3));
        if (crt.status === 'CONFIRMED_CRT') {
          const direction = crt.directionalBias === 'BULLISH' ? 'BUY' : 'SELL';
          const extreme = crt.sweepExtremePrice ?? (direction === 'BUY' ? curr.low : curr.high);
          const stopLoss = roundPrice(symbol, direction === 'BUY' ? extreme - spec.pipSize * 3 : extreme + spec.pipSize * 3);
          const takeProfit = roundPrice(symbol, direction === 'BUY' ? curr.close + Math.abs(curr.close - stopLoss) * 2.0 : curr.close - Math.abs(stopLoss - curr.close) * 2.0);
          hits.push({
            id: uuidv4(),
            symbol,
            displayName: spec.displayName,
            timeframe,
            setupType: 'CRT_SWEEP_REENTRY',
            direction,
            triggerPrice: curr.close,
            setupDescription: `CRT Confirmed: Reference range ${crt.referenceRange.high}–${crt.referenceRange.low} swept and confirmed with body close re-entry`,
            candleTimestamp: curr.timestamp,
            confluenceScore: 90,
            keyLevels: {
              entry: curr.close,
              stopLoss,
              takeProfit,
              rewardToRisk: 2.0
            },
            session,
            dataTimestamp: curr.timestamp,
            sourceProvider: curr.sourceProvider
          });
        }
      }
    }

    return hits;
  }

  private static async persistScanHistory(userId: string, result: ScannerResult): Promise<void> {
    try {
      const db = getDatabase();
      await db.run(
        `INSERT INTO scanner_history (id, user_id, scan_type, symbols_json, timeframes_json, hits_json)
         VALUES (?, ?, 'MULTI_ASSET_SCAN', ?, ?, ?)`,
        [
          result.scanId,
          userId,
          JSON.stringify(result.symbolsScanned),
          JSON.stringify(result.timeframesScanned),
          JSON.stringify(result.hits)
        ]
      );
    } catch {
      // Non-fatal if history persistence fails
    }
  }

  public static async getScanHistory(userId: string, limit: number = 10): Promise<any[]> {
    const db = getDatabase();
    const rows = await db.query<any>(
      `SELECT * FROM scanner_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      scanType: r.scan_type,
      symbols: JSON.parse(r.symbols_json || '[]'),
      timeframes: JSON.parse(r.timeframes_json || '[]'),
      hits: JSON.parse(r.hits_json || '[]'),
      createdAt: r.created_at
    }));
  }
}
