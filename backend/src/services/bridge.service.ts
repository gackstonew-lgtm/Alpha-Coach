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

export class BridgeService {
  /**
   * Generates a secure device token for the MT5 Local Bridge
   */
  public static async registerDevice(userId: string, deviceName: string, ipAddress?: string): Promise<{ deviceId: string; deviceToken: string }> {
    const db = getDatabase();
    const deviceId = uuidv4();
    const rawToken = 'ac_bridge_' + crypto.randomBytes(32).toString('hex');

    await db.run(
      `INSERT INTO bridge_devices (id, user_id, device_name, device_token, ip_address, is_active, last_seen_at)
       VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [deviceId, userId, deviceName, rawToken, ipAddress || null]
    );

    await db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address, details_json)
       VALUES (?, ?, 'BRIDGE_DEVICE_PAIRED', 'bridge_device', ?, ?, ?)`,
      [uuidv4(), userId, deviceId, ipAddress || null, JSON.stringify({ deviceName })]
    );

    return { deviceId, deviceToken: rawToken };
  }

  /**
   * Validates device token and returns user
   */
  public static async validateDeviceToken(deviceToken: string): Promise<{ userId: string; deviceId: string; deviceName: string } | null> {
    const db = getDatabase();
    const device = await db.get<{ id: string; user_id: string; device_name: string; is_active: number }>(
      `SELECT id, user_id, device_name, is_active FROM bridge_devices WHERE device_token = ?`,
      [deviceToken]
    );

    if (!device || !device.is_active) {
      return null;
    }

    // Update last seen
    await db.run(`UPDATE bridge_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`, [device.id]);

    return {
      userId: device.user_id,
      deviceId: device.id,
      deviceName: device.device_name
    };
  }

  /**
   * List devices paired by user
   */
  public static async getUserDevices(userId: string) {
    const db = getDatabase();
    return db.query(
      `SELECT id, device_name, ip_address, is_active, last_seen_at, created_at FROM bridge_devices WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Revoke device
   */
  public static async revokeDevice(userId: string, deviceId: string) {
    const db = getDatabase();
    await db.run(`UPDATE bridge_devices SET is_active = 0 WHERE id = ? AND user_id = ?`, [deviceId, userId]);
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

    return { sessionCode, expiresAt };
  }

  /**
   * Fetch current status of a pairing session
   */
  public static async getPairingSession(sessionCode: string): Promise<BridgePairingSession | null> {
    const db = getDatabase();
    const session = await db.get<BridgePairingSession>(
      `SELECT * FROM bridge_pairing_sessions WHERE session_code = ?`,
      [sessionCode]
    );

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
  public static async authorizePairingSession(sessionCode: string, userId: string, ipAddress?: string): Promise<{ success: boolean }> {
    const db = getDatabase();
    const session = await this.getPairingSession(sessionCode);

    if (!session) {
      throw new Error('Pairing session not found.');
    }

    if (session.status !== 'PENDING') {
      throw new Error(`Cannot authorize pairing session in status: ${session.status}`);
    }

    // Register permanent device
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

    return { success: true };
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
  public static async pollAndConsumePairingToken(sessionCode: string): Promise<{ status: string; deviceToken?: string }> {
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
      return { status: 'AUTHORIZED', deviceToken: token };
    }

    return { status: session.status };
  }
}
