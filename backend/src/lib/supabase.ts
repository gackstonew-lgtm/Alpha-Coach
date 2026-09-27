import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_SUPABASE_URL = 'https://rmnudqejyrrklltodiaf.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM1NDI5NiwiZXhwIjoyMTA1OTMwMjk2fQ.mrJWj1hVYNdSjCGR92WTuAUFLPE1E7wrqAALUkufcso';
const DEFAULT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8';

/**
 * Dynamically resolves the Supabase project URL preferring environment configuration.
 */
export function getSupabaseUrl(): string {
  return (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
}

/**
 * Dynamically resolves the Supabase public/anon key with SUPABASE_ANON_KEY preferred and SUPABASE_PUBLISHABLE_KEY fallback.
 */
export function getSupabaseAnonKey(): string {
  return (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON).trim();
}

/**
 * Dynamically resolves the Supabase service role key for trusted administrative tasks.
 */
export function getSupabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || DEFAULT_SUPABASE_SERVICE_ROLE).trim();
}

let supabaseAdminInstance: SupabaseClient | null = null;
let supabaseAnonInstance: SupabaseClient | null = null;

/**
 * Returns the Supabase Admin client with service_role privileges.
 * Used for server-side trusted operations like MT5 bridge synchronization,
 * batch analytics generation, and system administration.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) not configured in environment variables');
  }

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(url, serviceRoleKey, {
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
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error('Supabase public credentials (SUPABASE_URL or SUPABASE_ANON_KEY) not configured in environment variables');
  }

  if (!supabaseAnonInstance) {
    supabaseAnonInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAnonInstance;
}

/**
 * Creates a fresh, stateless Supabase client specifically for serverless token verification.
 * Disables session persistence and auto-refresh to prevent cross-request session pollution on warm lambdas.
 */
export function createTokenVerificationClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error('Supabase public credentials (SUPABASE_URL or SUPABASE_ANON_KEY) not configured in environment variables');
  }
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Creates an authenticated Supabase client scoped to a specific user's Bearer token.
 * Respects all Supabase Row Level Security (RLS) policies for that user.
 */
export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error('Supabase public credentials (SUPABASE_URL or SUPABASE_ANON_KEY) not configured in environment variables');
  }
  return createClient(url, anonKey, {
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
 * Verifies a Supabase JWT access token using Supabase Auth with detailed failure reporting.
 * Utilizes a fresh stateless verification client for deterministic serverless execution.
 */
export async function verifySupabaseTokenDetailed(token: string): Promise<{
  valid: boolean;
  user?: any;
  failureReason?: string;
}> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { valid: false, failureReason: 'SUPABASE_TOKEN_MISSING' };
  }

  const cleanToken = token.trim();
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return { valid: false, failureReason: 'SUPABASE_CONFIGURATION_ERROR' };
  }

  try {
    const client = createTokenVerificationClient();
    const { data, error } = await client.auth.getUser(cleanToken);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      const status = (error as any).status;
      if (msg.includes('expired') || msg.includes('jwt expired')) {
        return { valid: false, failureReason: 'SUPABASE_TOKEN_EXPIRED' };
      }
      if (msg.includes('issuer') || msg.includes('claim') || msg.includes('audience')) {
        return { valid: false, failureReason: 'SUPABASE_TOKEN_ISSUER_INVALID' };
      }
      if (
        msg.includes('invalid') ||
        msg.includes('malformed') ||
        msg.includes('signature') ||
        msg.includes('bad') ||
        status === 401 ||
        status === 400
      ) {
        return { valid: false, failureReason: 'SUPABASE_TOKEN_INVALID' };
      }
      return { valid: false, failureReason: 'SUPABASE_VERIFICATION_FAILED' };
    }
    if (!data || !data.user) {
      return { valid: false, failureReason: 'SUPABASE_USER_NOT_FOUND' };
    }
    return { valid: true, user: data.user };
  } catch {
    return { valid: false, failureReason: 'SUPABASE_VERIFICATION_FAILED' };
  }
}

/**
 * Verifies a Supabase JWT access token using Supabase Auth.
 */
export async function verifySupabaseToken(token: string) {
  const result = await verifySupabaseTokenDetailed(token);
  return result.valid ? result.user : null;
}

/**
 * Exposes safe diagnostics regarding Supabase environment configuration without exposing secret values.
 */
export function getSupabaseDiagnostics() {
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const serviceRole = getSupabaseServiceRoleKey();

  return {
    supabaseConfigured: Boolean(url && anon),
    supabaseServiceRoleConfigured: Boolean(serviceRole),
    supabaseUrlConfigured: Boolean(url)
  };
}

export default {
  getSupabaseAdmin,
  getSupabaseAnon,
  createTokenVerificationClient,
  getSupabaseUserClient,
  verifySupabaseToken,
  verifySupabaseTokenDetailed,
  getSupabaseDiagnostics,
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey
};

