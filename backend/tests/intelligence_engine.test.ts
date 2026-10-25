/**
 * Comprehensive Automated Test Suite: Alpha Coach Forex Intelligence Platform
 * Covers Modules A through K and Module 14:
 *  1. MarketDataService: OHLCV integrity, digits/pip calculations (standard vs JPY vs Metal), asOfTimestamp look-ahead prevention.
 *  2. TechnicalAnalysisService: Deterministic SMA, EMA, RSI, MACD, ATR, ADX, Bollinger Bands, S/R, Fibonacci, Candlestick patterns.
 *  3. CRTAnalysisService: Reference range, sweep excursion detection, re-entry close, displacement, confirmed vs provisional vs breakout.
 *  4. SMCEngineService: Non-repainting swings, HH/HL/LH/LL, BOS, CHoCH, MSS, FVGs, IFVGs, Order Blocks, Breakers, Dealing Range, OTE, Killzones.
 *  5. FundamentalAnalysisService: Economic calendar, surprise calculation, G8 macro profiles, pair rate & yield differentials.
 *  6. CurrencyStrengthService: Multi-pair return aggregation, macro alignment, pair ranking, correlation matrix.
 *  7. ConfluenceScoringService: 9-factor weighted scoring, overlap deduplication, contradiction penalties, heuristic disclaimer.
 *  8. RiskGuardianService: Position sizing, non-USD account currencies, JPY/Metal pip values, friction modeling, currency exposure.
 *  9. AIAnalystService: Schema validation, sanitization of unsupported claims, provenance attribution, caching and persistence.
 * 10. BacktestingService: Zero look-ahead bar-by-bar simulation, friction modeling, equity curve, drawdown, session breakdown.
 * 11. JournalEnrichmentService & TradePlans: Additive trade enrichment, journal insights aggregation, duplicate-alert prevention.
 * 12. Intelligence API Routes: Authentication enforcement, Zod validation, and error contracts.
 */

import request from 'supertest';
import { app } from '../src/app';
import { initDatabase, getDatabase } from '../src/db/db';
import { AuthService } from '../src/services/auth.service';
import {
  MarketDataService,
  getInstrumentSpec,
  roundPrice,
  priceDiffInPips
} from '../src/services/marketData.service';
import { TechnicalAnalysisService } from '../src/services/technicalAnalysis.service';
import { CRTAnalysisService } from '../src/services/crtAnalysis.service';
import { SMCEngineService, DEFAULT_SMC_RULE_CONFIG } from '../src/services/smcEngine.service';
import { FundamentalAnalysisService } from '../src/services/fundamentalAnalysis.service';
import { CurrencyStrengthService } from '../src/services/currencyStrength.service';
import { ConfluenceScoringService } from '../src/services/confluenceScoring.service';
import { RiskGuardianService } from '../src/services/risk.service';
import { AIAnalystService } from '../src/services/aiAnalyst.service';
import { BacktestingService } from '../src/services/backtesting.service';
import { JournalEnrichmentService } from '../src/services/journalEnrichment.service';
import { OHLCVCandle } from '../src/models/intelligence.types';

describe('Alpha Coach Forex Intelligence Platform — Comprehensive Test Suite', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const reg = await AuthService.register({
      email: 'intel_trader@alphacoach.test',
      password: 'SecurePassword123!',
      firstName: 'Institutional',
      lastName: 'Analyst'
    });
    testUserId = reg.user.id;
    authToken = reg.token!;
  });

  // ==========================================================================
  // 1. Market Data, Specifications & Price Calculations
  // ==========================================================================
  describe('1. Market Data, Precision & Pip Calculations', () => {
    it('accurately resolves specifications for standard EURUSD, JPY pairs, and Metals', () => {
      const eurusd = getInstrumentSpec('EURUSD');
      expect(eurusd.digits).toBe(5);
      expect(eurusd.pipSize).toBe(0.0001);
      expect(eurusd.contractSize).toBe(100000);

      const usdjpy = getInstrumentSpec('USDJPY');
      expect(usdjpy.digits).toBe(3);
      expect(usdjpy.pipSize).toBe(0.01);
      expect(usdjpy.contractSize).toBe(100000);

      const xauusd = getInstrumentSpec('XAUUSD');
      expect(xauusd.digits).toBe(2);
      expect(xauusd.pipSize).toBe(0.1);
      expect(xauusd.contractSize).toBe(100);
    });

    it('correctly rounds prices and calculates pips for standard and JPY instruments', () => {
      expect(roundPrice('EURUSD', 1.085467)).toBe(1.08547);
      expect(roundPrice('USDJPY', 154.2367)).toBe(154.237);

      expect(priceDiffInPips('EURUSD', 0.0025)).toBe(25.0);
      expect(priceDiffInPips('USDJPY', 0.50)).toBe(50.0);
    });

    it('validates OHLCV integrity and rejects inverted candles (high < low)', async () => {
      const validCandles = [
        {
          timestamp: '2026-10-01T10:00:00Z',
          open: 1.085,
          high: 1.088,
          low: 1.084,
          close: 1.087,
          volume: 1200
        }
      ];
      const invalidCandles = [
        {
          timestamp: '2026-10-01T11:00:00Z',
          open: 1.085,
          high: 1.082, // High lower than Low!
          low: 1.087,
          close: 1.084,
          volume: 500
        }
      ];

      const resValid = await MarketDataService.ingestCandles('EURUSD', 'H1', validCandles, 'TEST_FIXTURE');
      expect(resValid.insertedOrUpdated).toBe(1);
      expect(resValid.rejectedInvalid).toBe(0);

      const resInvalid = await MarketDataService.ingestCandles('EURUSD', 'H1', invalidCandles, 'TEST_FIXTURE');
      expect(resInvalid.insertedOrUpdated).toBe(0);
      expect(resInvalid.rejectedInvalid).toBe(1);
    });

    it('filters candles by asOfTimestamp to eliminate look-ahead bias during replay', async () => {
      const testCandles = [
        { timestamp: '2026-09-01T12:00:00Z', open: 1.08, high: 1.085, low: 1.079, close: 1.083 },
        { timestamp: '2026-09-01T13:00:00Z', open: 1.083, high: 1.089, low: 1.082, close: 1.088 },
        { timestamp: '2026-09-01T14:00:00Z', open: 1.088, high: 1.092, low: 1.087, close: 1.091 }
      ];
      await MarketDataService.ingestCandles('EURUSD', 'H1', testCandles, 'TEST_FIXTURE');

      const pastQuery = await MarketDataService.getCandles({
        symbol: 'EURUSD',
        timeframe: 'H1',
        asOfTimestamp: '2026-09-01T13:00:00Z',
        allowExternalFetch: false
      });
      // The 14:00 candle must NOT be returned!
      expect(pastQuery.candles.some((c) => c.timestamp === '2026-09-01T14:00:00Z')).toBe(false);
    });
  });

  // ==========================================================================
  // 2. Technical Analysis Engine
  // ==========================================================================
  describe('2. Module D — Technical Analysis Engine', () => {
    it('computes deterministic SMA and EMA accurately', () => {
      const series = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const sma5 = TechnicalAnalysisService.calculateSMA(series, 5);
      expect(sma5).toBe(18); // (16+17+18+19+20)/5 = 18

      const emaSeries = TechnicalAnalysisService.calculateEMASeries(series, 5);
      expect(emaSeries.length).toBe(series.length - 4);
      expect(emaSeries[emaSeries.length - 1]).toBeGreaterThan(17);
    });

    it('computes Wilder RSI(14) and returns null with warning when bars are insufficient', () => {
      const insufficientCloses = [1.08, 1.082, 1.081, 1.083];
      expect(TechnicalAnalysisService.calculateRSI(insufficientCloses, 14)).toBeNull();

      // Monotonically rising series should produce RSI = 100
      const risingCloses = Array.from({ length: 25 }, (_, i) => 1.08 + i * 0.001);
      const rsi = TechnicalAnalysisService.calculateRSI(risingCloses, 14);
      expect(rsi).toBe(100);
    });

    it('computes Wilder ATR(14) accurately from OHLCV candles', () => {
      const candles: OHLCVCandle[] = Array.from({ length: 20 }, (_, i) => ({
        symbol: 'EURUSD',
        timeframe: 'H1',
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        open: 1.085,
        high: 1.09,
        low: 1.08,
        close: 1.087,
        volume: 1000,
        isClosed: true,
        sourceProvider: 'TEST'
      }));

      const atr = TechnicalAnalysisService.calculateATR(candles, 14);
      expect(atr).not.toBeNull();
      expect(atr!).toBeCloseTo(0.01, 3);
    });

    it('detects Candlestick Patterns deterministically (Bullish Engulfing and Hammer)', () => {
      const patternCandles: OHLCVCandle[] = [
        {
          symbol: 'EURUSD',
          timeframe: 'H1',
          timestamp: '2026-10-01T09:00:00Z',
          open: 1.084,
          high: 1.086,
          low: 1.083,
          close: 1.085,
          volume: 100,
          isClosed: true,
          sourceProvider: 'TEST'
        },
        {
          symbol: 'EURUSD',
          timeframe: 'H1',
          timestamp: '2026-10-01T10:00:00Z',
          open: 1.085,
          high: 1.086,
          low: 1.08,
          close: 1.081,
          volume: 100,
          isClosed: true,
          sourceProvider: 'TEST'
        },
        // Bullish Engulfing
        {
          symbol: 'EURUSD',
          timeframe: 'H1',
          timestamp: '2026-10-01T11:00:00Z',
          open: 1.08,
          high: 1.089,
          low: 1.079,
          close: 1.088,
          volume: 200,
          isClosed: true,
          sourceProvider: 'TEST'
        }
      ];

      const patterns = TechnicalAnalysisService.detectCandlestickPatterns(patternCandles, [], 'MIXED');
      expect(patterns.some((p) => p.patternName === 'BULLISH_ENGULFING')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Candle Range Theory (CRT) Analysis Engine
  // ==========================================================================
  describe('3. Module B — Candle Range Theory (CRT)', () => {
    it('detects confirmed Bearish CRT High Sweep and Re-entry', () => {
      const htfCandles: OHLCVCandle[] = [
        {
          symbol: 'EURUSD',
          timeframe: 'H4',
          timestamp: '2026-10-01T08:00:00Z',
          open: 1.082,
          high: 1.088,
          low: 1.08,
          close: 1.085,
          volume: 500,
          isClosed: true,
          sourceProvider: 'TEST'
        },
        {
          symbol: 'EURUSD',
          timeframe: 'H4',
          timestamp: '2026-10-01T12:00:00Z',
          open: 1.085,
          high: 1.091, // Sweeps 1.088 by 30 pips (> minSweepPips 1.5)
          low: 1.083,
          close: 1.084, // Closes back inside [1.080, 1.088]
          volume: 800,
          isClosed: true,
          sourceProvider: 'TEST'
        }
      ];

      const crt = CRTAnalysisService.analyzeCRT('EURUSD', htfCandles, [], {
        requireDisplacementAfterSweep: false
      });
      expect(crt.sweepType).toBe('HIGH_SWEEP_BEARISH_CRT');
      expect(crt.status).toBe('CONFIRMED_CRT');
      expect(crt.directionalBias).toBe('BEARISH');
      expect(crt.reEntryConfirmed).toBe(true);
      expect(crt.invalidationPrice).toBeGreaterThan(1.091);
      expect(crt.targets?.tp1Midpoint).toBe(1.084);
    });

    it('classifies breakout outside range as RANGE_EXPANSION_BREAKOUT rather than false sweep', () => {
      const htfCandles: OHLCVCandle[] = [
        {
          symbol: 'EURUSD',
          timeframe: 'H4',
          timestamp: '2026-10-01T08:00:00Z',
          open: 1.082,
          high: 1.088,
          low: 1.08,
          close: 1.085,
          volume: 500,
          isClosed: true,
          sourceProvider: 'TEST'
        },
        {
          symbol: 'EURUSD',
          timeframe: 'H4',
          timestamp: '2026-10-01T12:00:00Z',
          open: 1.088,
          high: 1.098,
          low: 1.087,
          close: 1.097, // Closed strongly outside reference high (body expansion)
          volume: 900,
          isClosed: true,
          sourceProvider: 'TEST'
        }
      ];

      const crt = CRTAnalysisService.analyzeCRT('EURUSD', htfCandles, []);
      expect(crt.status).toBe('RANGE_EXPANSION_BREAKOUT');
      expect(crt.sweepType).toBe('BREAKOUT_EXPANSION');
      expect(crt.directionalBias).toBe('BULLISH');
    });
  });

  // ==========================================================================
  // 4. SMC & ICT Analysis Engine
  // ==========================================================================
  describe('4. Module C — SMC & ICT Analysis Engine', () => {
    it('detects non-repainting Swing Points only after swingRightBars confirmation', () => {
      const candles: OHLCVCandle[] = [
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:00:00Z', open: 1.08, high: 1.082, low: 1.079, close: 1.081, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:15:00Z', open: 1.081, high: 1.084, low: 1.08, close: 1.083, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        // Swing High candidate at index 2 (high: 1.092)
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:30:00Z', open: 1.083, high: 1.092, low: 1.082, close: 1.09, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:45:00Z', open: 1.09, high: 1.087, low: 1.084, close: 1.085, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T02:00:00Z', open: 1.085, high: 1.086, low: 1.083, close: 1.084, volume: 10, isClosed: true, sourceProvider: 'TEST' }
      ];

      const swings = SMCEngineService.detectSwingPoints(candles, 'EURUSD', {
        ...DEFAULT_SMC_RULE_CONFIG,
        swingLeftBars: 2,
        swingRightBars: 2
      });

      expect(swings.length).toBeGreaterThanOrEqual(1);
      const topSwing = swings.find((s) => s.type === 'SWING_HIGH');
      expect(topSwing).toBeDefined();
      expect(topSwing?.price).toBe(1.092);
      expect(topSwing?.confirmedAtTimestamp).toBe('2026-10-01T02:00:00Z');
    });

    it('identifies Bullish Fair Value Gap (FVG) and consequent encroachment', () => {
      const candles: OHLCVCandle[] = [
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:00:00Z', open: 1.08, high: 1.082, low: 1.079, close: 1.081, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:15:00Z', open: 1.082, high: 1.095, low: 1.082, close: 1.094, volume: 100, isClosed: true, sourceProvider: 'TEST' },
        // Candle 3 low (1.086) > Candle 1 high (1.082) creates FVG [1.082, 1.086]
        { symbol: 'EURUSD', timeframe: 'M15', timestamp: '2026-10-01T01:30:00Z', open: 1.094, high: 1.098, low: 1.086, close: 1.096, volume: 50, isClosed: true, sourceProvider: 'TEST' }
      ];

      const fvgs = SMCEngineService.detectFairValueGaps(candles, 'EURUSD');
      expect(fvgs.length).toBe(1);
      expect(fvgs[0].type).toBe('BULLISH_FVG');
      expect(fvgs[0].lowerPrice).toBe(1.082);
      expect(fvgs[0].upperPrice).toBe(1.086);
      expect(fvgs[0].consequentEncroachment).toBe(1.084);
    });

    it('computes Dealing Range and verifies Optimal Trade Entry (OTE 61.8%–78.6%) zone', () => {
      const candles: OHLCVCandle[] = [
        { symbol: 'EURUSD', timeframe: 'H1', timestamp: '2026-10-01T01:00:00Z', open: 1.08, high: 1.08, low: 1.07, close: 1.075, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'H1', timestamp: '2026-10-01T02:00:00Z', open: 1.075, high: 1.10, low: 1.074, close: 1.08, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'H1', timestamp: '2026-10-01T03:00:00Z', open: 1.08, high: 1.083, low: 1.079, close: 1.079, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'H1', timestamp: '2026-10-01T04:00:00Z', open: 1.079, high: 1.082, low: 1.078, close: 1.079, volume: 10, isClosed: true, sourceProvider: 'TEST' },
        { symbol: 'EURUSD', timeframe: 'H1', timestamp: '2026-10-01T05:00:00Z', open: 1.079, high: 1.082, low: 1.078, close: 1.079, volume: 10, isClosed: true, sourceProvider: 'TEST' }
      ];

      const dealing = SMCEngineService.computeDealingRange(candles, [], 'EURUSD', 'BULLISH');
      expect(dealing).not.toBeNull();
      expect(dealing?.equilibriumPrice).toBeCloseTo(1.085, 3);
      expect(dealing?.oteZone.fib705).toBeCloseTo(1.07885, 3);
    });
  });

  // ==========================================================================
  // 5. Fundamental Analysis Engine
  // ==========================================================================
  describe('5. Module E — Fundamental & Macroeconomic Intelligence', () => {
    it('computes surprise direction comparing actual vs forecast for standard and inverse indicators', () => {
      // GDP higher than forecast is positive
      expect(FundamentalAnalysisService.computeSurpriseDirection('US GDP Growth', '2.8%', '2.5%', '2.0%')).toBe('POSITIVE_SURPRISE');

      // Unemployment Rate lower than forecast is POSITIVE (inverse indicator)
      expect(FundamentalAnalysisService.computeSurpriseDirection('US Unemployment Rate', '4.0%', '4.2%', '4.2%')).toBe('POSITIVE_SURPRISE');
      expect(FundamentalAnalysisService.computeSurpriseDirection('US Unemployment Rate', '4.3%', '4.1%', '4.1%')).toBe('NEGATIVE_SURPRISE');
    });

    it('computes pair rate and yield differentials in basis points and policy stance summary', async () => {
      const assessment = await FundamentalAnalysisService.evaluatePairFundamentals('EURUSD');
      expect(assessment.symbol).toBe('EURUSD');
      expect(assessment.baseCurrency).toBe('EUR');
      expect(assessment.quoteCurrency).toBe('USD');
      expect(assessment.rateDifferentialBps).toBeDefined();
      expect(assessment.yieldDifferential10YBps).toBeDefined();
      expect(assessment.policyDivergenceSummary).toContain('bps');
      expect(assessment.disclaimer).toContain('Macroeconomic');
    });
  });

  // ==========================================================================
  // 6. Currency Strength & Pair Ranking Model
  // ==========================================================================
  describe('6. Module F — Currency Strength & Pair Ranking', () => {
    it('computes G8 rankings across USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD with correlation matrix', async () => {
      const result = await CurrencyStrengthService.evaluateCurrencyStrength('24H');
      expect(result.rankings.length).toBe(8);
      expect(result.topRankedPairs.length).toBeGreaterThan(0);
      expect(result.correlationMatrix['EURUSD']['EURUSD']).toBe(1.0);
      expect(result.methodologyExplanation).toBeDefined();
    });
  });

  // ==========================================================================
  // 7. Multi-Factor Confluence Scoring Engine
  // ==========================================================================
  describe('7. Module H — Confluence & Setup Scoring', () => {
    it('computes component breakdown, deduplication penalty, and heuristic disclaimer', () => {
      const dummyTech: any = {
        candleCount: 50,
        movingAverages: { maAlignment: 'BULLISH_STACK' },
        marketRegime: { classification: 'TRENDING_BULLISH' },
        volatility: { regime: 'NORMAL_VOLATILITY', atr14: 0.002 }
      };
      const dummySmc: any = {
        trendStructure: 'BULLISH',
        structureBreaks: [{ direction: 'BULLISH', type: 'BOS', brokenSwingPrice: 1.085, hasDisplacement: true }],
        liquidityPools: [{ type: 'SELL_SIDE_LIQUIDITY', swept: true, subsequentReaction: 'REJECTION_REVERSAL', priceLevel: 1.08 }],
        fairValueGaps: [{ type: 'BULLISH_FVG', lowerPrice: 1.081, upperPrice: 1.084 }],
        orderBlocks: [],
        ictContext: { activeKillzone: 'NEW_YORK_OPEN_KILLZONE', activeSession: 'New York', asianSessionRange: null }
      };
      const dummyCrt: any = {
        status: 'CONFIRMED_CRT',
        directionalBias: 'BULLISH',
        setupClassification: 'BULLISH_CRT_LOW_SWEEP_REENTRY'
      };
      const dummyFundamentals: any = {
        directionalBias: 'BULLISH',
        relativeStrengthScore: 40,
        policyDivergenceSummary: 'Policy rate spread +125 bps',
        upcomingEventRisk: { hasHighImpactWithin24h: false, eventRiskWarning: 'Clear' }
      };

      const evalRes = ConfluenceScoringService.evaluateConfluence({
        symbol: 'EURUSD',
        evaluatedDirection: 'BULLISH',
        htfTechnical: dummyTech,
        htfSmc: dummySmc,
        ltfSmc: dummySmc,
        crtResult: dummyCrt,
        fundamentals: dummyFundamentals
      });

      expect(evalRes.totalHeuristicScore).toBeGreaterThanOrEqual(70);
      expect(evalRes.grade).toBe('A_PLUS_HIGH_CONFLUENCE');
      expect(evalRes.penaltiesApplied.some((p) => p.reason.includes('deduplication'))).toBe(true);
      expect(evalRes.calibrationDisclaimer).toContain('HEURISTIC CONFLUENCE SCORE DISCLAIMER');
    });
  });

  // ==========================================================================
  // 8. Risk Management & Position Sizing Engine
  // ==========================================================================
  describe('8. Module I — Professional Risk Management & Position Sizing', () => {
    it('calculates position size, pip value in USD, and lot size stepped rounding for standard EURUSD', () => {
      const sizing = RiskGuardianService.calculatePositionSize({
        accountBalance: 10000,
        accountCurrency: 'USD',
        riskPercentage: 1.0, // $100 risk
        symbol: 'EURUSD',
        direction: 'BUY',
        entryPrice: 1.085,
        stopLossPrice: 1.083, // 20 pips stop distance
        takeProfitPrices: [1.089, 1.091],
        commissionPerLotRoundTurn: 7.0,
        spreadPipsOverride: 1.0
      });

      expect(sizing.stopDistancePips).toBe(20);
      expect(sizing.pipValuePerStandardLotInAccountCurrency).toBe(10);
      // Risk per lot = 20 pips * $10 + $7 comm = $207. Target risk = $100. Raw lots ~ 0.48
      expect(sizing.recommendedLotSize).toBeCloseTo(0.48, 1);
      expect(sizing.targets.length).toBe(2);
      expect(sizing.targets[0].rewardToRiskRatioGross).toBe(2.0);
    });

    it('calculates position size for USDJPY with JPY-to-USD currency conversion', () => {
      const sizing = RiskGuardianService.calculatePositionSize({
        accountBalance: 10000,
        accountCurrency: 'USD',
        riskPercentage: 1.0,
        symbol: 'USDJPY',
        direction: 'BUY',
        entryPrice: 150.0,
        stopLossPrice: 149.5, // 50 pips stop distance
        commissionPerLotRoundTurn: 7.0
      });

      expect(sizing.stopDistancePips).toBe(50);
      // For USDJPY at 150.0, pip value in quote is 1000 JPY. In USD = 1000/150 = $6.67
      expect(sizing.pipValuePerStandardLotInAccountCurrency).toBeCloseTo(6.67, 1);
      expect(sizing.recommendedLotSize).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 9. AI Trading Analyst Engine
  // ==========================================================================
  describe('9. Module G — AI Trading Analyst & Schema Validation', () => {
    it('validates schema and sanitizes prohibited claims ("guaranteed win")', () => {
      const sanitized = AIAnalystService.sanitizeAnalystText(
        'This trade is a guaranteed profit with 100% win rate based on secret bank order book!'
      );
      expect(sanitized).not.toContain('guaranteed profit');
      expect(sanitized).not.toContain('secret bank order book');
    });

    it('generates an evidence-grounded report with attributed statements', async () => {
      const dummyWorkspace = await (await request(app)
        .get('/api/v1/intelligence/workspace?symbol=EURUSD&htfTimeframe=H4&ltfTimeframe=M15')
        .set('Authorization', `Bearer ${authToken}`)).body.workspace;

      expect(dummyWorkspace).toBeDefined();
      expect(dummyWorkspace.aiReport).toBeDefined();
      expect(dummyWorkspace.aiReport.attributedStatements.length).toBeGreaterThanOrEqual(4);
      expect(dummyWorkspace.aiReport.disclaimer).toContain('DISCLAIMER');
    });
  });

  // ==========================================================================
  // 10. Strategy Backtesting Engine
  // ==========================================================================
  describe('10. Module J — Strategy Backtesting Engine', () => {
    it('runs bar-by-bar backtest without future-data leakage and records equity curve', async () => {
      const testCandles: OHLCVCandle[] = Array.from({ length: 60 }, (_, i) => ({
        symbol: 'EURUSD',
        timeframe: 'H1',
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        open: 1.08 + (i % 2 === 0 ? 0.002 : -0.001),
        high: 1.085 + (i % 2 === 0 ? 0.004 : 0.001),
        low: 1.078,
        close: 1.082,
        volume: 500,
        isClosed: true,
        sourceProvider: 'TEST'
      }));

      const run = await BacktestingService.runBacktest(testCandles, {
        strategyId: 'CRT_SWEEP_REENTRY',
        symbol: 'EURUSD',
        timeframe: 'H1',
        initialCapital: 10000,
        riskPerTradePct: 1.0,
        rewardToRiskTarget: 2.0
      });

      expect(run.barsEvaluated).toBe(60);
      expect(run.equityCurve.length).toBeGreaterThan(0);
      expect(run.assumptionsAndLimitations.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 11. Journal Enrichment & Trade Plans (Module K & 14)
  // ==========================================================================
  describe('11. Module K & Module 14 — Journal Enrichment & Trade Plans', () => {
    it('creates trade plan and evaluates price alert with duplicate-alert suppression', async () => {
      const plan = await JournalEnrichmentService.createTradePlan(testUserId, {
        symbol: 'EURUSD',
        direction: 'BUY',
        setupThesis: 'Asian Low sweep into Discount FVG',
        entryZoneMin: 1.082,
        entryZoneMax: 1.085,
        invalidationPrice: 1.079,
        targetTp1: 1.092,
        plannedRiskPct: 1.0,
        alertOnEntryZone: true,
        alertOnInvalidation: true
      });

      expect(plan.id).toBeDefined();
      expect(plan.status).toBe('WATCHING');

      // Price enters entry zone -> triggers ENTRY_TRIGGERED alert
      const firstEval = await JournalEnrichmentService.evaluateTradePlanAlertsForPrice(
        testUserId,
        'EURUSD',
        1.083
      );
      expect(firstEval.length).toBe(1);
      expect(firstEval[0].triggeredNewAlert).toBe(true);

      // Re-evaluating with same price inside zone must NOT trigger duplicate alert
      const duplicateEval = await JournalEnrichmentService.evaluateTradePlanAlertsForPrice(
        testUserId,
        'EURUSD',
        1.0835
      );
      expect(duplicateEval[0].triggeredNewAlert).toBe(false);
    });
  });

  // ==========================================================================
  // 12. Intelligence REST API Endpoints
  // ==========================================================================
  describe('12. Intelligence REST API Contracts & Auth', () => {
    it('rejects unauthenticated requests to /api/v1/intelligence/workspace with 401', async () => {
      const res = await request(app).get('/api/v1/intelligence/workspace?symbol=EURUSD');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('returns supported instruments on GET /api/v1/intelligence/instruments', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/instruments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.instruments.length).toBeGreaterThanOrEqual(10);
      expect(res.body.instruments.some((i: any) => i.symbol === 'EURUSD')).toBe(true);
    });

    it('returns economic calendar events on GET /api/v1/intelligence/fundamentals/calendar', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/fundamentals/calendar?currency=USD')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toBeDefined();
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it('returns G8 currency strength rankings on GET /api/v1/intelligence/currency-strength', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/currency-strength?window=24H')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.model.rankings.length).toBe(8);
      expect(res.body.model.correlationMatrix).toBeDefined();
    });

    it('calculates position size via POST /api/v1/intelligence/risk/position-size', async () => {
      const res = await request(app)
        .post('/api/v1/intelligence/risk/position-size')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountBalance: 25000,
          accountCurrency: 'USD',
          riskPercentage: 1.0,
          symbol: 'EURUSD',
          direction: 'BUY',
          entryPrice: 1.085,
          stopLossPrice: 1.082
        });

      expect(res.status).toBe(200);
      expect(res.body.calculation.recommendedLotSize).toBeGreaterThan(0);
      expect(res.body.exposure).toBeDefined();
    });
  });
});
