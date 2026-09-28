import request from 'supertest';
import { app } from '../src/app';
import { initDatabase, getDatabase } from '../src/db/db';
import { AuthService } from '../src/services/auth.service';
import { SettingsService } from '../src/services/settings.service';

describe('Settings API & Persistence Integration Tests', () => {
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    await initDatabase();
    const uniqueEmail = `settings_tester_${Date.now()}@metacoach.io`;
    const registered = await AuthService.register({
      email: uniqueEmail,
      password: 'StrongPassword123!',
      firstName: 'Settings',
      lastName: 'Tester',
      timezone: 'America/New_York',
      currency: 'USD'
    });
    testUserId = registered.user.id;
    authToken = AuthService.generateToken({ id: testUserId, email: uniqueEmail });
  });

  it('GET /api/v1/settings without token must return 401', async () => {
    const res = await request(app).get('/api/v1/settings');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/settings returns sensible defaults for new user', async () => {
    const res = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings).toBeDefined();
    expect(res.body.settings.profile.firstName).toBe('Settings');
    expect(res.body.settings.profile.timezone).toBe('America/New_York');
    expect(res.body.settings.risk.dailyLossLimitAmount).toBeGreaterThan(0);
    expect(res.body.settings.journal.customSetups.length).toBeGreaterThan(0);
    expect(res.body.settings.display.plDisplayMode).toBe('money');
    expect(res.body.settings.sessions.london.enabled).toBe(true);
  });

  it('PUT /api/v1/settings updates settings and persists them', async () => {
    const updates = {
      profile: {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        timezone: 'Europe/London'
      },
      risk: {
        dailyLossLimitType: 'amount' as const,
        dailyLossLimitAmount: 750,
        maxTradesPerDay: 8,
        maxPositionSize: 3.5,
        consecutiveLossLimit: 2
      },
      display: {
        plDisplayMode: 'r_multiple' as const,
        layoutDensity: 'compact' as const
      },
      security: {
        privacyMode: true
      }
    };

    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings.profile.firstName).toBe('UpdatedFirst');
    expect(res.body.settings.profile.timezone).toBe('Europe/London');
    expect(res.body.settings.risk.dailyLossLimitAmount).toBe(750);
    expect(res.body.settings.risk.maxTradesPerDay).toBe(8);
    expect(res.body.settings.display.plDisplayMode).toBe('r_multiple');
    expect(res.body.settings.display.layoutDensity).toBe('compact');
    expect(res.body.settings.security.privacyMode).toBe(true);

    // Verify database persistence on next GET
    const verifyRes = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`);
    expect(verifyRes.body.settings.profile.firstName).toBe('UpdatedFirst');
    expect(verifyRes.body.settings.risk.dailyLossLimitAmount).toBe(750);
    expect(verifyRes.body.settings.security.privacyMode).toBe(true);
  });

  it('PUT /api/v1/settings rejects invalid types via Zod validation', async () => {
    const invalidPayload = {
      risk: {
        dailyLossLimitAmount: -500 // negative amount not allowed
      }
    };

    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/settings/reset resets a section to default values', async () => {
    const res = await request(app)
      .post('/api/v1/settings/reset')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ section: 'risk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Default risk limit is 500
    expect(res.body.settings.risk.dailyLossLimitAmount).toBe(500);
    expect(res.body.settings.risk.maxTradesPerDay).toBe(5);
  });

  it('GET /api/v1/settings/export generates valid user data archive', async () => {
    const res = await request(app)
      .get('/api/v1/settings/export')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metaCoachExportVersion).toBe('1.0');
    expect(res.body.user).toBeDefined();
    expect(res.body.settings).toBeDefined();
    expect(res.body.accounts).toBeInstanceOf(Array);
  });
});
