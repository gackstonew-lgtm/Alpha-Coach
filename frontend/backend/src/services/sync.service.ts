import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { TradingAccount, SyncCheckpoint } from '../models/types';
import { PositionReconstructionService } from './reconstruction.service';
import { RiskGuardianService } from './risk.service';
import { GamificationService } from './gamification.service';

export interface MT5SyncPayload {
  accountInfo: {
    accountNumber: string | number;
    brokerName: string;
    serverName: string;
    currency: string;
    leverage: number;
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel?: number;
    accountType?: 'hedging' | 'netting';
  };
  orders?: Array<{
    ticket: string | number;
    symbol: string;
    type: number;
    state: number;
    volume_initial: number;
    volume_current: number;
    price_open: number;
    sl?: number;
    tp?: number;
    time_setup: string;
    time_done?: string;
    time_expiration?: string;
    magic?: number;
    comment?: string;
  }>;
  deals?: Array<{
    ticket: string | number;
    order: string | number;
    position_id: string | number;
    symbol: string;
    type: number;
    entry: number;
    volume: number;
    price: number;
    commission?: number;
    swap?: number;
    profit?: number;
    fee?: number;
    sl?: number;
    tp?: number;
    time: string;
    magic?: number;
    comment?: string;
  }>;
}

export class SyncService {
  /**
   * Upserts or creates a trading account for the user
   */
  public static async getOrCreateAccount(userId: string, accountInfo: MT5SyncPayload['accountInfo']): Promise<TradingAccount> {
    const db = getDatabase();
    const accNum = String(accountInfo.accountNumber);
    const serverName = accountInfo.serverName || 'DefaultServer';
    const brokerName = accountInfo.brokerName || 'MetaQuotes';

    let account = await db.get<TradingAccount>(
      `SELECT * FROM trading_accounts WHERE user_id = ? AND account_number = ? AND server_name = ?`,
      [userId, accNum, serverName]
    );

    if (account) {
      await db.run(
        `UPDATE trading_accounts SET
          balance = ?, equity = ?, margin = ?, free_margin = ?, margin_level = ?,
          leverage = ?, currency = ?, broker_name = ?, last_synced_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          accountInfo.balance,
          accountInfo.equity,
          accountInfo.margin,
          accountInfo.freeMargin,
          accountInfo.marginLevel || 0,
          accountInfo.leverage || 100,
          accountInfo.currency || 'USD',
          brokerName,
          account.id
        ]
      );
      account = (await db.get<TradingAccount>(`SELECT * FROM trading_accounts WHERE id = ?`, [account.id]))!;
    } else {
      const accountId = uuidv4();
      await db.run(
        `INSERT INTO trading_accounts (
          id, user_id, account_number, broker_name, server_name, currency, leverage,
          balance, equity, margin, free_margin, margin_level, account_type, is_active, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [
          accountId,
          userId,
          accNum,
          brokerName,
          serverName,
          accountInfo.currency || 'USD',
          accountInfo.leverage || 100,
          accountInfo.balance,
          accountInfo.equity,
          accountInfo.margin,
          accountInfo.freeMargin,
          accountInfo.marginLevel || 0,
          accountInfo.accountType || 'hedging'
        ]
      );
      account = (await db.get<TradingAccount>(`SELECT * FROM trading_accounts WHERE id = ?`, [accountId]))!;
    }

    return account;
  }

  /**
   * Ingest raw orders and deals safely with upsert and trigger position reconstruction
   */
  public static async processSyncPayload(
    userId: string,
    payload: MT5SyncPayload,
    deviceId?: string
  ): Promise<{
    accountId: string;
    ordersProcessed: number;
    dealsProcessed: number;
    positionsReconstructed: number;
    closedTradesCount: number;
  }> {
    const db = getDatabase();
    const account = await this.getOrCreateAccount(userId, payload.accountInfo);
    const syncId = uuidv4();

    // Create sync checkpoint record
    await db.run(
      `INSERT INTO sync_checkpoints (id, account_id, sync_status, started_at)
       VALUES (?, ?, 'IN_PROGRESS', CURRENT_TIMESTAMP)`,
      [syncId, account.id]
    );

    let ordersProcessed = 0;
    let dealsProcessed = 0;
    let latestDealTime: string | null = null;
    let latestDealId: string | null = null;
    let latestOrderTime: string | null = null;
    let latestOrderId: string | null = null;

    try {
      // 1. Process Orders
      if (payload.orders && payload.orders.length > 0) {
        for (const ord of payload.orders) {
          const ordId = String(ord.ticket);
          const timeSetup = ord.time_setup ? new Date(ord.time_setup).toISOString() : new Date().toISOString();
          const timeDone = ord.time_done ? new Date(ord.time_done).toISOString() : null;
          const timeExp = ord.time_expiration ? new Date(ord.time_expiration).toISOString() : null;

          await db.run(
            `INSERT INTO raw_orders (
              id, account_id, order_id, symbol, type, state, volume_initial, volume_current,
              price_open, price_sl, price_tp, time_setup, time_done, time_expiration, magic, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(account_id, order_id) DO UPDATE SET
              state = excluded.state,
              volume_current = excluded.volume_current,
              price_sl = excluded.price_sl,
              price_tp = excluded.price_tp,
              time_done = excluded.time_done`,
            [
              uuidv4(),
              account.id,
              ordId,
              ord.symbol,
              ord.type,
              ord.state,
              ord.volume_initial,
              ord.volume_current,
              ord.price_open,
              ord.sl || 0,
              ord.tp || 0,
              timeSetup,
              timeDone,
              timeExp,
              ord.magic || 0,
              ord.comment || null
            ]
          );

          ordersProcessed++;
          latestOrderId = ordId;
          latestOrderTime = timeSetup;
        }
      }

      // 2. Process Deals
      if (payload.deals && payload.deals.length > 0) {
        for (const deal of payload.deals) {
          const dealId = String(deal.ticket);
          const orderId = String(deal.order);
          const posId = String(deal.position_id || deal.order);
          const timeIso = deal.time ? new Date(deal.time).toISOString() : new Date().toISOString();

          await db.run(
            `INSERT INTO raw_deals (
              id, account_id, deal_id, order_id, position_id, symbol, type, entry,
              volume, price, commission, swap, profit, fee, price_sl, price_tp, time, magic, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(account_id, deal_id) DO UPDATE SET
              commission = excluded.commission,
              swap = excluded.swap,
              profit = excluded.profit,
              fee = excluded.fee,
              price_sl = excluded.price_sl,
              price_tp = excluded.price_tp`,
            [
              uuidv4(),
              account.id,
              dealId,
              orderId,
              posId,
              deal.symbol,
              deal.type,
              deal.entry,
              deal.volume,
              deal.price,
              deal.commission || 0,
              deal.swap || 0,
              deal.profit || 0,
              deal.fee || 0,
              deal.sl || 0,
              deal.tp || 0,
              timeIso,
              deal.magic || 0,
              deal.comment || null
            ]
          );

          dealsProcessed++;
          latestDealId = dealId;
          latestDealTime = timeIso;
        }
      }

      // 3. Reconstruct Positions & Lifecycle
      const { positionsCount, closedTradesCount } = await PositionReconstructionService.reconstructAccountPositions(
        account.id,
        userId
      );

      // 4. Update Sync Checkpoint
      await db.run(
        `UPDATE sync_checkpoints SET
          sync_status = 'COMPLETED',
          deals_count = ?,
          positions_count = ?,
          trades_count = ?,
          last_deal_id = ?,
          last_deal_time = ?,
          last_order_id = ?,
          last_order_time = ?,
          completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [dealsProcessed, positionsCount, closedTradesCount, latestDealId, latestDealTime, latestOrderId, latestOrderTime, syncId]
      );

      // 5. Evaluate Risk Guardian rules
      await RiskGuardianService.evaluateRules(userId, account.id);

      // 6. Award Gamification XP for synchronization
      await GamificationService.recordSyncActivity(userId, closedTradesCount);

      // 7. Audit Log
      await db.run(
        `INSERT INTO audit_logs (id, user_id, account_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, ?, 'SYNC_SUCCESS', 'sync_checkpoint', ?, ?)`,
        [
          uuidv4(),
          userId,
          account.id,
          syncId,
          JSON.stringify({ dealsProcessed, ordersProcessed, positionsCount, closedTradesCount, deviceId })
        ]
      );

      // 8. Create notification
      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link)
         VALUES (?, ?, 'MT5 Sync Complete', ?, 'SYNC', '/journal')`,
        [
          uuidv4(),
          userId,
          `Synchronized ${dealsProcessed} deals across ${positionsCount} positions (${closedTradesCount} completed trades).`
        ]
      );

      // 9. Sync to Supabase Postgres cloud store if available
      try {
        const { getSupabaseAdmin, getSupabaseAnon } = require('../lib/supabase');
        const supabase = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
          ? getSupabaseAdmin()
          : getSupabaseAnon();
        if (supabase) {
          await supabase.from('trading_accounts').upsert({
            id: account.id,
            user_id: userId,
            account_number: String(payload.accountInfo.accountNumber),
            broker_name: payload.accountInfo.brokerName || 'Exness (KE) Limited',
            server_name: payload.accountInfo.serverName || 'ExnessKE-MT5Real21',
            currency: payload.accountInfo.currency || 'USD',
            leverage: payload.accountInfo.leverage || 100,
            balance: payload.accountInfo.balance,
            equity: payload.accountInfo.equity,
            margin: payload.accountInfo.margin,
            free_margin: payload.accountInfo.freeMargin,
            margin_level: payload.accountInfo.marginLevel || 0,
            account_type: payload.accountInfo.accountType || 'hedging',
            is_active: 1,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'id' });

          const positions = await db.query(
            `SELECT * FROM reconstructed_positions WHERE account_id = ?`,
            [account.id]
          );
          if (positions && positions.length > 0) {
            await supabase.from('reconstructed_positions').upsert(positions, { onConflict: 'id' });
          }
        }
      } catch (supaSyncErr) {
        console.warn('[SyncService] Supabase cloud sync skipped:', supaSyncErr);
      }

      return {
        accountId: account.id,
        ordersProcessed,
        dealsProcessed,
        positionsReconstructed: positionsCount,
        closedTradesCount
      };
    } catch (err: any) {
      await db.run(
        `UPDATE sync_checkpoints SET
          sync_status = 'FAILED',
          error_message = ?,
          completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [err.message || 'Sync error', syncId]
      );
      throw err;
    }
  }

  /**
   * Get latest sync checkpoint for incremental fetch
   */
  public static async getLatestCheckpoint(accountId: string): Promise<SyncCheckpoint | undefined> {
    const db = getDatabase();
    return db.get<SyncCheckpoint>(
      `SELECT * FROM sync_checkpoints WHERE account_id = ? AND sync_status = 'COMPLETED' ORDER BY completed_at DESC LIMIT 1`,
      [accountId]
    );
  }
}
