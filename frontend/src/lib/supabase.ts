import { createClient } from '@supabase/supabase-js';

const CANONICAL_SUPABASE_URL = 'https://rmnudqejyrrklltodiaf.supabase.co';
const CANONICAL_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseUrl = (rawUrl && rawUrl.startsWith('https://')) ? rawUrl : CANONICAL_SUPABASE_URL;
export const supabaseKey = (rawKey && (rawKey.startsWith('sb_publishable_') || rawKey.startsWith('eyJ'))) ? rawKey : CANONICAL_SUPABASE_ANON;

// Safety assertion: Ensure client is not initialized with undefined or malformed keys
if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`[Supabase Fatal] Invalid Supabase URL format: ${supabaseUrl}`);
}

if (!supabaseKey || supabaseKey.length < 20) {
  throw new Error('[Supabase Fatal] Missing or truncated Supabase public API key.');
}

/**
 * Returns safe diagnostics for browser Supabase client without revealing secret values.
 */
export function getSupabaseBrowserDiagnostics() {
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const isPublishable = supabaseKey.startsWith('sb_publishable_');
  const isAnonJwt = supabaseKey.startsWith('eyJ');

  return {
    supabaseUrl,
    projectRef,
    browserKeyConfigured: Boolean(supabaseKey),
    browserKeyType: isPublishable ? 'publishable' : (isAnonJwt ? 'anon_jwt' : 'custom'),
    browserKeyLength: supabaseKey.length
  };
}

/**
 * Canonical browser Supabase client.
 * Single instance across the application lifecycle.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'alpha_coach_supabase_auth_token'
  }
});

export default supabase;
