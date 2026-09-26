import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { StrategyLabService } from '../services/strategy.service';

const router = Router();

router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const strategies = await db.query(
      `SELECT * FROM strategies WHERE user_id = ? ORDER BY created_at ASC`,
      [req.user!.userId]
    );
    res.json({ strategies });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const analytics = await StrategyLabService.getStrategyAnalytics(req.user!.userId, accountId);
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const { name, description, rules, colorTag } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Strategy name is required.' });
      return;
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO strategies (id, user_id, name, description, rules, color_tag)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user!.userId, name, description || null, rules || null, colorTag || '#3b82f6']
    );

    const created = await db.get(`SELECT * FROM strategies WHERE id = ?`, [id]);
    res.status(201).json({ strategy: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    await db.run(`DELETE FROM strategies WHERE id = ? AND user_id = ?`, [req.params.id, req.user!.userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
