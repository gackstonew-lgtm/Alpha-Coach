import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';

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
  /**
   * Generates a SHA-256 hash of the device token for secure backend persistence
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a secure device token and stores both hash and token for the MT5 Local Bridge
   */
  public static async registerDevice(userId: string, deviceName: string, ipAddress?: string): Promise<{ deviceId: string; deviceToken: string }> {
    const db = getDatabase();
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

    const db = getDatabase();
    const tokenHash = this.hashToken(deviceToken.trim());

    // Check by token_hash or raw token (backward compatibility)
    let device = await db.get<{ id: string; user_id: string; device_name: string; is_active: number }>(
      `SELECT id, user_id, device_name, is_active FROM bridge_devices WHERE token_hash = ? OR device_token = ?`,
      [tokenHash, deviceToken.trim()]
    );

    if (!device) {
      try {
        const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
        const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
          ? getSupabaseAdmin()
          : getSupabaseAnon();
        if (supabase) {
          const { data } = await supabase
            .from('bridge_devices')
            .select('id, user_id, device_name, is_active')
            .or(`device_token.eq.${deviceToken.trim()},token_hash.eq.${tokenHash}`)
            .maybeSingle();
          if (data) {
            device = {
              id: data.id,
              user_id: data.user_id,
              device_name: data.device_name,
              is_active: data.is_active !== undefined ? Number(data.is_active) : 1
            };
            // Cache locally
            await db.run(
              `INSERT OR IGNORE INTO bridge_devices (id, user_id, device_name, device_token, token_hash, is_active, last_seen_at)
               VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [device.id, device.user_id, device.device_name, deviceToken.trim(), tokenHash, device.is_active]
            );
          } else {
            // Also check bridge_pairing_sessions in Supabase
            const { data: sessData } = await supabase
              .from('bridge_pairing_sessions')
              .select('id, user_id, device_name')
              .eq('device_token', deviceToken.trim())
              .maybeSingle();
            if (sessData && sessData.user_id) {
              device = {
                id: sessData.id,
                user_id: sessData.user_id,
                device_name: sessData.device_name || 'Local Windows Terminal',
                is_active: 1
              };
              // Cache locally
              await db.run(
                `INSERT OR IGNORE INTO bridge_devices (id, user_id, device_name, device_token, token_hash, is_active, last_seen_at)
                 VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                [device.id, device.user_id, device.device_name, deviceToken.trim(), tokenHash]
              );
              // Also record in Supabase bridge_devices table
              try {
                await supabase.from('bridge_devices').upsert({
                  id: sessData.id,
                  user_id: sessData.user_id,
                  device_name: sessData.device_name || 'Local Windows Terminal',
                  device_token: deviceToken.trim(),
                  token_hash: tokenHash,
                  is_active: 1
                }, { onConflict: 'id' });
              } catch (e) {}
            }
          }
        }
      } catch (supaErr) {
        console.warn('[BridgeAuth] Supabase fallback check skipped:', supaErr);
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
    await db.run(`UPDATE bridge_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`, [device.id]);

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
    const db = getDatabase();
    return db.query(
      `SELECT id, device_name, ip_address, is_active, last_seen_at, created_at FROM bridge_devices WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Revoke device authorization
   */
  public static async revokeDevice(userId: string, deviceId: string) {
    const db = getDatabase();
    await db.run(`UPDATE bridge_devices SET is_active = 0 WHERE id = ? AND user_id = ?`, [deviceId, userId]);
    await db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'BRIDGE_DEVICE_REVOKED', 'bridge_device', ?, ?)`,
      [uuidv4(), userId, deviceId, JSON.stringify({ revokedAt: new Date().toISOString() })]
    );
  }

  // =========================================================================
  // Secure Browser-to-Bridge 1-Click Pairing Sessions
  // =========================================================================

  /**
   * Bridge app creates a new temporary pairing session (valid for 10 minutes)
   */
  public static async createPairingSession(deviceName: string, ipAddress?: string): Promise<{ sessionCode: string; expiresAt: string }> {
    const db = getDatabase();
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
      console.warn('[BridgePairing] Supabase session write skipped:', supaErr);
    }

    return { sessionCode, expiresAt };
  }

  /**
   * Fetch current status of a pairing session
   */
  public static async getPairingSession(sessionCode: string): Promise<BridgePairingSession | null> {
    const db = getDatabase();
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
        console.warn('[BridgePairing] Supabase session lookup skipped:', supaErr);
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
    const db = getDatabase();
    const session = await this.getPairingSession(sessionCode);

    if (!session) {
      throw new Error('Pairing session not found.');
    }

    if (session.status !== 'PENDING') {
      throw new Error(`Cannot authorize pairing session in status: ${session.status}`);
    }

    // Register permanent device first
    const { deviceToken } = await this.registerDevice(userId, session.device_name, ipAddress || session.ip_address);

    // Update session to AUTHORIZED
    await db.run(
      `UPDATE bridge_pairing_sessions SET
        status = 'AUTHORIZED',
        user_id = ?,
        device_token = ?
       WHERE session_code = ?`,
      [userId, deviceToken, sessionCode]
    );

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
      console.warn('[BridgePairing] Supabase session auth update skipped:', supaErr);
    }

    return { success: true, deviceToken };
  }

  /**
   * Authenticated web user rejects the pairing session
   */
  public static async rejectPairingSession(sessionCode: string, userId: string): Promise<{ success: boolean }> {
    const db = getDatabase();
    await db.run(
      `UPDATE bridge_pairing_sessions SET status = 'REJECTED', user_id = ? WHERE session_code = ? AND status = 'PENDING'`,
      [userId, sessionCode]
    );
    return { success: true };
  }

  /**
   * Bridge polls this to obtain the authorized device token (single-use consumption)
   */
  public static async pollAndConsumePairingToken(sessionCode: string): Promise<{ status: string; deviceToken?: string; deviceName?: string }> {
    const db = getDatabase();
    const session = await this.getPairingSession(sessionCode);

    if (!session) {
      return { status: 'NOT_FOUND' };
    }

    if (session.status === 'AUTHORIZED' && session.device_token) {
      const token = session.device_token;
      // Mark COMPLETED so token is consumed and erased from session table
      await db.run(
        `UPDATE bridge_pairing_sessions SET status = 'COMPLETED', device_token = NULL WHERE session_code = ?`,
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
      } catch (e) {}
      return { status: 'AUTHORIZED', deviceToken: token, deviceName: session.device_name };
    }

    return { status: session.status, deviceName: session.device_name };
  }
}
