import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BotService } from '../services/bot.service';
import { requireUserAuth, AuthenticatedRequest, logAuditEvent } from '../middlewares/auth.middleware';
import { getDatabaseAsync } from '../db/db';

const router = Router();

// Middleware to authenticate local agent via x-bot-token
async function requireAgentAuth(req: Request & { botInstance?: any }, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers['x-bot-token'] as string;
  if (!token) {
    res.status(401).json({ success: false, error: 'Agent authentication required (x-bot-token header missing).' });
    return;
  }

  const auth = await BotService.authenticateAgentToken(token);
  if (!auth.authenticated || !auth.instance) {
    res.status(401).json({ success: false, error: 'Invalid or revoked bot agent token.' });
    return;
  }

  req.botInstance = auth.instance;
  next();
}

// =============================================================================
// Web User Endpoints
// =============================================================================

// Generate One-Time 10-Minute Pairing Code
router.post('/pairing/generate-code', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await BotService.generatePairingCode(req.user!.userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List User's Bot Instances
router.get('/instances', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();
    const instances = await db.query(
      `SELECT b.*,
              r.max_risk_pct_ceiling, r.max_lots_ceiling, r.max_drawdown_pct_ceiling, r.live_trading_allowed_locally,
              (SELECT COUNT(*) FROM bot_commands c WHERE c.instance_id = b.id AND c.status = 'QUEUED') as queued_commands_count
       FROM bot_instances b
       LEFT JOIN risk_limits_local_snapshot r ON r.instance_id = b.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user!.userId]
    );

    // Compute online status dynamically based on heartbeat freshness
    const now = Date.now();
    const enriched = instances.map(inst => {
      let liveStatus: 'ONLINE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
      if (inst.last_heartbeat_at) {
        const lastHb = new Date(inst.last_heartbeat_at).getTime();
        const diffSec = Math.floor((now - lastHb) / 1000);
        if (diffSec < 45) {
          liveStatus = 'ONLINE';
        } else if (diffSec < 120) {
          liveStatus = 'STALE';
        } else {
          liveStatus = 'OFFLINE';
        }
      }
      return {
        ...inst,
        status: liveStatus
      };
    });

    res.json({ success: true, instances: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Bot Instance Detail
router.get('/instances/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();
    const instance = await db.get(
      `SELECT b.*, r.max_risk_pct_ceiling, r.max_lots_ceiling, r.max_drawdown_pct_ceiling, r.live_trading_allowed_locally
       FROM bot_instances b
       LEFT JOIN risk_limits_local_snapshot r ON r.instance_id = b.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user!.userId]
    );

    if (!instance) {
      res.status(404).json({ success: false, error: 'Bot instance not found.' });
      return;
    }

    const recentEvents = await db.query(
      'SELECT * FROM bot_events WHERE instance_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );

    res.json({ success: true, instance, recentEvents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dispatch Cloud Safe Command
router.post('/instances/:id/command', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { commandType, payload } = req.body;
    if (!commandType) {
      res.status(400).json({ success: false, error: 'commandType is required.' });
      return;
    }

    const result = await BotService.validateAndDispatchCommand({
      userId: req.user!.userId,
      instanceId: req.params.id,
      commandType,
      payload: payload || {},
      ipAddress: req.ip || req.socket.remoteAddress
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Command History
router.get('/instances/:id/commands', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();
    const commands = await db.query(
      'SELECT * FROM bot_commands WHERE instance_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id, req.user!.userId]
    );
    res.json({ success: true, commands });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Safe Config
router.post('/instances/:id/config', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { symbolsEnabled, sessionFilters, riskPercent, maxTradesPerDay, notifications } = req.body;
    const db = await getDatabaseAsync();

    // Verify local ceiling
    const snapshot = await db.get<{ max_risk_pct_ceiling: number }>(
      'SELECT max_risk_pct_ceiling FROM risk_limits_local_snapshot WHERE instance_id = ?',
      [req.params.id]
    );
    const ceiling = snapshot?.max_risk_pct_ceiling ?? 1.0;

    if (riskPercent && parseFloat(riskPercent) > ceiling) {
      res.status(400).json({
        success: false,
        error: `Risk percent (${riskPercent}%) cannot exceed local machine ceiling (${ceiling}%).`
      });
      return;
    }

    const latestConfig = await db.get<{ version: number }>(
      'SELECT version FROM bot_configs WHERE instance_id = ? ORDER BY version DESC LIMIT 1',
      [req.params.id]
    );
    const nextVersion = (latestConfig?.version || 0) + 1;

    await db.run(
      `INSERT INTO bot_configs (id, user_id, instance_id, version, symbols_enabled, session_filters, risk_percent, max_trades_per_day, notifications_json, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [
        uuidv4(),
        req.user!.userId,
        req.params.id,
        nextVersion,
        JSON.stringify(symbolsEnabled || ['EURUSD']),
        JSON.stringify(sessionFilters || {}),
        parseFloat(riskPercent) || 1.0,
        parseInt(maxTradesPerDay, 10) || 5,
        JSON.stringify(notifications || {})
      ]
    );

    // Dispatch update_config command to agent
    await BotService.validateAndDispatchCommand({
      userId: req.user!.userId,
      instanceId: req.params.id,
      commandType: 'update_config',
      payload: { symbolsEnabled, sessionFilters, riskPercent, maxTradesPerDay, version: nextVersion }
    });

    res.json({ success: true, version: nextVersion, message: 'Config updated and dispatched to agent.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revoke Device Token
router.post('/instances/:id/tokens/revoke', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabaseAsync();
    await db.run('UPDATE device_tokens SET is_revoked = 1 WHERE instance_id = ? AND user_id = ?', [
      req.params.id,
      req.user!.userId
    ]);
    await db.run("UPDATE bot_instances SET status = 'OFFLINE' WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user!.userId
    ]);
    res.json({ success: true, message: 'Device token revoked. Agent disconnected.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// Local Agent Endpoints (Outbound connections from user machine only)
// =============================================================================

// Claim Pairing Code
router.post('/pairing/claim', async (req, res) => {
  try {
    const { pairingCode, instanceName, engineVersion } = req.body;
    if (!pairingCode) {
      res.status(400).json({ success: false, error: 'pairingCode is required.' });
      return;
    }

    const result = await BotService.claimPairingCode({
      pairingCode,
      instanceName,
      engineVersion,
      ipAddress: req.ip || req.socket.remoteAddress
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit Heartbeat Telemetry
router.post('/heartbeat', requireAgentAuth, async (req: any, res) => {
  try {
    const instanceId = req.botInstance.id;
    await BotService.processHeartbeat(instanceId, req.body);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Poll Pending Signed Commands
router.post('/commands/poll', requireAgentAuth, async (req: any, res) => {
  try {
    const instanceId = req.botInstance.id;
    const commands = await BotService.getPendingCommandsForAgent(instanceId);
    res.json({ success: true, commands });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Acknowledge Command Execution Result
router.post('/commands/:commandId/ack', requireAgentAuth, async (req: any, res) => {
  try {
    const instanceId = req.botInstance.id;
    const { commandId } = req.params;
    const { success, result, errorMessage } = req.body;

    await BotService.acknowledgeCommand({
      commandId,
      instanceId,
      success: Boolean(success),
      result,
      errorMessage
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Synchronize Event Batch with Deduplication
router.post('/events/sync', requireAgentAuth, async (req: any, res) => {
  try {
    const instanceId = req.botInstance.id;
    const userId = req.botInstance.user_id;
    const { events } = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({ success: false, error: 'events array expected.' });
      return;
    }

    const db = await getDatabaseAsync();
    let inserted = 0;

    for (const ev of events) {
      const dedupId = ev.dedupId || `${instanceId}-${ev.eventType}-${ev.timestamp}`;
      try {
        await db.run(
          `INSERT INTO bot_events (id, user_id, instance_id, event_type, payload_json, dedup_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(dedup_id) DO NOTHING`,
          [uuidv4(), userId, instanceId, ev.eventType || 'event', JSON.stringify(ev.payload || {}), dedupId]
        );
        inserted++;
      } catch {}
    }

    res.json({ success: true, processed: events.length, inserted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Signed Agent Version Check
router.get('/agent/version', async (req, res) => {
  res.json({
    latestVersion: '1.2.0',
    minRequiredVersion: '1.0.0',
    releaseNotes: 'Enhanced local hard risk limit guardrails, HMAC signed command replay protection, and offline event queue.',
    downloadUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases'
  });
});

// Generate Telegram Link Code (User sends code to bot, zero tokens pasted)
router.post('/telegram/link-code', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const cryptoMod = await import('crypto');
    const code = 'TG-' + cryptoMod.default.randomBytes(3).toString('hex').toUpperCase();
    const db = await getDatabaseAsync();
    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
       VALUES (?, ?, 'Telegram Linking Code', ?, 'SYSTEM', 0, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), req.user!.userId, `Your Telegram linking code is: ${code}. Send this code to @ArcadeFxAlertsBot.`, code]
    );
    res.json({
      success: true,
      linkCode: code,
      botUsername: 'ArcadeFxAlertsBot',
      instructions: 'Start a chat with @ArcadeFxAlertsBot on Telegram and send this code to connect your account.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
