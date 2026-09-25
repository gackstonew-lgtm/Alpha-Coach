import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { RiskGuardianService } from '../services/risk.service';

const router = Router();

router.get('/rules', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const rules = await RiskGuardianService.getRules(req.user!.userId, accountId);
    res.json({ rules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rules', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const updated = await RiskGuardianService.updateRules(req.user!.userId, accountId, req.body);
    res.json({ rules: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alerts', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const alerts = await RiskGuardianService.getAlerts(req.user!.userId, accountId);
    res.json({ alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/:id/acknowledge', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await RiskGuardianService.acknowledgeAlert(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monitor', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    if (!accountId || accountId === 'ALL') {
      res.json({ status: 'SELECT_ACCOUNT' });
      return;
    }
    const monitor = await RiskGuardianService.evaluateRules(req.user!.userId, accountId);
    res.json({ monitor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
