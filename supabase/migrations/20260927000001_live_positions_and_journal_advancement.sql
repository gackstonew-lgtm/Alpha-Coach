-- Alpha Coach: MT5 Live Positions & Authoritative Journal Advancement Migration

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
  time_msc BIGINT,
  time_update TEXT,
  time_update_msc BIGINT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, position_id)
);

-- Index for high performance open position queries
CREATE INDEX IF NOT EXISTS idx_raw_open_positions_account_active ON raw_open_positions(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_raw_open_positions_symbol ON raw_open_positions(symbol);

-- Add live price and metadata columns to reconstructed_positions if not existing
ALTER TABLE reconstructed_positions ADD COLUMN IF NOT EXISTS current_price REAL;
ALTER TABLE reconstructed_positions ADD COLUMN IF NOT EXISTS floating_profit REAL DEFAULT 0.0;
ALTER TABLE reconstructed_positions ADD COLUMN IF NOT EXISTS magic INTEGER DEFAULT 0;
ALTER TABLE reconstructed_positions ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE reconstructed_positions ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add index for date filtering and status lookups
CREATE INDEX IF NOT EXISTS idx_positions_account_status_open ON reconstructed_positions(account_id, status, open_time);
CREATE INDEX IF NOT EXISTS idx_positions_open_time ON reconstructed_positions(open_time);
CREATE INDEX IF NOT EXISTS idx_positions_close_time ON reconstructed_positions(close_time);
