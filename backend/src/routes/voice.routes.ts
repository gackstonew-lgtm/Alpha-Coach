import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { VoiceJournalService } from '../services/voice.service';

const router = Router();

router.post('/parse', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcript text is required.' });
      return;
    }

    const suggestions = VoiceJournalService.parseVoiceTranscript(transcript);
    res.json({
      originalTranscript: transcript,
      suggestions,
      requiresConfirmation: true,
      message: 'Suggested fields generated. Please review and confirm before saving.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
