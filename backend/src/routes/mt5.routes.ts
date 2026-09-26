import { Router } from 'express';
import { requireUserAuth, requireBridgeOrUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { BridgeService } from '../services/bridge.service';
import { SyncService, MT5SyncPayload } from '../services/sync.service';

const router = Router();

// =========================================================================
// 1-Click Browser Pairing Session Endpoints
// =========================================================================

// Create pairing session (called by Bridge App on startup)
router.post('/bridge/session/create', async (req, res) => {
  try {
    const { deviceName } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const session = await BridgeService.createPairingSession(deviceName || 'Local Windows Terminal', clientIp);
    res.json({
      success: true,
      ...session
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Poll pairing session status (called by Bridge App)
router.get('/bridge/session/:sessionCode/status', async (req, res) => {
  try {
    const result = await BridgeService.pollAndConsumePairingToken(req.params.sessionCode);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get pairing session info (called by Web UI /pair page)
router.get('/bridge/session/:sessionCode', async (req, res) => {
  try {
    const session = await BridgeService.getPairingSession(req.params.sessionCode);
    if (!session) {
      res.status(404).json({ error: 'Pairing session not found or expired.' });
      return;
    }
    res.json({
      sessionCode: session.session_code,
      deviceName: session.device_name,
      ipAddress: session.ip_address,
      status: session.status,
      expiresAt: session.expires_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authorize pairing session (called by Authenticated Web User)
router.post('/bridge/session/:sessionCode/authorize', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await BridgeService.authorizePairingSession(req.params.sessionCode, req.user!.userId, clientIp);
    res.json({ success: true, message: 'Device successfully authorized.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reject pairing session (called by Authenticated Web User)
router.post('/bridge/session/:sessionCode/reject', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await BridgeService.rejectPairingSession(req.params.sessionCode, req.user!.userId);
    res.json({ success: true, message: 'Device pairing rejected.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// Existing Device Management Endpoints
// =========================================================================

// Generate Bridge Pairing Token manually (Legacy / Developer fallback)
router.post('/bridge/pair', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { deviceName } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await BridgeService.registerDevice(req.user!.userId, deviceName || 'Local Windows Terminal', clientIp);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Paired Devices
router.get('/bridge/devices', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const devices = await BridgeService.getUserDevices(req.user!.userId);
    res.json({ devices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke Device
router.delete('/bridge/devices/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await BridgeService.revokeDevice(req.user!.userId, req.params.id);
    res.json({ success: true, message: 'Device authorization revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MT5 Bridge Status & Verification Endpoint
router.get('/status', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  res.json({
    status: 'ONLINE',
    bridgeDevice: req.bridgeDevice || null,
    serverTime: new Date().toISOString(),
    version: '1.0.0-PROD'
  });
});

// Get Checkpoint For Incremental Sync
router.get('/checkpoint/:accountId', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const checkpoint = await SyncService.getLatestCheckpoint(req.params.accountId);
    res.json({ checkpoint: checkpoint || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest MT5 Sync Payload (Historical 3-month or Incremental)
router.post('/sync', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload: MT5SyncPayload = req.body;
    if (!payload || !payload.accountInfo || !payload.accountInfo.accountNumber) {
      res.status(400).json({ error: 'Invalid MT5 sync payload. Missing accountInfo.' });
      return;
    }

    const userId = req.user!.userId;
    const deviceId = req.bridgeDevice?.deviceId;

    const result = await SyncService.processSyncPayload(userId, payload, deviceId);
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
