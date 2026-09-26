-- =============================================================================
-- Alpha Coach - Supabase Bridge Pairing Sessions Migration
-- Migration: 20260925000006_bridge_pairing_sessions.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bridge_pairing_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_code TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'REJECTED', 'EXPIRED', 'COMPLETED')),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  device_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_pairing_sessions_code ON public.bridge_pairing_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_user ON public.bridge_pairing_sessions(user_id);

-- Enable RLS
ALTER TABLE public.bridge_pairing_sessions ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public can create and check pairing sessions by session_code
CREATE POLICY "Public can create pairing sessions"
  ON public.bridge_pairing_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view pending pairing session by code"
  ON public.bridge_pairing_sessions FOR SELECT
  USING (true);

-- Authenticated user can authorize/update pairing sessions
CREATE POLICY "Users can authorize own pairing session"
  ON public.bridge_pairing_sessions FOR UPDATE
  USING (auth.uid()::text = user_id OR status = 'PENDING' OR is_service_or_admin())
  WITH CHECK (auth.uid()::text = user_id OR is_service_or_admin());
