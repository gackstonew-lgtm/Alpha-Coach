-- =============================================================================
-- Alpha Coach - Supabase Auth Integration & Automated Profile Triggers
-- Migration: 20260925000004_auth_triggers.sql
-- =============================================================================

-- Function to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract names from metadata if available
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Trader');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Alpha');

  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, timezone, currency, subscription_tier, is_active)
  VALUES (
    NEW.id::text,
    NEW.email,
    '',
    v_first_name,
    v_last_name,
    COALESCE(NEW.raw_user_meta_data->>'role', 'trader'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'PRO'),
    1
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = CURRENT_TIMESTAMP;

  -- 2. Create User Profile
  INSERT INTO public.user_profiles (id, user_id, bio, favorite_pairs, preferred_sessions, max_daily_risk_pct)
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    'Alpha Coach Trader',
    'EURUSD,GBPUSD,XAUUSD,US30,NAS100',
    'London,New York',
    2.0
  )
  ON CONFLICT DO NOTHING;

  -- 3. Initialize Trader Progression
  INSERT INTO public.trader_progression (id, user_id, current_xp, current_level, current_streak_days, longest_streak_days, total_trades_reviewed, rule_compliance_rate)
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    0,
    1,
    0,
    0,
    0,
    100.0
  )
  ON CONFLICT DO NOTHING;

  -- 4. Initialize Default Risk Rules
  INSERT INTO public.risk_rules (id, user_id, max_daily_loss_amount, max_daily_loss_pct, max_weekly_loss_amount, max_trades_per_day, max_risk_per_trade_pct, max_consecutive_losses, max_drawdown_pct, max_position_size, is_active)
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    500.0,
    2.0,
    1500.0,
    5,
    1.0,
    3,
    5.0,
    5.0,
    1
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute upon new signup in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
