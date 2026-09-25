import { Router } from 'express';
import { requireUserAuth, requireBridgeOrUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { BridgeService } from '../services/bridge.service';
import { SyncService, MT5SyncPayload } from '../services/sync.service';

const router = Router();

// 1. Generate Bridge Pairing Token (User UI creates token to paste into MT5 Bridge)
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

// 2. List Paired Devices
router.get('/bridge/devices', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const devices = await BridgeService.getUserDevices(req.user!.userId);
    res.json({ devices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Revoke Device
router.delete('/bridge/devices/:id', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await BridgeService.revokeDevice(req.user!.userId, req.params.id);
    res.json({ success: true, message: 'Device authorization revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. MT5 Bridge Status & Verification Endpoint (called by Python Bridge to test connectivity)
router.get('/status', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  res.json({
    status: 'ONLINE',
    bridgeDevice: req.bridgeDevice || null,
    serverTime: new Date().toISOString(),
    version: '1.0.0-PROD'
  });
});

// 5. Get Checkpoint For Incremental Sync (called by bridge before fetching deals/orders)
router.get('/checkpoint/:accountId', requireBridgeOrUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const checkpoint = await SyncService.getLatestCheckpoint(req.params.accountId);
    res.json({ checkpoint: checkpoint || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ingest MT5 Sync Payload (Historical 3-month or Incremental)
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
