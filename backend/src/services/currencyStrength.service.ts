/**
 * Module F — Currency Strength & Pair Ranking Model
 * Evaluates relative strength across the 8 Major Currencies (USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD):
 *  - Time-aligned log/percentage returns across available pairs in the lookback window
 *  - Combines technical momentum with macroeconomic fundamental score
 *  - Flags conflicts between short-term technical flow and macro policy stance
 *  - Generates a ranked Pair Watchlist (Strongest vs Weakest) and pairwise Pearson correlation matrix
 */

import {
  SupportedTimeframe,
  OHLCVCandle,
  CurrencyStrengthItem,
  PairRankingWatchlistItem,
  CurrencyStrengthModelResult
} from '../models/intelligence.types';
import { MarketDataService, getInstrumentSpec } from './marketData.service';
import { FundamentalAnalysisService } from './fundamentalAnalysis.service';

export const G8_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'] as const;

export const BASKET_FOREX_PAIRS = [
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
  'GBPAUD'
];

export class CurrencyStrengthService {
  /**
   * Computes Pearson correlation coefficient between two return series.
   */
  public static computePearsonCorrelation(seriesA: number[], seriesB: number[]): number {
    const len = Math.min(seriesA.length, seriesB.length);
    if (len < 3) return 0;

    const a = seriesA.slice(-len);
    const b = seriesB.slice(-len);

    const meanA = a.reduce((sum, v) => sum + v, 0) / len;
    const meanB = b.reduce((sum, v) => sum + v, 0) / len;

    let num = 0;
    let denA = 0;
    let denB = 0;

    for (let i = 0; i < len; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }

    const denom = Math.sqrt(denA * denB);
    if (denom === 0) return 0;
    return Number(Math.max(-1, Math.min(1, num / denom)).toFixed(2));
  }

  /**
   * Maps window label ('SESSION', '24H', '7D', '30D') to recommended timeframe and lookback bars.
   */
  public static resolveWindowConfig(windowLabel: string = '24H'): {
    windowLabel: string;
    timeframe: SupportedTimeframe;
    barsLookback: number;
  } {
    const normalized = windowLabel.toUpperCase();
    switch (normalized) {
      case 'SESSION':
        return { windowLabel: 'SESSION (8H)', timeframe: 'M15', barsLookback: 32 };
      case '7D':
        return { windowLabel: '7D', timeframe: 'H4', barsLookback: 42 };
      case '30D':
        return { windowLabel: '30D', timeframe: 'D1', barsLookback: 30 };
      case '24H':
      default:
        return { windowLabel: '24H', timeframe: 'H1', barsLookback: 24 };
    }
  }

  /**
   * Computes the full G8 Currency Strength & Pair Ranking Model.
   * Accepts optional pre-loaded candle map (useful for deterministic unit tests and backtests).
   */
  public static async evaluateCurrencyStrength(
    windowLabel: string = '24H',
    preloadedCandlesBySymbol?: Record<string, OHLCVCandle[]>
  ): Promise<CurrencyStrengthModelResult> {
    const { windowLabel: resolvedLabel, timeframe, barsLookback } =
      this.resolveWindowConfig(windowLabel);

    const macroProfiles = await FundamentalAnalysisService.getAllCurrencyMacroProfiles();
    const macroMap = new Map<string, number>();
    for (const p of macroProfiles) {
      macroMap.set(p.currency, p.fundamentalScore);
    }

    const pairReturnsMap = new Map<string, number>();
    const pairBarReturnSeries = new Map<string, number[]>();

    for (const pair of BASKET_FOREX_PAIRS) {
      let candles: OHLCVCandle[] = [];
      if (preloadedCandlesBySymbol && preloadedCandlesBySymbol[pair]) {
        candles = preloadedCandlesBySymbol[pair];
      } else {
        const res = await MarketDataService.getCandles({
          symbol: pair,
          timeframe,
          limit: barsLookback + 5,
          allowExternalFetch: false
        });
        candles = res.candles;
      }

      if (candles.length >= 2) {
        const slice = candles.slice(-Math.min(candles.length, barsLookback));
        const firstOpen = slice[0].open;
        const lastClose = slice[slice.length - 1].close;
        if (firstOpen > 0) {
          const pctChange = ((lastClose - firstOpen) / firstOpen) * 100;
          pairReturnsMap.set(pair, Number(pctChange.toFixed(4)));
        }

        const barReturns: number[] = [];
        for (let i = 1; i < slice.length; i++) {
          if (slice[i - 1].close > 0) {
            barReturns.push(((slice[i].close - slice[i - 1].close) / slice[i - 1].close) * 100);
          }
        }
        if (barReturns.length >= 3) {
          pairBarReturnSeries.set(pair, barReturns);
        }
      }
    }

    // Aggregate currency returns across all pairs where the currency is Base (+return) or Quote (-return)
    const rankings: CurrencyStrengthItem[] = [];

    for (const currency of G8_CURRENCIES) {
      const contributingPairs: CurrencyStrengthItem['contributingPairs'] = [];

      for (const [symbol, retPct] of pairReturnsMap.entries()) {
        const spec = getInstrumentSpec(symbol);
        if (spec.baseCurrency === currency) {
          contributingPairs.push({ symbol, returnPct: retPct, role: 'BASE' });
        } else if (spec.quoteCurrency === currency) {
          contributingPairs.push({
            symbol,
            returnPct: Number((-retPct).toFixed(4)),
            role: 'QUOTE'
          });
        }
      }

      const fundamentalScore = macroMap.get(currency) ?? 0;
      let technicalReturnPct: number | null = null;
      let momentumScore: number | null = null;
      let compositeStrengthScore = fundamentalScore;

      if (contributingPairs.length > 0) {
        const avgRet =
          contributingPairs.reduce((sum, p) => sum + p.returnPct, 0) /
          contributingPairs.length;
        technicalReturnPct = Number(avgRet.toFixed(3));
        // Normalize typical FX basket return (-1.5% to +1.5%) into a -100 to +100 momentum score
        momentumScore = Math.max(-100, Math.min(100, Math.round(avgRet * 65)));
        compositeStrengthScore = Math.round(momentumScore * 0.65 + fundamentalScore * 0.35);
      }

      let alignmentStatus: CurrencyStrengthItem['alignmentStatus'] = 'NEUTRAL';
      if (momentumScore !== null) {
        if (momentumScore >= 15 && fundamentalScore >= 10) {
          alignmentStatus = 'ALIGNED_BULLISH';
        } else if (momentumScore <= -15 && fundamentalScore <= -10) {
          alignmentStatus = 'ALIGNED_BEARISH';
        } else if (
          (momentumScore >= 20 && fundamentalScore <= -15) ||
          (momentumScore <= -20 && fundamentalScore >= 15)
        ) {
          alignmentStatus = 'CONFLICTING_TECH_VS_MACRO';
        }
      }

      rankings.push({
        currency,
        rank: 0,
        compositeStrengthScore,
        technicalReturnPct,
        momentumScore,
        fundamentalScore,
        alignmentStatus,
        pairsAnalyzedCount: contributingPairs.length,
        contributingPairs
      });
    }

    // Sort strongest to weakest and assign rank 1..8
    rankings.sort((a, b) => b.compositeStrengthScore - a.compositeStrengthScore);
    rankings.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const scoreLookup = new Map<string, CurrencyStrengthItem>();
    for (const r of rankings) {
      scoreLookup.set(r.currency, r);
    }

    // Build Pair Ranking Watchlist
    const topRankedPairs: PairRankingWatchlistItem[] = BASKET_FOREX_PAIRS.map((symbol) => {
      const spec = getInstrumentSpec(symbol);
      const baseItem = scoreLookup.get(spec.baseCurrency)!;
      const quoteItem = scoreLookup.get(spec.quoteCurrency)!;

      const strengthSpread = baseItem.compositeStrengthScore - quoteItem.compositeStrengthScore;
      let directionBias: PairRankingWatchlistItem['directionBias'] = 'NEUTRAL';
      if (strengthSpread >= 20) directionBias = 'BULLISH';
      else if (strengthSpread <= -20) directionBias = 'BEARISH';

      const techSpread =
        (baseItem.momentumScore ?? 0) - (quoteItem.momentumScore ?? 0);
      const macroSpread = baseItem.fundamentalScore - quoteItem.fundamentalScore;

      const technicalTrendAligned =
        (directionBias === 'BULLISH' && techSpread >= 0) ||
        (directionBias === 'BEARISH' && techSpread <= 0);
      const macroAligned =
        (directionBias === 'BULLISH' && macroSpread > 0) ||
        (directionBias === 'BEARISH' && macroSpread < 0);

      let conflictingSignalWarning: string | null = null;
      if (techSpread * macroSpread < -300) {
        conflictingSignalWarning = `Technical momentum (${
          techSpread > 0 ? 'Bullish' : 'Bearish'
        }) diverges from Macroeconomic differential (${
          macroSpread > 0 ? 'Bullish' : 'Bearish'
        }).`;
      }

      const correlationGroup = spec.symbol.includes('USD')
        ? 'USD_BLOC'
        : spec.symbol.includes('JPY')
        ? 'JPY_CARRY_BLOC'
        : 'EUROPEAN_COMMODITY_CROSS';

      return {
        symbol,
        baseCurrency: spec.baseCurrency,
        quoteCurrency: spec.quoteCurrency,
        strengthSpread,
        directionBias,
        technicalTrendAligned,
        macroAligned,
        conflictingSignalWarning,
        correlationGroup
      };
    }).sort((a, b) => Math.abs(b.strengthSpread) - Math.abs(a.strengthSpread));

    // Build Correlation Matrix across pairs with return series (or structural currency-sharing correlation if price series absent)
    const correlationMatrix: Record<string, Record<string, number>> = {};
    const matrixPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'EURJPY', 'GBPJPY'];

    for (const pA of matrixPairs) {
      correlationMatrix[pA] = {};
      const specA = getInstrumentSpec(pA);
      const seriesA = pairBarReturnSeries.get(pA);

      for (const pB of matrixPairs) {
        if (pA === pB) {
          correlationMatrix[pA][pB] = 1.0;
          continue;
        }
        const seriesB = pairBarReturnSeries.get(pB);
        if (seriesA && seriesB && seriesA.length >= 4 && seriesB.length >= 4) {
          correlationMatrix[pA][pB] = this.computePearsonCorrelation(seriesA, seriesB);
        } else {
          // Structural currency-exposure baseline correlation when historical candle series is not yet populated
          const specB = getInstrumentSpec(pB);
          let structuralCorr = 0;
          if (specA.baseCurrency === specB.baseCurrency || specA.quoteCurrency === specB.quoteCurrency) {
            structuralCorr = 0.72;
          } else if (specA.baseCurrency === specB.quoteCurrency || specA.quoteCurrency === specB.baseCurrency) {
            structuralCorr = -0.72;
          }
          correlationMatrix[pA][pB] = structuralCorr;
        }
      }
    }

    const anyPriceData = pairReturnsMap.size > 0;

    return {
      windowLabel: resolvedLabel,
      timeframeUsed: timeframe,
      barsLookback,
      rankings,
      strongestCurrency: rankings.length > 0 ? rankings[0].currency : null,
      weakestCurrency: rankings.length > 0 ? rankings[rankings.length - 1].currency : null,
      topRankedPairs,
      correlationMatrix,
      methodologyExplanation: anyPriceData
        ? `Composite score combines time-aligned ${resolvedLabel} (${timeframe}, ${barsLookback} bars) basket percentage returns (65% weight) across ${pairReturnsMap.size} active FX pairs with G8 Macroeconomic Fundamental Scores (35% weight).`
        : `No OHLCV price bars cached for ${timeframe} window yet; rankings currently reflect pure G8 Macroeconomic Fundamental Scores (policy rates, inflation, GDP, PMI, 10Y yields) until price bars are ingested.`,
      provenance: {
        category: 'DETERMINISTIC_METRIC',
        sourceProvider: anyPriceData ? 'MULTI_PAIR_OHLCV_AND_MACRO_BASKET' : 'MACRO_BASELINE_ONLY',
        retrievedAt: new Date().toISOString(),
        timezone: 'UTC',
        freshnessStatus: anyPriceData ? 'FRESH' : 'CACHED',
        ruleVersion: 'CS-MODEL-v1.0.0'
      }
    };
  }
}
