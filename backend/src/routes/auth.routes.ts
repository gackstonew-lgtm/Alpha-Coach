import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, timezone, currency } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Email, password, firstName, and lastName are required.' });
      return;
    }
    const result = await AuthService.register({ email, password, firstName, lastName, timezone, currency });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await AuthService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
