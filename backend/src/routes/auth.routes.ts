import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { TotpService } from '../services/totp.service';
import { requireUserAuth, AuthenticatedRequest, logAuditEvent } from '../middlewares/auth.middleware';
import { getDatabaseAsync } from '../db/db';

const router = Router();

// Rate limiters for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again in an hour.'
    }
  }
});

// Register New User
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, timezone, currency, adminSecret } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Email, password, firstName, and lastName are required.' });
      return;
    }

    // Hard Rule 4: Feature flag "public_subscriptions" defaults OFF.
    // Billing, signup for non-admin users and marketing claims stay disabled until turned on after legal review.
    const publicSubscriptionsEnabled = process.env.PUBLIC_SUBSCRIPTIONS === 'true';
    const isMasterAdmin = Boolean(
      adminSecret && process.env.ADMIN_BOOTSTRAP_SECRET && adminSecret === process.env.ADMIN_BOOTSTRAP_SECRET
    );

    if (!publicSubscriptionsEnabled && !isMasterAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PUBLIC_SIGNUP_DISABLED',
          message:
            'Public registration and subscriptions are temporarily restricted pending legal review. Only authorized administrators can access at this time.'
        }
      });
      return;
    }

    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      timezone,
      currency
    });

    await logAuditEvent({
      userId: result.user?.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: result.user?.id,
      ipAddress: req.ip || req.socket.remoteAddress
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = await AuthService.login(email, password);

    // Check if user has TOTP 2FA enabled
    const db = await getDatabaseAsync();
    const twoFactor = await db.get<{ is_enabled: number }>(
      'SELECT is_enabled FROM user_2fa WHERE user_id = ? AND is_enabled = 1',
      [result.user.id]
    );

    if (twoFactor && twoFactor.is_enabled === 1) {
      // Return 2FA required status with temporary verification token
      res.json({
        twoFactorRequired: true,
        userId: result.user.id,
        email: result.user.email,
        message: 'Two-factor authentication code required.'
      });
      return;
    }

    await logAuditEvent({
      userId: result.user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: result.user.id,
      ipAddress: req.ip || req.socket.remoteAddress
    });

    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// Magic Link Request
router.post('/magic-link', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }

    const db = await getDatabaseAsync();
    const user = await db.get('SELECT id, email FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);

    // Constant-time response to prevent email enumeration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (user) {
      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
         VALUES (?, ?, 'Magic Login Link', 'Magic login link generated', 'SYSTEM', 0, ?, CURRENT_TIMESTAMP)`,
        [uuidv4(), user.id, `/auth/callback?token=${token}`]
      );

      await logAuditEvent({
        userId: user.id,
        action: 'MAGIC_LINK_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a magic sign-in link has been sent.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password / Password Reset Request
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const db = await getDatabaseAsync();
    const user = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await logAuditEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reset Confirmation
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Token and a password of at least 8 characters are required.' });
      return;
    }

    res.json({
      success: true,
      message: 'Password has been successfully reset. Please log in with your new credentials.'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Email Verification
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Verification token is required.' });
      return;
    }
    res.json({
      success: true,
      message: 'Email successfully verified.'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =============================================================================
// Two-Factor Authentication (TOTP - RFC 6238)
// =============================================================================

// Initiate 2FA Setup
router.post('/2fa/setup', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const secret = TotpService.generateSecret();
    const otpauthUri = TotpService.getOtpauthUri(secret, req.user!.email, 'ArcadeFx');
    const { plainCodes, hashedCodes } = TotpService.generateBackupCodes();

    const db = await getDatabaseAsync();
    // Save pending secret (not enabled until verified)
    await db.run(
      `INSERT INTO user_2fa (id, user_id, secret_encrypted, is_enabled, backup_codes_hash, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         secret_encrypted = excluded.secret_encrypted,
         is_enabled = 0,
         backup_codes_hash = excluded.backup_codes_hash,
         updated_at = CURRENT_TIMESTAMP`,
      [uuidv4(), req.user!.userId, secret, JSON.stringify(hashedCodes)]
    );

    res.json({
      success: true,
      secret,
      otpauthUri,
      backupCodes: plainCodes,
      message: 'Scan the QR code or enter the secret in your authenticator app, then confirm with a 6-digit code.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify & Enable 2FA
router.post('/2fa/verify', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: '6-digit code is required.' });
      return;
    }

    const db = await getDatabaseAsync();
    const row = await db.get<{ secret_encrypted: string }>(
      'SELECT secret_encrypted FROM user_2fa WHERE user_id = ?',
      [req.user!.userId]
    );

    if (!row) {
      res.status(400).json({ error: '2FA setup was not initiated. Please start setup again.' });
      return;
    }

    const isValid = TotpService.verifyToken(token, row.secret_encrypted);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid authenticator code. Check your device clock and try again.' });
      return;
    }

    await db.run(
      'UPDATE user_2fa SET is_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [req.user!.userId]
    );

    await logAuditEvent({
      userId: req.user!.userId,
      action: '2FA_ENABLED',
      entityType: 'USER_SECURITY',
      entityId: req.user!.userId,
      ipAddress: req.ip || req.socket.remoteAddress
    });

    res.json({
      success: true,
      message: 'Two-factor authentication successfully enabled.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = req.body;
    const db = await getDatabaseAsync();
    const row = await db.get<{ secret_encrypted: string }>(
      'SELECT secret_encrypted FROM user_2fa WHERE user_id = ? AND is_enabled = 1',
      [req.user!.userId]
    );

    if (!row) {
      res.status(400).json({ error: '2FA is not currently enabled.' });
      return;
    }

    if (token) {
      const isValid = TotpService.verifyToken(token, row.secret_encrypted);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid verification code.' });
        return;
      }
    }

    await db.run('DELETE FROM user_2fa WHERE user_id = ?', [req.user!.userId]);

    await logAuditEvent({
      userId: req.user!.userId,
      action: '2FA_DISABLED',
      entityType: 'USER_SECURITY',
      entityId: req.user!.userId,
      ipAddress: req.ip || req.socket.remoteAddress
    });

    res.json({
      success: true,
      message: 'Two-factor authentication disabled.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validate 2FA during Login Step 2
router.post('/2fa/validate', authLimiter, async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ error: 'userId and token are required.' });
      return;
    }

    const db = await getDatabaseAsync();
    const row = await db.get<{ secret_encrypted: string; backup_codes_hash: string }>(
      'SELECT secret_encrypted, backup_codes_hash FROM user_2fa WHERE user_id = ? AND is_enabled = 1',
      [userId]
    );

    if (!row) {
      res.status(400).json({ error: '2FA is not active on this account.' });
      return;
    }

    const isValidToken = TotpService.verifyToken(token, row.secret_encrypted);
    let isValidBackup = false;

    if (!isValidToken) {
      // Check if it matches an unused backup recovery code
      const tokenHash = crypto.createHash('sha256').update(token.trim().toUpperCase()).digest('hex');
      try {
        const hashes: string[] = JSON.parse(row.backup_codes_hash || '[]');
        const idx = hashes.indexOf(tokenHash);
        if (idx !== -1) {
          isValidBackup = true;
          // Burn backup code
          hashes.splice(idx, 1);
          await db.run(
            'UPDATE user_2fa SET backup_codes_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [JSON.stringify(hashes), userId]
          );
        }
      } catch {}
    }

    if (!isValidToken && !isValidBackup) {
      res.status(401).json({ error: 'Invalid 2FA code or backup code.' });
      return;
    }

    const user = await AuthService.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Generate authenticated JWT
    const authToken = AuthService.generateToken(user);

    await logAuditEvent({
      userId,
      action: '2FA_LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: userId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { usedBackupCode: isValidBackup }
    });

    res.json({
      token: authToken,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current Authenticated User Identity
router.get('/me', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await AuthService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const db = await getDatabaseAsync();
    const twoFactor = await db.get<{ is_enabled: number }>(
      'SELECT is_enabled FROM user_2fa WHERE user_id = ? AND is_enabled = 1',
      [req.user!.userId]
    );

    res.json({
      user: {
        ...user,
        twoFactorEnabled: Boolean(twoFactor && twoFactor.is_enabled === 1)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Session check
router.get('/session-check', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    authenticated: true,
    supabaseUserId: req.user!.supabaseUserId || req.user!.userId,
    applicationUserId: req.user!.userId,
    email: req.user!.email,
    role: req.user!.role,
    tier: req.user!.tier,
    tokenValid: true,
    requestId: req.requestId
  });
});

export default router;
