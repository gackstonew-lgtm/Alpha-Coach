import { getDatabase } from '../db/db';

export interface StrategyPerformance {
  strategyId: string;
  name: string;
  colorTag: string;
  description?: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  averageR: number;
  avgHoldingSeconds: number;
  maxDrawdown: number;
}

export class StrategyLabService {
  public static async getStrategyAnalytics(userId: string, accountId?: string): Promise<{
    strategies: StrategyPerformance[];
    confluences: Array<{ confluence: string; count: number; winRate: number; netProfit: number }>;
  }> {
    const db = getDatabase();

    let sql = `
      SELECT
        s.id as strategy_id,
        s.name as strategy_name,
        s.color_tag,
        s.description,
        p.id as position_id,
        p.net_profit,
        p.gross_profit,
        p.r_multiple,
        p.holding_seconds,
        j.confluences
      FROM strategies s
      LEFT JOIN trade_journals j ON j.strategy_id = s.id
      LEFT JOIN reconstructed_positions p ON j.position_id = p.id AND p.status = 'CLOSED'
      LEFT JOIN trading_accounts a ON p.account_id = a.id
      WHERE s.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId && accountId !== 'ALL') {
      sql += ` AND (p.account_id = ? OR p.account_id IS NULL)`;
      params.push(accountId);
    }

    const rows = await db.query(sql, params);

    const stratMap = new Map<string, {
      id: string;
      name: string;
      color: string;
      desc?: string;
      trades: any[];
    }>();

    const confluenceMap = new Map<string, { count: number; wins: number; netProfit: number }>();

    for (const r of rows) {
      if (!stratMap.has(r.strategy_id)) {
        stratMap.set(r.strategy_id, {
          id: r.strategy_id,
          name: r.strategy_name,
          color: r.color_tag || '#3b82f6',
          desc: r.description,
          trades: []
        });
      }

      if (r.position_id) {
        stratMap.get(r.strategy_id)!.trades.push(r);

        if (r.confluences) {
          try {
            const confs: string[] = typeof r.confluences === 'string' && r.confluences.startsWith('[')
              ? JSON.parse(r.confluences)
              : r.confluences.split(',').map((s: string) => s.trim());

            for (const conf of confs) {
              if (!conf) continue;
              if (!confluenceMap.has(conf)) {
                confluenceMap.set(conf, { count: 0, wins: 0, netProfit: 0 });
              }
              const item = confluenceMap.get(conf)!;
              item.count++;
              item.netProfit += r.net_profit || 0;
              if (r.net_profit > 0) item.wins++;
            }
          } catch {
            // Non-json comma separated
          }
        }
      }
    }

    const strategies: StrategyPerformance[] = [];

    for (const item of stratMap.values()) {
      const totalTrades = item.trades.length;
      let winCount = 0;
      let lossCount = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let netProfit = 0;
      let sumR = 0;
      let countR = 0;
      let totalHolding = 0;

      for (const t of item.trades) {
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

      const winRate = totalTrades > 0 ? parseFloat(((winCount / totalTrades) * 100).toFixed(1)) : 0;
      const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
      const averageR = countR > 0 ? parseFloat((sumR / countR).toFixed(2)) : 0;
      const avgHoldingSeconds = totalTrades > 0 ? Math.round(totalHolding / totalTrades) : 0;

      strategies.push({
        strategyId: item.id,
        name: item.name,
        colorTag: item.color,
        description: item.desc,
        totalTrades,
        winCount,
        lossCount,
        winRate,
        netProfit: parseFloat(netProfit.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        grossLoss: parseFloat(grossLoss.toFixed(2)),
        profitFactor,
        averageR,
        avgHoldingSeconds,
        maxDrawdown: 0
      });
    }

    const confluences = Array.from(confluenceMap.entries()).map(([name, stat]) => ({
      confluence: name,
      count: stat.count,
      winRate: parseFloat(((stat.wins / stat.count) * 100).toFixed(1)),
      netProfit: parseFloat(stat.netProfit.toFixed(2))
    })).sort((a, b) => b.count - a.count);

    return { strategies, confluences };
  }
}
