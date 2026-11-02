import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseAsync } from '../db/db';
import { requireUserAuth, requireAdmin, AuthenticatedRequest, logAuditEvent } from '../middlewares/auth.middleware';

const router = Router();

// Admin System Overview
router.get('/overview', requireUserAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();

    const usersCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users'))?.count || 0;
    const accountsCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM trading_accounts'))?.count || 0;
    const devicesCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM bridge_devices WHERE is_active = 1'))?.count || 0;
    const dealsCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM raw_deals'))?.count || 0;
    const positionsCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM reconstructed_positions'))?.count || 0;
    const botInstancesCount = (await db.get<{ count: number }>('SELECT COUNT(*) as count FROM bot_instances'))?.count || 0;
    const activeSubsCount = (await db.get<{ count: number }>("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'"))?.count || 0;

    const recentSyncs = await db.query(
      `SELECT s.*, a.account_number, a.broker_name, a.server_name
       FROM sync_checkpoints s
       JOIN trading_accounts a ON s.account_id = a.id
       ORDER BY s.started_at DESC LIMIT 10`
    );

    const recentAuditLogs = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50`
    );

    res.json({
      metrics: {
        usersCount,
        accountsCount,
        devicesCount,
        dealsCount,
        positionsCount,
        botInstancesCount,
        activeSubsCount
      },
      recentSyncs,
      recentAuditLogs,
      systemHealth: {
        status: 'HEALTHY',
        database: 'ONLINE',
        bridgeConnectivity: 'OPERATIONAL',
        memoryUsage: process.memoryUsage(),
        uptimeSeconds: process.uptime()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Users with Subscriptions & Instance Count
router.get('/users', requireUserAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();
    const users = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at,
              s.status as subscription_status, p.name as plan_name,
              (SELECT COUNT(*) FROM bot_instances b WHERE b.user_id = u.id) as instance_count
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       LEFT JOIN plans p ON s.plan_id = p.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suspend or Activate User
router.post('/users/:id/status', requireUserAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;
    const db = await getDatabaseAsync();

    await db.run('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      isActive ? 1 : 0,
      id
    ]);

    await logAuditEvent({
      userId: req.user!.userId,
      action: isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_SUSPENDED',
      entityType: 'USER',
      entityId: id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { reason: reason || 'Admin action' }
    });

    res.json({ success: true, message: `User status updated to ${isActive ? 'active' : 'suspended'}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Searchable Audit Logs
router.get('/audit-logs', requireUserAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { action, userId, limit = '100' } = req.query;
    const db = await getDatabaseAsync();

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (action) {
      sql += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Math.min(parseInt(limit as string, 10) || 100, 500));

    const logs = await db.query(sql, params);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global Emergency Kill Switch (Stops new trades across ALL bot instances)
router.post('/global-kill-switch', requireUserAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { reason, confirmationText } = req.body;
    if (confirmationText !== 'GLOBAL KILL SWITCH') {
      res.status(400).json({ error: 'Type "GLOBAL KILL SWITCH" to confirm global suspension.' });
      return;
    }

    const db = await getDatabaseAsync();

    // Broadcast emergency stop command to all active bot instances
    const activeInstances = await db.query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM bot_instances WHERE status != 'OFFLINE'"
    );

    for (const inst of activeInstances) {
      await db.run(
        `INSERT INTO bot_commands (id, user_id, instance_id, command_type, payload_json, signature, nonce, idempotency_key, status, created_at, expires_at)
         VALUES (?, ?, ?, 'kill_switch', ?, 'ADMIN_GLOBAL_DISPATCH', ?, ?, 'QUEUED', CURRENT_TIMESTAMP, datetime('now', '+5 minutes'))`,
        [
          uuidv4(),
          inst.user_id,
          inst.id,
          JSON.stringify({ reason: reason || 'GLOBAL EMERGENCY SUSPENSION' }),
          uuidv4(),
          `global-kill-${inst.id}-${Date.now()}`
        ]
      );
    }

    await logAuditEvent({
      userId: req.user!.userId,
      action: 'ADMIN_GLOBAL_KILL_SWITCH_ACTIVATED',
      entityType: 'FLEET',
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { instancesTargeted: activeInstances.length, reason }
    });

    res.json({
      success: true,
      instancesTargeted: activeInstances.length,
      message: `Global emergency kill switch issued to ${activeInstances.length} active bot instances.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
