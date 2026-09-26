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
router.post('/bridge/session/create', async (req, res) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  try {
    const { deviceName } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const session = await BridgeService.createPairingSession(deviceName || 'Local Windows Terminal', clientIp);
    res.json({
      success: true,
      ...session,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_CREATE_ERROR',
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
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_POLL_ERROR',
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
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Pairing session not found or expired.'
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
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_FETCH_ERROR',
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
    res.json({
      success: true,
      message: 'Device successfully authorized.',
      requestId: reqId
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_FAILED',
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
    res.json({
      success: true,
      message: 'Device pairing rejected.',
      requestId: reqId
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REJECTION_FAILED',
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

// MT5 Bridge Status & Verification Endpoint
router.get('/status', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  const reqId = req.requestId || uuidv4();
  res.json({
    success: true,
    status: 'ONLINE',
    bridgeDevice: req.bridgeDevice || null,
    serverTime: new Date().toISOString(),
    version: '1.0.4-PROD',
    requestId: reqId
  });
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

// Ingest MT5 Sync Payload (Historical 90-day or Incremental)
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

export default router;

