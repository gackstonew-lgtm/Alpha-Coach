import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../src/app';
import { initDatabase, getDatabaseAsync } from '../src/db/db';
import { AuthService } from '../src/services/auth.service';
import { SyncService, MT5SyncPayload } from '../src/services/sync.service';

describe('Canonical Authentication & MT5 Persistence Architecture Tests', () => {
  let db: any;
  const testUserId = uuidv4();
  const testEmail = `trader_${Date.now()}@alphacoach.io`;
  let validToken: string;

  beforeAll(async () => {
    db = await initDatabase();
    // Synchronize Supabase user identity into application database
    await AuthService.syncSupabaseUser({
      id: testUserId,
      email: testEmail,
      user_metadata: {
        first_name: 'Canonical',
        last_name: 'Trader',
        role: 'trader',
        subscription_tier: 'PRO'
      }
    });

    validToken = AuthService.generateToken({
      id: testUserId,
      email: testEmail,
      role: 'trader',
      subscription_tier: 'PRO'
    });
  });

  describe('1. Cryptographic Token Verification & Anti-Tamper Security', () => {
    it('Rejects requests with missing Authorization header (401)', async () => {
      const res = await request(app).get('/api/v1/accounts');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('Rejects requests with tampered JWT token (401)', async () => {
      const tamperedToken = validToken.substring(0, validToken.length - 8) + 'TAMPERED';
      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${tamperedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_AUTH_TOKEN');
    });

    it('Rejects untrusted decoded claims when signature verification fails', async () => {
      // Craft an unverified token signed by an attacker's key
      const forgedToken = jwt.sign(
        { userId: testUserId, email: testEmail, role: 'trader' },
        'attacker-untrusted-secret'
      );
      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_AUTH_TOKEN');
    });

    it('Accepts valid cryptographically verified token (200)', async () => {
      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.accounts)).toBe(true);
    });
  });

  describe('2. User Profile Synchronization & Anti-Duplication', () => {
    it('Maps Supabase UUID directly as canonical user ID without duplicates', async () => {
      const syncResult1 = await AuthService.syncSupabaseUser({
        id: testUserId,
        email: testEmail,
        user_metadata: { first_name: 'Canonical', last_name: 'Trader' }
      });
      const syncResult2 = await AuthService.syncSupabaseUser({
        id: testUserId,
        email: testEmail,
        user_metadata: { first_name: 'Canonical', last_name: 'Trader' }
      });

      expect(syncResult1.id).toBe(testUserId);
      expect(syncResult2.id).toBe(testUserId);

      const userRows = await db.query('SELECT * FROM users WHERE id = ?', [testUserId]);
      expect(userRows.length).toBe(1);
    });

    it('Links legacy records when email matches without duplicating accounts', async () => {
      const legacyId = uuidv4();
      const legacyEmail = `legacy_${Date.now()}@alphacoach.io`;

      // Simulate legacy record in database
      await db.run(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, 'OLD_HASH', 'Legacy', 'User', 1)`,
        [legacyId, legacyEmail]
      );
      await db.run(
        `INSERT INTO trading_accounts (id, user_id, account_number, broker_name, server_name, balance, equity) VALUES (?, ?, 'LEGACY_123', 'Exness', 'Real', 500, 500)`,
        [uuidv4(), legacyId]
      );

      // Now Supabase user signs in with same email but new Supabase UUID
      const newSupabaseId = uuidv4();
      await AuthService.syncSupabaseUser({
        id: newSupabaseId,
        email: legacyEmail,
        user_metadata: { first_name: 'Migrated', last_name: 'User' }
      });

      // Verification: trading account must now belong to new Supabase UUID
      const account = await db.get('SELECT * FROM trading_accounts WHERE account_number = ?', ['LEGACY_123']);
      expect(account.user_id).toBe(newSupabaseId);
    });
  });

  describe('3. MT5 Data Persistence Independence from Login Sessions', () => {
    it('Persists MT5 accounts and trades across simulated login/logout cycles', async () => {
      const payload: MT5SyncPayload = {
        accountInfo: {
          accountNumber: `776655_${Date.now()}`,
          brokerName: 'Exness (KE) Limited',
          serverName: 'Exness-Real25',
          currency: 'USD',
          leverage: 200,
          balance: 1000.0,
          equity: 1000.0,
          margin: 0.0,
          freeMargin: 1000.0
        },
        orders: [
          {
            ticket: 101,
            symbol: 'XAUUSD',
            type: 0,
            state: 2,
            volume_initial: 0.05,
            volume_current: 0.0,
            price_open: 2600.0,
            time_setup: '2026-09-21T10:00:00Z'
          }
        ],
        deals: [
          {
            ticket: 201,
            order: 101,
            position_id: 301,
            symbol: 'XAUUSD',
            type: 0,
            entry: 0,
            volume: 0.05,
            price: 2600.0,
            time: '2026-09-21T10:00:00Z'
          },
          {
            ticket: 202,
            order: 102,
            position_id: 301,
            symbol: 'XAUUSD',
            type: 1,
            entry: 1,
            volume: 0.05,
            price: 2620.0,
            profit: 100.0,
            time: '2026-09-21T12:00:00Z'
          }
        ]
      };

      // Ingest MT5 sync
      await SyncService.processSyncPayload(testUserId, payload);

      // Verify accounts and trades are present
      const accountsRes1 = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${validToken}`);
      expect(accountsRes1.status).toBe(200);
      expect(accountsRes1.body.accounts.length).toBeGreaterThan(0);

      const tradesRes1 = await request(app)
        .get('/api/v1/trades')
        .set('Authorization', `Bearer ${validToken}`);
      expect(tradesRes1.status).toBe(200);
      expect(tradesRes1.body.trades.length).toBeGreaterThan(0);

      // Simulate Logout (Token discarded) & Re-login with newly minted Supabase access token
      const newSessionToken = AuthService.generateToken({
        id: testUserId,
        email: testEmail,
        role: 'trader',
        subscription_tier: 'PRO'
      });

      // Verify MT5 data is 100% preserved
      const accountsRes2 = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${newSessionToken}`);
      expect(accountsRes2.status).toBe(200);
      expect(accountsRes2.body.accounts.length).toBe(accountsRes1.body.accounts.length);

      const tradesRes2 = await request(app)
        .get('/api/v1/trades')
        .set('Authorization', `Bearer ${newSessionToken}`);
      expect(tradesRes2.status).toBe(200);
      expect(tradesRes2.body.trades.length).toBe(tradesRes1.body.trades.length);
    });
  });

  describe('4. Truthful Health & Diagnostics Endpoint', () => {
    it('Exposes database, authentication, and environment diagnostics on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ONLINE');
      expect(res.body.database).toBeDefined();
      expect(res.body.database.status).toBe('CONNECTED');
      expect(res.body.authentication.authority).toBe('SUPABASE_AUTH');
      expect(res.body.bridgeService.status).toBe('ONLINE');
    });
  });

  describe('5. Atomic MT5 Bridge Pairing Lifecycle & Re-Pairing', () => {
    let sessionCode: string;
    let deviceToken: string;

    it('Step A: Creates a fresh PENDING pairing session', async () => {
      const res = await request(app)
        .post('/api/v1/mt5/bridge/session/create')
        .send({ deviceName: 'Windows Desktop Terminal 64' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sessionCode).toMatch(/^pair_/);
      expect(res.body.expiresAt).toBeDefined();
      sessionCode = res.body.sessionCode;

      // Verify session exists in PENDING state
      const checkRes = await request(app).get(`/api/v1/mt5/bridge/session/${sessionCode}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.status).toBe('PENDING');
      expect(checkRes.body.deviceName).toBe('Windows Desktop Terminal 64');
    });

    it('Step B: Authenticated web user authorizes the pairing session (PENDING -> AUTHORIZED)', async () => {
      const res = await request(app)
        .post(`/api/v1/mt5/bridge/session/${sessionCode}/authorize`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/authorized/i);
    });

    it('Step C: Bridge polls session and atomically consumes device token (AUTHORIZED -> COMPLETED)', async () => {
      const res = await request(app)
        .get(`/api/v1/mt5/bridge/session/${sessionCode}/status`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHORIZED');
      expect(res.body.deviceToken).toMatch(/^ac_bridge_/);
      deviceToken = res.body.deviceToken;

      // Verify session is now COMPLETED and token cannot be fetched again
      const repeatRes = await request(app)
        .get(`/api/v1/mt5/bridge/session/${sessionCode}/status`);
      expect(repeatRes.status).toBe(200);
      expect(repeatRes.body.status).toBe('COMPLETED');
      expect(repeatRes.body.deviceToken).toBeUndefined();
    });

    it('Step D: Companion checks device authorization with token (returns ACTIVE with correct userId)', async () => {
      const res = await request(app)
        .get('/api/v1/mt5/bridge/device/status')
        .set('x-bridge-token', deviceToken);

      expect(res.status).toBe(200);
      expect(res.body.authorized).toBe(true);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.userId).toBe(testUserId);
    });

    it('Step E: Re-pairing creates fresh device token without wiping existing historical records', async () => {
      // Create new session
      const createRes = await request(app)
        .post('/api/v1/mt5/bridge/session/create')
        .send({ deviceName: 'Re-paired Terminal' });
      const newSessionCode = createRes.body.sessionCode;

      // Authorize
      await request(app)
        .post(`/api/v1/mt5/bridge/session/${newSessionCode}/authorize`)
        .set('Authorization', `Bearer ${validToken}`);

      // Consume
      const consumeRes = await request(app)
        .get(`/api/v1/mt5/bridge/session/${newSessionCode}/status`);
      const newDeviceToken = consumeRes.body.deviceToken;
      expect(newDeviceToken).toBeDefined();
      expect(newDeviceToken).not.toBe(deviceToken);

      // Verify new token works
      const authRes = await request(app)
        .get('/api/v1/mt5/bridge/device/status')
        .set('x-bridge-token', newDeviceToken);
      expect(authRes.body.authorized).toBe(true);
      expect(authRes.body.userId).toBe(testUserId);

      // Verify user's accounts still exist
      const accountsRes = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${validToken}`);
      expect(accountsRes.body.accounts.length).toBeGreaterThan(0);
    });

    it('Step F: Rejects attempt to authorize an already completed session with typed error code', async () => {
      const res = await request(app)
        .post(`/api/v1/mt5/bridge/session/${sessionCode}/authorize`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAIRING_SESSION_ALREADY_COMPLETED');
      expect(typeof res.body.error.message).toBe('string');
      expect(res.body.error.message).not.toContain('[object');
    });
  });
});
