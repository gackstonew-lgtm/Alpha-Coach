import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { RiskRule } from '../models/types';

export class RiskGuardianService {
  /**
   * Get or create default risk rule for user/account
   */
  public static async getRules(userId: string, accountId?: string): Promise<RiskRule> {
    const db = getDatabase();
    let rule: RiskRule | undefined;

    if (accountId && accountId !== 'ALL') {
      rule = await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE user_id = ? AND account_id = ?`, [userId, accountId]);
    }

    if (!rule) {
      rule = await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE user_id = ? AND account_id IS NULL`, [userId]);
    }

    if (!rule) {
      const ruleId = uuidv4();
      await db.run(
        `INSERT INTO risk_rules (
          id, user_id, account_id, max_daily_loss_amount, max_daily_loss_pct, max_weekly_loss_amount,
          max_trades_per_day, max_risk_per_trade_pct, max_consecutive_losses, max_drawdown_pct, max_position_size
        ) VALUES (?, ?, ?, 500.0, 2.0, 1500.0, 5, 1.0, 3, 5.0, 5.0)`,
        [ruleId, userId, accountId && accountId !== 'ALL' ? accountId : null]
      );
      rule = (await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE id = ?`, [ruleId]))!;
    }

    return rule;
  }

  /**
   * Update risk rules
   */
  public static async updateRules(userId: string, accountId: string | undefined, updates: Partial<RiskRule>): Promise<RiskRule> {
    const db = getDatabase();
    const existing = await this.getRules(userId, accountId);

    await db.run(
      `UPDATE risk_rules SET
        max_daily_loss_amount = ?,
        max_daily_loss_pct = ?,
        max_weekly_loss_amount = ?,
        max_trades_per_day = ?,
        max_risk_per_trade_pct = ?,
        max_consecutive_losses = ?,
        max_drawdown_pct = ?,
        max_position_size = ?,
        allowed_start_time = ?,
        allowed_end_time = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.max_daily_loss_amount ?? existing.max_daily_loss_amount,
        updates.max_daily_loss_pct ?? existing.max_daily_loss_pct,
        updates.max_weekly_loss_amount ?? existing.max_weekly_loss_amount,
        updates.max_trades_per_day ?? existing.max_trades_per_day,
        updates.max_risk_per_trade_pct ?? existing.max_risk_per_trade_pct,
        updates.max_consecutive_losses ?? existing.max_consecutive_losses,
        updates.max_drawdown_pct ?? existing.max_drawdown_pct,
        updates.max_position_size ?? existing.max_position_size,
        updates.allowed_start_time ?? existing.allowed_start_time,
        updates.allowed_end_time ?? existing.allowed_end_time,
        updates.is_active ?? existing.is_active,
        existing.id
      ]
    );

    return (await db.get<RiskRule>(`SELECT * FROM risk_rules WHERE id = ?`, [existing.id]))!;
  }

  /**
   * Evaluate all risk rules for today's trading activity and record real-time alerts
   */
  public static async evaluateRules(userId: string, accountId: string): Promise<any> {
    const db = getDatabase();
    const rules = await this.getRules(userId, accountId);
    if (!rules || !rules.is_active) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    // Fetch today's closed positions
    const todayTrades = await db.query(
      `SELECT * FROM reconstructed_positions
       WHERE account_id = ? AND status = 'CLOSED' AND (close_time LIKE ? OR open_time LIKE ?)`,
      [accountId, `${todayStr}%`, `${todayStr}%`]
    );

    let todayNetProfit = 0;
    let todayLossCount = 0;
    let consecutiveLosses = 0;

    for (const t of todayTrades) {
      todayNetProfit += t.net_profit;
      if (t.net_profit < 0) {
        todayLossCount++;
        consecutiveLosses++;
      } else if (t.net_profit > 0) {
        consecutiveLosses = 0;
      }
    }

    const todayLoss = todayNetProfit < 0 ? Math.abs(todayNetProfit) : 0;
    const tradesUsed = todayTrades.length;

    // Check Daily Loss Threshold
    if (rules.max_daily_loss_amount > 0 && todayLoss >= rules.max_daily_loss_amount) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_DAILY_LOSS_EXCEEDED',
        'CRITICAL',
        `Daily loss limit breached: -$${todayLoss.toFixed(2)} exceeds configured limit of -$${rules.max_daily_loss_amount.toFixed(2)}.`,
        todayLoss,
        rules.max_daily_loss_amount
      );
    } else if (rules.max_daily_loss_amount > 0 && todayLoss >= rules.max_daily_loss_amount * 0.75) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_DAILY_LOSS_WARNING',
        'WARNING',
        `Daily loss is at ${( (todayLoss / rules.max_daily_loss_amount) * 100 ).toFixed(1)}% of your daily limit ($${todayLoss.toFixed(2)} / $${rules.max_daily_loss_amount.toFixed(2)}).`,
        todayLoss,
        rules.max_daily_loss_amount
      );
    }

    // Check Max Trades Per Day
    if (rules.max_trades_per_day > 0 && tradesUsed >= rules.max_trades_per_day) {
      await this.createAlert(
        userId,
        accountId,
        'MAX_TRADES_EXCEEDED',
        'WARNING',
        `Daily trade limit reached: ${tradesUsed} of ${rules.max_trades_per_day} trades executed today.`,
        tradesUsed,
        rules.max_trades_per_day
      );
    }

    // Check Consecutive Losses
    if (rules.max_consecutive_losses > 0 && consecutiveLosses >= rules.max_consecutive_losses) {
      await this.createAlert(
        userId,
        accountId,
        'CONSECUTIVE_LOSS_LIMIT',
        'CRITICAL',
        `${consecutiveLosses} consecutive losses detected today. Step away from terminal to avoid revenge trading.`,
        consecutiveLosses,
        rules.max_consecutive_losses
      );
    }

    return {
      todayTrades: tradesUsed,
      todayNetProfit,
      todayLoss,
      consecutiveLosses,
      dailyLossLimit: rules.max_daily_loss_amount,
      dailyTradesLimit: rules.max_trades_per_day
    };
  }

  private static async createAlert(
    userId: string,
    accountId: string,
    ruleType: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    message: string,
    currentValue: number,
    thresholdValue: number
  ) {
    const db = getDatabase();
    // Prevent spamming identical unacknowledged alerts on the same day
    const existing = await db.get(
      `SELECT id FROM risk_alerts
       WHERE user_id = ? AND account_id = ? AND rule_type = ? AND is_acknowledged = 0
       AND triggered_at >= date('now')`,
      [userId, accountId, ruleType]
    );

    if (!existing) {
      const alertId = uuidv4();
      await db.run(
        `INSERT INTO risk_alerts (id, user_id, account_id, rule_type, severity, message, current_value, threshold_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [alertId, userId, accountId, ruleType, severity, message, currentValue, thresholdValue]
      );

      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link)
         VALUES (?, ?, 'Risk Guardian Alert', ?, 'RISK', '/risk-guardian')`,
        [uuidv4(), userId, message]
      );
    }
  }

  public static async getAlerts(userId: string, accountId?: string) {
    const db = getDatabase();
    let sql = `SELECT * FROM risk_alerts WHERE user_id = ?`;
    const params: any[] = [userId];
    if (accountId && accountId !== 'ALL') {
      sql += ` AND account_id = ?`;
      params.push(accountId);
    }
    sql += ` ORDER BY triggered_at DESC LIMIT 50`;
    return db.query(sql, params);
  }

  public static async acknowledgeAlert(alertId: string, userId: string) {
    const db = getDatabase();
    await db.run(`UPDATE risk_alerts SET is_acknowledged = 1 WHERE id = ? AND user_id = ?`, [alertId, userId]);
  }
}
