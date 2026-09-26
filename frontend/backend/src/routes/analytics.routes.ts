import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AnalyticsService } from '../services/analytics.service';

const router = Router();

router.get('/overview', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.query.accountId as string;
    const symbol = req.query.symbol as string;
    const session = req.query.session as string;
    const strategyId = req.query.strategyId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const direction = req.query.direction as 'BUY' | 'SELL';

    const overview = await AnalyticsService.getAccountPerformance(userId, accountId, {
      symbol,
      session,
      strategyId,
      startDate,
      endDate,
      direction
    });

    res.json({ overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
