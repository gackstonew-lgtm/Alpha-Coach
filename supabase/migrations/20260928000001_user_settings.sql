-- =============================================================================
-- Meta Coach - User Settings Table & RLS Policies Migration
-- Migration: 20260928000001_user_settings.sql
-- =============================================================================

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast retrieval by user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 3. Enable Row-Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id OR is_service_or_admin());

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_service_or_admin());

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id OR is_service_or_admin())
  WITH CHECK (auth.uid() = user_id OR is_service_or_admin());

CREATE POLICY "Users can delete their own settings"
  ON public.user_settings
  FOR DELETE
  USING (auth.uid() = user_id OR is_service_or_admin());
