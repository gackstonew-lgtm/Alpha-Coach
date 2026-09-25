import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rmnudqejyrrklltodiaf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8';

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
