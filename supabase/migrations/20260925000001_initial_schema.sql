-- =============================================================================
-- Alpha Coach - Supabase PostgreSQL Database Schema Migration
-- Migration: 20260925000001_initial_schema.sql
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Users Table (Core Identity)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL DEFAULT 'Trader',
  last_name TEXT NOT NULL DEFAULT 'Alpha',
  role TEXT NOT NULL DEFAULT 'trader' CHECK (role IN ('trader', 'admin')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  subscription_tier TEXT NOT NULL DEFAULT 'PRO' CHECK (subscription_tier IN ('FREE', 'PRO', 'PREMIUM')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. User Profiles Table (Preferences & Settings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  trading_experience_years NUMERIC(4, 1) DEFAULT 1.0,
  favorite_pairs TEXT DEFAULT 'EURUSD,GBPUSD,XAUUSD,US30,NAS100',
  preferred_sessions TEXT DEFAULT 'London,New York',
  max_daily_risk_pct NUMERIC(5, 2) DEFAULT 2.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. Trading Accounts Table (MT5 Account Bindings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  server_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  equity NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  margin NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  free_margin NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  margin_level NUMERIC(10, 2) DEFAULT 0.0,
  account_type TEXT NOT NULL DEFAULT 'hedging' CHECK (account_type IN ('hedging', 'netting')),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_account_per_user UNIQUE(user_id, account_number, server_name)
);

CREATE TRIGGER set_trading_accounts_updated_at
BEFORE UPDATE ON public.trading_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. Bridge Devices Table (Local MT5 Python Bridge Pairings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bridge_devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Raw Orders Table (MT5 History Orders)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raw_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id TEXT NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type INTEGER NOT NULL,
  state INTEGER NOT NULL,
  volume_initial NUMERIC(12, 4) NOT NULL,
  volume_current NUMERIC(12, 4) NOT NULL,
  price_open NUMERIC(15, 5) NOT NULL,
  price_sl NUMERIC(15, 5) DEFAULT 0.0,
  price_tp NUMERIC(15, 5) DEFAULT 0.0,
  time_setup TIMESTAMPTZ NOT NULL,
  time_done TIMESTAMPTZ,
  time_expiration TIMESTAMPTZ,
  magic INTEGER DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_account_order UNIQUE(account_id, order_id)
);

-- -----------------------------------------------------------------------------
-- 6. Raw Deals Table (MT5 History Deals)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raw_deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id TEXT NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type INTEGER NOT NULL,
  entry INTEGER NOT NULL,
  volume NUMERIC(12, 4) NOT NULL,
  price NUMERIC(15, 5) NOT NULL,
  commission NUMERIC(12, 2) DEFAULT 0.0,
  swap NUMERIC(12, 2) DEFAULT 0.0,
  profit NUMERIC(15, 2) DEFAULT 0.0,
  fee NUMERIC(12, 2) DEFAULT 0.0,
  price_sl NUMERIC(15, 5) DEFAULT 0.0,
  price_tp NUMERIC(15, 5) DEFAULT 0.0,
  time TIMESTAMPTZ NOT NULL,
  magic INTEGER DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_account_deal UNIQUE(account_id, deal_id)
);

-- -----------------------------------------------------------------------------
-- 7. Reconstructed Positions Table (Core Trade Journaling Unit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reconstructed_positions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id TEXT NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('BUY', 'SELL')),
  total_volume NUMERIC(12, 4) NOT NULL,
  entry_price_avg NUMERIC(15, 5) NOT NULL,
  exit_price_avg NUMERIC(15, 5),
  open_time TIMESTAMPTZ NOT NULL,
  close_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  commission_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  swap_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  fee_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  net_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  initial_sl NUMERIC(15, 5),
  initial_tp NUMERIC(15, 5),
  risk_amount NUMERIC(15, 2),
  r_multiple NUMERIC(10, 2),
  holding_seconds INTEGER DEFAULT 0,
  session_name TEXT,
  exit_reason TEXT DEFAULT 'UNKNOWN' CHECK (exit_reason IN ('SL_HIT', 'TP_HIT', 'MANUAL', 'SO_HIT', 'PARTIAL', 'UNKNOWN')),
  is_hedged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_account_position UNIQUE(account_id, position_id)
);

CREATE TRIGGER set_reconstructed_positions_updated_at
BEFORE UPDATE ON public.reconstructed_positions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 8. Position Executions Table (Deal Splits & Multi-Entry Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.position_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  position_id TEXT NOT NULL REFERENCES public.reconstructed_positions(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('ENTRY', 'SCALE_IN', 'PARTIAL_EXIT', 'FINAL_EXIT')),
  volume NUMERIC(12, 4) NOT NULL,
  price NUMERIC(15, 5) NOT NULL,
  profit NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
  commission NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  swap NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  execution_time TIMESTAMPTZ NOT NULL
);

-- -----------------------------------------------------------------------------
-- 9. Strategies Table (Trading Playbooks & Setups)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  color_tag TEXT DEFAULT '#3b82f6',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. Mistake Tags Table (Trading Psychology & Execution Taxonomy)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mistake_tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PSYCHOLOGY', 'EXECUTION', 'RISK', 'STRATEGY')),
  severity TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. Trade Journals Table (Annotated Trade Log, Voice, AI Feedback)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trade_journals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  position_id TEXT UNIQUE NOT NULL REFERENCES public.reconstructed_positions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  setup_name TEXT,
  strategy_id TEXT REFERENCES public.strategies(id) ON DELETE SET NULL,
  confluences TEXT,
  bias TEXT DEFAULT 'NEUTRAL' CHECK (bias IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  entry_trigger TEXT,
  exit_trigger TEXT,
  confidence_score INTEGER DEFAULT 5 CHECK (confidence_score BETWEEN 1 AND 10),
  emotion_state TEXT CHECK (emotion_state IN ('DISCIPLINED', 'FOMO', 'FEARFUL', 'GREEDY', 'ANXIOUS', 'CONFIDENT')),
  mistake_id TEXT REFERENCES public.mistake_tags(id) ON DELETE SET NULL,
  lesson_learned TEXT,
  voice_transcript TEXT,
  trader_notes TEXT,
  ai_feedback TEXT,
  is_reviewed INTEGER NOT NULL DEFAULT 0,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_trade_journals_updated_at
BEFORE UPDATE ON public.trade_journals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 12. Trade Screenshots Table (Multi-Timeframe Chart Proofs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trade_screenshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  journal_id TEXT NOT NULL REFERENCES public.trade_journals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'CHART' CHECK (stage IN ('BEFORE', 'DURING', 'AFTER', 'CHART')),
  image_url TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. Risk Rules Table (Account Guardrails & Stop Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  max_daily_loss_amount NUMERIC(12, 2) DEFAULT 500.0,
  max_daily_loss_pct NUMERIC(5, 2) DEFAULT 2.0,
  max_weekly_loss_amount NUMERIC(12, 2) DEFAULT 1500.0,
  max_trades_per_day INTEGER DEFAULT 5,
  max_risk_per_trade_pct NUMERIC(5, 2) DEFAULT 1.0,
  max_consecutive_losses INTEGER DEFAULT 3,
  max_drawdown_pct NUMERIC(5, 2) DEFAULT 5.0,
  max_position_size NUMERIC(10, 2) DEFAULT 5.0,
  allowed_start_time TEXT DEFAULT '00:00',
  allowed_end_time TEXT DEFAULT '23:59',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_risk_account UNIQUE(user_id, account_id)
);

CREATE TRIGGER set_risk_rules_updated_at
BEFORE UPDATE ON public.risk_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 14. Risk Alerts Table (Real-Time Guardrail Breaches)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message TEXT NOT NULL,
  current_value NUMERIC(15, 2) NOT NULL,
  threshold_value NUMERIC(15, 2) NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_acknowledged INTEGER NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 15. Trader Progression Table (Discipline XP & Leveling Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trader_progression (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  total_trades_reviewed INTEGER NOT NULL DEFAULT 0,
  rule_compliance_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_trader_progression_updated_at
BEFORE UPDATE ON public.trader_progression
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 16. Achievements Table (Gamification Master Catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DISCIPLINE', 'ANALYSIS', 'CONSISTENCY', 'RISK_MANAGEMENT')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  icon TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 17. User Achievements Table (Trader Unlocks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_achievement UNIQUE(user_id, achievement_id)
);

-- -----------------------------------------------------------------------------
-- 18. Reports Table (Performance Briefs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('WEEKLY', 'MONTHLY')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pdf_url TEXT
);

-- -----------------------------------------------------------------------------
-- 19. Economic Events Table (High-Impact Macro Calendar)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economic_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (impact IN ('LOW', 'MEDIUM', 'HIGH')),
  event_time TIMESTAMPTZ NOT NULL,
  forecast TEXT,
  previous TEXT,
  actual TEXT
);

-- -----------------------------------------------------------------------------
-- 20. Sync Checkpoints Table (MT5 Re-Sync Resilience)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_checkpoints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id TEXT NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  last_deal_id TEXT,
  last_deal_time TIMESTAMPTZ,
  last_order_id TEXT,
  last_order_time TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  deals_count INTEGER NOT NULL DEFAULT 0,
  positions_count INTEGER NOT NULL DEFAULT 0,
  trades_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- -----------------------------------------------------------------------------
-- 21. Audit Logs Table (Security & Traceability)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  account_id TEXT REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 22. Notifications Table (Live In-App Alert Feed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('SYNC', 'RISK', 'REVIEW', 'REPORT', 'SYSTEM')),
  is_read INTEGER NOT NULL DEFAULT 0,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
