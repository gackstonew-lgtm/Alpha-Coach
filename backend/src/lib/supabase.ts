import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

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
      throw new Error('Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) not configured in environment variables');
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase public credentials (SUPABASE_URL or SUPABASE_ANON_KEY) not configured in environment variables');
    }
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase public credentials (SUPABASE_URL or SUPABASE_ANON_KEY) not configured in environment variables');
  }
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
 * Verifies a Supabase JWT access token using Supabase Auth.
 */
export async function verifySupabaseToken(token: string) {
  try {
    const supabase = getSupabaseAnon();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default {
  getSupabaseAdmin,
  getSupabaseAnon,
  getSupabaseUserClient,
  verifySupabaseToken
};
