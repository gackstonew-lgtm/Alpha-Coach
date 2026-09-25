import { getDatabase } from '../db/db';
import { AnalyticsService } from './analytics.service';
import { AICoachService } from './ai.service';
import { StrategyLabService } from './strategy.service';
import { SessionIntelligenceService } from './session.service';
import { SymbolIntelligenceService } from './symbol.service';

export class ReportService {
  /**
   * Generates a comprehensive Weekly or Monthly report for a user
   */
  public static async generateReport(
    userId: string,
    type: 'WEEKLY' | 'MONTHLY',
    accountId?: string,
    customStartDate?: string,
    customEndDate?: string
  ): Promise<any> {
    const now = new Date();
    let startDate: string;
    let endDate: string = customEndDate || now.toISOString();

    if (customStartDate) {
      startDate = customStartDate;
    } else if (type === 'WEEKLY') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = past7.toISOString();
    } else {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = past30.toISOString();
    }

    const performance = await AnalyticsService.getAccountPerformance(userId, accountId, {
      startDate,
      endDate
    });

    const dna = await AICoachService.getTraderDNA(userId, accountId);
    const { strategies } = await StrategyLabService.getStrategyAnalytics(userId, accountId);
    const { sessions } = await SessionIntelligenceService.getSessionAnalytics(userId, accountId);
    const symbols = await SymbolIntelligenceService.getSymbolAnalytics(userId, accountId);

    const reportData = {
      title: `${type === 'WEEKLY' ? 'Weekly' : 'Monthly'} Trading Performance OS Report`,
      type,
      generatedAt: now.toISOString(),
      period: {
        startDate,
        endDate
      },
      performance,
      dna,
      topStrategies: strategies.slice(0, 3),
      sessionBreakdown: sessions,
      symbolBreakdown: symbols.slice(0, 5),
      keyInsights: [
        `Net P/L for the period: $${performance.netProfit.toFixed(2)} across ${performance.totalTrades} trades.`,
        `Win rate achieved: ${performance.winRate}% with a Profit Factor of ${performance.profitFactor}.`,
        `Average trade expectancy: $${performance.expectancy} per trade.`,
        performance.maxDrawdownAmount > 0
          ? `Maximum period drawdown was $${performance.maxDrawdownAmount.toFixed(2)} (${performance.maxDrawdownPct}%).`
          : `No significant period drawdown observed.`
      ]
    };

    return reportData;
  }

  /**
   * Export all user trades to CSV formatted string
   */
  public static async exportTradesCSV(userId: string, accountId?: string): Promise<string> {
    const db = getDatabase();
    let sql = `
      SELECT p.*, a.account_number, a.broker_name, j.setup_name, j.bias, j.is_reviewed, j.emotion_state, m.name as mistake_name
      FROM reconstructed_positions p
      JOIN trading_accounts a ON p.account_id = a.id
      LEFT JOIN trade_journals j ON p.id = j.position_id
      LEFT JOIN mistake_tags m ON j.mistake_id = m.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];
    if (accountId && accountId !== 'ALL') {
      sql += ` AND p.account_id = ?`;
      params.push(accountId);
    }
    sql += ` ORDER BY p.open_time DESC`;

    const trades = await db.query(sql, params);

    const headers = [
      'Trade ID',
      'Account',
      'Broker',
      'Symbol',
      'Type',
      'Volume (Lots)',
      'Entry Price',
      'Exit Price',
      'Open Time (UTC)',
      'Close Time (UTC)',
      'Holding Time (s)',
      'Gross Profit',
      'Commission',
      'Swap',
      'Net Profit',
      'R-Multiple',
      'Session',
      'Exit Reason',
      'Status',
      'Setup',
      'Emotion',
      'Mistake Tag',
      'Reviewed'
    ];

    const rows = trades.map(t => [
      `"${t.position_id}"`,
      `"${t.account_number}"`,
      `"${t.broker_name}"`,
      `"${t.symbol}"`,
      `"${t.position_type}"`,
      t.total_volume,
      t.entry_price_avg,
      t.exit_price_avg || '',
      `"${t.open_time}"`,
      `"${t.close_time || ''}"`,
      t.holding_seconds,
      t.gross_profit,
      t.commission_total,
      t.swap_total,
      t.net_profit,
      t.r_multiple ?? '',
      `"${t.session_name || ''}"`,
      `"${t.exit_reason || ''}"`,
      `"${t.status}"`,
      `"${t.setup_name || ''}"`,
      `"${t.emotion_state || ''}"`,
      `"${t.mistake_name || ''}"`,
      t.is_reviewed ? 'YES' : 'NO'
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
