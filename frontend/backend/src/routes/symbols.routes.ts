import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SymbolIntelligenceService } from '../services/symbol.service';

const router = Router();

router.get('/analytics', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const symbols = await SymbolIntelligenceService.getSymbolAnalytics(req.user!.userId, accountId);
    res.json({ symbols });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
