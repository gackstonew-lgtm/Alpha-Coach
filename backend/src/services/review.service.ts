import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { TradeJournal, ReconstructedPosition } from '../models/types';
import { GamificationService } from './gamification.service';

export class ReviewService {
  /**
   * Get full trade journal details including reconstructed position, executions, screenshots, and review data
   */
  public static async getTradeJournalDetails(positionId: string, userId: string): Promise<any> {
    const db = getDatabase();

    const position = await db.get<ReconstructedPosition>(
      `SELECT p.*, a.account_number, a.broker_name, a.currency as account_currency
       FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       WHERE p.id = ? AND a.user_id = ?`,
      [positionId, userId]
    );

    if (!position) {
      throw new Error('Position not found or unauthorized.');
    }

    const executions = await db.query(
      `SELECT * FROM position_executions WHERE position_id = ? ORDER BY execution_time ASC`,
      [positionId]
    );

    let journal = await db.get<TradeJournal>(
      `SELECT * FROM trade_journals WHERE position_id = ?`,
      [positionId]
    );

    if (!journal) {
      const jId = uuidv4();
      await db.run(
        `INSERT INTO trade_journals (id, position_id, user_id, setup_name, bias, confidence_score, is_reviewed)
         VALUES (?, ?, ?, 'Standard Setup', ?, 5, 0)`,
        [jId, positionId, userId, position.position_type === 'BUY' ? 'BULLISH' : 'BEARISH']
      );
      journal = (await db.get<TradeJournal>(`SELECT * FROM trade_journals WHERE id = ?`, [jId]))!;
    }

    const screenshots = await db.query(
      `SELECT * FROM trade_screenshots WHERE journal_id = ? ORDER BY created_at ASC`,
      [journal.id]
    );

    const mistake = journal.mistake_id
      ? await db.get(`SELECT * FROM mistake_tags WHERE id = ?`, [journal.mistake_id])
      : null;

    const strategy = journal.strategy_id
      ? await db.get(`SELECT * FROM strategies WHERE id = ?`, [journal.strategy_id])
      : null;

    return {
      position,
      executions,
      journal,
      screenshots,
      mistake,
      strategy
    };
  }

  /**
   * Save or update subjective trade review
   */
  public static async updateTradeReview(
    positionId: string,
    userId: string,
    data: {
      setupName?: string;
      strategyId?: string;
      confluences?: string[] | string;
      bias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      entryTrigger?: string;
      exitTrigger?: string;
      confidenceScore?: number;
      emotionState?: 'DISCIPLINED' | 'FOMO' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'CONFIDENT';
      mistakeId?: string;
      lessonLearned?: string;
      traderNotes?: string;
      voiceTranscript?: string;
    }
  ): Promise<TradeJournal> {
    const db = getDatabase();

    const position = await db.get<ReconstructedPosition>(
      `SELECT p.* FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       WHERE p.id = ? AND a.user_id = ?`,
      [positionId, userId]
    );

    if (!position) {
      throw new Error('Position not found or unauthorized.');
    }

    let journal = await db.get<TradeJournal>(`SELECT * FROM trade_journals WHERE position_id = ?`, [positionId]);

    const confluencesJson = data.confluences
      ? typeof data.confluences === 'string'
        ? data.confluences
        : JSON.stringify(data.confluences)
      : journal?.confluences || null;

    const wasAlreadyReviewed = journal?.is_reviewed === 1;

    if (!journal) {
      const jId = uuidv4();
      await db.run(
        `INSERT INTO trade_journals (
          id, position_id, user_id, setup_name, strategy_id, confluences, bias,
          entry_trigger, exit_trigger, confidence_score, emotion_state,
          mistake_id, lesson_learned, voice_transcript, trader_notes, is_reviewed, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [
          jId,
          positionId,
          userId,
          data.setupName || 'Standard Setup',
          data.strategyId || null,
          confluencesJson,
          data.bias || 'NEUTRAL',
          data.entryTrigger || null,
          data.exitTrigger || null,
          data.confidenceScore || 5,
          data.emotionState || 'DISCIPLINED',
          data.mistakeId || null,
          data.lessonLearned || null,
          data.voiceTranscript || null,
          data.traderNotes || null
        ]
      );
      journal = (await db.get<TradeJournal>(`SELECT * FROM trade_journals WHERE id = ?`, [jId]))!;
    } else {
      await db.run(
        `UPDATE trade_journals SET
          setup_name = ?,
          strategy_id = ?,
          confluences = ?,
          bias = ?,
          entry_trigger = ?,
          exit_trigger = ?,
          confidence_score = ?,
          emotion_state = ?,
          mistake_id = ?,
          lesson_learned = ?,
          voice_transcript = ?,
          trader_notes = ?,
          is_reviewed = 1,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          data.setupName ?? journal.setup_name,
          data.strategyId ?? journal.strategy_id,
          confluencesJson,
          data.bias ?? journal.bias,
          data.entryTrigger ?? journal.entry_trigger,
          data.exitTrigger ?? journal.exit_trigger,
          data.confidenceScore ?? journal.confidence_score,
          data.emotionState ?? journal.emotion_state,
          data.mistakeId ?? journal.mistake_id,
          data.lessonLearned ?? journal.lesson_learned,
          data.voiceTranscript ?? journal.voice_transcript,
          data.traderNotes ?? journal.trader_notes,
          journal.id
        ]
      );
      journal = (await db.get<TradeJournal>(`SELECT * FROM trade_journals WHERE id = ?`, [journal.id]))!;
    }

    // If newly reviewed, award discipline XP
    if (!wasAlreadyReviewed) {
      await GamificationService.recordTradeReview(userId, position.net_profit < 0);
    }

    return journal;
  }

  /**
   * Add screenshot attachment
   */
  public static async addScreenshot(
    journalId: string,
    userId: string,
    stage: 'BEFORE' | 'DURING' | 'AFTER' | 'CHART',
    imageUrl: string,
    caption?: string,
    fileSize: number = 0
  ) {
    const db = getDatabase();
    const screenshotId = uuidv4();

    await db.run(
      `INSERT INTO trade_screenshots (id, journal_id, stage, image_url, caption, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [screenshotId, journalId, stage, imageUrl, caption || null, fileSize]
    );

    return db.get(`SELECT * FROM trade_screenshots WHERE id = ?`, [screenshotId]);
  }
}
