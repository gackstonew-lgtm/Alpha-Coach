import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDatabase, getDatabaseAsync } from '../db/db';
import {
  UserSettings,
  getDefaultSettings,
  UserSettingsUpdateSchema
} from '../models/settings.types';
import { RiskGuardianService } from './risk.service';

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

export class SettingsService {
  public static async getSettings(userId: string): Promise<UserSettings> {
    const db = await getDatabaseAsync();
    const userRow = await db.get<{ first_name: string; last_name: string; email: string; timezone: string; currency: string }>(
      `SELECT first_name, last_name, email, timezone, currency FROM users WHERE id = ?`,
      [userId]
    );

    const defaultSettings = getDefaultSettings({
      firstName: userRow?.first_name,
      lastName: userRow?.last_name,
      timezone: userRow?.timezone,
      currency: userRow?.currency
    });

    const settingsRow = await db.get<{ settings_json: string }>(
      `SELECT settings_json FROM user_settings WHERE user_id = ?`,
      [userId]
    );

    let parsed: any = {};
    if (settingsRow?.settings_json) {
      try {
        parsed = JSON.parse(settingsRow.settings_json);
      } catch (err) {
        console.warn('[SettingsService] Failed to parse settings_json, reverting to defaults:', err);
      }
    }

    const merged = deepMerge(defaultSettings, parsed);

    try {
      const profileRow = await db.get<{ avatar_url: string }>(
        `SELECT avatar_url FROM user_profiles WHERE user_id = ?`,
        [userId]
      );
      if (profileRow?.avatar_url && !merged.profile.avatarUrl) {
        merged.profile.avatarUrl = profileRow.avatar_url;
      }
    } catch {
      // non-fatal
    }

    try {
      const rules = await RiskGuardianService.getRules(userId);
      if (rules) {
        merged.risk.dailyLossLimitAmount = rules.max_daily_loss_amount ?? merged.risk.dailyLossLimitAmount;
        merged.risk.dailyLossLimitPercent = rules.max_daily_loss_pct ?? merged.risk.dailyLossLimitPercent;
        merged.risk.maxTradesPerDay = rules.max_trades_per_day ?? merged.risk.maxTradesPerDay;
        merged.risk.maxPositionSize = rules.max_position_size ?? merged.risk.maxPositionSize;
        merged.risk.consecutiveLossLimit = rules.max_consecutive_losses ?? merged.risk.consecutiveLossLimit;
      }
    } catch {
      // non-fatal
    }

    return merged as UserSettings;
  }

  public static async updateSettings(userId: string, rawUpdates: any): Promise<UserSettings> {
    const validatedUpdates = UserSettingsUpdateSchema.parse(rawUpdates);
    const db = await getDatabaseAsync();
    const current = await this.getSettings(userId);
    const updated = deepMerge(current, validatedUpdates) as UserSettings;

    const jsonStr = JSON.stringify(updated);
    const id = uuidv4();

    await db.run(
      `INSERT INTO user_settings (id, user_id, settings_json, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         settings_json = excluded.settings_json,
         updated_at = CURRENT_TIMESTAMP`,
      [id, userId, jsonStr]
    );

    if (validatedUpdates.profile) {
      await db.run(
        `UPDATE users SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          timezone = COALESCE(?, timezone),
          currency = COALESCE(?, currency),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          validatedUpdates.profile.firstName || null,
          validatedUpdates.profile.lastName !== undefined ? validatedUpdates.profile.lastName : null,
          validatedUpdates.profile.timezone || null,
          validatedUpdates.profile.timezone ? (validatedUpdates.profile.timezone.includes('New_York') ? 'USD' : null) : null,
          userId
        ]
      );

      if (validatedUpdates.profile.avatarUrl !== undefined) {
        await db.run(
          `INSERT INTO user_profiles (id, user_id, avatar_url, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET avatar_url = excluded.avatar_url`,
          [uuidv4(), userId, validatedUpdates.profile.avatarUrl]
        );
      }
    }

    if (validatedUpdates.risk) {
      try {
        await RiskGuardianService.updateRules(userId, undefined, {
          max_daily_loss_amount: updated.risk.dailyLossLimitAmount,
          max_daily_loss_pct: updated.risk.dailyLossLimitPercent,
          max_trades_per_day: updated.risk.maxTradesPerDay,
          max_position_size: updated.risk.maxPositionSize,
          max_consecutive_losses: updated.risk.consecutiveLossLimit,
          is_active: 1
        });
      } catch (riskErr) {
        console.warn('[SettingsService] Failed to sync risk rules:', riskErr);
      }
    }

    return updated;
  }

  public static async resetSection(userId: string, section: keyof UserSettings | 'all'): Promise<UserSettings> {
    const defaults = getDefaultSettings();
    if (section === 'all') {
      return this.updateSettings(userId, defaults);
    }
    const current = await this.getSettings(userId);
    (current as any)[section] = defaults[section];
    return this.updateSettings(userId, { [section]: defaults[section] });
  }

  public static async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    if (!newPass || newPass.length < 8) {
      throw new Error('New password must be at least 8 characters in length.');
    }
    const db = await getDatabaseAsync();
    const user = await db.get<{ password_hash: string; email: string }>(
      `SELECT password_hash, email FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) {
      throw new Error('User not found.');
    }

    const matches = await bcrypt.compare(currentPass, user.password_hash);
    if (!matches) {
      throw new Error('Current password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPass, 10);
    await db.run(
      `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newHash, userId]
    );
  }

  public static async exportUserData(userId: string): Promise<{ data: any; filename: string; mimeType: string }> {
    const db = await getDatabaseAsync();
    const user = await db.get(`SELECT id, email, first_name, last_name, role, timezone, currency, created_at FROM users WHERE id = ?`, [userId]);
    const settings = await this.getSettings(userId);
    const accounts = await db.query(`SELECT * FROM trading_accounts WHERE user_id = ?`, [userId]);
    const trades = await db.query(
      `SELECT p.* FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       WHERE a.user_id = ? ORDER BY p.open_time DESC`,
      [userId]
    );
    const journals = await db.query(`SELECT * FROM trade_journals WHERE user_id = ?`, [userId]);
    const strategies = await db.query(`SELECT * FROM strategies WHERE user_id = ?`, [userId]);
    const riskRules = await db.query(`SELECT * FROM risk_rules WHERE user_id = ?`, [userId]);
    const auditLogs = await db.query(`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`, [userId]);

    const payload = {
      metaCoachExportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      settings,
      accounts,
      tradesCount: trades.length,
      trades,
      journalsCount: journals.length,
      journals,
      strategies,
      riskRules,
      auditLogs
    };

    return {
      data: payload,
      filename: `meta_coach_export_${user?.email || 'user'}_${new Date().toISOString().substring(0, 10)}.json`,
      mimeType: 'application/json'
    };
  }

  public static async deleteAccount(userId: string): Promise<void> {
    const db = await getDatabaseAsync();
    await db.run(`DELETE FROM user_settings WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM user_profiles WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM trade_journals WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM strategies WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM risk_rules WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM notifications WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM trading_accounts WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM users WHERE id = ?`, [userId]);
  }
}
