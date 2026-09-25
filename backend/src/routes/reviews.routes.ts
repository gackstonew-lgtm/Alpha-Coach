import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ReviewService } from '../services/review.service';
import { getDatabase } from '../db/db';

const router = Router();

router.get('/trade/:positionId', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const details = await ReviewService.getTradeJournalDetails(req.params.positionId, req.user!.userId);
    res.json(details);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.put('/trade/:positionId', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updatedJournal = await ReviewService.updateTradeReview(req.params.positionId, req.user!.userId, req.body);
    res.json({ journal: updatedJournal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/screenshots', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { journalId, stage, imageUrl, caption } = req.body;
    if (!journalId || !imageUrl) {
      res.status(400).json({ error: 'journalId and imageUrl are required.' });
      return;
    }
    const screenshot = await ReviewService.addScreenshot(journalId, req.user!.userId, stage || 'CHART', imageUrl, caption);
    res.status(201).json({ screenshot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mistake-tags', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const tags = await db.query(
      `SELECT * FROM mistake_tags WHERE user_id = ? OR user_id = 'SYSTEM' ORDER BY name ASC`,
      [req.user!.userId]
    );
    res.json({ mistakeTags: tags });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
