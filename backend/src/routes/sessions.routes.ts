import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SessionIntelligenceService } from '../services/session.service';

const router = Router();

router.get('/analytics', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const result = await SessionIntelligenceService.getSessionAnalytics(req.user!.userId, accountId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
