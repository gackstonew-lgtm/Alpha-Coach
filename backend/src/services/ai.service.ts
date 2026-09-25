import { getDatabase } from '../db/db';
import { AnalyticsService } from './analytics.service';
import { ReconstructedPosition } from '../models/types';

export interface TraderDNAProfile {
  mostTradedSymbol: { symbol: string; count: number; winRate: number; netProfit: number } | null;
  mostActiveSession: { session: string; count: number; winRate: number; netProfit: number } | null;
  avgRiskPerTrade: number | null;
  avgDurationMinutes: number;
  longShortRatio: { longPct: number; shortPct: number };
  topStrategy: { name: string; count: number; winRate: number; netProfit: number } | null;
  mostCommonMistake: { name: string; count: number; category: string } | null;
  bestSession: { session: string; netProfit: number; winRate: number } | null;
  worstSession: { session: string; netProfit: number; winRate: number } | null;
  typicalPositionSizeLots: number;
  riskDisciplineScore: number; // 0 - 100
  behavioralSummary: string;
}

export class AICoachService {
  /**
   * Generates strictly descriptive Trader DNA from historical trading logs
   */
  public static async getTraderDNA(userId: string, accountId?: string): Promise<TraderDNAProfile> {
    const db = getDatabase();

    let sql = `
      SELECT p.*, j.strategy_id, j.setup_name, j.bias, j.emotion_state, j.mistake_id, m.name as mistake_name, m.category as mistake_category, s.name as strategy_name
      FROM reconstructed_positions p
      JOIN trading_accounts a ON p.account_id = a.id
      LEFT JOIN trade_journals j ON p.id = j.position_id
      LEFT JOIN mistake_tags m ON j.mistake_id = m.id
      LEFT JOIN strategies s ON j.strategy_id = s.id
      WHERE a.user_id = ? AND p.status = 'CLOSED'
    `;
    const params: any[] = [userId];

    if (accountId && accountId !== 'ALL') {
      sql += ` AND p.account_id = ?`;
      params.push(accountId);
    }

    const positions = await db.query(sql, params);

    if (positions.length === 0) {
      return {
        mostTradedSymbol: null,
        mostActiveSession: null,
        avgRiskPerTrade: null,
        avgDurationMinutes: 0,
        longShortRatio: { longPct: 50, shortPct: 50 },
        topStrategy: null,
        mostCommonMistake: null,
        bestSession: null,
        worstSession: null,
        typicalPositionSizeLots: 0.1,
        riskDisciplineScore: 100,
        behavioralSummary: 'Insufficient trade history available. Complete and synchronize more trades to compute your Trader DNA.'
      };
    }

    // Symbol counts
    const symbolMap = new Map<string, { count: number; wins: number; profit: number }>();
    // Session counts
    const sessionMap = new Map<string, { count: number; wins: number; profit: number }>();
    // Strategy counts
    const stratMap = new Map<string, { count: number; wins: number; profit: number }>();
    // Mistake counts
    const mistakeMap = new Map<string, { count: number; category: string }>();

    let longCount = 0;
    let shortCount = 0;
    let totalDurationSec = 0;
    let totalVolume = 0;
    let totalRiskAmount = 0;
    let countWithRisk = 0;

    for (const p of positions) {
      // Symbol
      const sym = p.symbol || 'UNKNOWN';
      if (!symbolMap.has(sym)) symbolMap.set(sym, { count: 0, wins: 0, profit: 0 });
      const sItem = symbolMap.get(sym)!;
      sItem.count++;
      sItem.profit += p.net_profit || 0;
      if (p.net_profit > 0) sItem.wins++;

      // Session
      const sess = p.session_name || 'Off-Hours';
      if (!sessionMap.has(sess)) sessionMap.set(sess, { count: 0, wins: 0, profit: 0 });
      const sesItem = sessionMap.get(sess)!;
      sesItem.count++;
      sesItem.profit += p.net_profit || 0;
      if (p.net_profit > 0) sesItem.wins++;

      // Strategy
      if (p.strategy_name || p.setup_name) {
        const sName = p.strategy_name || p.setup_name;
        if (!stratMap.has(sName)) stratMap.set(sName, { count: 0, wins: 0, profit: 0 });
        const stItem = stratMap.get(sName)!;
        stItem.count++;
        stItem.profit += p.net_profit || 0;
        if (p.net_profit > 0) stItem.wins++;
      }

      // Mistake
      if (p.mistake_name) {
        if (!mistakeMap.has(p.mistake_name)) {
          mistakeMap.set(p.mistake_name, { count: 0, category: p.mistake_category || 'PSYCHOLOGY' });
        }
        mistakeMap.get(p.mistake_name)!.count++;
      }

      // Direction
      if (p.position_type === 'BUY') longCount++;
      else shortCount++;

      totalDurationSec += p.holding_seconds || 0;
      totalVolume += p.total_volume || 0;

      if (p.risk_amount && p.risk_amount > 0) {
        totalRiskAmount += p.risk_amount;
        countWithRisk++;
      }
    }

    const totalTrades = positions.length;

    // Most traded symbol
    let mostTradedSymbol: TraderDNAProfile['mostTradedSymbol'] = null;
    let maxSymCount = -1;
    for (const [sym, data] of symbolMap.entries()) {
      if (data.count > maxSymCount) {
        maxSymCount = data.count;
        mostTradedSymbol = {
          symbol: sym,
          count: data.count,
          winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1)),
          netProfit: parseFloat(data.profit.toFixed(2))
        };
      }
    }

    // Most active session, best & worst sessions
    let mostActiveSession: TraderDNAProfile['mostActiveSession'] = null;
    let bestSession: TraderDNAProfile['bestSession'] = null;
    let worstSession: TraderDNAProfile['worstSession'] = null;
    let maxSessCount = -1;
    let maxSessProfit = -Infinity;
    let minSessProfit = Infinity;

    for (const [sess, data] of sessionMap.entries()) {
      if (data.count > maxSessCount) {
        maxSessCount = data.count;
        mostActiveSession = {
          session: sess,
          count: data.count,
          winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1)),
          netProfit: parseFloat(data.profit.toFixed(2))
        };
      }
      if (data.profit > maxSessProfit && data.count >= 2) {
        maxSessProfit = data.profit;
        bestSession = {
          session: sess,
          netProfit: parseFloat(data.profit.toFixed(2)),
          winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1))
        };
      }
      if (data.profit < minSessProfit && data.count >= 2) {
        minSessProfit = data.profit;
        worstSession = {
          session: sess,
          netProfit: parseFloat(data.profit.toFixed(2)),
          winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1))
        };
      }
    }

    // Top Strategy
    let topStrategy: TraderDNAProfile['topStrategy'] = null;
    let maxStratCount = -1;
    for (const [sName, data] of stratMap.entries()) {
      if (data.count > maxStratCount) {
        maxStratCount = data.count;
        topStrategy = {
          name: sName,
          count: data.count,
          winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1)),
          netProfit: parseFloat(data.profit.toFixed(2))
        };
      }
    }

    // Most Common Mistake
    let mostCommonMistake: TraderDNAProfile['mostCommonMistake'] = null;
    let maxMistakeCount = -1;
    for (const [mName, data] of mistakeMap.entries()) {
      if (data.count > maxMistakeCount) {
        maxMistakeCount = data.count;
        mostCommonMistake = {
          name: mName,
          count: data.count,
          category: data.category
        };
      }
    }

    const avgDurationMinutes = Math.round(totalDurationSec / totalTrades / 60);
    const avgRiskPerTrade = countWithRisk > 0 ? parseFloat((totalRiskAmount / countWithRisk).toFixed(2)) : null;
    const longPct = parseFloat(((longCount / totalTrades) * 100).toFixed(1));
    const shortPct = parseFloat(((shortCount / totalTrades) * 100).toFixed(1));
    const typicalPositionSizeLots = parseFloat((totalVolume / totalTrades).toFixed(2));

    const mistakeRatio = totalTrades > 0 ? (Array.from(mistakeMap.values()).reduce((a, b) => a + b.count, 0) / totalTrades) : 0;
    const riskDisciplineScore = Math.max(20, Math.min(100, Math.round(100 - (mistakeRatio * 80))));

    const summary = `Based on your ${totalTrades} historical trades, you are primarily a ${mostTradedSymbol?.symbol || 'multi-asset'} trader concentrating on ${mostActiveSession?.session || 'active sessions'}. Your average holding time is ${avgDurationMinutes}m with a typical lot size of ${typicalPositionSizeLots}. Your risk discipline score is rated at ${riskDisciplineScore}%.`;

    return {
      mostTradedSymbol,
      mostActiveSession,
      avgRiskPerTrade,
      avgDurationMinutes,
      longShortRatio: { longPct, shortPct },
      topStrategy,
      mostCommonMistake,
      bestSession,
      worstSession,
      typicalPositionSizeLots,
      riskDisciplineScore,
      behavioralSummary: summary
    };
  }

  /**
   * AI Coach query assistant grounded strictly on user's real journal metrics
   */
  public static async queryCoach(
    userId: string,
    question: string,
    accountId?: string
  ): Promise<{
    answer: string;
    observedData: Record<string, any>;
    calculatedStats: Record<string, any>;
    patterns: string[];
    recommendations: string[];
  }> {
    const q = question.toLowerCase();
    const overview = await AnalyticsService.getAccountPerformance(userId, accountId);
    const dna = await this.getTraderDNA(userId, accountId);

    const observedData: Record<string, any> = {
      totalAnalyzedTrades: overview.totalTrades,
      netProfit: `$${overview.netProfit.toFixed(2)}`,
      winRate: `${overview.winRate}%`,
      profitFactor: overview.profitFactor,
      averageR: `${overview.averageR}R`,
      maxDrawdown: `$${overview.maxDrawdownAmount.toFixed(2)} (${overview.maxDrawdownPct}%)`
    };

    const calculatedStats: Record<string, any> = {
      averageWin: `$${overview.averageWin.toFixed(2)}`,
      averageLoss: `$${overview.averageLoss.toFixed(2)}`,
      expectancy: `$${overview.expectancy.toFixed(2)} / trade`,
      longWinRate: `${overview.longTrades.winRate}%`,
      shortWinRate: `${overview.shortTrades.winRate}%`
    };

    const patterns: string[] = [];
    const recommendations: string[] = [];

    if (overview.longTrades.winRate > overview.shortTrades.winRate + 15) {
      patterns.push(`Observed Long bias asymmetry: Long trades win rate is ${overview.longTrades.winRate}% vs Short trades at ${overview.shortTrades.winRate}%.`);
    } else if (overview.shortTrades.winRate > overview.longTrades.winRate + 15) {
      patterns.push(`Observed Short bias asymmetry: Short trades win rate is ${overview.shortTrades.winRate}% vs Long trades at ${overview.longTrades.winRate}%.`);
    }

    if (dna.mostCommonMistake) {
      patterns.push(`Most logged behavioral tag: '${dna.mostCommonMistake.name}' appeared in ${dna.mostCommonMistake.count} journal entries.`);
      recommendations.push(`Review trades tagged with '${dna.mostCommonMistake.name}' to establish pre-entry checklist rules.`);
    }

    if (dna.bestSession && dna.worstSession && dna.worstSession.netProfit < 0) {
      patterns.push(`Session disparity: ${dna.bestSession.session} generated +$${dna.bestSession.netProfit} while ${dna.worstSession.session} lost -$${Math.abs(dna.worstSession.netProfit)}.`);
      recommendations.push(`Consider restricting or lowering risk during ${dna.worstSession.session} session.`);
    }

    let answer = '';

    if (q.includes('how did i perform') || q.includes('performance') || q.includes('summary')) {
      answer = `### Performance Summary\nAcross your **${overview.totalTrades}** completed trades, your total Net P/L is **${overview.netProfit >= 0 ? '+' : ''}$${overview.netProfit.toFixed(2)}** with a **${overview.winRate}%** win rate and a **${overview.profitFactor}** Profit Factor.\n\n- **Expectancy:** Each trade has an average historical expectancy of **+$${overview.expectancy}**.\n- **Risk-Reward:** Average win is **$${overview.averageWin}** vs average loss of **$${overview.averageLoss}**.\n- **Max Drawdown:** Peak-to-trough drawdown was **$${overview.maxDrawdownAmount} (${overview.maxDrawdownPct}%)**.`;
    } else if (q.includes('losing') || q.includes('mistake') || q.includes('loss')) {
      answer = `### Losing Trade Analysis\nYou have recorded **${overview.losingTrades}** losing trades out of ${overview.totalTrades} (${overview.lossRate}% loss rate).\n\n- **Max Consecutive Losses:** ${overview.maxConsecutiveLosses} in a row.\n- **Largest Single Loss:** -$${overview.largestLoss.toFixed(2)}.\n- **Top Tagged Mistake:** ${dna.mostCommonMistake ? dna.mostCommonMistake.name + ' (' + dna.mostCommonMistake.count + ' occurrences)' : 'None logged yet'}.\n\n*Note: Every trading edge incurs statistical losses. Consistent execution and strict risk limits preserve capital over the long run.*`;
    } else if (q.includes('session') || q.includes('london') || q.includes('new york') || q.includes('asia')) {
      answer = `### Session Breakdown\n- **Most Active Session:** ${dna.mostActiveSession ? dna.mostActiveSession.session + ' (' + dna.mostActiveSession.count + ' trades, ' + dna.mostActiveSession.winRate + '% WR, $' + dna.mostActiveSession.netProfit + ' Net P/L)' : 'N/A'}\n- **Top Profitable Session:** ${dna.bestSession ? dna.bestSession.session + ' (+$' + dna.bestSession.netProfit + ')' : 'N/A'}\n- **Lowest Performing Session:** ${dna.worstSession ? dna.worstSession.session + ' ($' + dna.worstSession.netProfit + ')' : 'N/A'}`;
    } else if (q.includes('review') || q.includes('which trade')) {
      answer = `### Recommended Trades For Review\n1. Trades with largest drawdown impact (e.g. largest loss of -$${overview.largestLoss}).\n2. Trades where stop loss was widened or removed.\n3. Trades executed outside your primary session (${dna.mostActiveSession?.session || 'Main Session'}).\n4. Reviewing unreviewed losing trades directly in the Journal tab grants +50 XP toward your Discipline Streak.`;
    } else {
      answer = `### Historical Data Analysis\nBased on your synchronized journal data (${overview.totalTrades} positions):\n\n- **Net P/L:** $${overview.netProfit.toFixed(2)}\n- **Win Rate:** ${overview.winRate}%\n- **Average R-Multiple:** ${overview.averageR}R\n- **Primary Symbol:** ${dna.mostTradedSymbol?.symbol || 'N/A'}\n- **Primary Session:** ${dna.mostActiveSession?.session || 'N/A'}\n\n*Disclaimer: Alpha Coach AI provides strictly descriptive analytics on your historical journal logs and does not provide financial or trading advice.*`;
    }

    return {
      answer,
      observedData,
      calculatedStats,
      patterns,
      recommendations
    };
  }
}
