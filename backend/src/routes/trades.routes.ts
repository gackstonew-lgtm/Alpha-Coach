import { Router } from 'express';
import { getDatabase } from '../db/db';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

// Helper to compute date range boundaries dynamically
function resolveDateRange(
  preset?: string,
  customStart?: string,
  customEnd?: string
): { startDate?: string; endDate?: string } {
  const now = new Date();

  if (preset === 'today') {
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return {
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString()
    };
  } else if (preset === 'last_week') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: sevenDaysAgo.toISOString(),
      endDate: now.toISOString()
    };
  } else if (preset === 'last_month') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo.toISOString(),
      endDate: now.toISOString()
    };
  } else if (preset === 'last_3_months') {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return {
      startDate: ninetyDaysAgo.toISOString(),
      endDate: now.toISOString()
    };
  } else if (customStart || customEnd) {
    let startIso: string | undefined = undefined;
    let endIso: string | undefined = undefined;

    if (customStart) {
      const d = new Date(customStart);
      if (!isNaN(d.getTime())) {
        startIso = d.toISOString();
      }
    }
    if (customEnd) {
      const d = new Date(customEnd);
      if (!isNaN(d.getTime())) {
        // If date string is just YYYY-MM-DD, set to end of day UTC
        if (customEnd.length === 10) {
          d.setUTCHours(23, 59, 59, 999);
        }
        endIso = d.toISOString();
      }
    }
    return { startDate: startIso, endDate: endIso };
  }

  return {};
}

// Get paginated list of reconstructed positions / trades with dynamic date filters
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

    // Date filters
    const datePreset = req.query.datePreset as string; // 'today' | 'last_week' | 'last_month' | 'last_3_months' | 'custom'
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;
    const includeOpenPositions = req.query.includeOpenPositions !== 'false';

    const { startDate, endDate } = resolveDateRange(datePreset, customStart, customEnd);

    // Validate date boundaries if both provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      res.status(400).json({
        error: 'Start Date must be before or equal to End Date.'
      });
      return;
    }

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

    // Apply date range filter
    if (startDate && endDate) {
      if (status === 'CLOSED') {
        whereSql += ` AND ((p.close_time >= ? AND p.close_time <= ?) OR (p.open_time >= ? AND p.open_time <= ?))`;
        params.push(startDate, endDate, startDate, endDate);
      } else if (status === 'OPEN') {
        // Open positions are not hidden by date filter
      } else if (includeOpenPositions) {
        // Requirement 14: Preserve currently running open positions while filtering closed history
        whereSql += ` AND (p.status = 'OPEN' OR (p.open_time >= ? AND p.open_time <= ?) OR (p.close_time >= ? AND p.close_time <= ?))`;
        params.push(startDate, endDate, startDate, endDate);
      } else {
        whereSql += ` AND ((p.open_time >= ? AND p.open_time <= ?) OR (p.close_time >= ? AND p.close_time <= ?))`;
        params.push(startDate, endDate, startDate, endDate);
      }
    } else if (startDate) {
      if (status === 'CLOSED') {
        whereSql += ` AND (p.close_time >= ? OR p.open_time >= ?)`;
        params.push(startDate, startDate);
      } else if (status !== 'OPEN' && includeOpenPositions) {
        whereSql += ` AND (p.status = 'OPEN' OR p.open_time >= ? OR p.close_time >= ?)`;
        params.push(startDate, startDate);
      }
    }

    if (search) {
      whereSql += ` AND (p.symbol LIKE ? OR p.position_id LIKE ? OR p.comment LIKE ? OR j.setup_name LIKE ? OR j.trader_notes LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countRes = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM reconstructed_positions p
       JOIN trading_accounts a ON p.account_id = a.id
       LEFT JOIN trade_journals j ON p.id = j.position_id
       LEFT JOIN strategies s ON j.strategy_id = s.id
       ${whereSql}`,
      params
    );

    const total = countRes?.count || 0;

    // Order OPEN positions first, then by open_time DESC
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
      ORDER BY CASE WHEN p.status = 'OPEN' THEN 0 ELSE 1 END ASC, p.open_time DESC
      LIMIT ? OFFSET ?
    `;

    const trades = await db.query(sql, [...params, limit, offset]);

    res.json({
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      },
      filtersApplied: {
        datePreset: datePreset || 'ALL',
        startDate: startDate || null,
        endDate: endDate || null
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
       WHERE (p.id = ? OR p.position_id = ?) AND a.user_id = ?`,
      [req.params.id, req.params.id, req.user!.userId]
    );

    if (!position) {
      res.status(404).json({ error: 'Trade position not found.' });
      return;
    }

    const executions = await db.query(
      `SELECT * FROM position_executions WHERE position_id = ? ORDER BY execution_time ASC`,
      [position.id]
    );

    const journal = await db.get(
      `SELECT j.*, m.name as mistake_name, s.name as strategy_name, s.color_tag as strategy_color
       FROM trade_journals j
       LEFT JOIN mistake_tags m ON j.mistake_id = m.id
       LEFT JOIN strategies s ON j.strategy_id = s.id
       WHERE j.position_id = ?`,
      [position.id]
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
