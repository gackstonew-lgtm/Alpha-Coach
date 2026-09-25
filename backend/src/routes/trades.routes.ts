import { Router } from 'express';
import { getDatabase } from '../db/db';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

// Get paginated list of reconstructed positions / trades
router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const accountId = req.query.accountId as string;
    const symbol = req.query.symbol as string;
    const status = req.query.status as string; // 'OPEN' | 'CLOSED'
    const direction = req.query.direction as string; // 'BUY' | 'SELL'
    const session = req.query.session as string;
    const strategyId = req.query.strategyId as string;
    const isReviewed = req.query.isReviewed as string; // '1' | '0'
    const search = req.query.search as string;

    let whereSql = `WHERE a.user_id = ?`;
    const params: any[] = [userId];

    if (accountId && accountId !== 'ALL') {
      whereSql += ` AND p.account_id = ?`;
      params.push(accountId);
    }
    if (symbol) {
      whereSql += ` AND p.symbol = ?`;
      params.push(symbol);
    }
    if (status) {
      whereSql += ` AND p.status = ?`;
      params.push(status);
    }
    if (direction) {
      whereSql += ` AND p.position_type = ?`;
      params.push(direction);
    }
    if (session) {
      whereSql += ` AND p.session_name = ?`;
      params.push(session);
    }
    if (strategyId) {
      whereSql += ` AND j.strategy_id = ?`;
      params.push(strategyId);
    }
    if (isReviewed !== undefined && isReviewed !== '') {
      whereSql += ` AND j.is_reviewed = ?`;
      params.push(parseInt(isReviewed));
    }
    if (search) {
      whereSql += ` AND (p.symbol LIKE ? OR p.position_id LIKE ? OR j.setup_name LIKE ? OR j.trader_notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countRes = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       LEFT JOIN trade_journals j ON p.id = j.position_id
       ${whereSql}`,
      params
    );

    const total = countRes?.count || 0;

    const sql = `
      SELECT p.*, a.account_number, a.broker_name,
        j.id as journal_id, j.setup_name, j.strategy_id, j.bias, j.is_reviewed,
        j.emotion_state, j.confidence_score, j.mistake_id, j.confluences,
        m.name as mistake_name, s.name as strategy_name, s.color_tag as strategy_color
      FROM reconstructed_positions p
      JOIN trading_accounts a ON p.account_id = a.id
      LEFT JOIN trade_journals j ON p.id = j.position_id
      LEFT JOIN mistake_tags m ON j.mistake_id = m.id
      LEFT JOIN strategies s ON j.strategy_id = s.id
      ${whereSql}
      ORDER BY p.open_time DESC
      LIMIT ? OFFSET ?
    `;

    const trades = await db.query(sql, [...params, limit, offset]);

    res.json({
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get individual trade position with full executions and journal info
router.get('/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const position = await db.get(
      `SELECT p.*, a.account_number, a.broker_name, a.currency as account_currency
       FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       WHERE p.id = ? AND a.user_id = ?`,
      [req.params.id, req.user!.userId]
    );

    if (!position) {
      res.status(404).json({ error: 'Trade position not found.' });
      return;
    }

    const executions = await db.query(
      `SELECT * FROM position_executions WHERE position_id = ? ORDER BY execution_time ASC`,
      [req.params.id]
    );

    const journal = await db.get(
      `SELECT j.*, m.name as mistake_name, s.name as strategy_name, s.color_tag as strategy_color
       FROM trade_journals j
       LEFT JOIN mistake_tags m ON j.mistake_id = m.id
       LEFT JOIN strategies s ON j.strategy_id = s.id
       WHERE j.position_id = ?`,
      [req.params.id]
    );

    const screenshots = journal
      ? await db.query(`SELECT * FROM trade_screenshots WHERE journal_id = ?`, [journal.id])
      : [];

    res.json({
      position,
      executions,
      journal,
      screenshots
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
