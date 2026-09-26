import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AICoachService } from '../services/ai.service';

const router = Router();

// Get Trader DNA
router.get('/trader-dna', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const dna = await AICoachService.getTraderDNA(req.user!.userId, accountId);
    res.json({ dna });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ask AI Trading Coach
router.post('/chat', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { question, accountId } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const response = await AICoachService.queryCoach(req.user!.userId, question, accountId);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
