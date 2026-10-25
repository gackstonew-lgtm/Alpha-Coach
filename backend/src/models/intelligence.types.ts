/**
 * Alpha Coach — Professional Forex Intelligence Platform Types & Data Contracts
 * Strictly separates:
 *  - OBSERVED_MARKET_DATA (Attributable OHLCV, published economic events, MT5 broker deals)
 *  - DETERMINISTIC_METRIC (Mathematically computed indicators, pips, ATR, RSI, currency strength)
 *  - STRATEGY_INTERPRETATION (Rules-based CRT, SMC, ICT structures with explicit rule Version & definitions)
 *  - AI_EXPLANATION (Structured LLM / Analytical synthesis grounded in verified inputs)
 *  - UNAVAILABLE_DATA (Explicitly missing or stale provider states — never fabricated)
 */

export type DataProvenanceCategory =
  | 'OBSERVED_MARKET_DATA'
  | 'DETERMINISTIC_METRIC'
  | 'STRATEGY_INTERPRETATION'
  | 'AI_EXPLANATION'
  | 'UNAVAILABLE_DATA';

export type SupportedTimeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN1';

export type MarketDataProviderId =
  | 'MT5_TERMINAL'
  | 'TWELVEDATA'
  | 'ALPHA_VANTAGE'
  | 'FRANKFURTER_ECB'
  | 'DATABASE_CACHE'
  | 'USER_CSV'
  | 'TEST_FIXTURE'
  | 'UNAVAILABLE';

export interface DataProvenanceMetadata {
  category: DataProvenanceCategory;
  sourceProvider: MarketDataProviderId | string;
  retrievedAt: string;
  eventTime?: string;
  timezone: string;
  freshnessStatus: 'FRESH' | 'CACHED' | 'STALE' | 'UNAVAILABLE';
  staleThresholdSeconds?: number;
  ageSeconds?: number;
  ruleVersion?: string;
  notes?: string;
}

export interface InstrumentSpecification {
  symbol: string;
  displayName: string;
  baseCurrency: string;
  quoteCurrency: string;
  category: 'FOREX_MAJOR' | 'FOREX_CROSS' | 'METAL' | 'INDEX' | 'CRYPTO';
  digits: number;
  pointSize: number;      // e.g. 0.00001 for 5-digit EURUSD, 0.001 for 3-digit USDJPY
  pipSize: number;        // e.g. 0.0001 for EURUSD, 0.01 for USDJPY
  contractSize: number;   // Standard lot units: 100,000 for FX, 100 for XAUUSD
  minLot: number;
  maxLot: number;
  lotStep: number;
  typicalSpreadPips: number;
}

export interface OHLCVCandle {
  symbol: string;
  timeframe: SupportedTimeframe;
  timestamp: string; // ISO-8601 UTC opening time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spread?: number;
  isClosed: boolean;
  sourceProvider: string;
}

export interface MarketCandleSeriesResult {
  symbol: string;
  timeframe: SupportedTimeframe;
  candles: OHLCVCandle[];
  currentPrice: number | null;
  lastUpdateTimestamp: string | null;
  provenance: DataProvenanceMetadata;
  status: 'AVAILABLE' | 'STALE' | 'EMPTY' | 'PROVIDER_ERROR';
  errorMessage?: string;
}

// ============================================================================
// MODULE B: CANDLE RANGE THEORY (CRT)
// ============================================================================

export interface CRTRuleConfiguration {
  ruleVersion: string;
  referenceTimeframe: SupportedTimeframe;
  confirmationTimeframe: SupportedTimeframe;
  requireSweepBeyondWick: boolean;
  minSweepPips: number;
  maxSweepBodyRatio: number; // Max body excursion outside range before considered a breakout instead of sweep
  requireCloseInsideRange: boolean;
  requireDisplacementAfterSweep: boolean;
  displacementMinAtrMultiplier: number;
  allowedSessions: string[]; // e.g., ['London', 'New York', 'London/NY Overlap', 'Asia']
}

export interface CRTReferenceRange {
  candleTimestamp: string;
  timeframe: SupportedTimeframe;
  high: number;
  low: number;
  open: number;
  close: number;
  midpoint: number;
  rangePips: number;
  quarter25: number;
  quarter75: number;
}

export interface CRTDetectionResult {
  id: string;
  symbol: string;
  referenceTimeframe: SupportedTimeframe;
  confirmationTimeframe: SupportedTimeframe;
  referenceRange: CRTReferenceRange;
  sweepType: 'HIGH_SWEEP_BEARISH_CRT' | 'LOW_SWEEP_BULLISH_CRT' | 'BOTH_SIDES_SWEPT' | 'BREAKOUT_EXPANSION' | 'NONE';
  status: 'CONFIRMED_CRT' | 'PROVISIONAL_SWEEP_INCOMPLETE' | 'RANGE_EXPANSION_BREAKOUT' | 'INSIDE_RANGE_NO_SWEEP';
  sweepExtremePrice: number | null;
  sweepTimestamp: string | null;
  sweepExcursionPips: number;
  reEntryConfirmed: boolean;
  reEntryCandleTimestamp: string | null;
  reEntryClosePrice: number | null;
  displacementConfirmed: boolean;
  sessionAtSweep: string;
  sessionRuleSatisfied: boolean;
  directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  setupClassification: string;
  entryZone: { min: number; max: number } | null;
  invalidationPrice: number | null;
  invalidationCondition: string;
  targets: { tp1Midpoint: number; tp2OppositeExtreme: number } | null;
  ruleDefinitionSummary: string;
  ruleConfigUsed: CRTRuleConfiguration;
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE C: SMC & ICT ANALYSIS ENGINE
// ============================================================================

export interface SMCRuleConfiguration {
  ruleVersion: string;
  swingLeftBars: number;
  swingRightBars: number;
  bosRequiresBodyClose: boolean;
  equalHighLowTolerancePips: number;
  equalHighLowMinTouches: number;
  fvgMinSizePips: number;
  displacementMinAtrMultiplier: number;
  displacementMinBodyToRangeRatio: number;
  oteFibLower: number; // default 0.618
  oteFibUpper: number; // default 0.786
  oteFibSweetSpot: number; // default 0.705
  killzones: {
    asianRange: { startUtc: string; endUtc: string };
    londonOpen: { startUtc: string; endUtc: string };
    newYorkOpen: { startUtc: string; endUtc: string };
    londonClose: { startUtc: string; endUtc: string };
  };
}

export interface SwingPoint {
  index: number;
  timestamp: string;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  structureLabel: 'HH' | 'HL' | 'LH' | 'LL' | 'EH' | 'EL' | 'INITIAL';
  isConfirmed: boolean;
  confirmedAtTimestamp: string;
}

export interface StructureBreakEvent {
  id: string;
  type: 'BOS' | 'CHOCH' | 'MSS';
  direction: 'BULLISH' | 'BEARISH';
  brokenSwingPrice: number;
  brokenSwingTimestamp: string;
  breakCandleTimestamp: string;
  breakClosePrice: number;
  hasDisplacement: boolean;
  isConfirmedClose: boolean;
  ruleDefinition: string;
  invalidationLevel: number;
}

export interface LiquidityPool {
  id: string;
  type: 'BUY_SIDE_LIQUIDITY' | 'SELL_SIDE_LIQUIDITY';
  sourceType: 'EQUAL_HIGHS' | 'EQUAL_LOWS' | 'PREV_DAY_HIGH' | 'PREV_DAY_LOW' | 'PREV_WEEK_HIGH' | 'PREV_WEEK_LOW' | 'SESSION_HIGH' | 'SESSION_LOW' | 'SWING_POOL';
  priceLevel: number;
  zoneMin: number;
  zoneMax: number;
  touchesCount: number;
  touchTimestamps: string[];
  swept: boolean;
  sweptAtTimestamp?: string;
  sweptExtremePrice?: number;
  subsequentReaction?: 'REJECTION_REVERSAL' | 'CONTINUATION_ACCEPTANCE' | 'PENDING';
  classification: 'INTERNAL_RANGE_LIQUIDITY' | 'EXTERNAL_RANGE_LIQUIDITY';
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH_FVG' | 'BEARISH_FVG' | 'BULLISH_IFVG' | 'BEARISH_IFVG';
  candle1Timestamp: string;
  candle2Timestamp: string;
  candle3Timestamp: string;
  upperPrice: number;
  lowerPrice: number;
  consequentEncroachment: number; // 50% midpoint of FVG
  sizePips: number;
  mitigationStatus: 'UNMITIGATED' | 'PARTIALLY_MITIGATED' | 'CONSEQUENT_ENCROACHMENT_TESTED' | 'FULLY_MITIGATED' | 'INVERTED';
  mitigatedAtTimestamp?: string;
  invalidationPrice: number;
}

export interface OrderBlockZone {
  id: string;
  type: 'BULLISH_OB' | 'BEARISH_OB' | 'BULLISH_BREAKER' | 'BEARISH_BREAKER' | 'MITIGATION_BLOCK';
  candleTimestamp: string;
  upperPrice: number;
  lowerPrice: number;
  meanThreshold: number; // 50% of OB candle body/range
  displacementConfirmed: boolean;
  associatedStructureBreakId?: string;
  status: 'ACTIVE_UNMITIGATED' | 'MITIGATED_RESPECTED' | 'CONVERTED_TO_BREAKER' | 'INVALIDATED';
  testedAtTimestamp?: string;
  invalidationPrice: number;
  ruleDefinition: string;
}

export interface DealingRangeZone {
  swingLowPrice: number;
  swingLowTimestamp: string;
  swingHighPrice: number;
  swingHighTimestamp: string;
  direction: 'BULLISH_DEALING_RANGE' | 'BEARISH_DEALING_RANGE';
  equilibriumPrice: number; // 50%
  currentPricePosition: 'PREMIUM' | 'EQUILIBRIUM' | 'DISCOUNT';
  currentRangePercent: number; // 0 to 100
  oteZone: {
    fib618: number;
    fib705: number;
    fib786: number;
    zoneMin: number;
    zoneMax: number;
    isPriceInOte: boolean;
  };
}

export interface ICTSessionContext {
  currentTimestamp: string;
  activeSession: 'London' | 'New York' | 'London/NY Overlap' | 'Asia' | 'Off-Hours';
  activeKillzone: 'LONDON_OPEN_KILLZONE' | 'NEW_YORK_OPEN_KILLZONE' | 'LONDON_CLOSE_KILLZONE' | 'ASIAN_RANGE_KILLZONE' | 'NONE';
  asianSessionRange: { high: number; low: number; rangePips: number; sweptHigh: boolean; sweptLow: boolean } | null;
  londonSessionRange: { high: number; low: number; rangePips: number } | null;
  newYorkSessionRange: { high: number; low: number; rangePips: number } | null;
  previousDay: { high: number; low: number; open: number; close: number } | null;
  previousWeek: { high: number; low: number } | null;
  midnightOpenUtc: number | null;
  judasSwingCandidate: {
    detected: boolean;
    direction?: 'BULLISH_TRAP_ABOVE_OPEN' | 'BEARISH_TRAP_BELOW_OPEN';
    sweptReference?: string;
    interpretationNote: string;
  };
}

export interface SMCAnalysisResult {
  symbol: string;
  timeframe: SupportedTimeframe;
  ruleVersion: string;
  trendStructure: 'BULLISH' | 'BEARISH' | 'RANGING';
  structureStateNote: string;
  swingPoints: SwingPoint[];
  structureBreaks: StructureBreakEvent[];
  liquidityPools: LiquidityPool[];
  fairValueGaps: FairValueGap[];
  orderBlocks: OrderBlockZone[];
  dealingRange: DealingRangeZone | null;
  ictContext: ICTSessionContext;
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE D: ADVANCED TECHNICAL ANALYSIS
// ============================================================================

export interface TechnicalIndicatorConfig {
  smaPeriods: number[];      // e.g. [20, 50, 200]
  emaPeriods: number[];      // e.g. [9, 21, 50, 200]
  rsiPeriod: number;         // default 14
  macdFast: number;          // default 12
  macdSlow: number;          // default 26
  macdSignal: number;        // default 9
  atrPeriod: number;         // default 14
  adxPeriod: number;         // default 14
  bollingerPeriod: number;   // default 20
  bollingerStdDev: number;   // default 2
}

export interface CandlestickPatternMatch {
  patternName: 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'HAMMER_PINBAR' | 'SHOOTING_STAR' | 'DOJI' | 'INSIDE_BAR' | 'MORNING_STAR' | 'EVENING_STAR';
  timestamp: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  contextSignificance: 'AT_SUPPORT_RESISTANCE' | 'WITH_TREND' | 'MID_RANGE_LOW_SIGNIFICANCE';
  description: string;
}

export interface SupportResistanceZone {
  type: 'SUPPORT' | 'RESISTANCE' | 'ROLE_REVERSAL_FLIP';
  centerPrice: number;
  zoneMin: number;
  zoneMax: number;
  touches: number;
  strengthScore: number; // 0 to 100
  firstTouchTimestamp: string;
  lastTouchTimestamp: string;
  breakoutStatus: 'HOLDING' | 'BROKEN_AWAITING_RETEST' | 'BROKEN_AND_RETESTED';
}

export interface TechnicalAnalysisSummary {
  symbol: string;
  timeframe: SupportedTimeframe;
  candleCount: number;
  insufficientHistoryWarnings: string[];
  movingAverages: {
    sma: Record<number, number | null>;
    ema: Record<number, number | null>;
    maAlignment: 'BULLISH_STACK' | 'BEARISH_STACK' | 'MIXED';
    priceVs200Ema: 'ABOVE' | 'BELOW' | 'UNAVAILABLE';
  };
  oscillators: {
    rsi14: number | null;
    rsiState: 'OVERBOUGHT' | 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'BEARISH_MOMENTUM' | 'NEUTRAL' | 'UNAVAILABLE';
    macd: { macdLine: number | null; signalLine: number | null; histogram: number | null; state: string };
  };
  volatility: {
    atr14: number | null;
    atrPips: number | null;
    bollingerUpper: number | null;
    bollingerMiddle: number | null;
    bollingerLower: number | null;
    bollingerBandwidthPct: number | null;
    regime: 'LOW_VOLATILITY_SQUEEZE' | 'NORMAL_VOLATILITY' | 'HIGH_VOLATILITY_EXPANSION' | 'EXTREME_VOLATILITY' | 'UNAVAILABLE';
  };
  marketRegime: {
    classification: 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'RANGE_BOUND' | 'TRANSITIONING' | 'UNAVAILABLE';
    adx14: number | null;
    trendStrengthScore: number | null; // 0-100
    explanation: string;
  };
  supportResistanceZones: SupportResistanceZone[];
  fibonacci: {
    anchorHigh: number;
    anchorLow: number;
    direction: 'UPTREND_RETRACEMENT' | 'DOWNTREND_RETRACEMENT';
    retracements: Record<string, number>; // '0.236', '0.382', '0.500', '0.618', '0.786'
    extensions: Record<string, number>;   // '1.272', '1.618', '2.000'
  } | null;
  candlestickPatterns: CandlestickPatternMatch[];
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE E: FUNDAMENTAL & MACROECONOMIC INTELLIGENCE
// ============================================================================

export interface EconomicCalendarEventRecord {
  id: string;
  externalId?: string;
  title: string;
  country: string;
  currency: string;
  category: 'INFLATION' | 'EMPLOYMENT' | 'GROWTH' | 'CENTRAL_BANK' | 'PMI' | 'RETAIL' | 'TRADE' | 'BONDS' | 'MACRO';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  eventTime: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'REVISED' | 'CANCELLED';
  forecastValue: string | null;
  previousValue: string | null;
  revisedPreviousValue: string | null;
  actualValue: string | null;
  unit: string | null;
  surpriseDirection?: 'POSITIVE_SURPRISE' | 'NEGATIVE_SURPRISE' | 'IN_LINE' | 'UNAVAILABLE';
  sourceProvider: string;
  sourceUrl?: string;
  publishedAt?: string;
  retrievedAt: string;
  timezone: string;
}

export interface CurrencyMacroProfile {
  currency: string;
  centralBank: string;
  policyRatePct: number | null;
  cpiYoYPct: number | null;
  coreCpiYoYPct: number | null;
  gdpGrowthPct: number | null;
  unemploymentRatePct: number | null;
  ManufacturingPmi: number | null;
  ServicesPmi: number | null;
  bondYield10YPct: number | null;
  policyStance: 'HAWKISH' | 'NEUTRAL_DATA_DEPENDENT' | 'DOVISH' | 'UNAVAILABLE';
  inflationTrend: 'COOLING' | 'STICKY_HIGH' | 'RISING' | 'AT_TARGET' | 'UNAVAILABLE';
  growthMomentum: 'EXPANDING' | 'SLOWING' | 'CONTRACTING' | 'UNAVAILABLE';
  fundamentalScore: number; // -100 to +100
  supportingFactors: string[];
  opposingFactors: string[];
  upcomingHighImpactEvents: EconomicCalendarEventRecord[];
  lastUpdated: string;
  sourceProvider: string;
}

export interface PairFundamentalAssessment {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseProfile: CurrencyMacroProfile;
  quoteProfile: CurrencyMacroProfile;
  rateDifferentialBps: number | null; // (baseRate - quoteRate) * 100
  yieldDifferential10YBps: number | null;
  policyDivergenceSummary: string;
  relativeStrengthScore: number; // -100 (Strong Quote/Bearish Pair) to +100 (Strong Base/Bullish Pair)
  directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  riskSentimentContext: 'RISK_ON_SUPPORTIVE' | 'RISK_OFF_SAFE_HAVEN' | 'NEUTRAL';
  upcomingEventRisk: {
    hasHighImpactWithin24h: boolean;
    nextHighImpactEvent: EconomicCalendarEventRecord | null;
    hoursUntilNextHighImpact: number | null;
    eventRiskWarning: string;
  };
  supportingEvidence: string[];
  contradictingEvidence: string[];
  disclaimer: string;
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE F: CURRENCY STRENGTH & PAIR RANKING
// ============================================================================

export interface CurrencyStrengthItem {
  currency: string;
  rank: number;
  compositeStrengthScore: number; // -100 to +100
  technicalReturnPct: number | null;
  momentumScore: number | null;
  fundamentalScore: number;
  alignmentStatus: 'ALIGNED_BULLISH' | 'ALIGNED_BEARISH' | 'CONFLICTING_TECH_VS_MACRO' | 'NEUTRAL';
  pairsAnalyzedCount: number;
  contributingPairs: Array<{ symbol: string; returnPct: number; role: 'BASE' | 'QUOTE' }>;
}

export interface PairRankingWatchlistItem {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  strengthSpread: number; // baseScore - quoteScore
  directionBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  technicalTrendAligned: boolean;
  macroAligned: boolean;
  conflictingSignalWarning: string | null;
  correlationGroup: string;
}

export interface CurrencyStrengthModelResult {
  windowLabel: string; // e.g., '24H', '7D', '30D', 'SESSION'
  timeframeUsed: SupportedTimeframe;
  barsLookback: number;
  rankings: CurrencyStrengthItem[];
  strongestCurrency: string | null;
  weakestCurrency: string | null;
  topRankedPairs: PairRankingWatchlistItem[];
  correlationMatrix: Record<string, Record<string, number>>;
  methodologyExplanation: string;
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE H: CONFLUENCE & SETUP SCORING
// ============================================================================

export interface ConfluenceWeights {
  htfStructureAlignment: number;   // default 20
  ltfStructureShift: number;       // default 15
  liquiditySweepConfirmed: number; // default 15
  fvgOrOrderBlockZone: number;     // default 12
  crtSetupConfirmed: number;       // default 10
  sessionKillzoneTiming: number;   // default 8
  fundamentalAlignment: number;    // default 10
  eventRiskClearance: number;      // default 5
  rewardToRiskFeasibility: number; // default 5
}

export interface ConfluenceComponentScore {
  componentId: keyof ConfluenceWeights;
  label: string;
  weight: number;
  rawScore: number; // -1 (contradictory), 0 (missing/neutral), +0.5 (partial), +1 (confirmed)
  weightedContribution: number;
  status: 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL_OR_MISSING';
  evidence: string;
  provenanceCategory: DataProvenanceCategory;
}

export interface ConfluenceEvaluationResult {
  symbol: string;
  evaluatedDirection: 'BULLISH' | 'BEARISH';
  totalHeuristicScore: number; // 0 to 100
  grade: 'A_PLUS_HIGH_CONFLUENCE' | 'B_MODERATE_CONFLUENCE' | 'C_LOW_CONFLUENCE' | 'NO_SETUP_CONTRADICTORY';
  components: ConfluenceComponentScore[];
  penaltiesApplied: Array<{ reason: string; pointsDeducted: number }>;
  missingEvidenceWarnings: string[];
  contradictorySignals: string[];
  calibrationDisclaimer: string;
  ruleVersion: string;
}

// ============================================================================
// MODULE G: AI TRADING ANALYST
// ============================================================================

export interface AIValidatedStatement {
  statement: string;
  evidenceCategory: DataProvenanceCategory;
  sourceReference: string;
}

export interface AIScenarioOutline {
  scenarioType: 'BULLISH' | 'BEARISH' | 'NEUTRAL_RANGE';
  conditionTrigger: string;
  keyPriceLevels: number[];
  targetLevels: number[];
  invalidationPrice: number | null;
  invalidationReason: string;
  supportingEvidence: string[];
  opposingEvidence: string[];
}

export interface AITradingAnalystReport {
  id: string;
  symbol: string;
  htfTimeframe: SupportedTimeframe;
  ltfTimeframe: SupportedTimeframe;
  generatedAt: string;
  modelIdentifier: string;
  ruleVersion: string;
  evidenceStatus: 'SUFFICIENT_EVIDENCE' | 'PARTIAL_EVIDENCE' | 'INSUFFICIENT_MARKET_DATA';
  executiveBriefing: string;
  marketStructureSummary: {
    htfBias: string;
    ltfStructure: string;
    crtAndSmcEvidence: string[];
    provenance: DataProvenanceCategory;
  };
  fundamentalSummary: {
    macroBias: string;
    keyDrivers: string[];
    upcomingCatalysts: string[];
    provenance: DataProvenanceCategory;
  };
  scenarios: {
    bullish: AIScenarioOutline;
    bearish: AIScenarioOutline;
    neutral: AIScenarioOutline;
  };
  setupEvaluation: {
    proposedDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL_WAIT';
    confluenceScore: number;
    entryConditions: string[];
    stopLossLogic: string;
    invalidationPrice: number | null;
    targetScenarios: Array<{ label: string; price: number; rrRatio: number }>;
    disqualifyingConditions: string[];
  };
  riskConsiderations: string[];
  missingOrContradictoryEvidence: string[];
  attributedStatements: AIValidatedStatement[];
  disclaimer: string;
}

// ============================================================================
// MODULE I: PROFESSIONAL RISK MANAGEMENT & POSITION SIZING
// ============================================================================

export interface PositionSizingInput {
  accountBalance: number;
  accountEquity?: number;
  accountCurrency: string; // e.g., 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'
  riskPercentage: number;  // e.g., 1.0 for 1%
  symbol: string;          // e.g., 'EURUSD', 'USDJPY', 'GBPJPY', 'XAUUSD'
  direction?: 'BUY' | 'SELL';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrices?: number[]; // Supports single or multiple partial TPs
  commissionPerLotRoundTurn?: number; // in accountCurrency, e.g. $7.00 per standard lot
  spreadPipsOverride?: number;
  conversionRatesToAccountCurrency?: Record<string, number>; // Optional quote-to-account FX rate overrides
}

export interface PositionSizingResult {
  symbol: string;
  accountCurrency: string;
  direction: 'BUY' | 'SELL';
  accountBalance: number;
  accountEquity: number;
  riskPercentage: number;
  riskAmountCurrency: number;
  entryPrice: number;
  stopLossPrice: number;
  stopDistancePrice: number;
  stopDistancePips: number;
  pipSize: number;
  contractSize: number;
  pipValuePerStandardLotInQuote: number;
  quoteToAccountRateUsed: number;
  pipValuePerStandardLotInAccountCurrency: number;
  spreadPipsAssumed: number;
  commissionPerLotCurrency: number;
  totalFrictionCostPerLotCurrency: number;
  recommendedLotSizeRaw: number;
  recommendedLotSize: number; // Rounded to instrument lotStep & clamped to [minLot, maxLot]
  recommendedUnits: number;
  effectiveRiskAmountWithFriction: number;
  effectiveRiskPercentage: number;
  targets: Array<{
    targetIndex: number;
    targetPrice: number;
    rewardPips: number;
    grossRewardCurrency: number;
    netRewardCurrency: number;
    rewardToRiskRatioGross: number;
    rewardToRiskRatioNet: number;
  }>;
  warnings: string[];
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MODULE J: BACKTESTING & STRATEGY RESEARCH
// ============================================================================

export type BacktestStrategyId =
  | 'CRT_SWEEP_REENTRY'
  | 'SMC_FVG_ORDER_BLOCK'
  | 'ICT_KILLZONE_OTE'
  | 'MA_TREND_PULLBACK';

export interface BacktestConfiguration {
  strategyId: BacktestStrategyId;
  symbol: string;
  timeframe: SupportedTimeframe;
  initialCapital: number;
  riskPerTradePct: number;
  rewardToRiskTarget: number;
  spreadPips: number;
  commissionPerLot: number;
  slippagePips: number;
  maxBarsHold: number;
  sessionFilter?: string[];
}

export interface SimulatedTradeRecord {
  tradeIndex: number;
  direction: 'BUY' | 'SELL';
  entryTimestamp: string;
  exitTimestamp: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  exitPrice: number;
  lotSize: number;
  grossPnl: number;
  frictionCost: number;
  netPnl: number;
  rMultipleNet: number;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'TIME_EXIT';
  sessionAtEntry: string;
  setupTriggerNote: string;
}

export interface BacktestRunResult {
  id: string;
  config: BacktestConfiguration;
  ruleVersion: string;
  startTimestamp: string;
  endTimestamp: string;
  barsEvaluated: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRatePct: number;
  profitFactor: number;
  expectancyCurrency: number;
  expectancyR: number;
  averageWinCurrency: number;
  averageLossCurrency: number;
  averageRMultiple: number;
  netProfitCurrency: number;
  netProfitPct: number;
  maxDrawdownCurrency: number;
  maxDrawdownPct: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  trades: SimulatedTradeRecord[];
  equityCurve: Array<{ timestamp: string; equity: number; drawdownPct: number }>;
  breakdownBySession: Record<string, { trades: number; winRatePct: number; netPnl: number; avgR: number }>;
  assumptionsAndLimitations: string[];
  createdAt: string;
}

// ============================================================================
// MODULE K: DEEP INTEGRATION WITH EXISTING MT5 TRADING JOURNAL
// ============================================================================

export interface TradeAnalysisEnrichmentRecord {
  id: string;
  positionId: string;
  userId: string;
  accountId?: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  htfBiasAtEntry: string;
  ltfStructureAtEntry: string;
  marketRegimeAtEntry: string;
  volatilityRegimeAtEntry: string;
  activeSessionAtEntry: string;
  crtSetupNearby: string | null;
  smcStructureNearby: string | null;
  fvgOrObConfluence: string | null;
  macroBiasAtEntry: string;
  nearbyEconomicEvents: Array<{
    title: string;
    currency: string;
    impact: string;
    eventTime: string;
    minutesFromEntry: number;
  }>;
  plannedRiskReward: number | null;
  actualRMultiple: number | null;
  confluenceScoreAtEntry: number;
  ruleComplianceScore: number;
  executionQualityGrade: 'A' | 'B' | 'C' | 'D';
  postTradeSummary: string;
  lessonsLearned: string[];
  ruleVersion: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MODULE 14: TRADE PLANS & CONFIGURABLE ALERTS
// ============================================================================

export interface TradePlanRecord {
  id: string;
  userId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  timeframe: SupportedTimeframe;
  strategyType: string;
  setupThesis: string;
  entryZoneMin: number;
  entryZoneMax: number;
  invalidationPrice: number;
  targetTp1: number;
  targetTp2: number | null;
  plannedRiskPct: number;
  confluenceScore: number;
  status: 'WATCHING' | 'ENTRY_TRIGGERED' | 'INVALIDATED' | 'COMPLETED' | 'CANCELLED';
  alertOnEntryZone: boolean;
  alertOnInvalidation: boolean;
  lastAlertTriggeredType: string | null;
  lastAlertTriggeredAt: string | null;
  linkedPositionId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MARKET SCANNER TYPES (Adapted from trader-scanner for multi-asset Forex)
// ============================================================================

export type ScannerSetupType =
  | 'ORB_BREAKOUT'
  | 'BREAKOUT_20BAR'
  | 'BULL_FLAG'
  | 'BEAR_FLAG'
  | 'RECLAIM_MA20'
  | 'RSI_OVERSOLD_BOUNCE'
  | 'RSI_OVERBOUGHT_REVERSAL'
  | 'LIQUIDITY_SWEEP_DISPLACEMENT'
  | 'CRT_SWEEP_REENTRY';

export interface ScannerHit {
  id: string;
  symbol: string;
  displayName: string;
  timeframe: SupportedTimeframe;
  setupType: ScannerSetupType;
  direction: 'BUY' | 'SELL';
  triggerPrice: number;
  setupDescription: string;
  candleTimestamp: string;
  confluenceScore: number;
  keyLevels: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rewardToRisk: number;
  };
  session: string;
  dataTimestamp: string;
  sourceProvider: string;
}

export interface ScannerFilterOptions {
  symbols?: string[];
  timeframes?: SupportedTimeframe[];
  setupTypes?: ScannerSetupType[];
  direction?: 'BUY' | 'SELL' | 'ALL';
  minConfluence?: number;
  sessionFilter?: string[];
  limit?: number;
}

export interface ScannerResult {
  scanId: string;
  timestamp: string;
  symbolsScanned: number;
  timeframesScanned: string[];
  hitsCount: number;
  hits: ScannerHit[];
  scanDurationMs: number;
  provenance: DataProvenanceMetadata;
}

// ============================================================================
// MONTE CARLO & SIMULATION TYPES (Adapted from trader-timemachine)
// ============================================================================

export interface MonteCarloRunConfig {
  replays: number;       // default 10,000
  seed: number;          // default 19 for deterministic reproducibility
  windowBars: number;    // time-of-day sampling jitter window (default 2 bars)
  maxBarsHold: number;   // default 24 bars
  confidenceLevel: number; // default 0.95
}

export interface MonteCarloSimulationResult {
  runId: string;
  symbol: string;
  planId?: string;
  replays: number;
  seed: number;
  planDetails: {
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    targetRMultiple: number;
    breakEvenWinRateRequiredPct: number;
  };
  odds: {
    targetFirstPct: number;
    stopFirstPct: number;
    neitherPct: number;
    greenPct: number;
    averageRMultiple: number;
  };
  verdict: string;
  verdictReason: string;
  fanChartBands: Array<{
    barIndex: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>;
  terminalPricePercentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  terminalRHistogram: Array<{
    binStart: number;
    binEnd: number;
    count: number;
    percentage: number;
  }>;
  historicalExactRuleReplay?: {
    sessionsEvaluated: number;
    historicalWinRatePct: number;
    historicalProfitFactor: number;
    historicalExpectancyR: number;
  };
  disclaimer: string;
  createdAt: string;
}

// ============================================================================
// CENTRALIZED RISK GATE & BUDGET CHECK (Adapted from trader-risk & trader-budget)
// ============================================================================

export interface CentralizedRiskCheckInput {
  userId: string;
  accountId?: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  lotSize?: number;
  orderType?: 'MARKET' | 'LIMIT' | 'STOP';
  accountBalance?: number;
  accountEquity?: number;
  accountCurrency?: string;
}

export interface CentralizedRiskCheckResult {
  decision: 'PASS' | 'BLOCK';
  orderFingerprint: string;
  reasons: string[];
  warnings: string[];
  checkedAt: string;
  metrics: {
    symbol: string;
    accountCurrency: string;
    calculatedLotSize: number;
    stopDistancePips: number;
    plannedLossCurrency: number;
    plannedLossPercentage: number;
    rewardToRiskRatio: number;
    dailyLossRemainingCurrency: number;
    tradesRemainingToday: number;
    correlatedExposureWarning?: string;
    newsBlackoutWarning?: string;
  };
}

// ============================================================================
// BROKER EXECUTION & APPROVAL ORDER TICKET (Adapted from trader-broker)
// ============================================================================

export interface BrokerOrderTicket {
  ticketId: string;
  userId: string;
  accountId?: string;
  idempotencyKey: string;
  orderFingerprint: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  requestedPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  lotSize: number;
  maxLossCurrency: number;
  accountCurrency: string;
  rewardToRiskRatio: number;
  executionMode: 'PAPER' | 'LIVE';
  approvalState: 'AWAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUBMITTED' | 'FILLED' | 'CANCELLED';
  userApprovedAt?: string;
  userApprovalReply?: string;
  rejectionReason?: string;
  mt5DealTicket?: string;
  mt5OrderTicket?: string;
  fillPrice?: number;
  filledAt?: string;
  createdAt: string;
  expiresAt: string;
}


