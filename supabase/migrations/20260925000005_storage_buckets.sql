-- =============================================================================
-- Alpha Coach - Supabase Storage Buckets & Policies Migration
-- Migration: 20260925000005_storage_buckets.sql
-- =============================================================================

-- 1. Create storage buckets if not already present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('trade-screenshots', 'trade-screenshots', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('voice-audio', 'voice-audio', false, 20971520, ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a']),
  ('reports', 'reports', false, 15728640, ARRAY['application/pdf', 'application/json'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for trade-screenshots (Public read, authenticated upload)
CREATE POLICY "Public Read Trade Screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trade-screenshots');

CREATE POLICY "Authenticated Traders Can Upload Screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trade-screenshots' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

CREATE POLICY "Traders Can Delete Own Screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trade-screenshots'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );

-- 3. Storage Policies for voice-audio (Private to user or service role)
CREATE POLICY "Users Can Access Own Voice Audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-audio'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );

CREATE POLICY "Users Can Upload Own Voice Audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-audio'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );

-- 4. Storage Policies for reports
CREATE POLICY "Users Can Access Own Reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );
