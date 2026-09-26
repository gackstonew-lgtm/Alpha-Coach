-- =============================================================================
-- Alpha Coach - Supabase Migration: MT5 Bridge Authorization & Token Security
-- Migration: 20260926_mt5_bridge_authorization.sql
-- =============================================================================

-- 1. Ensure token_hash column exists on bridge_devices for cryptographic token hashing
ALTER TABLE IF EXISTS public.bridge_devices 
  ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- 2. Indexes for high-performance device token validation and session polling
CREATE INDEX IF NOT EXISTS idx_bridge_devices_token ON public.bridge_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_bridge_devices_token_hash ON public.bridge_devices(token_hash);
CREATE INDEX IF NOT EXISTS idx_bridge_devices_user ON public.bridge_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_devices_active ON public.bridge_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_code ON public.bridge_pairing_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_status ON public.bridge_pairing_sessions(status);

-- 3. Atomic pairing token consumption function to prevent race conditions
CREATE OR REPLACE FUNCTION public.consume_pairing_session(p_session_code TEXT)
RETURNS TABLE (
  status TEXT,
  device_token TEXT,
  device_name TEXT,
  user_id TEXT
) AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Lock the row for update
  SELECT s.id, s.status, s.device_token, s.device_name, s.user_id, s.expires_at
  INTO v_session
  FROM public.bridge_pairing_sessions s
  WHERE s.session_code = p_session_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'NOT_FOUND'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_session.expires_at < CURRENT_TIMESTAMP AND v_session.status = 'PENDING' THEN
    UPDATE public.bridge_pairing_sessions
    SET status = 'EXPIRED'
    WHERE session_code = p_session_code;
    
    RETURN QUERY SELECT 'EXPIRED'::TEXT, NULL::TEXT, v_session.device_name, NULL::TEXT;
    RETURN;
  END IF;

  IF v_session.status = 'AUTHORIZED' AND v_session.device_token IS NOT NULL THEN
    -- Atomically transition to COMPLETED and clear the token from the session table
    UPDATE public.bridge_pairing_sessions
    SET status = 'COMPLETED',
        device_token = NULL
    WHERE session_code = p_session_code;

    RETURN QUERY SELECT 'AUTHORIZED'::TEXT, v_session.device_token, v_session.device_name, v_session.user_id;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_session.status::TEXT, NULL::TEXT, v_session.device_name, v_session.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
