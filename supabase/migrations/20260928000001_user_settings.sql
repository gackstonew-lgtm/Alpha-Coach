-- =============================================================================
-- Arcade Fx - User Settings Table & RLS Policies (Idempotent & Type-Safe)
-- Migration: 20260928000001_user_settings.sql
-- =============================================================================

-- 1. Ensure Service/Admin Role Helper Exists with Hardened search_path
CREATE OR REPLACE FUNCTION public.is_service_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claim.role', true) = 'service_role'
    OR auth.role() = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Guarded Data Migration for Pre-Existing Tables with TEXT user_id
DO $$
DECLARE
  v_col_type text;
  v_invalid_count integer;
BEGIN
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'user_id';

  IF v_col_type = 'text' OR v_col_type = 'character varying' THEN
    -- Check for non-UUID strings
    SELECT count(*) INTO v_invalid_count
    FROM public.user_settings
    WHERE user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    IF v_invalid_count > 0 THEN
      RAISE EXCEPTION 'Aborting: Found % row(s) in public.user_settings with invalid UUID string in user_id', v_invalid_count;
    END IF;

    -- Drop existing foreign key or unique constraints if present
    ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_key;
    ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

    -- Alter column type safely from text to uuid
    ALTER TABLE public.user_settings
      ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

    -- Re-add constraints
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);

    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Indexes for fast retrieval by user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 5. Enable Row-Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if present
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

-- 7. Type-Safe Subquery-Optimized RLS Policies (UUID = UUID)
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR is_service_or_admin());

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR is_service_or_admin());

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR is_service_or_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR is_service_or_admin());

CREATE POLICY "Users can delete their own settings"
  ON public.user_settings FOR DELETE
  USING (user_id = (SELECT auth.uid()) OR is_service_or_admin());

-- 8. Shared Updated At Trigger
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
