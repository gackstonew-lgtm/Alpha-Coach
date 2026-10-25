// Alpha Coach Relational Database Schema (PostgreSQL & SQLite Compatible DDL)

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'trader',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  subscription_tier TEXT NOT NULL DEFAULT 'PRO',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  trading_experience_years REAL DEFAULT 1.0,
  favorite_pairs TEXT,
  preferred_sessions TEXT,
  max_daily_risk_pct REAL DEFAULT 2.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  server_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  balance REAL NOT NULL DEFAULT 0.0,
  equity REAL NOT NULL DEFAULT 0.0,
  margin REAL NOT NULL DEFAULT 0.0,
  free_margin REAL NOT NULL DEFAULT 0.0,
  margin_level REAL DEFAULT 0.0,
  account_type TEXT NOT NULL DEFAULT 'hedging',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_number, server_name)
);

CREATE TABLE IF NOT EXISTS bridge_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_token TEXT UNIQUE NOT NULL,
  token_hash TEXT,
  ip_address TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bridge_pairing_sessions (
  id TEXT PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_orders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type INTEGER NOT NULL,
  state INTEGER NOT NULL,
  volume_initial REAL NOT NULL,
  volume_current REAL NOT NULL,
  price_open REAL NOT NULL,
  price_sl REAL DEFAULT 0.0,
  price_tp REAL DEFAULT 0.0,
  time_setup TEXT NOT NULL,
  time_done TEXT,
  time_expiration TEXT,
  magic INTEGER DEFAULT 0,
  comment TEXT,
  external_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, order_id)
);

CREATE TABLE IF NOT EXISTS raw_deals (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type INTEGER NOT NULL,
  entry INTEGER NOT NULL,
  volume REAL NOT NULL,
  price REAL NOT NULL,
  commission REAL DEFAULT 0.0,
  swap REAL DEFAULT 0.0,
  profit REAL DEFAULT 0.0,
  fee REAL DEFAULT 0.0,
  price_sl REAL DEFAULT 0.0,
  price_tp REAL DEFAULT 0.0,
  time TEXT NOT NULL,
  magic INTEGER DEFAULT 0,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, deal_id)
);

CREATE TABLE IF NOT EXISTS raw_open_positions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL,
  ticket TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type INTEGER NOT NULL, -- 0: BUY, 1: SELL
  magic INTEGER DEFAULT 0,
  identifier TEXT,
  reason INTEGER DEFAULT 0,
  volume REAL NOT NULL,
  price_open REAL NOT NULL,
  price_sl REAL DEFAULT 0.0,
  price_tp REAL DEFAULT 0.0,
  price_current REAL NOT NULL,
  swap REAL DEFAULT 0.0,
  profit REAL DEFAULT 0.0, -- Live floating profit
  comment TEXT,
  external_id TEXT,
  time TEXT NOT NULL,
  time_msc INTEGER,
  time_update TEXT,
  time_update_msc INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, position_id)
);

CREATE TABLE IF NOT EXISTS reconstructed_positions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  position_type TEXT NOT NULL,
  total_volume REAL NOT NULL,
  entry_price_avg REAL NOT NULL,
  exit_price_avg REAL,
  current_price REAL,
  floating_profit REAL DEFAULT 0.0,
  magic INTEGER DEFAULT 0,
  comment TEXT,
  external_id TEXT,
  open_time TEXT NOT NULL,
  close_time TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  gross_profit REAL NOT NULL DEFAULT 0.0,
  commission_total REAL NOT NULL DEFAULT 0.0,
  swap_total REAL NOT NULL DEFAULT 0.0,
  fee_total REAL NOT NULL DEFAULT 0.0,
  net_profit REAL NOT NULL DEFAULT 0.0,
  initial_sl REAL,
  initial_tp REAL,
  risk_amount REAL,
  r_multiple REAL,
  holding_seconds INTEGER DEFAULT 0,
  session_name TEXT,
  exit_reason TEXT DEFAULT 'UNKNOWN',
  is_hedged INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, position_id)
);

CREATE TABLE IF NOT EXISTS position_executions (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES reconstructed_positions(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  volume REAL NOT NULL,
  price REAL NOT NULL,
  profit REAL NOT NULL DEFAULT 0.0,
  commission REAL NOT NULL DEFAULT 0.0,
  swap REAL NOT NULL DEFAULT 0.0,
  execution_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  color_tag TEXT DEFAULT '#3b82f6',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mistake_tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT DEFAULT 'MEDIUM',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_journals (
  id TEXT PRIMARY KEY,
  position_id TEXT UNIQUE NOT NULL REFERENCES reconstructed_positions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setup_name TEXT,
  strategy_id TEXT REFERENCES strategies(id) ON DELETE SET NULL,
  confluences TEXT,
  bias TEXT DEFAULT 'NEUTRAL',
  entry_trigger TEXT,
  exit_trigger TEXT,
  confidence_score INTEGER DEFAULT 5,
  emotion_state TEXT,
  mistake_id TEXT REFERENCES mistake_tags(id) ON DELETE SET NULL,
  lesson_learned TEXT,
  voice_transcript TEXT,
  trader_notes TEXT,
  ai_feedback TEXT,
  is_reviewed INTEGER NOT NULL DEFAULT 0,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_screenshots (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES trade_journals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'CHART',
  image_url TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
  max_daily_loss_amount REAL DEFAULT 500.0,
  max_daily_loss_pct REAL DEFAULT 2.0,
  max_weekly_loss_amount REAL DEFAULT 1500.0,
  max_trades_per_day INTEGER DEFAULT 5,
  max_risk_per_trade_pct REAL DEFAULT 1.0,
  max_consecutive_losses INTEGER DEFAULT 3,
  max_drawdown_pct REAL DEFAULT 5.0,
  max_position_size REAL DEFAULT 5.0,
  allowed_start_time TEXT DEFAULT '00:00',
  allowed_end_time TEXT DEFAULT '23:59',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id)
);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'WARNING',
  message TEXT NOT NULL,
  current_value REAL NOT NULL,
  threshold_value REAL NOT NULL,
  triggered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_acknowledged INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trader_progression (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  total_trades_reviewed INTEGER NOT NULL DEFAULT 0,
  rule_compliance_rate REAL NOT NULL DEFAULT 100.0,
  last_activity_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pdf_url TEXT
);

CREATE TABLE IF NOT EXISTS economic_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'MEDIUM',
  event_time TEXT NOT NULL,
  forecast TEXT,
  previous TEXT,
  actual TEXT
);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  last_deal_id TEXT,
  last_deal_time TEXT,
  last_order_id TEXT,
  last_order_time TEXT,
  sync_status TEXT NOT NULL DEFAULT 'PENDING',
  deals_count INTEGER NOT NULL DEFAULT 0,
  positions_count INTEGER NOT NULL DEFAULT 0,
  trades_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  account_id TEXT REFERENCES trading_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  is_read INTEGER NOT NULL DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_deals_account_time ON raw_deals(account_id, time);
CREATE INDEX IF NOT EXISTS idx_raw_orders_account_time ON raw_orders(account_id, time_setup);
CREATE INDEX IF NOT EXISTS idx_positions_account_time ON reconstructed_positions(account_id, open_time);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON reconstructed_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON reconstructed_positions(status);
CREATE INDEX IF NOT EXISTS idx_trade_journals_user ON trade_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journals_reviewed ON trade_journals(is_reviewed);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user ON risk_alerts(user_id, is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_code ON bridge_pairing_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_user ON bridge_pairing_sessions(user_id);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================================================
-- Alpha Coach Forex Fundamental & Technical Intelligence Platform Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS market_candles (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  candle_time TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL DEFAULT 0.0,
  spread INTEGER DEFAULT 0,
  is_closed INTEGER NOT NULL DEFAULT 1,
  source_provider TEXT NOT NULL DEFAULT 'MT5',
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, timeframe, candle_time, source_provider)
);
CREATE INDEX IF NOT EXISTS idx_market_candles_lookup ON market_candles(symbol, timeframe, candle_time);

CREATE TABLE IF NOT EXISTS economic_calendar_events (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'MACRO',
  impact TEXT NOT NULL DEFAULT 'MEDIUM',
  event_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  forecast_value TEXT,
  previous_value TEXT,
  revised_previous_value TEXT,
  actual_value TEXT,
  unit TEXT,
  source_provider TEXT NOT NULL,
  source_url TEXT,
  published_at TEXT,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  timezone TEXT NOT NULL DEFAULT 'UTC'
);
CREATE INDEX IF NOT EXISTS idx_econ_calendar_time_ccy ON economic_calendar_events(event_time, currency, impact);

CREATE TABLE IF NOT EXISTS macroeconomic_indicators (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  indicator_code TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  value REAL,
  value_text TEXT,
  previous_value REAL,
  trend TEXT DEFAULT 'FLAT',
  central_bank TEXT,
  effective_date TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(currency, indicator_code, effective_date, source_provider)
);
CREATE INDEX IF NOT EXISTS idx_macro_indicators_ccy ON macroeconomic_indicators(currency, indicator_code);

CREATE TABLE IF NOT EXISTS analysis_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_analysis_config_user ON analysis_configurations(user_id);

CREATE TABLE IF NOT EXISTS analysis_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  htf_timeframe TEXT NOT NULL,
  ltf_timeframe TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'WORKSPACE_SNAPSHOT',
  current_price REAL,
  price_timestamp TEXT,
  active_session TEXT,
  directional_bias TEXT DEFAULT 'NEUTRAL',
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
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_symbol ON analysis_reports(user_id, symbol, created_at);

CREATE TABLE IF NOT EXISTS trade_analysis_enrichments (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL UNIQUE REFERENCES reconstructed_positions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  entry_timeframe TEXT DEFAULT 'M15',
  htf_timeframe TEXT DEFAULT 'H4',
  analysis_status TEXT NOT NULL DEFAULT 'COMPLETE',
  market_regime_at_entry TEXT,
  htf_structure_at_entry TEXT,
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
CREATE INDEX IF NOT EXISTS idx_trade_enrichments_user ON trade_analysis_enrichments(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_trade_enrichments_position ON trade_analysis_enrichments(position_id);

CREATE TABLE IF NOT EXISTS backtest_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_backtest_runs_user ON backtest_runs(user_id, created_at);

CREATE TABLE IF NOT EXISTS trade_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'WATCHING',
  alert_enabled INTEGER NOT NULL DEFAULT 1,
  alert_triggered_at TEXT,
  alert_delivery_status TEXT DEFAULT 'PENDING',
  linked_report_id TEXT,
  linked_position_id TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trade_plans_user_status ON trade_plans(user_id, status, symbol);

CREATE TABLE IF NOT EXISTS scanner_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL,
  symbols_json TEXT NOT NULL,
  timeframes_json TEXT NOT NULL,
  hits_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scanner_history_user ON scanner_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS monte_carlo_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT,
  symbol TEXT NOT NULL,
  replays INTEGER NOT NULL DEFAULT 10000,
  seed INTEGER NOT NULL DEFAULT 19,
  odds_json TEXT NOT NULL,
  verdict TEXT NOT NULL,
  chart_bands_json TEXT NOT NULL,
  histogram_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_monte_carlo_user ON monte_carlo_runs(user_id, created_at);

CREATE TABLE IF NOT EXISTS broker_order_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  order_fingerprint TEXT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'MARKET',
  requested_price REAL NOT NULL,
  stop_loss_price REAL NOT NULL,
  take_profit_price REAL NOT NULL,
  lot_size REAL NOT NULL,
  max_loss_currency REAL NOT NULL,
  account_currency TEXT NOT NULL DEFAULT 'USD',
  reward_to_risk_ratio REAL NOT NULL,
  execution_mode TEXT NOT NULL DEFAULT 'PAPER',
  approval_state TEXT NOT NULL DEFAULT 'AWAITING_APPROVAL',
  user_approved_at TEXT,
  user_approval_reply TEXT,
  rejection_reason TEXT,
  mt5_deal_ticket TEXT,
  mt5_order_ticket TEXT,
  fill_price REAL,
  filled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_broker_orders_user ON broker_order_tickets(user_id, approval_state);
CREATE INDEX IF NOT EXISTS idx_broker_orders_idempotency ON broker_order_tickets(idempotency_key);
`;

