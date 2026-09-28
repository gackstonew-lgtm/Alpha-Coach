import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseAsync, IDatabase } from '../db/db';

export class BridgePairingError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BridgePairingError';
    this.code = code;
    Object.setPrototypeOf(this, BridgePairingError.prototype);
  }
}

export interface BridgePairingSession {
  id: string;
  session_code: string;
  device_name: string;
  ip_address?: string;
  status: 'PENDING' | 'AUTHORIZED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';
  user_id?: string;
  device_token?: string;
  created_at: string;
  expires_at: string;
}

export interface DeviceAuthCheckResult {
  authorized: boolean;
  status: 'ACTIVE' | 'INVALID' | 'REVOKED' | 'EXPIRED';
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  serverTime: string;
  error?: {
    code: string;
    message: string;
  };
}

export class BridgeService {
  private static getHmacSecret(): string {
    return process.env.BRIDGE_TOKEN_HMAC_SECRET || process.env.JWT_SECRET || 'alpha-coach-hmac-salt-production-2026';
  }

  /**
   * Generates an HMAC-SHA256 hash of the device token for secure backend persistence
   */
  public static hashToken(token: string): string {
    return crypto.createHmac('sha256', this.getHmacSecret()).update(token).digest('hex');
  }

  /**
   * Generates a legacy SHA-256 hash for backward compatibility with existing stored device tokens
   */
  public static legacyHashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Constant-time string/digest comparison to protect against timing attacks
   */
  public static constantTimeCompare(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  }

  /**
   * Generates a secure device token and stores both hash and token for the MT5 Local Bridge
   */
  public static async registerDevice(userId: string, deviceName: string, ipAddress?: string): Promise<{ deviceId: string; deviceToken: string }> {
    const db = await getDatabaseAsync();
    const deviceId = uuidv4();
    const rawToken = 'ac_bridge_' + crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await db.run(
      `INSERT INTO bridge_devices (id, user_id, device_name, device_token, token_hash, ip_address, is_active, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [deviceId, userId, deviceName, rawToken, tokenHash, ipAddress || null]
    );

    await db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address, details_json)
       VALUES (?, ?, 'BRIDGE_DEVICE_PAIRED', 'bridge_device', ?, ?, ?)`,
      [uuidv4(), userId, deviceId, ipAddress || null, JSON.stringify({ deviceName, deviceId })]
    );

    // Synchronize to cloud database if available
    try {
      const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
      const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
        ? getSupabaseAdmin()
        : getSupabaseAnon();
      if (supabase) {
        await supabase.from('bridge_devices').upsert({
          id: deviceId,
          user_id: userId,
          device_name: deviceName,
          device_token: rawToken,
          token_hash: tokenHash,
          ip_address: ipAddress || null,
          is_active: 1
        }, { onConflict: 'id' });
      }
    } catch (supaErr) {
      // Non-fatal fallback
    }

    return { deviceId, deviceToken: rawToken };
  }

  /**
   * Dedicated device authentication verification check
   */
  public static async checkDeviceAuth(deviceToken: string): Promise<DeviceAuthCheckResult> {
    const serverTime = new Date().toISOString();
    if (!deviceToken || typeof deviceToken !== 'string' || !deviceToken.trim()) {
      return {
        authorized: false,
        status: 'INVALID',
        serverTime,
        error: {
          code: 'INVALID_BRIDGE_TOKEN',
          message: 'Device authorization token is empty or missing.'
        }
      };
    }

    const trimmedToken = deviceToken.trim();
    const hmacHash = this.hashToken(trimmedToken);
    const legacyHash = this.legacyHashToken(trimmedToken);

    let db: IDatabase | undefined;
    let device: { id: string; user_id: string; device_name: string; is_active: number; token_hash?: string; device_token?: string } | undefined;

    try {
      db = await getDatabaseAsync();
      // Check by token_hash (HMAC or legacy) or raw token
      device = await db.get<{ id: string; user_id: string; device_name: string; is_active: number; token_hash?: string; device_token?: string }>(
        `SELECT id, user_id, device_name, is_active, token_hash, device_token FROM bridge_devices WHERE token_hash IN (?, ?) OR device_token = ?`,
        [hmacHash, legacyHash, trimmedToken]
      );
    } catch (dbErr: any) {
      console.error('[BridgeAuth] Primary database query error:', dbErr?.message || dbErr);
      return {
        authorized: false,
        status: 'INVALID',
        serverTime,
        error: {
          code: 'BRIDGE_AUTH_DATABASE_UNAVAILABLE',
          message: 'Database temporarily unavailable while verifying device token.'
        }
      };
    }

    if (!device) {
      try {
        const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
        const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
          ? getSupabaseAdmin()
          : getSupabaseAnon();
        if (supabase) {
          const { data, error: supaErr } = await supabase
            .from('bridge_devices')
            .select('id, user_id, device_name, is_active, token_hash, device_token')
            .or(`device_token.eq.${trimmedToken},token_hash.eq.${hmacHash},token_hash.eq.${legacyHash}`)
            .maybeSingle();
          if (supaErr) {
            console.warn('[BridgeAuth] Supabase lookup error:', supaErr.message);
          } else if (data) {
            device = {
              id: data.id,
              user_id: data.user_id,
              device_name: data.device_name,
              is_active: data.is_active !== undefined ? Number(data.is_active) : 1,
              token_hash: data.token_hash || hmacHash,
              device_token: data.device_token || trimmedToken
            };
            // Cache in primary DB
            if (db) {
              await db.run(
                `INSERT OR IGNORE INTO bridge_devices (id, user_id, device_name, device_token, token_hash, is_active, last_seen_at)
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [device.id, device.user_id, device.device_name, trimmedToken, hmacHash, device.is_active]
              );
            }
          }
        }
      } catch (supaErr: any) {
        console.warn('[BridgeAuth] Supabase fallback exception:', supaErr?.message || supaErr);
      }
    }

    if (!device) {
      return {
        authorized: false,
        status: 'INVALID',
        serverTime,
        error: {
          code: 'INVALID_BRIDGE_TOKEN',
          message: 'Device authorization token is invalid or unassigned in the database.'
        }
      };
    }

    // Constant-time token verification
    const matchesHmac = device.token_hash ? this.constantTimeCompare(device.token_hash, hmacHash) : false;
    const matchesLegacy = device.token_hash ? this.constantTimeCompare(device.token_hash, legacyHash) : false;
    const matchesRaw = device.device_token ? this.constantTimeCompare(device.device_token, trimmedToken) : false;

    if (!matchesHmac && !matchesLegacy && !matchesRaw) {
      return {
        authorized: false,
        status: 'INVALID',
        serverTime,
        error: {
          code: 'INVALID_BRIDGE_TOKEN',
          message: 'Device authorization token verification failed.'
        }
      };
    }

    // Lazy migration from legacy SHA-256 or raw token to HMAC-SHA256
    if (!matchesHmac && (matchesLegacy || matchesRaw) && db) {
      try {
        await db.run(`UPDATE bridge_devices SET token_hash = ? WHERE id = ?`, [hmacHash, device.id]);
        const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
        const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
          ? getSupabaseAdmin()
          : getSupabaseAnon();
        if (supabase) {
          await supabase.from('bridge_devices').update({ token_hash: hmacHash }).eq('id', device.id);
        }
      } catch (migErr) {
        // Non-fatal lazy migration
      }
    }

    if (!device.is_active || Number(device.is_active) === 0) {
      return {
        authorized: false,
        status: 'REVOKED',
        deviceId: device.id,
        deviceName: device.device_name,
        userId: device.user_id,
        serverTime,
        error: {
          code: 'BRIDGE_DEVICE_REVOKED',
          message: 'This MT5 Bridge companion device authorization has been explicitly revoked.'
        }
      };
    }

    // Update last seen timestamp
    if (db) {
      await db.run(`UPDATE bridge_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`, [device.id]);
    }

    return {
      authorized: true,
      status: 'ACTIVE',
      deviceId: device.id,
      deviceName: device.device_name,
      userId: device.user_id,
      serverTime
    };
  }

  /**
   * Validates device token and returns authenticated user and device identity
   */
  public static async validateDeviceToken(deviceToken: string): Promise<{ userId: string; deviceId: string; deviceName: string } | null> {
    const authCheck = await this.checkDeviceAuth(deviceToken);
    if (!authCheck.authorized || !authCheck.userId || !authCheck.deviceId) {
      return null;
    }
    return {
      userId: authCheck.userId,
      deviceId: authCheck.deviceId,
      deviceName: authCheck.deviceName || 'Local Windows Terminal'
    };
  }

  /**
   * List devices paired by user (never returning raw secret token to prevent leaks)
   */
  public static async getUserDevices(userId: string) {
    const db = await getDatabaseAsync();
    return db.query(
      `SELECT id, device_name, ip_address, is_active, last_seen_at, created_at FROM bridge_devices WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Revoke device authorization
   */
  public static async revokeDevice(userId: string, deviceId: string) {
    const db = await getDatabaseAsync();
    await db.run(`UPDATE bridge_devices SET is_active = 0 WHERE id = ? AND user_id = ?`, [deviceId, userId]);
    await db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'BRIDGE_DEVICE_REVOKED', 'bridge_device', ?, ?)`,
      [uuidv4(), userId, deviceId, JSON.stringify({ revokedAt: new Date().toISOString() })]
    );

    // Synchronize revocation to Cloud Database (prevent split-brain resurrection)
    try {
      const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
      const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
        ? getSupabaseAdmin()
        : getSupabaseAnon();
      if (supabase) {
        await supabase
          .from('bridge_devices')
          .update({ is_active: 0 })
          .eq('id', deviceId)
          .eq('user_id', userId);
      }
    } catch (supaErr: any) {
      console.warn('[BridgeService] Failed to synchronize device revocation to Supabase:', supaErr?.message || supaErr);
    }
  }

  // =========================================================================
  // Secure Browser-to-Bridge 1-Click Pairing Sessions
  // =========================================================================

  /**
   * Bridge app creates a new temporary pairing session (valid for 10 minutes)
   */
  public static async createPairingSession(deviceName: string, ipAddress?: string): Promise<{ sessionCode: string; expiresAt: string }> {
    const db = await getDatabaseAsync();
    const sessionId = uuidv4();
    const sessionCode = 'pair_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.run(
      `INSERT INTO bridge_pairing_sessions (id, session_code, device_name, ip_address, status, expires_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [sessionId, sessionCode, deviceName || 'Local Windows Terminal', ipAddress || null, expiresAt]
    );

    try {
      const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
      const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
        ? getSupabaseAdmin()
        : getSupabaseAnon();
      if (supabase) {
        await supabase.from('bridge_pairing_sessions').insert({
          id: sessionId,
          session_code: sessionCode,
          device_name: deviceName || 'Local Windows Terminal',
          ip_address: ipAddress || null,
          status: 'PENDING',
          expires_at: expiresAt
        });
      }
    } catch (supaErr) {
      // Non-fatal
    }

    return { sessionCode, expiresAt };
  }

  /**
   * Fetch current status of a pairing session
   */
  public static async getPairingSession(sessionCode: string): Promise<BridgePairingSession | null> {
    const db = await getDatabaseAsync();
    let session = await db.get<BridgePairingSession>(
      `SELECT * FROM bridge_pairing_sessions WHERE session_code = ?`,
      [sessionCode]
    );

    if (!session) {
      try {
        const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
        const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
          ? getSupabaseAdmin()
          : getSupabaseAnon();
        if (supabase) {
          const { data } = await supabase
            .from('bridge_pairing_sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .maybeSingle();
          if (data) {
            session = data as BridgePairingSession;
          }
        }
      } catch (supaErr) {
        // Non-fatal
      }
    }

    if (!session) return null;

    // Check expiration
    if (new Date(session.expires_at).getTime() < Date.now() && session.status === 'PENDING') {
      await db.run(`UPDATE bridge_pairing_sessions SET status = 'EXPIRED' WHERE session_code = ?`, [sessionCode]);
      session.status = 'EXPIRED';
    }

    return session;
  }

  /**
   * Authenticated web user authorizes the pairing session from their browser
   */
  public static async authorizePairingSession(sessionCode: string, userId: string, ipAddress?: string): Promise<{ success: boolean; deviceToken?: string }> {
    const db = await getDatabaseAsync();
    const session = await this.getPairingSession(sessionCode);

    if (!session) {
      throw new BridgePairingError('PAIRING_SESSION_NOT_FOUND', 'Pairing session not found or has expired. Please initiate a new pairing from the MT5 Bridge app.');
    }

    if (session.status === 'EXPIRED') {
      throw new BridgePairingError('PAIRING_SESSION_EXPIRED', 'This pairing session has expired (10-minute limit). Please initiate a fresh pairing request from the MT5 Bridge app.');
    }

    if (session.status === 'COMPLETED') {
      throw new BridgePairingError('PAIRING_SESSION_ALREADY_COMPLETED', 'This pairing session has already been completed and cannot be reused. Please generate a new pairing request from the MT5 Bridge app.');
    }

    if (session.status === 'REJECTED') {
      throw new BridgePairingError('PAIRING_SESSION_REJECTED', 'This pairing session was previously declined.');
    }

    if (session.status === 'AUTHORIZED') {
      throw new BridgePairingError('PAIRING_SESSION_ALREADY_AUTHORIZED', 'This pairing session has already been authorized and is waiting for the MT5 Bridge app to finalize.');
    }

    if (session.status !== 'PENDING') {
      throw new BridgePairingError('PAIRING_SESSION_INVALID_STATE', `Cannot authorize pairing session in status: ${session.status}`);
    }

    // Register permanent device identity for the authenticated user
    const { deviceToken } = await this.registerDevice(userId, session.device_name, ipAddress || session.ip_address);

    // Atomically transition session status from PENDING to AUTHORIZED
    const res = await db.run(
      `UPDATE bridge_pairing_sessions SET
        status = 'AUTHORIZED',
        user_id = ?,
        device_token = ?
       WHERE session_code = ? AND status = 'PENDING'`,
      [userId, deviceToken, sessionCode]
    );

    if (res.changes === 0) {
      throw new BridgePairingError('PAIRING_CONCURRENT_UPDATE', 'Pairing session was updated concurrently. Please retry with a fresh pairing link.');
    }

    try {
      const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
      const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
        ? getSupabaseAdmin()
        : getSupabaseAnon();
      if (supabase) {
        await supabase
          .from('bridge_pairing_sessions')
          .update({
            status: 'AUTHORIZED',
            user_id: userId,
            device_token: deviceToken
          })
          .eq('session_code', sessionCode);
      }
    } catch (supaErr) {
      // Non-fatal
    }

    return { success: true, deviceToken };
  }

  /**
   * Authenticated web user rejects the pairing session
   */
  public static async rejectPairingSession(sessionCode: string, userId: string): Promise<{ success: boolean }> {
    const db = await getDatabaseAsync();
    await db.run(
      `UPDATE bridge_pairing_sessions SET status = 'REJECTED', user_id = ? WHERE session_code = ? AND status = 'PENDING'`,
      [userId, sessionCode]
    );
    return { success: true };
  }

  /**
   * Bridge polls this to obtain the authorized device token.
   * Does NOT prematurely erase the token on first read to avoid race conditions and network drops.
   * The token remains available during the 10-minute validity lease until completed via ACK or expiry.
   */
  public static async pollAndConsumePairingToken(sessionCode: string): Promise<{ status: string; deviceToken?: string; deviceName?: string }> {
    const db = await getDatabaseAsync();
    const session = await this.getPairingSession(sessionCode);

    if (!session) {
      return { status: 'NOT_FOUND' };
    }

    if (session.status === 'AUTHORIZED' && session.device_token) {
      const token = session.device_token;
      // Atomically mark COMPLETED so token is consumed and erased from session table
      const res = await db.run(
        `UPDATE bridge_pairing_sessions SET status = 'COMPLETED', device_token = NULL WHERE session_code = ? AND status = 'AUTHORIZED'`,
        [sessionCode]
      );

      if (res.changes > 0) {
        try {
          const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
          const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
            ? getSupabaseAdmin()
            : getSupabaseAnon();
          if (supabase) {
            await supabase
              .from('bridge_pairing_sessions')
              .update({ status: 'COMPLETED', device_token: null })
              .eq('session_code', sessionCode);
          }
        } catch (e) {}

        return { status: 'AUTHORIZED', deviceToken: token, deviceName: session.device_name };
      }
    }

    return { status: session.status, deviceName: session.device_name };
  }

  /**
   * Finalizes the pairing session once the companion has safely persisted the device token.
   * Atomically transitions status to COMPLETED and purges raw device_token from session record.
   */
  public static async completePairingSession(sessionCode: string): Promise<{ success: boolean }> {
    const db = await getDatabaseAsync();
    const res = await db.run(
      `UPDATE bridge_pairing_sessions SET status = 'COMPLETED', device_token = NULL WHERE session_code = ? AND status IN ('AUTHORIZED', 'COMPLETED')`,
      [sessionCode]
    );

    try {
      const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
      const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
        ? getSupabaseAdmin()
        : getSupabaseAnon();
      if (supabase) {
        await supabase
          .from('bridge_pairing_sessions')
          .update({ status: 'COMPLETED', device_token: null })
          .eq('session_code', sessionCode);
      }
    } catch (supaErr: any) {
      // Non-fatal
    }

    return { success: true };
  }
}

