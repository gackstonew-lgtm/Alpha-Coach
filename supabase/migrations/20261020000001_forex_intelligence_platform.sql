-- =============================================================================
-- Alpha Coach Professional Forex Intelligence Platform
-- Additive Migration: 20261020000001_forex_intelligence_platform.sql
-- =============================================================================
-- Preserves all existing tables and relationships.
-- Adds tables for OHLCV candles, economic events & indicators, strategy rule
-- configs, analysis reports, confluence scores, backtest runs, trade journal
-- enrichments, and trade plans / alerts.
-- =============================================================================

-- 1. Market OHLCV Candles (Time-series storage with strict source & freshness tracking)
CREATE TABLE IF NOT EXISTS public.market_candles (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL, -- 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN1'
  candle_time TEXT NOT NULL, -- ISO8601 UTC opening timestamp
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL DEFAULT 0.0,
  spread INTEGER DEFAULT 0,
  is_closed INTEGER NOT NULL DEFAULT 1,
  source_provider TEXT NOT NULL DEFAULT 'MT5', -- 'MT5' | 'TWELVEDATA' | 'ALPHA_VANTAGE' | 'FRANKFURTER_ECB' | 'USER_CSV'
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, timeframe, candle_time, source_provider)
);

CREATE INDEX IF NOT EXISTS idx_market_candles_lookup ON public.market_candles(symbol, timeframe, candle_time);

-- 2. Extend economic_events with full provenance, category, revision & source metadata
CREATE TABLE IF NOT EXISTS public.economic_calendar_events (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'MACRO', -- 'INFLATION' | 'EMPLOYMENT' | 'GROWTH' | 'CENTRAL_BANK' | 'PMI' | 'RETAIL' | 'TRADE' | 'BONDS' | 'MACRO'
  impact TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW' | 'MEDIUM' | 'HIGH'
  event_time TEXT NOT NULL, -- ISO8601 UTC
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'PUBLISHED' | 'REVISED' | 'CANCELLED'
  forecast_value TEXT,
  previous_value TEXT,
  revised_previous_value TEXT,
  actual_value TEXT,
  unit TEXT,
  source_provider TEXT NOT NULL, -- 'MT5_CALENDAR' | 'OFFICIAL_CB' | 'ECONOMIC_API' | 'USER_IMPORT'
  source_url TEXT,
  published_at TEXT,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  timezone TEXT NOT NULL DEFAULT 'UTC'
);

CREATE INDEX IF NOT EXISTS idx_econ_calendar_time_ccy ON public.economic_calendar_events(event_time, currency, impact);

-- 3. Macroeconomic Country / Currency Indicators Snapshot (Interest rates, CPI, GDP, Unemployment, 10Y Yields)
CREATE TABLE IF NOT EXISTS public.macroeconomic_indicators (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  indicator_code TEXT NOT NULL, -- 'POLICY_RATE' | 'CPI_YOY' | 'CORE_CPI_YOY' | 'GDP_QOQ' | 'UNEMPLOYMENT' | 'PMI_COMPOSITE' | 'BOND_YIELD_10Y' | 'TRADE_BALANCE' | 'CB_BIAS'
  indicator_name TEXT NOT NULL,
  value REAL,
  value_text TEXT,
  previous_value REAL,
  trend TEXT DEFAULT 'FLAT', -- 'RISING' | 'FALLING' | 'FLAT'
  central_bank TEXT,
  effective_date TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(currency, indicator_code, effective_date, source_provider)
);

CREATE INDEX IF NOT EXISTS idx_macro_indicators_ccy ON public.macroeconomic_indicators(currency, indicator_code);

-- 4. User Analysis Preferences & Strategy Rule Configurations
CREATE TABLE IF NOT EXISTS public.analysis_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  preferred_symbols_json TEXT NOT NULL DEFAULT '["EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD","EURGBP","GBPJPY","XAUUSD"]',
  htf_timeframes_json TEXT NOT NULL DEFAULT '["D1","H4"]',
  ltf_timeframes_json TEXT NOT NULL DEFAULT '["H1","M15","M5"]',
  crt_rules_json TEXT NOT NULL,
  smc_rules_json TEXT NOT NULL,
  technical_rules_json TEXT NOT NULL,
  confluence_weights_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_config_user ON public.analysis_configurations(user_id);

-- 5. Saved Analysis Reports & Historical Analysis Records (Modules A, G, H)
CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  htf_timeframe TEXT NOT NULL,
  ltf_timeframe TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'WORKSPACE_SNAPSHOT', -- 'WORKSPACE_SNAPSHOT' | 'AI_BRIEFING' | 'AI_SETUP_EVALUATION' | 'FUNDAMENTAL_ASSESSMENT'
  current_price REAL,
  price_timestamp TEXT,
  active_session TEXT,
  directional_bias TEXT DEFAULT 'NEUTRAL', -- 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  confluence_score REAL,
  technical_summary_json TEXT NOT NULL,
  crt_summary_json TEXT,
  smc_summary_json TEXT,
  fundamental_summary_json TEXT,
  currency_strength_json TEXT,
  ai_explanation_json TEXT,
  scenarios_json TEXT,
  invalidation_levels_json TEXT,
  data_provenance_json TEXT NOT NULL,
  rule_version TEXT NOT NULL DEFAULT '1.0.0',
  model_identifier TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_symbol ON public.analysis_reports(user_id, symbol, created_at);

-- 6. Trade Journal Analytical Enrichment (Module K - Strictly separate from authoritative MT5 trade records)
CREATE TABLE IF NOT EXISTS public.trade_analysis_enrichments (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL UNIQUE, -- References reconstructed_positions(id)
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  entry_timeframe TEXT DEFAULT 'M15',
  htf_timeframe TEXT DEFAULT 'H4',
  analysis_status TEXT NOT NULL DEFAULT 'COMPLETE', -- 'COMPLETE' | 'INCOMPLETE_DATA' | 'PENDING'
  market_regime_at_entry TEXT, -- 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'RANGING' | 'HIGH_VOLATILITY' | 'UNKNOWN'
  htf_structure_at_entry TEXT, -- 'BULLISH' | 'BEARISH' | 'RANGING' | 'UNAVAILABLE'
  ltf_structure_at_entry TEXT,
  crt_setup_json TEXT,
  smc_ict_setup_json TEXT,
  fundamental_context_json TEXT,
  nearby_economic_events_json TEXT,
  planned_entry REAL,
  planned_sl REAL,
  planned_tp REAL,
  planned_rr REAL,
  realized_r_multiple REAL,
  risk_pct_at_entry REAL,
  position_sizing_valid INTEGER DEFAULT 1,
  rule_compliance_score REAL,
  rule_violations_json TEXT,
  execution_mistakes_json TEXT,
  post_trade_ai_review_json TEXT,
  rule_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_enrichments_user ON public.trade_analysis_enrichments(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_trade_enrichments_position ON public.trade_analysis_enrichments(position_id);

-- 7. Strategy Backtest Runs (Module J)
CREATE TABLE IF NOT EXISTS public.backtest_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- 'CRT_SWEEP' | 'SMC_FVG_OB' | 'ICT_KILLZONE_OTE' | 'MA_TREND_PULLBACK' | 'BREAKOUT_RETEST'
  rule_version TEXT NOT NULL DEFAULT '1.0.0',
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  initial_balance REAL NOT NULL DEFAULT 10000.0,
  risk_per_trade_pct REAL NOT NULL DEFAULT 1.0,
  spread_pips REAL NOT NULL DEFAULT 1.0,
  commission_per_lot REAL NOT NULL DEFAULT 7.0,
  slippage_pips REAL NOT NULL DEFAULT 0.2,
  parameters_json TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  trades_json TEXT NOT NULL,
  equity_curve_json TEXT NOT NULL,
  data_provenance_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_user ON public.backtest_runs(user_id, created_at);

-- 8. Trade Plans & Configurable Alerts (Module 14)
CREATE TABLE IF NOT EXISTS public.trade_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'BUY' | 'SELL'
  setup_type TEXT NOT NULL,
  entry_zone_min REAL NOT NULL,
  entry_zone_max REAL NOT NULL,
  invalidation_price REAL NOT NULL,
  target_1_price REAL NOT NULL,
  target_2_price REAL,
  planned_risk_pct REAL DEFAULT 1.0,
  confluence_score REAL,
  entry_conditions_json TEXT NOT NULL,
  invalidation_conditions_json TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'WATCHING', -- 'WATCHING' | 'TRIGGERED' | 'INVALIDATED' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED'
  alert_enabled INTEGER NOT NULL DEFAULT 1,
  alert_triggered_at TEXT,
  alert_delivery_status TEXT DEFAULT 'PENDING', -- 'PENDING' | 'DELIVERED' | 'SUPPRESSED_DUPLICATE' | 'DISABLED'
  linked_report_id TEXT,
  linked_position_id TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_plans_user_status ON public.trade_plans(user_id, status, symbol);

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (Manual Down-Migration if ever required):
-- DROP TABLE IF EXISTS public.trade_plans;
-- DROP TABLE IF EXISTS public.backtest_runs;
-- DROP TABLE IF EXISTS public.trade_analysis_enrichments;
-- DROP TABLE IF EXISTS public.analysis_reports;
-- DROP TABLE IF EXISTS public.analysis_configurations;
-- DROP TABLE IF EXISTS public.macroeconomic_indicators;
-- DROP TABLE IF EXISTS public.economic_calendar_events;
-- DROP TABLE IF EXISTS public.market_candles;
-- =============================================================================
