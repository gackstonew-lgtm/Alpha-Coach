import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, getDatabaseAsync } from '../db/db';
import { User, TraderProgression } from '../models/types';
import { getSupabaseAnon, verifySupabaseToken, verifySupabaseTokenDetailed } from '../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'alpha-coach-super-secure-production-secret-key-2026';

export class AuthService {
  /**
   * Synchronizes and ensures an application user record exists for the canonical Supabase identity.
   * Maps Supabase User UUID directly to users.id.
   * If a legacy account existed with matching email, safely links records without duplication.
   */
  public static async syncSupabaseUser(supabaseUser: {
    id: string;
    email?: string;
    user_metadata?: any;
  }): Promise<Omit<User, 'password_hash'>> {
    const db = await getDatabaseAsync();
    const userId = supabaseUser.id;
    const email = (supabaseUser.email || '').toLowerCase().trim();
    const meta = supabaseUser.user_metadata || {};
    const firstName = meta.first_name || 'Trader';
    const lastName = meta.last_name || 'Alpha';
    const timezone = meta.timezone || 'UTC';
    const currency = meta.currency || 'USD';
    const role = meta.role || 'trader';
    const tier = meta.subscription_tier || 'PRO';

    // 1. Check if user already exists by Supabase UUID
    let existingUser = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);

    if (existingUser) {
      // Update email / metadata if changed
      if (email && (existingUser.email !== email || existingUser.first_name !== firstName)) {
        await db.run(
          `UPDATE users SET email = ?, first_name = ?, last_name = ?, timezone = ?, currency = ?, subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [email, firstName, lastName, timezone, currency, tier, userId]
        );
      }
      const { password_hash, ...safeUser } = (await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]))!;
      return safeUser;
    }

    // 2. Check if a legacy user exists with the exact same email
    if (email) {
      const legacyUser = await db.get<User>('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
      if (legacyUser && legacyUser.id !== userId) {
        // Link all foreign keys from legacyUser.id to new Supabase userId
        const legacyId = legacyUser.id;
        await db.run('UPDATE trading_accounts SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE bridge_devices SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE user_profiles SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE trader_progression SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE strategies SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE audit_logs SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE notifications SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE risk_rules SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE mistake_tags SET user_id = ? WHERE user_id = ?', [userId, legacyId]);
        await db.run('UPDATE users SET id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId, legacyId]);

        const { password_hash, ...safeUser } = (await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]))!;
        return safeUser;
      }
    }

    // 3. Create fresh user record with canonical Supabase UUID
    await db.run(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, timezone, currency, subscription_tier, role, is_active)
       VALUES (?, ?, 'SUPABASE_AUTH', ?, ?, ?, ?, ?, ?, 1)`,
      [userId, email, firstName, lastName, timezone, currency, tier, role]
    );

    // Create user profile
    await db.run(
      `INSERT INTO user_profiles (id, user_id, bio, favorite_pairs, preferred_sessions, max_daily_risk_pct)
       VALUES (?, ?, 'Disciplined Price Action Trader', 'XAUUSD,EURUSD,BTCUSD,NAS100', 'London,New York', 2.0)`,
      [uuidv4(), userId]
    );

    // Create progression
    await db.run(
      `INSERT INTO trader_progression (id, user_id, current_xp, current_level, current_streak_days, longest_streak_days, total_trades_reviewed, rule_compliance_rate)
       VALUES (?, ?, 100, 1, 1, 1, 0, 100.0)`,
      [uuidv4(), userId]
    );

    // Create default strategies
    const defaultStrategies = [
      { name: 'Liquidity Sweep + MSS + FVG', desc: 'ICT/SMC confluence: Sweep of Asian/Session high-low, Market Structure Shift, entry at Fair Value Gap', color: '#3b82f6' },
      { name: 'Order Block Retest', desc: 'Entry at unmitigated institutional order block in line with higher timeframe trend', color: '#10b981' },
      { name: 'Break & Retest', desc: 'Key support/resistance breakout with confirmed retest and rejection wick', color: '#f59e0b' },
      { name: 'London Open Breakout', desc: 'Expansion from Asian consolidation during early Frankfurt/London open', color: '#8b5cf6' }
    ];
    for (const strat of defaultStrategies) {
      await db.run(
        `INSERT INTO strategies (id, user_id, name, description, color_tag) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), userId, strat.name, strat.desc, strat.color]
      );
    }

    const createdUser = (await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]))!;
    const { password_hash, ...safeUser } = createdUser;
    return safeUser;
  }

  /**
   * Cryptographically verifies token against Supabase Auth (or JWT_SECRET for test suites) with detailed failure reporting.
   * Strictly rejects tampered, expired, or unverified tokens (HTTP 401).
   * Never trusts unverified decoded tokens.
   *
   * IMPORTANT: This method uses two separate try/catch blocks:
   * 1. Supabase token verification  → auth failure   → 401 INVALID_AUTH_TOKEN
   * 2. Database user sync           → database error → 503 DB_SYNC_FAILED
   * Keeping them separate prevents a database outage from being reported as
   * "invalid token" (a false 401) which would trigger client-side logout loops.
   */
  public static async verifyTokenDetailed(token: string): Promise<{
    valid: boolean;
    user?: {
      userId: string;
      supabaseUserId: string;
      email: string;
      role: string;
      tier: string;
    };
    failureReason?: string;
  }> {
    if (!token || typeof token !== 'string') {
      return { valid: false, failureReason: 'SUPABASE_TOKEN_MISSING' };
    }

    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) {
      return { valid: false, failureReason: 'SUPABASE_TOKEN_MISSING' };
    }

    // 1. Authoritative verification with Supabase Auth.
    //    This block ONLY handles the network call to Supabase.
    //    Database access is deliberately separated below.
    let supabaseUser: any = null;
    let supabaseFailureReason: string | undefined;

    try {
      const detailed = await verifySupabaseTokenDetailed(cleanToken);
      if (detailed.valid && detailed.user && detailed.user.id) {
        supabaseUser = detailed.user;
      } else if (detailed.failureReason) {
        supabaseFailureReason = detailed.failureReason;
      }
    } catch (err: any) {
      // Network/configuration error contacting Supabase — not a token invalidity
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Auth] Supabase verification exception — treating as SUPABASE_VERIFICATION_FAILED`);
      }
      supabaseFailureReason = 'SUPABASE_VERIFICATION_FAILED';
    }

    // If Supabase confirmed the token is invalid, reject immediately (401).
    // Do NOT proceed to the DB sync or JWT fallback.
    if (!supabaseUser && supabaseFailureReason && process.env.NODE_ENV !== 'test') {
      console.warn(`[Auth] Token verification failed: reason=${supabaseFailureReason}`);
      return { valid: false, failureReason: supabaseFailureReason };
    }

    // 2. If Supabase verified the token, sync the user record to the application DB.
    //    This block ONLY handles the database operation.
    //    A database failure here is NOT an auth failure — it is a service availability issue.
    if (supabaseUser) {
      try {
        const safeUser = await this.syncSupabaseUser(supabaseUser);
        const meta = supabaseUser.user_metadata || {};
        console.warn(`[Auth] Token verified: userId=${safeUser.id} project=rmnudqejyrrklltodiaf`);
        return {
          valid: true,
          user: {
            userId: safeUser.id,
            supabaseUserId: supabaseUser.id,
            email: supabaseUser.email || '',
            role: safeUser.role || (meta.role as string) || 'trader',
            tier: safeUser.subscription_tier || (meta.subscription_tier as string) || 'PRO'
          }
        };
      } catch (dbErr: any) {
        // The token IS valid (Supabase confirmed it), but the application DB is unavailable.
        // Return DB_SYNC_FAILED so the middleware can respond with 503 (not 401).
        // This prevents clients from logging out due to a transient DB connection issue.
        console.error(`[Auth] Database sync failed for verified Supabase user ${supabaseUser.id}: ${dbErr?.message || 'unknown error'}`);
        return { valid: false, failureReason: 'DB_SYNC_FAILED' };
      }
    }

    // 3. Fallback: Verify signature with JWT_SECRET for test suites / internal service tokens.
    //    Only reached when Supabase verification produced no user and no explicit failure reason
    //    (e.g. NODE_ENV=test with no network connection to Supabase).
    try {
      const payload = jwt.verify(cleanToken, JWT_SECRET) as any;
      if (payload && (payload.userId || payload.sub)) {
        const uid = payload.userId || payload.sub;
        return {
          valid: true,
          user: {
            userId: uid,
            supabaseUserId: uid,
            email: payload.email || '',
            role: payload.role || 'trader',
            tier: payload.tier || payload.subscription_tier || 'PRO'
          }
        };
      }
    } catch {
      // JWT signature verification failed
    }

    // NEVER trust decoded tokens. If verification failed, reject token.
    console.warn(`[Auth] Token verification failed: reason=SUPABASE_TOKEN_INVALID`);
    return { valid: false, failureReason: 'SUPABASE_TOKEN_INVALID' };
  }

  /**
   * Cryptographically verifies token against Supabase Auth (or JWT_SECRET for test runners).
   * Strictly rejects tampered, expired, or unverified tokens with null (HTTP 401).
   * Never trusts unverified decoded tokens.
   */
  public static async verifyTokenAsync(token: string): Promise<{
    userId: string;
    supabaseUserId?: string;
    email: string;
    role: string;
    tier: string;
  } | null> {
    const result = await this.verifyTokenDetailed(token);
    return result.valid && result.user ? result.user : null;
  }

  /**
   * Synchronous token verification for backwards compatibility (delegates to JWT verify without decode fallback).
   */
  public static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  /**
   * Generates a signed JWT token (used for testing or service authentication)
   */
  public static generateToken(user: { id: string; email: string; role?: string; subscription_tier?: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || 'trader',
        tier: user.subscription_tier || 'PRO'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  /**
   * Supabase Auth Login proxy for REST clients
   */
  public static async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    return this.loginWithSupabase(email, password);
  }

  public static async loginWithSupabase(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    try {
      const supabase = getSupabaseAnon();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (!error && data.user && data.session) {
        const safeUser = await this.syncSupabaseUser(data.user);
        return { user: safeUser, token: data.session.access_token };
      }
      if (error) {
        throw new Error(error.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'test') {
        const db = await getDatabaseAsync();
        const user = await db.get<User>('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
        if (user) {
          const { password_hash, ...safeUser } = user;
          const token = this.generateToken(safeUser);
          return { user: safeUser, token };
        }
      }
      throw err;
    }

    throw new Error('Invalid email or password.');
  }

  /**
   * Supabase Auth Registration proxy for REST clients
   */
  public static async register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
    currency?: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; token: string | null; session?: any; requiresEmailConfirmation?: boolean }> {
    return this.registerWithSupabase(params);
  }

  public static async registerWithSupabase(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
    currency?: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; token: string | null; session?: any; requiresEmailConfirmation?: boolean }> {
    try {
      const supabase = getSupabaseAnon();
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
            timezone: params.timezone || 'UTC',
            currency: params.currency || 'USD',
            subscription_tier: 'PRO',
            role: 'trader'
          }
        }
      });

      if (!error && data.user) {
        const safeUser = await this.syncSupabaseUser(data.user);
        const token = data.session?.access_token || null;
        return {
          user: safeUser,
          token,
          session: data.session,
          requiresEmailConfirmation: !data.session
        };
      }
    } catch {
      // Offline fallback for unit tests
    }

    if (process.env.NODE_ENV === 'test') {
      const testUser = {
        id: uuidv4(),
        email: params.email.trim(),
        user_metadata: {
          first_name: params.firstName,
          last_name: params.lastName,
          timezone: params.timezone || 'UTC',
          currency: params.currency || 'USD',
          subscription_tier: 'PRO',
          role: 'trader'
        }
      };
      const safeUser = await this.syncSupabaseUser(testUser);
      const token = this.generateToken(safeUser);
      return {
        user: safeUser,
        token,
        session: null,
        requiresEmailConfirmation: false
      };
    }

    throw new Error('Registration failed.');
  }

  public static async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const db = await getDatabaseAsync();
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

