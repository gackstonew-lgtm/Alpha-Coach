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
`;
