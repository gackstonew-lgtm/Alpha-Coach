import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { GamificationService } from '../services/gamification.service';

const router = Router();

router.get('/profile', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await GamificationService.getUserProgression(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
