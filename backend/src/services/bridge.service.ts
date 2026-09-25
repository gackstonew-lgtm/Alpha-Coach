import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';

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
}
