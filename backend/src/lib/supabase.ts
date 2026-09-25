import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rmnudqejyrrklltodiaf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM1NDI5NiwiZXhwIjoyMTA1OTMwMjk2fQ.mrJWj1hVYNdSjCGR92WTuAUFLPE1E7wrqAALUkufcso';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8';

let supabaseAdminInstance: SupabaseClient | null = null;
let supabaseAnonInstance: SupabaseClient | null = null;

/**
 * Returns the Supabase Admin client with service_role privileges.
 * Used for server-side trusted operations like MT5 bridge synchronization,
 * batch analytics generation, and system administration.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured in environment variables');
    }
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

/**
 * Returns the Supabase Anonymous/Public client.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnonInstance) {
    supabaseAnonInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });
  }
  return supabaseAnonInstance;
}

/**
 * Creates an authenticated Supabase client scoped to a specific user's Bearer token.
 * Respects all Supabase Row Level Security (RLS) policies for that user.
 */
export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Validates a Supabase JWT and retrieves user details from Supabase Auth.
 */
export async function verifySupabaseToken(accessToken: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY };
