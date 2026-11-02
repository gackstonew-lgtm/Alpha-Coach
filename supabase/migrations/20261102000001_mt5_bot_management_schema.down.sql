-- =============================================================================
-- Migration Rollback: 20261102000001_mt5_bot_management_schema.down.sql
-- =============================================================================

DROP TABLE IF EXISTS user_2fa CASCADE;
DROP TABLE IF EXISTS tos_acceptances CASCADE;
DROP TABLE IF EXISTS risk_limits_local_snapshot CASCADE;
DROP TABLE IF EXISTS bot_configs CASCADE;
DROP TABLE IF EXISTS bot_events CASCADE;
DROP TABLE IF EXISTS bot_commands CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS bot_instances CASCADE;
DROP TABLE IF EXISTS entitlements CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
