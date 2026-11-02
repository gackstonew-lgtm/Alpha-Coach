import crypto from 'crypto';
import request from 'supertest';
import { app } from '../src/app';
import { initDatabase, getDatabase } from '../src/db/db';
import { AuthService } from '../src/services/auth.service';
import { BotService } from '../src/services/bot.service';
import { SubscriptionService } from '../src/services/billing/subscription.service';
import { COMPLIANCE_CONFIG, isCountryBlocked } from '../src/config/compliance.config';

describe('MT5 Bot Management & Security Unit Tests', () => {
  let testUserId: string;
  let testUserToken: string;
  let testEmail: string;
  let testInstanceId: string;
  let deviceTokenPlain: string;

  beforeAll(async () => {
    await initDatabase();
    testEmail = `bot_tester_${Date.now()}@metacoach.io`;
    const reg = await AuthService.register({
      email: testEmail,
      password: 'StrongPassword123!',
      firstName: 'Bot',
      lastName: 'Tester',
      timezone: 'UTC',
      currency: 'USD'
    });
    testUserId = reg.user.id;
    testUserToken = AuthService.generateToken({ id: testUserId, email: testEmail });
  });

  describe('1. Secure Pairing Flow & One-Time Tokens', () => {
    it('creates a 10-minute one-time pairing code', async () => {
      const pairing = await BotService.generatePairingCode(testUserId);
      expect(pairing.pairingCode).toBeDefined();
      expect(pairing.pairingCode.length).toBe(6);
      expect(new Date(pairing.expiresAt).getTime()).toBeGreaterThan(Date.now() + 500 * 1000);
    });

    it('claims pairing code and returns rotating device token', async () => {
      const pairing = await BotService.generatePairingCode(testUserId);
      const claim = await BotService.claimPairingCode({
        pairingCode: pairing.pairingCode,
        instanceName: 'VPS-London-MT5',
        engineVersion: '1.0.0',
        ipAddress: '192.168.1.50'
      });

      expect(claim).toBeDefined();
      expect(claim.success).toBe(true);
      expect(claim.instanceId).toBeDefined();
      expect(claim.deviceToken).toBeDefined();
      expect(claim.deviceToken!.length).toBeGreaterThan(32);

      testInstanceId = claim.instanceId!;
      deviceTokenPlain = claim.deviceToken!;

      // Single-use guarantee: claiming again must return success: false
      const reClaim = await BotService.claimPairingCode({
        pairingCode: pairing.pairingCode,
        instanceName: 'VPS-London-MT5',
        engineVersion: '1.0.0',
        ipAddress: '192.168.1.50'
      });
      expect(reClaim.success).toBe(false);
      expect(reClaim.error).toMatch(/already been claimed or expired/i);
    });

    it('verifies device token hash on server without storing raw plain token', async () => {
      const db = getDatabase();
      const tokenRow = await db.get<{ token_hash: string }>(
        `SELECT token_hash FROM device_tokens WHERE instance_id = ?`,
        [testInstanceId]
      );
      expect(tokenRow).toBeDefined();

      const expectedHash = crypto.createHash('sha256').update(deviceTokenPlain).digest('hex');
      expect(tokenRow?.token_hash).toBe(expectedHash);
    });

    it('authenticates valid agent token and rejects tampered token', async () => {
      const validAuth = await BotService.authenticateAgentToken(deviceTokenPlain);
      expect(validAuth.authenticated).toBe(true);
      expect(validAuth.instance?.id).toBe(testInstanceId);

      const invalidAuth = await BotService.authenticateAgentToken('tampered_fake_token_value_123456');
      expect(invalidAuth.authenticated).toBe(false);
    });
  });

  describe('2. Cryptographic Command Signing & Replay Protection', () => {
    it('generates verifiable HMAC-SHA256 signature', () => {
      const dynamicSigningKey = crypto.randomBytes(32).toString('hex');
      const payload = { commandId: 'cmd_123', action: 'stop', nonce: 'nonce_abc', expiresAt: '2026-11-02T12:00:00Z' };

      const signature = BotService.signPayload(payload, dynamicSigningKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64);

      const isValid = BotService.verifySignature(payload, signature, dynamicSigningKey);
      expect(isValid).toBe(true);

      const tampered = { ...payload, action: 'start' };
      const isTamperedValid = BotService.verifySignature(tampered, signature, dynamicSigningKey);
      expect(isTamperedValid).toBe(false);
    });
  });

  describe('3. Local Risk Ceiling & Safe Cloud Bounds Enforcement', () => {
    beforeAll(async () => {
      // Ingest local risk limits snapshot from agent
      await BotService.processHeartbeat(testInstanceId, {
        instanceName: 'VPS-London-MT5',
        botState: 'RUNNING',
        mt5Connected: true,
        accountNumberMasked: '****5678',
        currency: 'USD',
        mode: 'DEMO',
        balance: 10000,
        equity: 10000,
        openPositions: [],
        engineVersion: '1.0.0',
        uptimeSeconds: 3600,
        localLimitsSnapshot: {
          maxRiskPctCeiling: 1.0,
          maxLotsCeiling: 1.5,
          maxDrawdownPctCeiling: 5.0,
          liveTradingAllowedLocally: false
        }
      });
    });

    it('server strictly blocks updating risk percentage above local machine ceiling', async () => {
      // Attempting to dispatch risk 2.5% when local ceiling is 1.0% must fail
      const result = await BotService.validateAndDispatchCommand({
        userId: testUserId,
        instanceId: testInstanceId,
        commandType: 'update_config',
        payload: {
          riskPercent: 2.5
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/exceeds local machine hard ceiling/i);
    });

    it('server strictly blocks forcing live trading without local machine permission', async () => {
      // Local snapshot reported liveTradingAllowedLocally = false
      const result = await BotService.validateAndDispatchCommand({
        userId: testUserId,
        instanceId: testInstanceId,
        commandType: 'update_config',
        payload: {
          mode: 'LIVE'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/explicit local physical confirmation/i);
    });

    it('server accepts safe config command within local machine ceiling', async () => {
      const result = await BotService.validateAndDispatchCommand({
        userId: testUserId,
        instanceId: testInstanceId,
        commandType: 'update_config',
        payload: {
          riskPercent: 0.75,
          symbols: ['EURUSD', 'GBPUSD'],
          maxTradesPerDay: 3
        }
      });

      expect(result.success).toBe(true);
      expect(result.commandId).toBeDefined();
    });
  });

  describe('4. Entitlement & Position Protection Enforcement', () => {
    it('subscription service checks user entitlements and protects open positions', async () => {
      const sub = await SubscriptionService.getUserSubscription(testUserId);
      expect(sub).toBeDefined();
      expect(sub.canTrade).toBe(true); // Default trial tier

      // Expire entitlement manually
      const db = getDatabase();
      await db.run(
        `INSERT OR REPLACE INTO entitlements (id, user_id, can_trade, max_instances, max_accounts, expires_at, updated_at)
         VALUES (?, ?, 0, 1, 1, datetime('now', '-1 day'), CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), testUserId]
      );

      // Attempting to dispatch start command with expired entitlement must be blocked
      const result = await BotService.validateAndDispatchCommand({
        userId: testUserId,
        instanceId: testInstanceId,
        commandType: 'start',
        payload: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/active subscription required/i);
      expect(result.error).toMatch(/open positions remain managed by local stop losses/i);
    });
  });

  describe('5. Compliance Scaffolding & Region Restrictions', () => {
    it('correctly blocks sanctioned jurisdictions', () => {
      expect(isCountryBlocked('KP')).toBe(true);
      expect(isCountryBlocked('IR')).toBe(true);
      expect(isCountryBlocked('SY')).toBe(true);
      expect(isCountryBlocked('DE')).toBe(false);
      expect(isCountryBlocked('KE')).toBe(false);
      expect(isCountryBlocked('US')).toBe(false);
    });

    it('requires age confirmation (18+) for TOS acceptance', async () => {
      const res = await request(app)
        .post('/api/v1/compliance/accept-tos')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ isAgeConfirmed: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AGE_VERIFICATION_REQUIRED');
    });

    it('records mandatory TOS and Risk Disclosure acceptance with audit logging', async () => {
      const res = await request(app)
        .post('/api/v1/compliance/accept-tos')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ isAgeConfirmed: true, countryCode: 'KE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tosVersion).toBe(COMPLIANCE_CONFIG.currentVersions.tos);

      const statusRes = await request(app)
        .get('/api/v1/compliance/tos-status')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.hasAcceptedCurrent).toBe(true);
    });
  });
});
