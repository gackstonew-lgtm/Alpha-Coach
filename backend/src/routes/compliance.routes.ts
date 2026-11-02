import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireUserAuth, AuthenticatedRequest, logAuditEvent } from '../middlewares/auth.middleware';
import { getDatabase } from '../db/db';
import { COMPLIANCE_CONFIG, isCountryBlocked } from '../config/compliance.config';
import { SettingsService } from '../services/settings.service';

const router = Router();

/**
 * GET /api/v1/compliance/tos-status
 * Inspect whether current user has accepted the latest draft terms and policies
 */
router.get('/tos-status', requireUserAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.requestId || uuidv4();
  const userId = req.user!.userId;
  const db = getDatabase();

  try {
    const latestAcceptance = await db.get<{
      id: string;
      tos_version: string;
      privacy_version: string;
      risk_disclosure_version: string;
      accepted_at: string;
    }>(
      `SELECT id, tos_version, privacy_version, risk_disclosure_version, accepted_at
       FROM tos_acceptances
       WHERE user_id = ?
       ORDER BY accepted_at DESC LIMIT 1`,
      [userId]
    );

    const hasAcceptedCurrent =
      latestAcceptance?.tos_version === COMPLIANCE_CONFIG.currentVersions.tos &&
      latestAcceptance?.privacy_version === COMPLIANCE_CONFIG.currentVersions.privacy &&
      latestAcceptance?.risk_disclosure_version === COMPLIANCE_CONFIG.currentVersions.riskDisclosure;

    res.json({
      success: true,
      data: {
        hasAcceptedCurrent: Boolean(hasAcceptedCurrent),
        currentVersions: COMPLIANCE_CONFIG.currentVersions,
        latestAcceptance: latestAcceptance || null,
        minUserAge: COMPLIANCE_CONFIG.minUserAge
      },
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TOS_STATUS_ERROR', message: err.message || 'Failed to check TOS acceptance.' },
      requestId: reqId
    });
  }
});

/**
 * POST /api/v1/compliance/accept-tos
 * Record mandatory user acceptance of Terms, Privacy Policy, and Risk Disclosure
 */
router.post('/accept-tos', requireUserAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.requestId || uuidv4();
  const userId = req.user!.userId;
  const db = getDatabase();

  const { isAgeConfirmed, countryCode } = req.body;

  if (isAgeConfirmed !== true) {
    res.status(400).json({
      success: false,
      error: { code: 'AGE_VERIFICATION_REQUIRED', message: 'You must confirm that you are at least 18 years of age.' },
      requestId: reqId
    });
    return;
  }

  if (countryCode && isCountryBlocked(countryCode)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'JURISDICTION_RESTRICTED',
        message: 'Arcade Fx is not offered in your jurisdiction due to local regulatory restrictions.'
      },
      requestId: reqId
    });
    return;
  }

  try {
    const acceptanceId = uuidv4();
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await db.run(
      `INSERT INTO tos_acceptances (
        id, user_id, tos_version, privacy_version, risk_disclosure_version, ip_address, user_agent, accepted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, tos_version) DO UPDATE SET
        accepted_at = CURRENT_TIMESTAMP,
        ip_address = excluded.ip_address,
        user_agent = excluded.user_agent`,
      [
        acceptanceId,
        userId,
        COMPLIANCE_CONFIG.currentVersions.tos,
        COMPLIANCE_CONFIG.currentVersions.privacy,
        COMPLIANCE_CONFIG.currentVersions.riskDisclosure,
        ipAddress,
        userAgent
      ]
    );

    await logAuditEvent({
      userId,
      action: 'COMPLIANCE_TOS_ACCEPTED',
      entityType: 'tos_acceptance',
      entityId: acceptanceId,
      ipAddress,
      details: {
        tosVersion: COMPLIANCE_CONFIG.currentVersions.tos,
        privacyVersion: COMPLIANCE_CONFIG.currentVersions.privacy,
        riskVersion: COMPLIANCE_CONFIG.currentVersions.riskDisclosure
      }
    });

    res.json({
      success: true,
      message: 'Terms of Service and Risk Disclosures successfully accepted.',
      data: {
        tosVersion: COMPLIANCE_CONFIG.currentVersions.tos,
        acceptedAt: new Date().toISOString()
      },
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TOS_ACCEPTANCE_ERROR', message: err.message || 'Failed to record acceptance.' },
      requestId: reqId
    });
  }
});

/**
 * GET /api/v1/compliance/blocked-regions
 * Public endpoint to query blocked jurisdictions and compliance terms
 */
router.get('/blocked-regions', (req, res) => {
  const reqId = (req as any).requestId || uuidv4();
  res.json({
    success: true,
    data: {
      blockedCountries: COMPLIANCE_CONFIG.blockedCountries,
      minAge: COMPLIANCE_CONFIG.minUserAge,
      disclaimers: COMPLIANCE_CONFIG.disclaimerStatements
    },
    requestId: reqId
  });
});

/**
 * POST /api/v1/compliance/check-country
 * Checks if a specific ISO-2 country code is restricted
 */
router.post('/check-country', (req, res) => {
  const reqId = (req as any).requestId || uuidv4();
  const { countryCode } = req.body;
  const blocked = isCountryBlocked(countryCode);

  res.json({
    success: true,
    data: {
      countryCode: countryCode ? countryCode.toUpperCase() : null,
      isBlocked: blocked,
      message: blocked ? 'Service is not offered in this country.' : 'Jurisdiction accepted.'
    },
    requestId: reqId
  });
});

/**
 * GET /api/v1/compliance/export-data
 * Full GDPR/Privacy user data export
 */
router.get('/export-data', requireUserAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.requestId || uuidv4();
  const userId = req.user!.userId;
  const db = getDatabase();

  try {
    const baseExport = await SettingsService.exportUserData(userId);
    const botInstances = await db.query(`SELECT * FROM bot_instances WHERE user_id = ?`, [userId]);
    const botConfigs = await db.query(`SELECT * FROM bot_configs WHERE user_id = ?`, [userId]);
    const tosRecords = await db.query(`SELECT * FROM tos_acceptances WHERE user_id = ?`, [userId]);

    const enrichedData = {
      ...baseExport.data,
      botFleet: {
        instancesCount: botInstances.length,
        instances: botInstances,
        configs: botConfigs
      },
      compliance: {
        tosAcceptances: tosRecords
      }
    };

    await logAuditEvent({
      userId,
      action: 'COMPLIANCE_DATA_EXPORTED',
      entityType: 'data_export',
      entityId: userId,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      details: { exportSize: JSON.stringify(enrichedData).length }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${baseExport.filename}"`);
    res.json({
      success: true,
      data: enrichedData,
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DATA_EXPORT_FAILED', message: err.message || 'Data export failed.' },
      requestId: reqId
    });
  }
});

/**
 * POST /api/v1/compliance/delete-account
 * Permanent account deletion request with verification
 */
router.post('/delete-account', requireUserAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.requestId || uuidv4();
  const userId = req.user!.userId;
  const { confirmationText } = req.body;

  if (confirmationText !== 'DELETE MY ACCOUNT PERMANENTLY') {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONFIRMATION_MISMATCH',
        message: 'Must enter exact phrase "DELETE MY ACCOUNT PERMANENTLY" to confirm deletion.'
      },
      requestId: reqId
    });
    return;
  }

  try {
    await logAuditEvent({
      userId,
      action: 'COMPLIANCE_ACCOUNT_DELETED',
      entityType: 'user_account',
      entityId: userId,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      details: { reason: 'User requested self-deletion' }
    });
    await SettingsService.deleteAccount(userId);

    res.json({
      success: true,
      message: 'Account and associated records permanently deleted.',
      requestId: reqId
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ACCOUNT_DELETION_FAILED', message: err.message || 'Failed to delete account.' },
      requestId: reqId
    });
  }
});

export default router;
