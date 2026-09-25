import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ReportService } from '../services/report.service';

const router = Router();

router.get('/generate', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const type = ((req.query.type as string) || 'WEEKLY').toUpperCase() as 'WEEKLY' | 'MONTHLY';
    const accountId = req.query.accountId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = await ReportService.generateReport(req.user!.userId, type, accountId, startDate, endDate);
    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/csv', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    const csvContent = await ReportService.exportTradesCSV(req.user!.userId, accountId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="alpha_coach_trades_${new Date().toISOString().substring(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
