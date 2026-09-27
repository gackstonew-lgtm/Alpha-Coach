import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireUserAuth, requireBridgeOrUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { BridgeService } from '../services/bridge.service';
import { SyncService, MT5SyncPayload } from '../services/sync.service';

const router = Router();

// =========================================================================
// 1-Click Browser Pairing Session Endpoints
// =========================================================================

// Create pairing session (called by Bridge App on startup)
// Create pairing session (called by Bridge App on startup)
router.post('/bridge/session/create', async (req, res) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  try {
    const { deviceName } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const session = await BridgeService.createPairingSession(deviceName || 'Local Windows Terminal', clientIp);
    console.log(`[BridgePairing] Created pairing session [${session.sessionCode}] for device "${deviceName}" (reqId: ${reqId})`);
    res.json({
      success: true,
      ...session,
      requestId: reqId
    });
  } catch (err: any) {
    const code = err.code || 'SESSION_CREATE_ERROR';
    console.error(`[BridgePairing] Session creation error [${code}]:`, err.message, `(reqId: ${reqId})`);
    res.status(500).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to create pairing session.'
      },
      requestId: reqId
    });
  }
});

// Poll pairing session status (called by Bridge App)
router.get('/bridge/session/:sessionCode/status', async (req, res) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  try {
    const result = await BridgeService.pollAndConsumePairingToken(req.params.sessionCode);
    res.json({
      success: true,
      ...result,
      requestId: reqId
    });
  } catch (err: any) {
    const code = err.code || 'SESSION_POLL_ERROR';
    console.error(`[BridgePairing] Session poll error [${code}]:`, err.message, `(reqId: ${reqId})`);
    res.status(500).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to poll pairing session.'
      },
      requestId: reqId
    });
  }
});

// Get pairing session info (called by Web UI /pair page)
router.get('/bridge/session/:sessionCode', async (req, res) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  try {
    const session = await BridgeService.getPairingSession(req.params.sessionCode);
    if (!session) {
      console.warn(`[BridgePairing] Session [${req.params.sessionCode}] not found or expired (reqId: ${reqId})`);
      res.status(404).json({
        success: false,
        error: {
          code: 'PAIRING_SESSION_NOT_FOUND',
          message: 'Pairing session not found or has expired. Please initiate a new pairing from the MT5 Bridge app.'
        },
        requestId: reqId
      });
      return;
    }
    res.json({
      success: true,
      sessionCode: session.session_code,
      deviceName: session.device_name,
      ipAddress: session.ip_address,
      status: session.status,
      expiresAt: session.expires_at,
      requestId: reqId
    });
  } catch (err: any) {
    const code = err.code || 'SESSION_FETCH_ERROR';
    console.error(`[BridgePairing] Session fetch error [${code}]:`, err.message, `(reqId: ${reqId})`);
    res.status(500).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to fetch pairing session.'
      },
      requestId: reqId
    });
  }
});

// Authorize pairing session (called by Authenticated Web User)
router.post('/bridge/session/:sessionCode/authorize', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await BridgeService.authorizePairingSession(req.params.sessionCode, req.user!.userId, clientIp);
    console.log(`[BridgePairing] Authorized session [${req.params.sessionCode}] for user [${req.user!.userId}] (reqId: ${reqId})`);
    res.json({
      success: true,
      message: 'Device successfully authorized.',
      requestId: reqId
    });
  } catch (err: any) {
    const code = err.code || 'AUTHORIZATION_FAILED';
    console.error(`[BridgePairing] Authorization rejected [${code}] for session [${req.params.sessionCode}]:`, err.message, `(reqId: ${reqId})`);
    let statusCode = 400;
    if (code === 'PAIRING_SESSION_NOT_FOUND') statusCode = 404;
    else if (code === 'PAIRING_SESSION_EXPIRED') statusCode = 410;
    else if (code === 'FORBIDDEN') statusCode = 403;

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to authorize pairing session.'
      },
      requestId: reqId
    });
  }
});

// Reject pairing session (called by Authenticated Web User)
router.post('/bridge/session/:sessionCode/reject', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    await BridgeService.rejectPairingSession(req.params.sessionCode, req.user!.userId);
    console.log(`[BridgePairing] Rejected session [${req.params.sessionCode}] by user [${req.user!.userId}] (reqId: ${reqId})`);
    res.json({
      success: true,
      message: 'Device pairing rejected.',
      requestId: reqId
    });
  } catch (err: any) {
    const code = err.code || 'REJECTION_FAILED';
    console.error(`[BridgePairing] Rejection error [${code}] for session [${req.params.sessionCode}]:`, err.message, `(reqId: ${reqId})`);
    res.status(400).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to reject pairing session.'
      },
      requestId: reqId
    });
  }
});

// =========================================================================
// Dedicated Device Authentication Status Check (Phase 7)
// =========================================================================

router.get('/bridge/device/status', async (req, res) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  const bridgeToken = (req.headers['x-bridge-token'] as string) || '';

  const authCheck = await BridgeService.checkDeviceAuth(bridgeToken);
  if (!authCheck.authorized) {
    res.status(401).json({
      success: false,
      authorized: false,
      status: authCheck.status,
      error: authCheck.error,
      serverTime: authCheck.serverTime,
      requestId: reqId
    });
    return;
  }

  res.json({
    success: true,
    authorized: true,
    status: authCheck.status,
    deviceId: authCheck.deviceId,
    deviceName: authCheck.deviceName,
    userId: authCheck.userId,
    serverTime: authCheck.serverTime,
    requestId: reqId
  });
});

// =========================================================================
// Device Management Endpoints
// =========================================================================

// Generate Bridge Pairing Token manually (Legacy / Developer fallback)
router.post('/bridge/pair', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const { deviceName } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await BridgeService.registerDevice(req.user!.userId, deviceName || 'Local Windows Terminal', clientIp);
    res.json({
      success: true,
      ...result,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DEVICE_PAIR_ERROR',
        message: err.message || 'Failed to pair device.'
      },
      requestId: reqId
    });
  }
});

// List Paired Devices
router.get('/bridge/devices', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const devices = await BridgeService.getUserDevices(req.user!.userId);
    res.json({
      success: true,
      devices,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DEVICES_FETCH_ERROR',
        message: err.message || 'Failed to fetch paired devices.'
      },
      requestId: reqId
    });
  }
});

// Revoke Device
router.delete('/bridge/devices/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    await BridgeService.revokeDevice(req.user!.userId, req.params.id);
    res.json({
      success: true,
      message: 'Device authorization revoked.',
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REVOCATION_FAILED',
        message: err.message || 'Failed to revoke device.'
      },
      requestId: reqId
    });
  }
});

import { BUILD_INFO } from '../buildInfo';
import { getDatabaseAsync } from '../db/db';

// MT5 Bridge Status & Verification Endpoint
router.get('/status', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  let dbStatus = 'UNAVAILABLE';
  let dbType = 'POSTGRESQL';
  try {
    const db = await getDatabaseAsync();
    if (db) {
      await db.query('SELECT 1');
      dbStatus = 'CONNECTED';
      dbType = process.env.DATABASE_URL ? 'POSTGRESQL' : 'SQLITE';
    }
  } catch {
    dbStatus = 'DEGRADED';
  }

  res.json({
    success: true,
    status: dbStatus === 'CONNECTED' ? 'ONLINE' : 'DEGRADED',
    database: dbStatus,
    databaseType: dbType,
    bridgeDevice: req.bridgeDevice || null,
    serverTime: new Date().toISOString(),
    version: BUILD_INFO.version,
    buildVersion: BUILD_INFO.version,
    gitCommit: BUILD_INFO.gitCommit,
    buildTimestamp: BUILD_INFO.buildTimestamp,
    environment: BUILD_INFO.environment,
    requestId: reqId
  });
});

// Comprehensive MT5 Diagnostics Endpoint (Phase 22)
router.get('/diagnostics', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const db = await getDatabaseAsync();
    const userId = req.user?.userId || req.bridgeDevice?.userId;

    let accountsCount = 0;
    let rawDealsCount = 0;
    let rawOrdersCount = 0;
    let rawOpenPosCount = 0;
    let reconstructedCount = 0;
    let lastCheckpoint: any = null;

    if (db && userId) {
      const accRow = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM trading_accounts WHERE user_id = ?`,
        [userId]
      );
      accountsCount = accRow?.count || 0;

      const dealsRow = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM raw_deals d JOIN trading_accounts a ON d.account_id = a.id WHERE a.user_id = ?`,
        [userId]
      );
      rawDealsCount = dealsRow?.count || 0;

      const ordersRow = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM raw_orders o JOIN trading_accounts a ON o.account_id = a.id WHERE a.user_id = ?`,
        [userId]
      );
      rawOrdersCount = ordersRow?.count || 0;

      const openPosRow = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM raw_open_positions p JOIN trading_accounts a ON p.account_id = a.id WHERE a.user_id = ? AND p.is_active = 1`,
        [userId]
      );
      rawOpenPosCount = openPosRow?.count || 0;

      const reconRow = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM reconstructed_positions p JOIN trading_accounts a ON p.account_id = a.id WHERE a.user_id = ? AND p.symbol IS NOT NULL AND p.symbol != ''`,
        [userId]
      );
      reconstructedCount = reconRow?.count || 0;

      lastCheckpoint = await db.get(
        `SELECT * FROM sync_checkpoints c JOIN trading_accounts a ON c.account_id = a.id WHERE a.user_id = ? ORDER BY c.started_at DESC LIMIT 1`,
        [userId]
      );
    }

    const isConnected = !!db;
    const dbType = process.env.DATABASE_URL ? 'POSTGRESQL' : 'SQLITE';

    res.json({
      success: true,
      bridgeAuthorized: !!req.bridgeDevice || !!req.user,
      userId: userId || null,
      deviceId: req.bridgeDevice?.deviceId || null,
      database: {
        connected: isConnected,
        type: dbType,
        persistent: !!process.env.DATABASE_URL || process.env.NODE_ENV !== 'production'
      },
      build: {
        version: BUILD_INFO.version,
        commit: BUILD_INFO.gitCommit,
        timestamp: BUILD_INFO.buildTimestamp,
        environment: BUILD_INFO.environment
      },
      accounts: {
        persisted: accountsCount
      },
      telemetry: {
        rawDeals: rawDealsCount,
        rawOrders: rawOrdersCount,
        rawOpenPositions: rawOpenPosCount,
        reconstructedPositions: reconstructedCount
      },
      latestSync: lastCheckpoint ? {
        syncId: lastCheckpoint.id,
        status: lastCheckpoint.sync_status,
        timestamp: lastCheckpoint.completed_at || lastCheckpoint.started_at
      } : null,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DIAGNOSTICS_ERROR',
        message: err.message || 'Failed to generate MT5 diagnostics.'
      },
      requestId: reqId
    });
  }
});

// Get Checkpoint For Incremental Sync
router.get('/checkpoint/:accountId', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const checkpoint = await SyncService.getLatestCheckpoint(req.params.accountId);
    res.json({
      success: true,
      checkpoint: checkpoint || null,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECKPOINT_ERROR',
        message: err.message || 'Failed to get checkpoint.'
      },
      requestId: reqId
    });
  }
});

// Ingest MT5 Sync Payload (Historical 90-day, Incremental, or Full History)
router.post('/sync', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const payload: MT5SyncPayload = req.body;
    if (!payload || !payload.accountInfo || !payload.accountInfo.accountNumber) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid MT5 sync payload. Missing accountInfo.'
        },
        requestId: reqId
      });
      return;
    }

    const userId = req.user!.userId;
    const deviceId = req.bridgeDevice?.deviceId;

    const result = await SyncService.processSyncPayload(userId, payload, deviceId);
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_PROCESSING_ERROR',
        message: err.message || 'Failed to process sync payload.'
      },
      requestId: reqId
    });
  }
});

// Dedicated Full-History Synchronization Endpoint
router.post('/sync/full', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const payload: MT5SyncPayload = req.body;
    if (!payload || !payload.accountInfo || !payload.accountInfo.accountNumber) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid MT5 full-sync payload. Missing accountInfo.'
        },
        requestId: reqId
      });
      return;
    }

    const userId = req.user!.userId;
    const deviceId = req.bridgeDevice?.deviceId;

    const result = await SyncService.processSyncPayload(userId, payload, deviceId);
    res.status(200).json({
      success: true,
      mode: 'FULL_HISTORY',
      ...result,
      timestamp: new Date().toISOString(),
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FULL_SYNC_ERROR',
        message: err.message || 'Failed to process full MT5 synchronization.'
      },
      requestId: reqId
    });
  }
});

// Live Synchronization Reconciliation Endpoint
router.get('/reconcile/:accountId', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  try {
    const result = await SyncService.getAccountReconciliation(req.params.accountId);
    res.json({
      success: true,
      ...result,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILIATION_ERROR',
        message: err.message || 'Failed to generate reconciliation report.'
      },
      requestId: reqId
    });
  }
});

export default router;

