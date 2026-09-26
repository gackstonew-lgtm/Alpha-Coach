import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { TraderProgression, Achievement } from '../models/types';

export class GamificationService {
  /**
   * Get user's current progression profile, XP, level, streaks, and unlocked achievements
   */
  public static async getUserProgression(userId: string): Promise<{
    progression: TraderProgression;
    achievements: Achievement[];
    xpToNextLevel: number;
    levelProgressPct: number;
  }> {
    const db = getDatabase();

    let progression = await db.get<TraderProgression>(
      `SELECT * FROM trader_progression WHERE user_id = ?`,
      [userId]
    );

    if (!progression) {
      const id = uuidv4();
      await db.run(
        `INSERT INTO trader_progression (id, user_id, current_xp, current_level, current_streak_days, longest_streak_days, total_trades_reviewed, rule_compliance_rate)
         VALUES (?, ?, 100, 1, 1, 1, 0, 100.0)`,
        [id, userId]
      );
      progression = (await db.get<TraderProgression>(`SELECT * FROM trader_progression WHERE id = ?`, [id]))!;
    }

    const allAchievements = await db.query<Achievement>(`SELECT * FROM achievements ORDER BY xp_reward ASC`);
    const unlocked = await db.query<{ achievement_id: string; unlocked_at: string }>(
      `SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?`,
      [userId]
    );
    const unlockedMap = new Map<string, string>();
    unlocked.forEach(u => unlockedMap.set(u.achievement_id, u.unlocked_at));

    const achievementsWithStatus = allAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedMap.has(ach.id),
      unlocked_at: unlockedMap.get(ach.id)
    }));

    // XP calculation: Each level requires level * 300 XP
    const currentLevel = progression.current_level;
    const currentXp = progression.current_xp;
    const xpForCurrentLevel = (currentLevel - 1) * 300;
    const xpForNextLevel = currentLevel * 300;
    const levelSpan = xpForNextLevel - xpForCurrentLevel;
    const xpInCurrentLevel = Math.max(0, currentXp - xpForCurrentLevel);
    const levelProgressPct = Math.min(100, parseFloat(((xpInCurrentLevel / levelSpan) * 100).toFixed(1)));
    const xpToNextLevel = Math.max(0, xpForNextLevel - currentXp);

    return {
      progression,
      achievements: achievementsWithStatus,
      xpToNextLevel,
      levelProgressPct
    };
  }

  /**
   * Award XP and check level ups / streak updates
   */
  public static async awardXP(userId: string, xpAmount: number, reason: string): Promise<void> {
    const db = getDatabase();
    const progression = await db.get<TraderProgression>(`SELECT * FROM trader_progression WHERE user_id = ?`, [userId]);
    if (!progression) return;

    const newXp = progression.current_xp + xpAmount;
    const newLevel = Math.floor(newXp / 300) + 1;

    await db.run(
      `UPDATE trader_progression SET
        current_xp = ?,
        current_level = ?,
        last_activity_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newXp, newLevel, userId]
    );
  }

  /**
   * Record trade review completed - rewards discipline and reviewing losing trades
   */
  public static async recordTradeReview(userId: string, isLosingTrade: boolean): Promise<void> {
    const db = getDatabase();
    const progression = await db.get<TraderProgression>(`SELECT * FROM trader_progression WHERE user_id = ?`, [userId]);
    if (!progression) return;

    const newReviewedCount = progression.total_trades_reviewed + 1;
    await db.run(
      `UPDATE trader_progression SET
        total_trades_reviewed = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newReviewedCount, userId]
    );

    // Award XP: 25 XP for normal review, 50 XP bonus for reviewing a losing trade with psychological honesty
    const xpBonus = isLosingTrade ? 50 : 25;
    await this.awardXP(userId, xpBonus, isLosingTrade ? 'Reviewed losing trade' : 'Reviewed trade');

    // Check achievement unlock for reviewing 25 losing trades
    if (isLosingTrade) {
      const losingReviewedCount = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM trade_journals j
         JOIN reconstructed_positions p ON j.position_id = p.id
         WHERE j.user_id = ? AND j.is_reviewed = 1 AND p.net_profit < 0`,
        [userId]
      );
      if (losingReviewedCount && losingReviewedCount.count >= 25) {
        await this.unlockAchievement(userId, 'REVIEW_25_LOSSES');
      }
    }
  }

  /**
   * Record MT5 Sync activity
   */
  public static async recordSyncActivity(userId: string, totalClosedTrades: number): Promise<void> {
    const db = getDatabase();
    await this.unlockAchievement(userId, 'FIRST_SYNC');

    if (totalClosedTrades >= 100) {
      await this.unlockAchievement(userId, 'TRADES_100');
    }
  }

  /**
   * Unlock achievement safely
   */
  public static async unlockAchievement(userId: string, achievementCode: string): Promise<boolean> {
    const db = getDatabase();
    const ach = await db.get<Achievement>(`SELECT * FROM achievements WHERE code = ?`, [achievementCode]);
    if (!ach) return false;

    const existing = await db.get(`SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`, [userId, ach.id]);
    if (existing) return false;

    await db.run(
      `INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), userId, ach.id]
    );

    await this.awardXP(userId, ach.xp_reward, `Unlocked Achievement: ${ach.title}`);

    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link)
       VALUES (?, ?, 'Achievement Unlocked: ' || ?, ?, 'SYSTEM', '/gamification')`,
      [uuidv4(), userId, ach.title, ach.description]
    );

    return true;
  }
}
