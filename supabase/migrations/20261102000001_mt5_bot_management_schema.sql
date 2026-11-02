-- =============================================================================
-- Migration: 20261102000001_mt5_bot_management_schema.sql
-- Description: MT5 Bot Management, Subscriptions, Entitlements, Commands,
--              Telemetry, Security & Auditing Schema
-- =============================================================================

-- 1. Subscription Plans Catalog
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_annual_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  max_instances INTEGER NOT NULL DEFAULT 1,
  max_accounts INTEGER NOT NULL DEFAULT 1,
  features_json JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  billing_provider TEXT NOT NULL DEFAULT 'manual' CHECK (billing_provider IN ('stripe', 'manual', 'mpesa', 'paystack')),
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 3. Computed / Cached Feature Entitlements
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  max_instances INTEGER NOT NULL DEFAULT 1,
  max_accounts INTEGER NOT NULL DEFAULT 1,
  can_trade BOOLEAN NOT NULL DEFAULT FALSE,
  features_json JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);

-- 4. Bot Instances (MT5-OO1 Runners)
CREATE TABLE IF NOT EXISTS bot_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
  instance_name TEXT NOT NULL,
  device_token_hash TEXT,
  mode TEXT NOT NULL DEFAULT 'DEMO' CHECK (mode IN ('DEMO', 'LIVE', 'PROP')),
  status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'STALE')),
  engine_version TEXT NOT NULL DEFAULT '1.0.0',
  symbol_set JSONB NOT NULL DEFAULT '["EURUSD"]',
  last_heartbeat_at TIMESTAMPTZ,
  last_error TEXT,
  uptime_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_instances_user ON bot_instances(user_id);

-- 5. Rotating Hashed Device Tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES bot_instances(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  rotated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_hash ON device_tokens(token_hash);

-- 6. Signed Safe Bot Commands (Cloud to Agent)
CREATE TABLE IF NOT EXISTS bot_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL CHECK (command_type IN ('start', 'stop', 'pause', 'resume', 'close_all', 'kill_switch', 'update_config')),
  payload_json JSONB NOT NULL DEFAULT '{}',
  signature TEXT NOT NULL,
  nonce TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'DELIVERED', 'EXECUTED', 'FAILED')),
  executed_at TIMESTAMPTZ,
  result_json JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes'
);
CREATE INDEX IF NOT EXISTS idx_bot_commands_instance_status ON bot_commands(instance_id, status);

-- 7. Bot Events & Telemetry Stream
CREATE TABLE IF NOT EXISTS bot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}',
  dedup_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_events_instance_created ON bot_events(instance_id, created_at DESC);

-- 8. Safe Configuration Profiles with Versioning
CREATE TABLE IF NOT EXISTS bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  symbols_enabled JSONB NOT NULL DEFAULT '["EURUSD"]',
  session_filters JSONB NOT NULL DEFAULT '{"london": true, "new_york": true, "asian": false}',
  risk_percent NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  max_trades_per_day INTEGER NOT NULL DEFAULT 5,
  notifications_json JSONB NOT NULL DEFAULT '{"telegram": false, "email": true}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rollback_from_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, version)
);
CREATE INDEX IF NOT EXISTS idx_bot_configs_instance ON bot_configs(instance_id);

-- 9. Local Machine Hard Risk Limits Snapshot
CREATE TABLE IF NOT EXISTS risk_limits_local_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  max_risk_pct_ceiling NUMERIC(4, 2) NOT NULL,
  max_lots_ceiling NUMERIC(6, 2) NOT NULL,
  max_drawdown_pct_ceiling NUMERIC(4, 2) NOT NULL,
  live_trading_allowed_locally BOOLEAN NOT NULL DEFAULT FALSE,
  snapshot_hash TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id)
);

-- 10. Terms of Service & Risk Disclosure Versioned Acceptances
CREATE TABLE IF NOT EXISTS tos_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tos_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  risk_disclosure_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tos_version)
);
CREATE INDEX IF NOT EXISTS idx_tos_acceptances_user ON tos_acceptances(user_id);

-- 11. Optional TOTP Two-Factor Authentication
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  backup_codes_hash JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 12. Row Level Security Policies (RLS)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_limits_local_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE tos_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all authenticated users
CREATE POLICY "Plans readable by authenticated users" ON plans
  FOR SELECT TO authenticated USING (TRUE);

-- Subscriptions: users view own subscriptions
CREATE POLICY "Users read own subscriptions" ON subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Entitlements: users read own entitlements
CREATE POLICY "Users read own entitlements" ON entitlements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Bot Instances: users manage own instances
CREATE POLICY "Users CRUD own bot instances" ON bot_instances
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Device Tokens: users manage own device tokens
CREATE POLICY "Users CRUD own device tokens" ON device_tokens
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Bot Commands: users manage own commands
CREATE POLICY "Users CRUD own bot commands" ON bot_commands
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Bot Events: users read own bot events
CREATE POLICY "Users read own bot events" ON bot_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Bot Configs: users manage own configs
CREATE POLICY "Users CRUD own bot configs" ON bot_configs
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Risk Limits Snapshot: users read own snapshots
CREATE POLICY "Users read own risk snapshots" ON risk_limits_local_snapshot
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- TOS Acceptances: users read and insert own acceptances
CREATE POLICY "Users read own tos acceptances" ON tos_acceptances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tos acceptances" ON tos_acceptances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2FA: users manage own 2fa
CREATE POLICY "Users manage own 2fa" ON user_2fa
  FOR ALL TO authenticated USING (auth.uid() = user_id);
