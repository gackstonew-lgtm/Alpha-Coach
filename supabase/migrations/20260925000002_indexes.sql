-- =============================================================================
-- Alpha Coach - Supabase Database Indexing Migration
-- Migration: 20260925000002_indexes.sql
-- =============================================================================

-- Users & Profiles
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Trading Accounts & Bridge Devices
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_account_num ON public.trading_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_bridge_devices_user_id ON public.bridge_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_devices_token ON public.bridge_devices(device_token);

-- Raw MT5 Orders & Deals
CREATE INDEX IF NOT EXISTS idx_raw_orders_account_id ON public.raw_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_raw_orders_time_setup ON public.raw_orders(account_id, time_setup DESC);
CREATE INDEX IF NOT EXISTS idx_raw_deals_account_id ON public.raw_deals(account_id);
CREATE INDEX IF NOT EXISTS idx_raw_deals_position_id ON public.raw_deals(position_id);
CREATE INDEX IF NOT EXISTS idx_raw_deals_account_time ON public.raw_deals(account_id, time DESC);

-- Reconstructed Positions (High-frequency querying)
CREATE INDEX IF NOT EXISTS idx_positions_account_id ON public.reconstructed_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_positions_account_open_time ON public.reconstructed_positions(account_id, open_time DESC);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.reconstructed_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.reconstructed_positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_session_name ON public.reconstructed_positions(session_name);
CREATE INDEX IF NOT EXISTS idx_position_executions_pos_id ON public.position_executions(position_id);

-- Playbooks, Journals & Reviews
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journals_user_id ON public.trade_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journals_pos_id ON public.trade_journals(position_id);
CREATE INDEX IF NOT EXISTS idx_trade_journals_strategy_id ON public.trade_journals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trade_journals_reviewed ON public.trade_journals(user_id, is_reviewed);
CREATE INDEX IF NOT EXISTS idx_trade_screenshots_journal_id ON public.trade_screenshots(journal_id);

-- Risk Management
CREATE INDEX IF NOT EXISTS idx_risk_rules_user_account ON public.risk_rules(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON public.risk_alerts(user_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unacknowledged ON public.risk_alerts(user_id, is_acknowledged);

-- Gamification, Reports & Notifications
CREATE INDEX IF NOT EXISTS idx_trader_progression_user_id ON public.trader_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_type_period ON public.reports(user_id, report_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_economic_events_time ON public.economic_events(event_time);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_account ON public.sync_checkpoints(account_id, started_at DESC);
