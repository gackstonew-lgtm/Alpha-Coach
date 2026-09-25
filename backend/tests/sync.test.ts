import { SyncService, MT5SyncPayload } from '../src/services/sync.service';
import { initDatabase, getDatabase } from '../src/db/db';
import { AuthService } from '../src/services/auth.service';

describe('MT5 Synchronization & Idempotency Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    await initDatabase();
    const uniqueEmail = `sync_tester_${Date.now()}@alphacoach.io`;
    const registered = await AuthService.register({
      email: uniqueEmail,
      password: 'TestPassword123!',
      firstName: 'Sync',
      lastName: 'Tester'
    });
    testUserId = registered.user.id;
  });

  it('should synchronize MT5 payload and reconstruct positions properly', async () => {
    const payload: MT5SyncPayload = {
      accountInfo: {
        accountNumber: `998811_${Date.now()}`,
        brokerName: 'HFM Global',
        serverName: 'HFM-Live',
        currency: 'USD',
        leverage: 100,
        balance: 10500.0,
        equity: 10500.0,
        margin: 0.0,
        freeMargin: 10500.0
      },
      orders: [
        {
          ticket: 7001,
          symbol: 'XAUUSD',
          type: 0, // BUY
          state: 2,
          volume_initial: 0.1,
          volume_current: 0.0,
          price_open: 2450.0,
          sl: 2440.0,
          tp: 2470.0,
          time_setup: '2026-09-20T08:00:00Z'
        }
      ],
      deals: [
        {
          ticket: 8001,
          order: 7001,
          position_id: 9001,
          symbol: 'XAUUSD',
          type: 0, // BUY
          entry: 0, // IN
          volume: 0.1,
          price: 2450.0,
          commission: -1.5,
          swap: 0.0,
          profit: 0.0,
          time: '2026-09-20T08:00:00Z'
        },
        {
          ticket: 8002,
          order: 7002,
          position_id: 9001,
          symbol: 'XAUUSD',
          type: 1, // SELL
          entry: 1, // OUT
          volume: 0.1,
          price: 2465.0,
          commission: -1.5,
          swap: 0.0,
          profit: 150.0,
          time: '2026-09-20T09:30:00Z',
          comment: '[tp 2470.0]'
        }
      ]
    };

    const firstSync = await SyncService.processSyncPayload(testUserId, payload);
    expect(firstSync.dealsProcessed).toBe(2);
    expect(firstSync.positionsReconstructed).toBe(1);
    expect(firstSync.closedTradesCount).toBe(1);

    // IDEMPOTENCY TEST: Running sync a second time with exact same records must not duplicate positions
    const secondSync = await SyncService.processSyncPayload(testUserId, payload);
    expect(secondSync.dealsProcessed).toBe(2);
    expect(secondSync.positionsReconstructed).toBe(1);
    expect(secondSync.closedTradesCount).toBe(1);

    const db = getDatabase();
    const positionsInDb = await db.query(
      `SELECT * FROM reconstructed_positions WHERE account_id = ?`,
      [firstSync.accountId]
    );
    expect(positionsInDb.length).toBe(1);
    expect(positionsInDb[0].net_profit).toBe(147.0); // 150 - 3 commission
  });
});
