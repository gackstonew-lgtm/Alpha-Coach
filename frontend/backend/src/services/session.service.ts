import { getDatabase } from '../db/db';

export interface SessionMetrics {
  sessionName: string;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  averageR: number;
  avgHoldingSeconds: number;
}

export class SessionIntelligenceService {
  public static async getSessionAnalytics(userId: string, accountId?: string): Promise<{
    sessions: SessionMetrics[];
    hourlyHeatmap: Array<{ hour: number; dayOfWeek: number; count: number; netProfit: number; winRate: number }>;
  }> {
    const db = getDatabase();

    let sql = `
      SELECT p.*
      FROM reconstructed_positions p
      JOIN trading_accounts a ON p.account_id = a.id
      WHERE a.user_id = ? AND p.status = 'CLOSED'
    `;
    const params: any[] = [userId];

    if (accountId && accountId !== 'ALL') {
      sql += ` AND p.account_id = ?`;
      params.push(accountId);
    }

    const positions = await db.query(sql, params);

    const sessionMap = new Map<string, any[]>();
    const allSessions = ['Asia', 'London', 'New York', 'London/NY Overlap', 'Off-Hours'];
    allSessions.forEach(s => sessionMap.set(s, []));

    // Hourly x Day of Week (0-6 Sun-Sat, 0-23 Hour)
    const heatmapGrid = new Map<string, { count: number; wins: number; netProfit: number }>();
    for (let day = 0; day < 7; day++) {
      for (let h = 0; h < 24; h++) {
        heatmapGrid.set(`${day}_${h}`, { count: 0, wins: 0, netProfit: 0 });
      }
    }

    for (const p of positions) {
      const sName = p.session_name || 'Off-Hours';
      if (!sessionMap.has(sName)) {
        sessionMap.set(sName, []);
      }
      sessionMap.get(sName)!.push(p);

      if (p.open_time) {
        const d = new Date(p.open_time);
        const day = d.getUTCDay();
        const hour = d.getUTCHours();
        const key = `${day}_${hour}`;
        if (heatmapGrid.has(key)) {
          const cell = heatmapGrid.get(key)!;
          cell.count++;
          cell.netProfit += p.net_profit || 0;
          if (p.net_profit > 0) cell.wins++;
        }
      }
    }

    const sessions: SessionMetrics[] = [];

    for (const [name, trades] of sessionMap.entries()) {
      const tradeCount = trades.length;
      let winCount = 0;
      let lossCount = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let netProfit = 0;
      let sumR = 0;
      let countR = 0;
      let totalHolding = 0;

      for (const t of trades) {
        const net = t.net_profit || 0;
        netProfit += net;
        totalHolding += t.holding_seconds || 0;
        if (net > 0) {
          winCount++;
          grossProfit += net;
        } else if (net < 0) {
          lossCount++;
          grossLoss += Math.abs(net);
        }

        if (t.r_multiple !== null && t.r_multiple !== undefined) {
          sumR += t.r_multiple;
          countR++;
        }
      }

      const winRate = tradeCount > 0 ? parseFloat(((winCount / tradeCount) * 100).toFixed(1)) : 0;
      const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
      const averageR = countR > 0 ? parseFloat((sumR / countR).toFixed(2)) : 0;
      const avgHoldingSeconds = tradeCount > 0 ? Math.round(totalHolding / tradeCount) : 0;

      sessions.push({
        sessionName: name,
        tradeCount,
        winCount,
        lossCount,
        winRate,
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitFactor,
        averageR,
        avgHoldingSeconds
      });
    }

    const hourlyHeatmap: Array<{ hour: number; dayOfWeek: number; count: number; netProfit: number; winRate: number }> = [];
    for (let day = 0; day < 7; day++) {
      for (let h = 0; h < 24; h++) {
        const cell = heatmapGrid.get(`${day}_${h}`)!;
        hourlyHeatmap.push({
          dayOfWeek: day,
          hour: h,
          count: cell.count,
          netProfit: parseFloat(cell.netProfit.toFixed(2)),
          winRate: cell.count > 0 ? parseFloat(((cell.wins / cell.count) * 100).toFixed(1)) : 0
        });
      }
    }

    return { sessions, hourlyHeatmap };
  }
}
