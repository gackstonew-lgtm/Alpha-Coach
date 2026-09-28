import { Router } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SettingsService } from '../services/settings.service';
import { ZodError } from 'zod';

const router = Router();

// GET /api/v1/settings - Fetch user settings
router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await SettingsService.getSettings(req.user!.userId);
    res.json({
      success: true,
      settings,
      requestId: req.requestId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_FETCH_ERROR',
        message: err.message || 'Failed to fetch user settings.'
      },
      requestId: req.requestId
    });
  }
});

// PUT /api/v1/settings - Update user settings with validation
router.put('/', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await SettingsService.updateSettings(req.user!.userId, req.body);
    res.json({
      success: true,
      settings: updated,
      requestId: req.requestId
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid settings payload provided.',
          details: err.errors
        },
        requestId: req.requestId
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_UPDATE_ERROR',
        message: err.message || 'Failed to update user settings.'
      },
      requestId: req.requestId
    });
  }
});

// POST /api/v1/settings/reset - Reset a section or all settings to defaults
router.post('/reset', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const section = req.body?.section || 'all';
    const settings = await SettingsService.resetSection(req.user!.userId, section);
    res.json({
      success: true,
      settings,
      message: `Section "${section}" reset to default values.`,
      requestId: req.requestId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_FAILED',
        message: err.message || 'Failed to reset settings.'
      },
      requestId: req.requestId
    });
  }
});

// POST /api/v1/settings/change-password - Change account password
router.post('/change-password', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Both currentPassword and newPassword are required.'
        },
        requestId: req.requestId
      });
      return;
    }
    await SettingsService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({
      success: true,
      message: 'Password changed successfully.',
      requestId: req.requestId
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_FAILED',
        message: err.message || 'Failed to change password.'
      },
      requestId: req.requestId
    });
  }
});

// POST /api/v1/settings/avatar - Upload avatar
router.post('/avatar', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { avatarUrl } = req.body;
    if (avatarUrl === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AVATAR_REQUIRED',
          message: 'avatarUrl is required (can be null or a URL/base64 string).'
        },
        requestId: req.requestId
      });
      return;
    }
    const updated = await SettingsService.updateSettings(req.user!.userId, {
      profile: { avatarUrl }
    });
    res.json({
      success: true,
      avatarUrl: updated.profile.avatarUrl,
      settings: updated,
      requestId: req.requestId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AVATAR_UPDATE_FAILED',
        message: err.message || 'Failed to update avatar.'
      },
      requestId: req.requestId
    });
  }
});

// GET /api/v1/settings/export - Export full user archive
router.get('/export', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const archive = await SettingsService.exportUserData(req.user!.userId);
    res.setHeader('Content-Type', archive.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${archive.filename}"`);
    res.json(archive.data);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: err.message || 'Failed to generate data archive.'
      },
      requestId: req.requestId
    });
  }
});

// DELETE /api/v1/settings/account - Delete user account with type-to-confirm check
router.delete('/account', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE' && confirmation !== req.user!.email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONFIRMATION_INVALID',
          message: 'Please confirm account deletion by typing DELETE or your email address.'
        },
        requestId: req.requestId
      });
      return;
    }

    await SettingsService.deleteAccount(req.user!.userId);
    res.json({
      success: true,
      message: 'Your Meta Coach account and all associated trading data have been permanently deleted.',
      requestId: req.requestId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_FAILED',
        message: err.message || 'Failed to delete account.'
      },
      requestId: req.requestId
    });
  }
});

export default router;
