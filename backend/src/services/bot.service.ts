/**
 * MT5 Bot Management & Cloud Orchestration Service
 * Handles secure pairing, HMAC command signing, heartbeat telemetry,
 * and safe cloud command validation.
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseAsync } from '../db/db';
import { logAuditEvent } from '../middlewares/auth.middleware';

export interface BotCommandPayload {
  commandType: 'start' | 'stop' | 'pause' | 'resume' | 'close_all' | 'kill_switch' | 'update_config';
  params?: Record<string, any>;
}

export interface BotHeartbeatPayload {
  instanceName: string;
  accountNumberMasked: string;
  mode: 'DEMO' | 'LIVE' | 'PROP';
  currency: string;
  balance: number;
  equity: number;
  openPositions: Array<{
    ticket: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
    sl: number;
    tp: number;
  }>;
  botState: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'KILL_SWITCH';
  mt5Connected: boolean;
  lastSignal?: string;
  engineVersion: string;
  lastError?: string;
  uptimeSeconds: number;
  localLimitsSnapshot: {
    maxRiskPctCeiling: number;
    maxLotsCeiling: number;
    maxDrawdownPctCeiling: number;
    liveTradingAllowedLocally: boolean;
  };
}

export class BotService {
  /**
   * Generates a secure HMAC-SHA256 signature for cloud commands.
   */
  public static signPayload(payload: Record<string, any>, secret: string): string {
    const serialized = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHmac('sha256', secret).update(serialized).digest('hex');
  }

  /**
   * Verifies an HMAC-SHA256 signature with timing-safe comparison.
   */
  public static verifySignature(payload: Record<string, any>, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret);
    if (!signature || signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * Generates a 6-digit alphanumeric one-time pairing code (valid for 10 minutes).
   */
  public static async generatePairingCode(userId: string): Promise<{ pairingCode: string; expiresAt: string }> {
    const db = await getDatabaseAsync();
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex characters
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.run(
      `INSERT INTO bridge_pairing_sessions (id, session_code, device_name, status, user_id, created_at, expires_at)
       VALUES (?, ?, 'Pending MT5 Bot Agent', 'PENDING', ?, CURRENT_TIMESTAMP, ?)`,
      [uuidv4(), code, userId, expiresAt]
    );

    await logAuditEvent({
      userId,
      action: 'BOT_PAIRING_CODE_GENERATED',
      entityType: 'BOT_INSTANCE',
      details: { pairingCode: code, expiresAt }
    });

    return { pairingCode: code, expiresAt };
  }

  /**
   * Claims a one-time pairing code from the local agent and returns a rotating device token & HMAC secret.
   */
  public static async claimPairingCode(params: {
    pairingCode: string;
    instanceName: string;
    engineVersion: string;
    ipAddress?: string;
  }): Promise<{
    success: boolean;
    instanceId?: string;
    deviceToken?: string;
    signingSecret?: string;
    error?: string;
  }> {
    const db = await getDatabaseAsync();
    const code = params.pairingCode.trim().toUpperCase();

    const session = await db.get<{ id: string; user_id: string; status: string; expires_at: string }>(
      'SELECT id, user_id, status, expires_at FROM bridge_pairing_sessions WHERE session_code = ?',
      [code]
    );

    if (!session) {
      return { success: false, error: 'Pairing code not found or invalid.' };
    }

    if (session.status !== 'PENDING') {
      return { success: false, error: 'Pairing code has already been claimed or expired.' };
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Pairing code has expired (10-minute limit).' };
    }

    // Generate rotating token and shared HMAC secret
    const rawToken = 'bot_' + crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const signingSecret = crypto.randomBytes(32).toString('hex');
    const instanceId = uuidv4();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    // Create Bot Instance
    await db.run(
      `INSERT INTO bot_instances (id, user_id, instance_name, device_token_hash, mode, status, engine_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'DEMO', 'ONLINE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [instanceId, session.user_id, params.instanceName || 'MT5 Bot Terminal', tokenHash, params.engineVersion || '1.0.0']
    );

    // Save Device Token
    await db.run(
      `INSERT INTO device_tokens (id, user_id, instance_id, token_hash, name, is_revoked, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), session.user_id, instanceId, tokenHash, params.instanceName, expiresAt]
    );

    // Save Signing Secret in bot_configs
    await db.run(
      `INSERT INTO bot_configs (id, user_id, instance_id, version, symbols_enabled, risk_percent, max_trades_per_day, notifications_json, is_active, created_at)
       VALUES (?, ?, ?, 1, '["EURUSD"]', 1.0, 5, ?, 1, CURRENT_TIMESTAMP)`,
      [uuidv4(), session.user_id, instanceId, JSON.stringify({ signingSecret })]
    );

    // Consume pairing session
    await db.run(
      "UPDATE bridge_pairing_sessions SET status = 'AUTHORIZED', device_token = ? WHERE id = ?",
      [tokenHash, session.id]
    );

    await logAuditEvent({
      userId: session.user_id,
      action: 'BOT_INSTANCE_PAIRED',
      entityType: 'BOT_INSTANCE',
      entityId: instanceId,
      ipAddress: params.ipAddress,
      details: { instanceName: params.instanceName, version: params.engineVersion }
    });

    return {
      success: true,
      instanceId,
      deviceToken: rawToken,
      signingSecret
    };
  }

  /**
   * Verifies an incoming device token from the agent.
   */
  public static async authenticateAgentToken(rawToken: string): Promise<{
    authenticated: boolean;
    instance?: { id: string; user_id: string; instance_name: string; signingSecret?: string };
  }> {
    if (!rawToken || !rawToken.startsWith('bot_')) return { authenticated: false };
    const db = await getDatabaseAsync();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const row = await db.get<{ id: string; user_id: string; instance_id: string; is_revoked: number }>(
      'SELECT id, user_id, instance_id, is_revoked FROM device_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (!row || row.is_revoked === 1) {
      return { authenticated: false };
    }

    // Update last_used_at
    await db.run('UPDATE device_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);

    const instance = await db.get<{ id: string; user_id: string; instance_name: string }>(
      'SELECT id, user_id, instance_name FROM bot_instances WHERE id = ?',
      [row.instance_id]
    );

    if (!instance) return { authenticated: false };

    // Get signing secret from active config
    const config = await db.get<{ notifications_json: string }>(
      'SELECT notifications_json FROM bot_configs WHERE instance_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1',
      [instance.id]
    );
    let signingSecret: string | undefined;
    try {
      const parsed = JSON.parse(config?.notifications_json || '{}');
      signingSecret = parsed.signingSecret;
    } catch {}

    return {
      authenticated: true,
      instance: {
        id: instance.id,
        user_id: instance.user_id,
        instance_name: instance.instance_name,
        signingSecret
      }
    };
  }

  /**
   * Ingests and processes an incoming heartbeat from a local bot agent.
   */
  public static async processHeartbeat(instanceId: string, heartbeat: BotHeartbeatPayload): Promise<void> {
    const db = await getDatabaseAsync();

    // 1. Update bot instance telemetry
    await db.run(
      `UPDATE bot_instances SET
         status = 'ONLINE',
         mode = ?,
         engine_version = ?,
         last_heartbeat_at = CURRENT_TIMESTAMP,
         last_error = ?,
         uptime_seconds = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        heartbeat.mode || 'DEMO',
        heartbeat.engineVersion || '1.0.0',
        heartbeat.lastError || null,
        heartbeat.uptimeSeconds || 0,
        instanceId
      ]
    );

    // 2. Snapshot local risk limits
    if (heartbeat.localLimitsSnapshot) {
      const snap = heartbeat.localLimitsSnapshot;
      const snapHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(snap))
        .digest('hex');

      await db.run(
        `INSERT INTO risk_limits_local_snapshot
           (id, user_id, instance_id, max_risk_pct_ceiling, max_lots_ceiling, max_drawdown_pct_ceiling, live_trading_allowed_locally, snapshot_hash, reported_at)
         VALUES
           (?, (SELECT user_id FROM bot_instances WHERE id = ?), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(instance_id) DO UPDATE SET
           max_risk_pct_ceiling = excluded.max_risk_pct_ceiling,
           max_lots_ceiling = excluded.max_lots_ceiling,
           max_drawdown_pct_ceiling = excluded.max_drawdown_pct_ceiling,
           live_trading_allowed_locally = excluded.live_trading_allowed_locally,
           snapshot_hash = excluded.snapshot_hash,
           reported_at = CURRENT_TIMESTAMP`,
        [
          uuidv4(),
          instanceId,
          instanceId,
          snap.maxRiskPctCeiling || 1.0,
          snap.maxLotsCeiling || 1.0,
          snap.maxDrawdownPctCeiling || 5.0,
          snap.liveTradingAllowedLocally ? 1 : 0,
          snapHash
        ]
      );
    }
  }

  /**
   * Validates safety boundaries for a cloud command before queuing.
   * Hard Rule 3: The cloud can NEVER enable live trading or raise risk limits above local machine ceiling.
   */
  public static async validateAndDispatchCommand(params: {
    userId: string;
    instanceId: string;
    commandType: 'start' | 'stop' | 'pause' | 'resume' | 'close_all' | 'kill_switch' | 'update_config';
    payload: Record<string, any>;
    ipAddress?: string;
  }): Promise<{ success: boolean; commandId?: string; error?: string }> {
    const db = await getDatabaseAsync();

    // 1. Check user entitlement to manage instances
    const entitlement = await db.get<{ can_trade: number; expires_at: string }>(
      'SELECT can_trade, expires_at FROM entitlements WHERE user_id = ?',
      [params.userId]
    );

    // If subscription expired or trade entitlement revoked, allow only emergency stop/pause/close_all
    if (entitlement && (new Date(entitlement.expires_at).getTime() < Date.now() || entitlement.can_trade === 0)) {
      if (['start', 'resume'].includes(params.commandType)) {
        return {
          success: false,
          error:
            'Active subscription required to start bot or open new positions. Open positions remain managed by local stop losses.'
        };
      }
    }

    // 2. Fetch local limits snapshot for this instance
    const localSnapshot = await db.get<{
      max_risk_pct_ceiling: number;
      max_lots_ceiling: number;
      max_drawdown_pct_ceiling: number;
      live_trading_allowed_locally: number;
    }>('SELECT * FROM risk_limits_local_snapshot WHERE instance_id = ?', [params.instanceId]);

    // 3. Enforce Hard Rule 3: Cloud cannot raise risk above local ceiling or enable live trading
    if (params.commandType === 'update_config' && params.payload.riskPercent) {
      const requestedRisk = parseFloat(params.payload.riskPercent);
      const ceiling = localSnapshot?.max_risk_pct_ceiling ?? 1.0;
      if (requestedRisk > ceiling) {
        return {
          success: false,
          error: `Requested risk percent (${requestedRisk}%) exceeds local machine hard ceiling (${ceiling}%). Local limits always win.`
        };
      }
    }

    if (params.payload.mode === 'LIVE' && (!localSnapshot || localSnapshot.live_trading_allowed_locally === 0)) {
      return {
        success: false,
        error:
          'Live trading requires explicit local physical confirmation on the user machine (allow_live_trading=true in local_limits.json). Cloud cannot enable live trading.'
      };
    }

    // 4. Retrieve signing secret
    const config = await db.get<{ notifications_json: string }>(
      'SELECT notifications_json FROM bot_configs WHERE instance_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1',
      [params.instanceId]
    );
    let signingSecret = 'default-agent-hmac-secret';
    try {
      const parsed = JSON.parse(config?.notifications_json || '{}');
      if (parsed.signingSecret) signingSecret = parsed.signingSecret;
    } catch {}

    const commandId = uuidv4();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min TTL
    const idempotencyKey = `cmd-${params.instanceId}-${Date.now()}-${nonce.slice(0, 8)}`;

    const messageToSign = {
      commandId,
      instanceId: params.instanceId,
      commandType: params.commandType,
      payload: params.payload,
      nonce,
      expiresAt
    };

    const signature = this.signPayload(messageToSign, signingSecret);

    await db.run(
      `INSERT INTO bot_commands
         (id, user_id, instance_id, command_type, payload_json, signature, nonce, idempotency_key, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', CURRENT_TIMESTAMP, ?)`,
      [
        commandId,
        params.userId,
        params.instanceId,
        params.commandType,
        JSON.stringify(params.payload),
        signature,
        nonce,
        idempotencyKey,
        expiresAt
      ]
    );

    await logAuditEvent({
      userId: params.userId,
      action: `BOT_COMMAND_${params.commandType.toUpperCase()}`,
      entityType: 'BOT_COMMAND',
      entityId: commandId,
      ipAddress: params.ipAddress,
      details: { instanceId: params.instanceId, payload: params.payload }
    });

    return { success: true, commandId };
  }

  /**
   * Retrieves pending commands for an agent and marks them DELIVERED.
   */
  public static async getPendingCommandsForAgent(instanceId: string): Promise<any[]> {
    const db = await getDatabaseAsync();
    const commands = await db.query(
      `SELECT * FROM bot_commands
       WHERE instance_id = ? AND status = 'QUEUED' AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at ASC`,
      [instanceId]
    );

    for (const cmd of commands) {
      await db.run("UPDATE bot_commands SET status = 'DELIVERED' WHERE id = ?", [cmd.id]);
    }

    return commands;
  }

  /**
   * Records execution result of a command from the local agent.
   */
  public static async acknowledgeCommand(params: {
    commandId: string;
    instanceId: string;
    success: boolean;
    result?: Record<string, any>;
    errorMessage?: string;
  }): Promise<void> {
    const db = await getDatabaseAsync();
    await db.run(
      `UPDATE bot_commands SET
         status = ?,
         executed_at = CURRENT_TIMESTAMP,
         result_json = ?,
         error_message = ?
       WHERE id = ? AND instance_id = ?`,
      [
        params.success ? 'EXECUTED' : 'FAILED',
        JSON.stringify(params.result || {}),
        params.errorMessage || null,
        params.commandId,
        params.instanceId
      ]
    );
  }
}

export default BotService;
