-- =============================================================================
-- Arcade Fx - User Settings RLS Isolation Verification Test
-- File: supabase/tests/user_settings_rls.test.sql
-- Description: Tests multi-tenant isolation, anonymous denial, and service role bypass.
-- =============================================================================

BEGIN;

-- Setup Test Users in auth.users
INSERT INTO auth.users (id, email)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user_a@arcadefx.test'),
  ('22222222-2222-2222-2222-222222222222', 'user_b@arcadefx.test')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- TEST 1: Anonymous User Isolation
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';
SET LOCAL "request.jwt.claim.sub" = '';

-- Anonymous should not see any rows
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.user_settings;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Anonymous user read % rows', v_count;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 2: User A Isolation & Insertion
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.user_settings (user_id, settings_json)
VALUES ('11111111-1111-1111-1111-111111111111', '{"theme": "dark", "sound": true}'::jsonb);

-- User A can read their own settings
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count 
  FROM public.user_settings 
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: User A cannot read their own settings';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 3: User B Cannot Read User A's Settings
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

DO $$
DECLARE
  v_count int;
BEGIN
  -- Should return 0 rows for User B
  SELECT count(*) INTO v_count 
  FROM public.user_settings 
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: User B was able to read User A settings!';
  END IF;
END $$;

-- User B cannot update User A's row
UPDATE public.user_settings 
SET settings_json = '{"hacked": true}'::jsonb 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Verify User A's data was NOT changed
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
  v_theme text;
BEGIN
  SELECT settings_json->>'theme' INTO v_theme 
  FROM public.user_settings 
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  IF v_theme <> 'dark' THEN
    RAISE EXCEPTION 'TEST 3 FAILED: User A settings was illegally updated by User B';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 4: Service Role Bypass
-- -----------------------------------------------------------------------------
SET LOCAL ROLE service_role;
SET LOCAL "request.jwt.claim.role" = 'service_role';
SET LOCAL "request.jwt.claim.sub" = '';

DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.user_settings;
  IF v_count < 1 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Service role cannot see settings rows';
  END IF;
END $$;

-- Rollback transaction to leave database clean
ROLLBACK;
