/**
 * Alpha Coach — Professional Forex Intelligence Platform API Routes
 * Mounted at `/api/v1/intelligence` and `/v1/intelligence`
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  SupportedTimeframe,
  BacktestStrategyId
} from '../models/intelligence.types';
import {
  MarketDataService,
  INSTRUMENT_SPECIFICATIONS,
  getInstrumentSpec
} from '../services/marketData.service';
import { TechnicalAnalysisService } from '../services/technicalAnalysis.service';
import { CRTAnalysisService } from '../services/crtAnalysis.service';
import { SMCEngineService } from '../services/smcEngine.service';
import { FundamentalAnalysisService } from '../services/fundamentalAnalysis.service';
import { CurrencyStrengthService } from '../services/currencyStrength.service';
import { ConfluenceScoringService } from '../services/confluenceScoring.service';
import { AIAnalystService } from '../services/aiAnalyst.service';
import { RiskGuardianService } from '../services/risk.service';
import { BacktestingService } from '../services/backtesting.service';
import { JournalEnrichmentService } from '../services/journalEnrichment.service';
import { MarketScannerService } from '../services/marketScanner.service';
import { MonteCarloService } from '../services/monteCarlo.service';
import { BrokerExecutionService } from '../services/brokerExecution.service';
import { SECDisclosuresService } from '../services/secDisclosures.service';
import { ForexNewsCalendarService } from '../services/providers/forexNewsCalendar.service';

const router = Router();

const VALID_TIMEFRAMES: SupportedTimeframe[] = [
  'M1',
  'M5',
  'M15',
  'H1',
  'H4',
  'D1',
  'W1',
  'MN1'
];

function parseTimeframe(raw: unknown, fallback: SupportedTimeframe): SupportedTimeframe {
  const str = String(raw || fallback).toUpperCase() as SupportedTimeframe;
  return VALID_TIMEFRAMES.includes(str) ? str : fallback;
}

// 1. Instrument Specifications & Watchlist Metadata
router.get('/instruments', requireUserAuth, async (_req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    instruments: Object.values(INSTRUMENT_SPECIFICATIONS)
  });
});

// 2. Market Data Candles Retrieval & Ingestion
router.get('/candles', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const timeframe = parseTimeframe(req.query.timeframe, 'H1');
    const limit = Math.min(1000, Math.max(5, Number(req.query.limit) || 200));
    const asOfTimestamp = req.query.asOfTimestamp ? String(req.query.asOfTimestamp) : undefined;
    const allowExternalFetch = req.query.allowExternalFetch !== 'false';

    const result = await MarketDataService.getCandles({
      symbol,
      timeframe,
      limit,
      asOfTimestamp,
      allowExternalFetch
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const IngestCandlesSchema = z.object({
  symbol: z.string().min(3).max(16),
  timeframe: z.enum(['M1', 'M5', 'M15', 'H1', 'H4', 'D1', 'W1', 'MN1']),
  sourceProvider: z.string().optional(),
  candles: z
    .array(
      z.object({
        timestamp: z.string(),
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number().optional(),
        spread: z.number().optional(),
        isClosed: z.boolean().optional()
      })
    )
    .min(1)
    .max(5000)
});

router.post('/candles/ingest', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = IngestCandlesSchema.parse(req.body);
    const result = await MarketDataService.ingestCandles(
      parsed.symbol,
      parsed.timeframe,
      parsed.candles,
      (parsed.sourceProvider as any) || 'USER_CSV'
    );
    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.errors ? JSON.stringify(err.errors) : err.message
    });
  }
});

// 3. Module A/B/C/D/E/G/H — Unified Multi-Timeframe Analysis Workspace Endpoint
router.get('/workspace', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const htfTimeframe = parseTimeframe(req.query.htfTimeframe, 'H4');
    const ltfTimeframe = parseTimeframe(req.query.ltfTimeframe, 'M15');
    const persistReport = req.query.persistReport === 'true';
    const allowExternalFetch = req.query.allowExternalFetch !== 'false';

    const spec = getInstrumentSpec(symbol);

    const [htfSeries, ltfSeries] = await Promise.all([
      MarketDataService.getCandles({
        symbol: spec.symbol,
        timeframe: htfTimeframe,
        limit: 220,
        allowExternalFetch
      }),
      MarketDataService.getCandles({
        symbol: spec.symbol,
        timeframe: ltfTimeframe,
        limit: 220,
        allowExternalFetch
      })
    ]);

    const htfTechnical = TechnicalAnalysisService.analyzeSeries(
      spec.symbol,
      htfTimeframe,
      htfSeries.candles
    );
    const ltfTechnical = TechnicalAnalysisService.analyzeSeries(
      spec.symbol,
      ltfTimeframe,
      ltfSeries.candles
    );

    const htfSmc = SMCEngineService.analyzeSMC(
      spec.symbol,
      htfTimeframe,
      htfSeries.candles
    );
    const ltfSmc = SMCEngineService.analyzeSMC(
      spec.symbol,
      ltfTimeframe,
      ltfSeries.candles
    );

    const crt = CRTAnalysisService.analyzeCRT(
      spec.symbol,
      htfSeries.candles,
      ltfSeries.candles,
      {
        referenceTimeframe: htfTimeframe,
        confirmationTimeframe: ltfTimeframe
      },
      req.query.referenceCandleTimestamp ? String(req.query.referenceCandleTimestamp) : undefined
    );

    const fundamentals = await FundamentalAnalysisService.evaluatePairFundamentals(spec.symbol);

    const bullishConfluence = ConfluenceScoringService.evaluateConfluence({
      symbol: spec.symbol,
      evaluatedDirection: 'BULLISH',
      htfTechnical,
      htfSmc,
      ltfSmc,
      crtResult: crt,
      fundamentals
    });

    const bearishConfluence = ConfluenceScoringService.evaluateConfluence({
      symbol: spec.symbol,
      evaluatedDirection: 'BEARISH',
      htfTechnical,
      htfSmc,
      ltfSmc,
      crtResult: crt,
      fundamentals
    });

    const currentPrice = ltfSeries.currentPrice ?? htfSeries.currentPrice;
    const lastUpdateTimestamp =
      ltfSeries.lastUpdateTimestamp ?? htfSeries.lastUpdateTimestamp;

    const aiReport = await AIAnalystService.generateAnalystReport({
      userId: req.user!.userId,
      symbol: spec.symbol,
      htfTimeframe,
      ltfTimeframe,
      currentPrice,
      htfTechnical,
      ltfTechnical,
      htfSmc,
      ltfSmc,
      crt,
      fundamentals,
      bullishConfluence,
      bearishConfluence,
      persistReport
    });

    // Also evaluate any active trade plan alerts if currentPrice is available
    let triggeredAlerts: any[] = [];
    if (currentPrice !== null && currentPrice > 0) {
      triggeredAlerts = await JournalEnrichmentService.evaluateTradePlanAlertsForPrice(
        req.user!.userId,
        spec.symbol,
        currentPrice
      );
    }

    res.json({
      success: true,
      workspace: {
        instrument: spec,
        currentPrice,
        lastUpdateTimestamp,
        dataStatus:
          ltfSeries.status === 'AVAILABLE' || htfSeries.status === 'AVAILABLE'
            ? 'AVAILABLE'
            : ltfSeries.status,
        htfSeries,
        ltfSeries,
        htfTechnical,
        ltfTechnical,
        htfSmc,
        ltfSmc,
        crt,
        fundamentals,
        confluence: {
          bullish: bullishConfluence,
          bearish: bearishConfluence
        },
        aiReport,
        triggeredAlerts
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Module B — Custom CRT Evaluation Endpoint
router.post('/crt/analyze', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.body.symbol || 'EURUSD').toUpperCase();
    const htfTimeframe = parseTimeframe(req.body.referenceTimeframe, 'H4');
    const ltfTimeframe = parseTimeframe(req.body.confirmationTimeframe, 'M15');

    const htfCandles = Array.isArray(req.body.htfCandles)
      ? req.body.htfCandles
      : (
          await MarketDataService.getCandles({
            symbol,
            timeframe: htfTimeframe,
            limit: 100
          })
        ).candles;

    const ltfCandles = Array.isArray(req.body.ltfCandles)
      ? req.body.ltfCandles
      : (
          await MarketDataService.getCandles({
            symbol,
            timeframe: ltfTimeframe,
            limit: 150
          })
        ).candles;

    const crt = CRTAnalysisService.analyzeCRT(
      symbol,
      htfCandles,
      ltfCandles,
      {
        ...req.body.ruleConfig,
        referenceTimeframe: htfTimeframe,
        confirmationTimeframe: ltfTimeframe
      },
      req.body.referenceCandleTimestamp
    );

    res.json({ success: true, crt });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Module C — Custom SMC/ICT Evaluation Endpoint
router.post('/smc/analyze', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.body.symbol || 'EURUSD').toUpperCase();
    const timeframe = parseTimeframe(req.body.timeframe, 'M15');
    const candles = Array.isArray(req.body.candles)
      ? req.body.candles
      : (await MarketDataService.getCandles({ symbol, timeframe, limit: 200 })).candles;

    const smc = SMCEngineService.analyzeSMC(symbol, timeframe, candles, req.body.ruleConfig);
    res.json({ success: true, smc });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Module E — Economic Calendar, Forex News & Macroeconomic Intelligence Endpoints
router.get('/fundamentals/calendar', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const calendarData = await ForexNewsCalendarService.getLiveEconomicCalendar({
      currency: req.query.currency ? String(req.query.currency) : undefined,
      impact: req.query.impact as any,
      timeframe: req.query.timeframe as any,
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      category: req.query.category as any,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    res.json({
      success: true,
      events: calendarData.events,
      total: calendarData.total,
      nextHighImpactEvent: calendarData.nextHighImpactEvent,
      lastUpdated: calendarData.lastUpdated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/fundamentals/news', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newsData = await ForexNewsCalendarService.getLiveForexNews({
      currency: req.query.currency ? String(req.query.currency) : undefined,
      impact: req.query.impact as any,
      category: req.query.category ? String(req.query.category) : undefined,
      query: req.query.q ? String(req.query.q) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 30
    });
    res.json({
      success: true,
      ...newsData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/fundamentals/macro-summary', requireUserAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const summary = await ForexNewsCalendarService.getMacroSummary();
    res.json({
      success: true,
      summary
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/fundamentals/calendar', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, currency, eventTime } = req.body;
    if (!title || !currency || !eventTime) {
      res.status(400).json({
        success: false,
        error: 'title, currency, and eventTime are required.'
      });
      return;
    }
    const event = await FundamentalAnalysisService.upsertCalendarEvent(req.body);
    res.json({ success: true, event });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/fundamentals/macro', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.query.currency) {
      const profile = await FundamentalAnalysisService.getCurrencyMacroProfile(
        String(req.query.currency)
      );
      res.json({ success: true, profile });
      return;
    }
    const profiles = await FundamentalAnalysisService.getAllCurrencyMacroProfiles();
    res.json({ success: true, profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get(
  '/fundamentals/pair/:symbol',
  requireUserAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const assessment = await FundamentalAnalysisService.evaluatePairFundamentals(
        req.params.symbol
      );
      res.json({ success: true, assessment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// 7. Module F — Currency Strength & Pair Ranking Watchlist
router.get('/currency-strength', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const windowLabel = String(req.query.window || '24H');
    const model = await CurrencyStrengthService.evaluateCurrencyStrength(windowLabel);
    res.json({ success: true, model });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Module I — Position Sizing, Pip Value & Currency Exposure Calculator
const PositionSizeSchema = z.object({
  accountBalance: z.number().positive(),
  accountEquity: z.number().positive().optional(),
  accountCurrency: z.string().min(3).max(6).default('USD'),
  riskPercentage: z.number().positive().max(100),
  symbol: z.string().min(3).max(16),
  direction: z.enum(['BUY', 'SELL']).optional(),
  entryPrice: z.number().positive(),
  stopLossPrice: z.number().positive(),
  takeProfitPrices: z.array(z.number().positive()).optional(),
  commissionPerLotRoundTurn: z.number().min(0).optional(),
  spreadPipsOverride: z.number().min(0).optional(),
  conversionRatesToAccountCurrency: z.record(z.string(), z.number().positive()).optional()
});

router.post('/risk/position-size', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = PositionSizeSchema.parse(req.body);
    const calculation = RiskGuardianService.calculatePositionSize(parsed);
    const exposure = await RiskGuardianService.evaluateOpenCurrencyExposure(
      req.body.accountId,
      parsed.symbol,
      calculation.direction
    );

    res.json({
      success: true,
      calculation,
      exposure
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.errors ? JSON.stringify(err.errors) : err.message
    });
  }
});

router.get('/risk/exposure', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId ? String(req.query.accountId) : undefined;
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const direction = String(req.query.direction || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';

    const exposure = await RiskGuardianService.evaluateOpenCurrencyExposure(
      accountId,
      symbol,
      direction
    );
    res.json({ success: true, exposure });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. Module J — Strategy Backtesting & Research
router.post('/backtest/run', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.body.symbol || 'EURUSD').toUpperCase();
    const timeframe = parseTimeframe(req.body.timeframe, 'H1');
    const strategyId = (req.body.strategyId || 'CRT_SWEEP_REENTRY') as BacktestStrategyId;

    const candles = Array.isArray(req.body.candles)
      ? req.body.candles
      : (
          await MarketDataService.getCandles({
            symbol,
            timeframe,
            limit: 500,
            allowExternalFetch: true
          })
        ).candles;

    const result = await BacktestingService.runBacktest(
      candles,
      {
        strategyId,
        symbol,
        timeframe,
        initialCapital: Number(req.body.initialCapital) || 10000,
        riskPerTradePct: Number(req.body.riskPerTradePct) || 1.0,
        rewardToRiskTarget: Number(req.body.rewardToRiskTarget) || 2.0,
        spreadPips: req.body.spreadPips !== undefined ? Number(req.body.spreadPips) : 1.0,
        commissionPerLot:
          req.body.commissionPerLot !== undefined ? Number(req.body.commissionPerLot) : 7.0,
        slippagePips: req.body.slippagePips !== undefined ? Number(req.body.slippagePips) : 0.3,
        maxBarsHold: Number(req.body.maxBarsHold) || 24,
        sessionFilter: req.body.sessionFilter
      },
      req.user!.userId,
      req.body.persistRun !== false
    );

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/backtest/runs', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const runs = await BacktestingService.getSavedBacktestRuns(req.user!.userId);
    res.json({ success: true, runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Saved AI/Workspace Reports
router.get('/reports', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = req.query.symbol ? String(req.query.symbol) : undefined;
    const reports = await AIAnalystService.getSavedReports(req.user!.userId, symbol);
    res.json({ success: true, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Module K — MT5 Trading Journal Enrichment & Insights
router.get(
  '/journal/enrichment/:positionId',
  requireUserAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const enrichment = await JournalEnrichmentService.getOrCreateEnrichment(
        req.user!.userId,
        req.params.positionId
      );
      res.json({ success: true, enrichment });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  }
);

router.post(
  '/journal/enrichment/:positionId',
  requireUserAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const enrichment = await JournalEnrichmentService.enrichTradePosition(
        req.user!.userId,
        req.params.positionId
      );
      res.json({ success: true, enrichment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

router.get('/journal/insights', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId ? String(req.query.accountId) : undefined;
    const insights = await JournalEnrichmentService.getJournalIntelligenceInsights(
      req.user!.userId,
      accountId
    );
    res.json({ success: true, insights });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Module 14 — Trade Plans & Configurable Alerts
router.get('/trade-plans', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const plans = await JournalEnrichmentService.getTradePlans(
      req.user!.userId,
      req.query.symbol ? String(req.query.symbol) : undefined,
      req.query.status ? String(req.query.status) : undefined
    );
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/trade-plans', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const plan = await JournalEnrichmentService.createTradePlan(req.user!.userId, req.body);
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch(
  '/trade-plans/:id/status',
  requireUserAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await JournalEnrichmentService.updateTradePlanStatus(
        req.user!.userId,
        req.params.id,
        req.body.status,
        req.body.linkedPositionId
      );
      res.json({ success: true, plan: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

router.post(
  '/trade-plans/evaluate-alerts',
  requireUserAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const symbol = String(req.body.symbol || 'EURUSD').toUpperCase();
      const currentPrice = Number(req.body.currentPrice);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        res.status(400).json({ success: false, error: 'Valid currentPrice is required.' });
        return;
      }
      const alerts = await JournalEnrichmentService.evaluateTradePlanAlertsForPrice(
        req.user!.userId,
        symbol,
        currentPrice
      );
      res.json({ success: true, alerts });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// 13. Market Scanner (Adapted from trader-scanner)
router.post('/scanner/scan', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await MarketScannerService.scan(req.body, req.user!.userId);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/scanner/history', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const history = await MarketScannerService.getScanHistory(req.user!.userId);
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Monte Carlo Simulation Engine (Adapted from trader-timemachine)
router.post('/monte-carlo/simulate', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const symbol = String(req.body.symbol || 'EURUSD').toUpperCase();
    const candles = Array.isArray(req.body.candles)
      ? req.body.candles
      : (await MarketDataService.getCandles({ symbol, timeframe: 'H1', limit: 120 })).candles;

    const result = MonteCarloService.runSimulation(
      symbol,
      {
        direction: req.body.direction || 'BUY',
        entryPrice: Number(req.body.entryPrice),
        stopLossPrice: Number(req.body.stopLossPrice),
        takeProfitPrice: Number(req.body.takeProfitPrice),
        maxBarsHold: req.body.maxBarsHold ? Number(req.body.maxBarsHold) : undefined
      },
      candles,
      {
        replays: req.body.replays ? Number(req.body.replays) : 10000,
        seed: req.body.seed !== undefined ? Number(req.body.seed) : 19
      },
      req.body.planId
    );

    if (req.body.save !== false) {
      await MonteCarloService.saveSimulationRun(req.user!.userId, result);
    }

    res.json({ success: true, simulation: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/monte-carlo/runs', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const runs = await MonteCarloService.getSavedSimulationRuns(req.user!.userId);
    res.json({ success: true, runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Broker Order Preparation & Explicit Approval Protocol (Adapted from trader-broker & trader-risk)
router.post('/broker/prepare-order', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticket, riskCheck } = await BrokerExecutionService.prepareOrderTicket({
      userId: req.user!.userId,
      accountId: req.body.accountId,
      symbol: req.body.symbol,
      direction: req.body.direction,
      orderType: req.body.orderType,
      requestedPrice: Number(req.body.requestedPrice),
      stopLossPrice: Number(req.body.stopLossPrice),
      takeProfitPrice: req.body.takeProfitPrice ? Number(req.body.takeProfitPrice) : undefined,
      lotSize: req.body.lotSize ? Number(req.body.lotSize) : undefined,
      accountBalance: req.body.accountBalance ? Number(req.body.accountBalance) : undefined,
      accountEquity: req.body.accountEquity ? Number(req.body.accountEquity) : undefined,
      accountCurrency: req.body.accountCurrency,
      executionMode: req.body.executionMode || 'PAPER',
      idempotencyKey: req.body.idempotencyKey
    });

    res.json({ success: true, ticket, riskCheck });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/broker/approve-order', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticketId, userApprovalReply, expectedFingerprint } = req.body;
    if (!ticketId || !userApprovalReply) {
      res.status(400).json({
        success: false,
        error: 'ticketId and userApprovalReply ("yes" | "CONFIRM") are required.'
      });
      return;
    }

    const result = await BrokerExecutionService.approveAndExecuteTicket(
      ticketId,
      req.user!.userId,
      userApprovalReply,
      expectedFingerprint
    );

    res.json({ ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/broker/tickets', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tickets = await BrokerExecutionService.getOrderTickets(req.user!.userId);
    res.json({ success: true, tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. SEC Company Fundamentals & Congressional Disclosures (Adapted from trader-analyst & trader-pelosi)
router.get('/disclosures/company/:ticker', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await SECDisclosuresService.getCompanyFundamentals(req.params.ticker);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/disclosures/congress', requireUserAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const data = await SECDisclosuresService.getCongressionalTradeDisclosures();
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
