import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('https://')) {
  throw new Error(
    'Supabase Configuration Error: VITE_SUPABASE_URL is missing or invalid. Please check your environment variables.'
  );
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
  throw new Error(
    'Supabase Configuration Error: VITE_SUPABASE_PUBLISHABLE_KEY is missing. Please check your environment variables.'
  );
}

/**
 * Public client for browser frontend interactions with Supabase.
 * Strictly uses the Publishable / Anon key to guarantee security.
 * Row-Level-Security (RLS) protects all database operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'alpha_coach_supabase_auth_token'
  }
});

export default supabase;
