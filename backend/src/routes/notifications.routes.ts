import { Router } from 'express';
import { getDatabase } from '../db/db';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const notifications = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [req.user!.userId]
    );
    const unreadCount = (await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user!.userId]
    ))?.count || 0;

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mark-all-read', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    await db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    await db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user!.userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
