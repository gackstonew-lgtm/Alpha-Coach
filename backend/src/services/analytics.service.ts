import { getDatabase } from '../db/db';
import { ReconstructedPosition } from '../models/types';

export interface PerformanceOverview {
  totalTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage e.g. 65.4
  lossRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  totalCommissions: number;
  totalSwaps: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  expectancy: number;
  averageR: number;
  maxDrawdownAmount: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingSeconds: number;
  medianHoldingSeconds: number;
  longTrades: {
    count: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  shortTrades: {
    count: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  equityCurve: Array<{
    date: string;
    tradeIndex: number;
    symbol: string;
    netProfit: number;
    cumulativeProfit: number;
    equity: number;
    drawdown: number;
    drawdownPct: number;
  }>;
  dailyPerformance: Array<{
    date: string;
    netProfit: number;
    tradesCount: number;
    winCount: number;
    lossCount: number;
  }>;
}

export class AnalyticsService {
  public static async getAccountPerformance(
    userId: string,
    accountId?: string,
    filters?: {
      symbol?: string;
      session?: string;
      strategyId?: string;
      startDate?: string;
      endDate?: string;
      direction?: 'BUY' | 'SELL';
    }
  ): Promise<PerformanceOverview> {
    const db = getDatabase();

    // Base query for user's positions
    let sql = `
      SELECT p.*, j.strategy_id, j.setup_name, j.bias, j.is_reviewed, j.emotion_state
      FROM reconstructed_positions p
      JOIN trading_accounts a ON p.account_id = a.id
      LEFT JOIN trade_journals j ON p.id = j.position_id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId && accountId !== 'ALL') {
      sql += ` AND p.account_id = ?`;
      params.push(accountId);
    }
    if (filters?.symbol) {
      sql += ` AND p.symbol = ?`;
      params.push(filters.symbol);
    }
    if (filters?.session) {
      sql += ` AND p.session_name = ?`;
      params.push(filters.session);
    }
    if (filters?.strategyId) {
      sql += ` AND j.strategy_id = ?`;
      params.push(filters.strategyId);
    }
    if (filters?.direction) {
      sql += ` AND p.position_type = ?`;
      params.push(filters.direction);
    }
    if (filters?.startDate) {
      sql += ` AND p.open_time >= ?`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ` AND p.open_time <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY p.open_time ASC`;

    const positions = await db.query<ReconstructedPosition & { strategy_id?: string; setup_name?: string }>(sql, params);

    // Calculate real dynamic starting equity baseline from synchronized account facts
    let currentBalance = 0;
    if (accountId && accountId !== 'ALL') {
      const acc = await db.get<{ balance: number }>(`SELECT balance FROM trading_accounts WHERE id = ?`, [accountId]);
      if (acc) currentBalance = Number(acc.balance || 0);
    } else {
      const accs = await db.query<{ balance: number }>(`SELECT balance FROM trading_accounts WHERE user_id = ?`, [userId]);
      currentBalance = accs.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    }

    const closedPositions = positions.filter(p => p.status === 'CLOSED');
    closedPositions.sort((a, b) => new Date(a.close_time || a.open_time).getTime() - new Date(b.close_time || b.open_time).getTime());
    const openTrades = positions.filter(p => p.status === 'OPEN').length;
    const totalTrades = closedPositions.length;

    const totalRealizedProfit = closedPositions.reduce((sum, p) => sum + Number(p.net_profit || 0), 0);
    const startingBalance = currentBalance > 0 ? Math.max(0, currentBalance - totalRealizedProfit) : 0;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        openTrades,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        lossRate: 0,
        grossProfit: 0,
        grossLoss: 0,
        netProfit: 0,
        totalCommissions: 0,
        totalSwaps: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0,
        expectancy: 0,
        averageR: 0,
        maxDrawdownAmount: 0,
        maxDrawdownPct: 0,
        recoveryFactor: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        largestWin: 0,
        largestLoss: 0,
        avgHoldingSeconds: 0,
        medianHoldingSeconds: 0,
        longTrades: { count: 0, winRate: 0, netProfit: 0, profitFactor: 0 },
        shortTrades: { count: 0, winRate: 0, netProfit: 0, profitFactor: 0 },
        equityCurve: [],
        dailyPerformance: []
      };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalCommissions = 0;
    let totalSwaps = 0;
    let totalR = 0;
    let countWithR = 0;
    let largestWin = 0;
    let largestLoss = 0;
    const holdingTimes: number[] = [];

    let currentConsecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    let longWins = 0;
    let longCount = 0;
    let longProfit = 0;
    let longGrossWin = 0;
    let longGrossLoss = 0;

    let shortWins = 0;
    let shortCount = 0;
    let shortProfit = 0;
    let shortGrossWin = 0;
    let shortGrossLoss = 0;

    // Equity Curve computation
    let runningEquity = startingBalance;
    let peakEquity = startingBalance;
    let maxDrawdownAmount = 0;
    let maxDrawdownPct = 0;
    let cumulativeProfit = 0;

    const equityCurve: PerformanceOverview['equityCurve'] = [];
    const dailyMap = new Map<string, { netProfit: number; tradesCount: number; winCount: number; lossCount: number }>();

    closedPositions.forEach((pos, idx) => {
      const net = pos.net_profit;
      totalCommissions += pos.commission_total || 0;
      totalSwaps += pos.swap_total || 0;
      cumulativeProfit += net;
      runningEquity += net;

      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddAmount = peakEquity - runningEquity;
      const ddPct = peakEquity > 0 ? (ddAmount / peakEquity) * 100 : 0;
      if (ddAmount > maxDrawdownAmount) maxDrawdownAmount = ddAmount;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

      equityCurve.push({
        date: pos.close_time || pos.open_time,
        tradeIndex: idx + 1,
        symbol: pos.symbol,
        netProfit: parseFloat(net.toFixed(2)),
        cumulativeProfit: parseFloat(cumulativeProfit.toFixed(2)),
        equity: parseFloat(runningEquity.toFixed(2)),
        drawdown: parseFloat(ddAmount.toFixed(2)),
        drawdownPct: parseFloat(ddPct.toFixed(2))
      });

      // Daily grouping
      const dateKey = (pos.close_time || pos.open_time).substring(0, 10);
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { netProfit: 0, tradesCount: 0, winCount: 0, lossCount: 0 });
      }
      const dayData = dailyMap.get(dateKey)!;
      dayData.netProfit += net;
      dayData.tradesCount += 1;
      if (net > 0) dayData.winCount += 1;
      else if (net < 0) dayData.lossCount += 1;

      // Win / Loss classification
      const gross = pos.gross_profit !== undefined && pos.gross_profit !== null ? pos.gross_profit : net;
      if (net > 0) {
        winningTrades++;
        grossProfit += gross > 0 ? gross : net;
        if (net > largestWin) largestWin = net;

        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
        if (currentConsecutiveWins > maxConsecutiveWins) maxConsecutiveWins = currentConsecutiveWins;
      } else if (net < 0) {
        losingTrades++;
        grossLoss += Math.abs(gross < 0 ? gross : net);
        if (net < largestLoss) largestLoss = net;

        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
        if (currentConsecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentConsecutiveLosses;
      } else {
        breakevenTrades++;
        currentConsecutiveWins = 0;
        currentConsecutiveLosses = 0;
      }

      if (pos.r_multiple !== null && pos.r_multiple !== undefined) {
        totalR += pos.r_multiple;
        countWithR++;
      }

      if (pos.holding_seconds > 0) {
        holdingTimes.push(pos.holding_seconds);
      }

      // Long / Short stats
      if (pos.position_type === 'BUY') {
        longCount++;
        longProfit += net;
        if (net > 0) {
          longWins++;
          longGrossWin += net;
        } else {
          longGrossLoss += Math.abs(net);
        }
      } else {
        shortCount++;
        shortProfit += net;
        if (net > 0) {
          shortWins++;
          shortGrossWin += net;
        } else {
          shortGrossLoss += Math.abs(net);
        }
      }
    });

    const winRate = parseFloat(((winningTrades / totalTrades) * 100).toFixed(2));
    const lossRate = parseFloat(((losingTrades / totalTrades) * 100).toFixed(2));
    const netProfit = parseFloat(cumulativeProfit.toFixed(2));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

    const averageWin = winningTrades > 0 ? parseFloat((grossProfit / winningTrades).toFixed(2)) : 0;
    const averageLoss = losingTrades > 0 ? parseFloat((grossLoss / losingTrades).toFixed(2)) : 0;
    const riskRewardRatio = averageLoss > 0 ? parseFloat((averageWin / averageLoss).toFixed(2)) : 0;
    const expectancy = parseFloat(((winRate / 100) * averageWin - (lossRate / 100) * averageLoss).toFixed(2));
    const averageR = countWithR > 0 ? parseFloat((totalR / countWithR).toFixed(2)) : 0;
    const recoveryFactor = maxDrawdownAmount > 0 ? parseFloat((netProfit / maxDrawdownAmount).toFixed(2)) : 0;

    // Holding time metrics
    const avgHoldingSeconds = holdingTimes.length > 0 ? Math.round(holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length) : 0;
    holdingTimes.sort((a, b) => a - b);
    const medianHoldingSeconds = holdingTimes.length > 0 ? holdingTimes[Math.floor(holdingTimes.length / 2)] : 0;

    // Long vs Short breakdowns
    const longWinRate = longCount > 0 ? parseFloat(((longWins / longCount) * 100).toFixed(2)) : 0;
    const longPF = longGrossLoss > 0 ? parseFloat((longGrossWin / longGrossLoss).toFixed(2)) : longGrossWin > 0 ? 99.9 : 0;

    const shortWinRate = shortCount > 0 ? parseFloat(((shortWins / shortCount) * 100).toFixed(2)) : 0;
    const shortPF = shortGrossLoss > 0 ? parseFloat((shortGrossWin / shortGrossLoss).toFixed(2)) : shortGrossWin > 0 ? 99.9 : 0;

    const dailyPerformance = Array.from(dailyMap.entries()).map(([date, d]) => ({
      date,
      netProfit: parseFloat(d.netProfit.toFixed(2)),
      tradesCount: d.tradesCount,
      winCount: d.winCount,
      lossCount: d.lossCount
    }));

    return {
      totalTrades,
      openTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      winRate,
      lossRate,
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossLoss: parseFloat(grossLoss.toFixed(2)),
      netProfit,
      totalCommissions: parseFloat(totalCommissions.toFixed(2)),
      totalSwaps: parseFloat(totalSwaps.toFixed(2)),
      profitFactor,
      averageWin,
      averageLoss,
      riskRewardRatio,
      expectancy,
      averageR,
      maxDrawdownAmount: parseFloat(maxDrawdownAmount.toFixed(2)),
      maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
      recoveryFactor,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      largestWin: parseFloat(largestWin.toFixed(2)),
      largestLoss: parseFloat(largestLoss.toFixed(2)),
      avgHoldingSeconds,
      medianHoldingSeconds,
      longTrades: {
        count: longCount,
        winRate: longWinRate,
        netProfit: parseFloat(longProfit.toFixed(2)),
        profitFactor: longPF
      },
      shortTrades: {
        count: shortCount,
        winRate: shortWinRate,
        netProfit: parseFloat(shortProfit.toFixed(2)),
        profitFactor: shortPF
      },
      equityCurve,
      dailyPerformance
    };
  }
}
