import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { EconomicCalendarService } from '../services/economic.service';

const router = Router();

router.get('/events', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const events = await EconomicCalendarService.getEvents(startDate, endDate);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
