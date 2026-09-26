import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { RawDeal, RawOrder, RawOpenPosition, ReconstructedPosition, PositionExecution } from '../models/types';

export class PositionReconstructionService {
  /**
   * Identifies session based on UTC open time:
   * Asia: 00:00 - 08:00 UTC
   * London: 07:00 - 16:00 UTC
   * New York: 13:00 - 21:00 UTC
   * London/NY Overlap: 13:00 - 16:00 UTC
   */
  public static determineSession(utcTimeString: string): string {
    const date = new Date(utcTimeString);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const timeDecimal = hour + minute / 60;

    if (timeDecimal >= 13 && timeDecimal <= 16) {
      return 'London/NY Overlap';
    } else if (timeDecimal >= 7 && timeDecimal < 13) {
      return 'London';
    } else if (timeDecimal > 16 && timeDecimal <= 21) {
      return 'New York';
    } else if (timeDecimal >= 0 && timeDecimal < 7) {
      return 'Asia';
    } else {
      return 'Off-Hours';
    }
  }

  /**
   * Determine exit reason from deal comments, SL/TP levels, and order history
   */
  public static determineExitReason(
    exitDeals: RawDeal[],
    initialSl?: number,
    initialTp?: number,
    posType: 'BUY' | 'SELL' = 'BUY'
  ): 'SL_HIT' | 'TP_HIT' | 'MANUAL' | 'SO_HIT' | 'PARTIAL' | 'UNKNOWN' {
    for (const deal of exitDeals) {
      const comment = (deal.comment || '').toLowerCase();
      if (comment.includes('sl') || comment.includes('stop loss') || comment.includes('s/l')) return 'SL_HIT';
      if (comment.includes('tp') || comment.includes('take profit') || comment.includes('t/p')) return 'TP_HIT';
      if (comment.includes('so') || comment.includes('stop out')) return 'SO_HIT';

      if (initialSl && initialSl > 0) {
        if (posType === 'BUY' && deal.price <= initialSl + 0.0001) return 'SL_HIT';
        if (posType === 'SELL' && deal.price >= initialSl - 0.0001) return 'SL_HIT';
      }
      if (initialTp && initialTp > 0) {
        if (posType === 'BUY' && deal.price >= initialTp - 0.0001) return 'TP_HIT';
        if (posType === 'SELL' && deal.price <= initialTp + 0.0001) return 'TP_HIT';
      }
    }
    return 'MANUAL';
  }

  /**
   * Reconstruct all positions for a specific trading account from raw deals, orders, and live open positions
   */
  public static async reconstructAccountPositions(accountId: string, userId: string): Promise<{
    positionsCount: number;
    closedTradesCount: number;
    openTradesCount: number;
  }> {
    const db = getDatabase();

    // 1. Fetch all raw deals for this account ordered by time and deal_id ASC
    const rawDeals = await db.query<RawDeal>(
      `SELECT * FROM raw_deals WHERE account_id = ? ORDER BY time ASC, deal_id ASC`,
      [accountId]
    );

    // 2. Fetch raw orders map for SL/TP and initial order matching
    const rawOrders = await db.query<RawOrder>(
      `SELECT * FROM raw_orders WHERE account_id = ?`,
      [accountId]
    );
    const orderMap = new Map<string, RawOrder>();
    for (const ord of rawOrders) {
      orderMap.set(ord.order_id, ord);
    }

    // 3. Fetch active raw open positions from live MT5 synchronization
    const rawOpenPositions = await db.query<RawOpenPosition>(
      `SELECT * FROM raw_open_positions WHERE account_id = ? AND is_active = 1`,
      [accountId]
    );
    const openPosMap = new Map<string, RawOpenPosition>();
    for (const op of rawOpenPositions) {
      openPosMap.set(op.position_id, op);
    }

    // 4. Group deals by position_id
    const dealsByPosition = new Map<string, RawDeal[]>();
    for (const deal of rawDeals) {
      const posId = deal.position_id || deal.order_id;
      if (!dealsByPosition.has(posId)) {
        dealsByPosition.set(posId, []);
      }
      dealsByPosition.get(posId)!.push(deal);
    }

    // Combine all unique position IDs from deals and active open positions
    const allPositionIds = new Set<string>([
      ...dealsByPosition.keys(),
      ...openPosMap.keys()
    ]);

    let positionsCount = 0;
    let closedTradesCount = 0;
    let openTradesCount = 0;

    for (const posId of allPositionIds) {
      positionsCount++;
      const deals = dealsByPosition.get(posId) || [];
      const liveOpenPos = openPosMap.get(posId);

      // Separate entry deals (entry === 0 or inout) vs exit deals (entry === 1 or out_by)
      const entryDeals = deals.filter(d => d.entry === 0 || d.entry === 2);
      const exitDeals = deals.filter(d => d.entry === 1 || d.entry === 3);

      let totalEntryVolume = 0;
      let totalEntryCost = 0;
      for (const d of entryDeals) {
        totalEntryVolume += d.volume;
        totalEntryCost += d.price * d.volume;
      }

      let totalExitVolume = 0;
      let totalExitCost = 0;
      let grossProfit = 0;
      let commissionTotal = 0;
      let swapTotal = 0;
      let feeTotal = 0;

      for (const d of deals) {
        commissionTotal += d.commission || 0;
        swapTotal += d.swap || 0;
        grossProfit += d.profit || 0;
        feeTotal += d.fee || 0;
      }

      for (const d of exitDeals) {
        totalExitVolume += d.volume;
        totalExitCost += d.price * d.volume;
      }

      // Determine whether position is CLOSED or OPEN based on MT5 facts:
      // A position is confirmed closed if:
      // 1. It is NOT reported in active live open positions AND has exit deals matching entry volume, OR
      // 2. It has exit deals matching/exceeding entry volume (and entry volume > 0)
      const isClosed = !liveOpenPos && (
        (totalExitVolume >= totalEntryVolume && totalEntryVolume > 0) ||
        (exitDeals.length > 0 && totalEntryVolume === 0)
      );

      let symbol = '';
      let positionType: 'BUY' | 'SELL' = 'BUY';
      let entryPriceAvg = 0;
      let openTime = '';
      let closeTime: string | undefined = undefined;
      let currentPrice: number | undefined = undefined;
      let floatingProfit = 0;
      let netProfit = 0;
      let magic = 0;
      let comment = '';
      let externalId = '';
      let initialSl: number | undefined = undefined;
      let initialTp: number | undefined = undefined;

      if (liveOpenPos) {
        // Position is currently LIVE in MT5
        symbol = liveOpenPos.symbol;
        positionType = liveOpenPos.type === 0 ? 'BUY' : 'SELL';
        entryPriceAvg = totalEntryVolume > 0 ? (totalEntryCost / totalEntryVolume) : liveOpenPos.price_open;
        totalEntryVolume = liveOpenPos.volume;
        openTime = liveOpenPos.time;
        closeTime = undefined;
        currentPrice = liveOpenPos.price_current;
        floatingProfit = liveOpenPos.profit || 0;
        swapTotal = liveOpenPos.swap || swapTotal;
        netProfit = floatingProfit + commissionTotal + swapTotal + feeTotal;
        magic = liveOpenPos.magic || 0;
        comment = liveOpenPos.comment || (deals[0]?.comment || '');
        externalId = liveOpenPos.external_id || '';
        initialSl = liveOpenPos.price_sl > 0 ? liveOpenPos.price_sl : undefined;
        initialTp = liveOpenPos.price_tp > 0 ? liveOpenPos.price_tp : undefined;
      } else if (deals.length > 0) {
        // Position is derived from Historical Deals
        const firstDeal = deals[0];
        symbol = firstDeal.symbol;
        positionType = (entryDeals.length > 0 ? entryDeals[0].type : firstDeal.type) === 0 ? 'BUY' : 'SELL';
        entryPriceAvg = totalEntryVolume > 0 ? (totalEntryCost / totalEntryVolume) : firstDeal.price;
        openTime = entryDeals.length > 0 ? entryDeals[0].time : deals[0].time;
        closeTime = isClosed && exitDeals.length > 0 ? exitDeals[exitDeals.length - 1].time : undefined;
        currentPrice = undefined;
        floatingProfit = 0;
        netProfit = grossProfit + commissionTotal + swapTotal + feeTotal;
        magic = firstDeal.magic || 0;
        comment = firstDeal.comment || '';
        externalId = firstDeal.external_id || '';

        const firstOrder = orderMap.get(firstDeal.order_id);
        if (firstOrder) {
          if (firstOrder.price_sl && firstOrder.price_sl > 0) initialSl = firstOrder.price_sl;
          if (firstOrder.price_tp && firstOrder.price_tp > 0) initialTp = firstOrder.price_tp;
        }
        if (!initialSl && firstDeal.price_sl && firstDeal.price_sl > 0) initialSl = firstDeal.price_sl;
        if (!initialTp && firstDeal.price_tp && firstDeal.price_tp > 0) initialTp = firstDeal.price_tp;
      } else {
        continue;
      }

      const exitPriceAvg = isClosed && totalExitVolume > 0 ? (totalExitCost / totalExitVolume) : undefined;

      let holdingSeconds = 0;
      if (openTime && closeTime) {
        holdingSeconds = Math.max(0, Math.floor((new Date(closeTime).getTime() - new Date(openTime).getTime()) / 1000));
      } else if (openTime) {
        holdingSeconds = Math.max(0, Math.floor((Date.now() - new Date(openTime).getTime()) / 1000));
      }

      // Risk Amount and R-Multiple calculations
      let riskAmount: number | undefined = undefined;
      let rMultiple: number | undefined = undefined;

      if (initialSl && initialSl > 0 && entryPriceAvg > 0) {
        const priceRisk = positionType === 'BUY' ? entryPriceAvg - initialSl : initialSl - entryPriceAvg;
        if (priceRisk > 0) {
          riskAmount = Math.abs(priceRisk * totalEntryVolume);
          if (riskAmount > 0) {
            const rawR = netProfit / (riskAmount * 100);
            rMultiple = isFinite(rawR) ? parseFloat(rawR.toFixed(2)) : undefined;
          }
        }
      }

      const sessionName = this.determineSession(openTime);
      const exitReason = isClosed ? this.determineExitReason(exitDeals, initialSl, initialTp, positionType) : 'UNKNOWN';
      const status: 'OPEN' | 'CLOSED' = isClosed ? 'CLOSED' : 'OPEN';

      // Check if position already exists in database
      const existingPos = await db.get<ReconstructedPosition>(
        `SELECT id FROM reconstructed_positions WHERE account_id = ? AND position_id = ?`,
        [accountId, posId]
      );

      const posGuid = existingPos?.id || uuidv4();

      if (existingPos) {
        await db.run(
          `UPDATE reconstructed_positions SET
            symbol = ?, position_type = ?, total_volume = ?, entry_price_avg = ?,
            exit_price_avg = ?, current_price = ?, floating_profit = ?, magic = ?, comment = ?, external_id = ?,
            open_time = ?, close_time = ?, status = ?,
            gross_profit = ?, commission_total = ?, swap_total = ?, fee_total = ?,
            net_profit = ?, initial_sl = ?, initial_tp = ?, risk_amount = ?,
            r_multiple = ?, holding_seconds = ?, session_name = ?, exit_reason = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            symbol, positionType, totalEntryVolume, entryPriceAvg,
            exitPriceAvg || null, currentPrice || null, floatingProfit, magic, comment || null, externalId || null,
            openTime, closeTime || null, status,
            grossProfit, commissionTotal, swapTotal, feeTotal,
            netProfit, initialSl || null, initialTp || null, riskAmount || null,
            rMultiple || null, holdingSeconds, sessionName, exitReason,
            posGuid
          ]
        );
      } else {
        await db.run(
          `INSERT INTO reconstructed_positions (
            id, account_id, position_id, symbol, position_type, total_volume,
            entry_price_avg, exit_price_avg, current_price, floating_profit, magic, comment, external_id,
            open_time, close_time, status, gross_profit, commission_total, swap_total, fee_total, net_profit,
            initial_sl, initial_tp, risk_amount, r_multiple, holding_seconds,
            session_name, exit_reason, is_hedged, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            posGuid, accountId, posId, symbol, positionType, totalEntryVolume,
            entryPriceAvg, exitPriceAvg || null, currentPrice || null, floatingProfit, magic, comment || null, externalId || null,
            openTime, closeTime || null, status, grossProfit, commissionTotal, swapTotal, feeTotal, netProfit,
            initialSl || null, initialTp || null, riskAmount || null, rMultiple || null, holdingSeconds,
            sessionName, exitReason
          ]
        );
      }

      // Reconstruct individual executions for complete traceability
      await db.run(`DELETE FROM position_executions WHERE position_id = ?`, [posGuid]);
      if (deals.length > 0) {
        for (const d of deals) {
          let execType: 'ENTRY' | 'SCALE_IN' | 'PARTIAL_EXIT' | 'FINAL_EXIT' = 'ENTRY';
          if (d.entry === 0) {
            execType = d === entryDeals[0] ? 'ENTRY' : 'SCALE_IN';
          } else if (d.entry === 1 || d.entry === 3) {
            execType = d === exitDeals[exitDeals.length - 1] && isClosed ? 'FINAL_EXIT' : 'PARTIAL_EXIT';
          }
          await db.run(
            `INSERT INTO position_executions (
              id, position_id, deal_id, order_id, execution_type, volume, price, profit, commission, swap, execution_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), posGuid, d.deal_id, d.order_id, execType, d.volume, d.price, d.profit, d.commission, d.swap, d.time]
          );
        }
      } else if (liveOpenPos) {
        // If deals haven't arrived yet for this live position, register initial execution record
        await db.run(
          `INSERT INTO position_executions (
            id, position_id, deal_id, order_id, execution_type, volume, price, profit, commission, swap, execution_time
          ) VALUES (?, ?, ?, ?, 'ENTRY', ?, ?, 0, 0, ?, ?)`,
          [uuidv4(), posGuid, liveOpenPos.ticket, liveOpenPos.identifier || liveOpenPos.ticket, liveOpenPos.volume, liveOpenPos.price_open, liveOpenPos.swap, liveOpenPos.time]
        );
      }

      // Automatically ensure a user trade journal record exists for this reconstructed position
      const existingJournal = await db.get(`SELECT id FROM trade_journals WHERE position_id = ?`, [posGuid]);
      if (!existingJournal) {
        await db.run(
          `INSERT INTO trade_journals (
            id, position_id, user_id, setup_name, bias, confidence_score, is_reviewed, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [uuidv4(), posGuid, userId, 'Default Setup', positionType === 'BUY' ? 'BULLISH' : 'BEARISH']
        );
      }

      // If position is closed, ensure raw_open_positions is marked inactive
      if (isClosed) {
        await db.run(
          `UPDATE raw_open_positions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE account_id = ? AND position_id = ?`,
          [accountId, posId]
        );
        closedTradesCount++;
      } else {
        openTradesCount++;
      }
    }

    return { positionsCount, closedTradesCount, openTradesCount };
  }
}
