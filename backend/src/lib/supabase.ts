import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// SECURITY NOTE (rotation required):
// This file previously contained hardcoded literal fallback values for the Supabase project
// URL, the public anon key, AND the service-role key. Because this repository is public, the
// service-role key must be treated as compromised. It has been removed from source entirely —
// there is no source-level fallback for it anymore. The application now fails closed
// (throws a clear configuration error) if SUPABASE_SERVICE_ROLE_KEY is not present in the
// environment, instead of silently falling back to a hardcoded, publicly-exposed credential.
//
// ACTION REQUIRED IN SUPABASE DASHBOARD (not performed automatically to avoid disrupting
// production without confirmation):
//   1. Rotate/regenerate the service-role (secret) API key for this project.
//   2. Set the new value as SUPABASE_SERVICE_ROLE_KEY in the Vercel production environment
//      variables (and any other deployment environment) — never in source code.
//   3. Redeploy so the running backend picks up the rotated key.
//
// The project URL and anon/public key are not secrets by design (the anon key is meant to be
// shipped to the browser and is protected by Row Level Security), so a non-secret default is
// kept only for local-developer convenience; it can still be overridden by environment
// variables in every environment, including production.
const DEFAULT_SUPABASE_URL = 'https://rmnudqejyrrklltodiaf.supabase.co';
const DEFAULT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8';

/**
 * Dynamically resolves the Supabase project URL preferring environment configuration.
 */
export function getSupabaseUrl(): string {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
}

/**
 * Dynamically resolves the Supabase public/anon key with SUPABASE_ANON_KEY preferred and SUPABASE_PUBLISHABLE_KEY fallback.
 * The anon key is a public, RLS-protected credential — not a secret — so a non-secret default
 * is acceptable here purely for local-developer convenience.
 */
export function getSupabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON
  ).trim();
}

/**
 * Resolves the Supabase service-role key EXCLUSIVELY from environment variables.
 * There is intentionally no hardcoded fallback: a service-role key grants full administrative
 * access bypassing Row Level Security, so it must never live in source control. Returns an
 * empty string if not configured — callers must treat that as "not configured" and fail
 * closed (see getSupabaseAdmin below), never fall back to a bundled default.
 */
export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();
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

      // IMPORTANT: check for backend-configuration-shaped errors BEFORE the generic
      // "invalid" catch-all below. If the backend's own SUPABASE_ANON_KEY is wrong, stale,
      // rotated, or simply pointed at the wrong Supabase project, Supabase's Auth API responds
      // with something like "Invalid API key" or "Project not found" — NOT because the user's
      // token is bad, but because the request itself was rejected before the token was even
      // evaluated. Generic string matching below would otherwise classify this as
      // SUPABASE_TOKEN_INVALID (a definitive 401), which sends every single request — for
      // every user, regardless of how fresh their session is — into a permanent
      // authorize→401→login→authorize loop that no amount of re-authentication can ever fix,
      // because the frontend's token was never the problem.
      if (
        msg.includes('api key') ||
        msg.includes('apikey') ||
        msg.includes('no api key') ||
        msg.includes('project not found') ||
        msg.includes('unable to find project') ||
        msg.includes('unauthorized to access project')
      ) {
        console.error(`[Supabase] Backend rejected by Supabase Auth API — check SUPABASE_URL / SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY) in this deployment's environment variables. Raw error: ${error.message}`);
        return { valid: false, failureReason: 'SUPABASE_CONFIGURATION_ERROR' };
      }
      if (msg.includes('expired') || msg.includes('jwt expired')) {
        return { valid: false, failureReason: 'SUPABASE_TOKEN_EXPIRED' };
      }
      if (msg.includes('issuer') || msg.includes('claim') || msg.includes('audience')) {
        // The presented token was issued by a DIFFERENT Supabase project than the one this
        // backend is configured to verify against. Logging the user out and back in will
        // never fix this — it's a deployment configuration mismatch, not a bad credential —
        // so this is intentionally NOT bucketed as a definitive 401 either.
        console.error('[Supabase] Token issuer/audience mismatch — the frontend and backend are configured against DIFFERENT Supabase projects. Verify SUPABASE_URL matches VITE_SUPABASE_URL in this deployment.');
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

