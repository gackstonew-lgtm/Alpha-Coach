import { getDatabase } from '../db/db';

export interface SymbolMetrics {
  symbol: string;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  averageR: number;
  totalVolume: number;
  avgHoldingSeconds: number;
  largestWin: number;
  largestLoss: number;
}

export class SymbolIntelligenceService {
  public static async getSymbolAnalytics(userId: string, accountId?: string): Promise<SymbolMetrics[]> {
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

    const symbolMap = new Map<string, any[]>();
    for (const p of positions) {
      const sym = p.symbol || 'UNKNOWN';
      if (!symbolMap.has(sym)) {
        symbolMap.set(sym, []);
      }
      symbolMap.get(sym)!.push(p);
    }

    const symbols: SymbolMetrics[] = [];

    for (const [sym, trades] of symbolMap.entries()) {
      const tradeCount = trades.length;
      let winCount = 0;
      let lossCount = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let netProfit = 0;
      let sumR = 0;
      let countR = 0;
      let totalVol = 0;
      let totalHolding = 0;
      let largestWin = 0;
      let largestLoss = 0;

      for (const t of trades) {
        const net = t.net_profit || 0;
        netProfit += net;
        totalVol += t.total_volume || 0;
        totalHolding += t.holding_seconds || 0;

        if (net > 0) {
          winCount++;
          grossProfit += net;
          if (net > largestWin) largestWin = net;
        } else if (net < 0) {
          lossCount++;
          grossLoss += Math.abs(net);
          if (net < largestLoss) largestLoss = net;
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

      symbols.push({
        symbol: sym,
        tradeCount,
        winCount,
        lossCount,
        winRate,
        netProfit: parseFloat(netProfit.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        grossLoss: parseFloat(grossLoss.toFixed(2)),
        profitFactor,
        averageR,
        totalVolume: parseFloat(totalVol.toFixed(2)),
        avgHoldingSeconds,
        largestWin: parseFloat(largestWin.toFixed(2)),
        largestLoss: parseFloat(largestLoss.toFixed(2))
      });
    }

    return symbols.sort((a, b) => b.tradeCount - a.tradeCount);
  }
}
