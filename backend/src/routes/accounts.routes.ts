import { Router } from 'express';
import { getDatabase } from '../db/db';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

// List user's trading accounts
router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const accounts = await db.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM reconstructed_positions p WHERE p.account_id = a.id) as total_positions,
        (SELECT COUNT(*) FROM reconstructed_positions p WHERE p.account_id = a.id AND p.status = 'CLOSED') as total_closed_trades,
        (SELECT SUM(net_profit) FROM reconstructed_positions p WHERE p.account_id = a.id AND p.status = 'CLOSED') as total_net_profit
       FROM trading_accounts a
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update account settings (e.g. leverage, account type)
router.patch('/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { leverage, currency, account_type } = req.body;

    await db.run(
      `UPDATE trading_accounts SET
        leverage = COALESCE(?, leverage),
        currency = COALESCE(?, currency),
        account_type = COALESCE(?, account_type),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [leverage, currency, account_type, id, req.user!.userId]
    );

    const updated = await db.get(`SELECT * FROM trading_accounts WHERE id = ? AND user_id = ?`, [id, req.user!.userId]);
    res.json({ account: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect/Delete account
router.delete('/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    await db.run(`DELETE FROM trading_accounts WHERE id = ? AND user_id = ?`, [id, req.user!.userId]);
    res.json({ success: true, message: 'Account and associated trade records deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
