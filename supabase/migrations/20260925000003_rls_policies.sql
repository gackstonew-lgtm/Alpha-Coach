-- =============================================================================
-- Alpha Coach - Supabase Row Level Security (RLS) Policies Migration
-- Migration: 20260925000003_rls_policies.sql
-- =============================================================================

-- Enable Row Level Security on all application tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconstructed_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper Function to Check if Current Request is Service Role or Admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_service_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claim.role', true) = 'service_role'
    OR auth.role() = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 1. Users Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id OR is_service_or_admin());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = id OR is_service_or_admin());

CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2. User Profiles Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own user_profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can manage own user_profile"
  ON public.user_profiles FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 3. Trading Accounts Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own trading accounts"
  ON public.trading_accounts FOR SELECT
  USING (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can manage own trading accounts"
  ON public.trading_accounts FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 4. Bridge Devices Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own bridge devices"
  ON public.bridge_devices FOR SELECT
  USING (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can manage own bridge devices"
  ON public.bridge_devices FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 5. Raw Orders Policies (Bound via account_id -> trading_accounts.user_id)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own raw orders"
  ON public.raw_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.raw_orders.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

CREATE POLICY "Service and owners can insert raw orders"
  ON public.raw_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.raw_orders.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

-- -----------------------------------------------------------------------------
-- 6. Raw Deals Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own raw deals"
  ON public.raw_deals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.raw_deals.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

CREATE POLICY "Service and owners can insert raw deals"
  ON public.raw_deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.raw_deals.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

-- -----------------------------------------------------------------------------
-- 7. Reconstructed Positions Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own reconstructed positions"
  ON public.reconstructed_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.reconstructed_positions.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

CREATE POLICY "Service and owners can manage reconstructed positions"
  ON public.reconstructed_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.reconstructed_positions.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts
      WHERE public.trading_accounts.id = public.reconstructed_positions.account_id
      AND public.trading_accounts.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

-- -----------------------------------------------------------------------------
-- 8. Position Executions Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view position executions"
  ON public.position_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reconstructed_positions p
      JOIN public.trading_accounts a ON a.id = p.account_id
      WHERE p.id = public.position_executions.position_id
      AND a.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

CREATE POLICY "Service and owners can manage position executions"
  ON public.position_executions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reconstructed_positions p
      JOIN public.trading_accounts a ON a.id = p.account_id
      WHERE p.id = public.position_executions.position_id
      AND a.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reconstructed_positions p
      JOIN public.trading_accounts a ON a.id = p.account_id
      WHERE p.id = public.position_executions.position_id
      AND a.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

-- -----------------------------------------------------------------------------
-- 9. Strategies Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own strategies"
  ON public.strategies FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 10. Mistake Tags Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view system tags and own mistake tags"
  ON public.mistake_tags FOR SELECT
  USING (user_id = 'SYSTEM' OR auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can manage own mistake tags"
  ON public.mistake_tags FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 11. Trade Journals Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own trade journals"
  ON public.trade_journals FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 12. Trade Screenshots Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own trade screenshots"
  ON public.trade_screenshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trade_journals j
      WHERE j.id = public.trade_screenshots.journal_id
      AND j.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trade_journals j
      WHERE j.id = public.trade_screenshots.journal_id
      AND j.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

-- -----------------------------------------------------------------------------
-- 13. Risk Rules & Alerts Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own risk rules"
  ON public.risk_rules FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can manage own risk alerts"
  ON public.risk_alerts FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 14. Trader Progression & Achievements Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view and update own progression"
  ON public.trader_progression FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Everyone can view achievements catalog"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view own unlocked achievements"
  ON public.user_achievements FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

-- -----------------------------------------------------------------------------
-- 15. Reports, Economic Events, Sync Checkpoints, Notifications & Audit Logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own reports"
  ON public.reports FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Everyone can view economic events"
  ON public.economic_events FOR SELECT
  USING (true);

CREATE POLICY "Users can view own account sync checkpoints"
  ON public.sync_checkpoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = public.sync_checkpoints.account_id
      AND a.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = public.sync_checkpoints.account_id
      AND a.user_id = auth.uid()::text
    )
    OR is_service_or_admin()
  );

CREATE POLICY "Users can view and manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid()::text = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid()::text = user_id OR is_service_or_admin());
