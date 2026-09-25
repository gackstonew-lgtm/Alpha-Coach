import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { PerformanceOverview } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Award,
  ShieldCheck,
  Target,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedAccountId, selectedAccount, accounts } = useAccounts();
  const { theme } = useTheme();
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [riskMonitor, setRiskMonitor] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedAccountId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, tradesRes] = await Promise.all([
        api.getAnalytics({ accountId: selectedAccountId }),
        api.getTrades({ accountId: selectedAccountId, limit: 6 })
      ]);
      setOverview(analyticsRes.overview);
      setRecentTrades(tradesRes.trades || []);

      if (selectedAccountId && selectedAccountId !== 'ALL') {
        const monRes = await api.getRiskMonitor(selectedAccountId);
        setRiskMonitor(monRes.monitor);
      } else if (accounts.length > 0) {
        const monRes = await api.getRiskMonitor(accounts[0].id);
        setRiskMonitor(monRes.monitor);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const netProfit = overview?.netProfit || 0;
  const isPositiveNet = netProfit >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Welcome & Quick Stats */}
      <div className="framer-card p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-surface via-surface to-brand-500/5">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-brand-500" />
              <span>Alpha Coach Performance OS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              Trading Terminal & Performance Hub
            </h1>
            <p className="text-xs sm:text-sm text-content-muted max-w-2xl">
              {selectedAccount
                ? `Connected to ${selectedAccount.broker_name} (Account ••••${selectedAccount.account_number.slice(-4)})`
                : `Consolidated multi-asset analysis across all synchronized MT5 trading accounts`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/journal"
              className="px-4 py-2.5 bg-surface-secondary hover:bg-surface-elevated text-content-primary rounded-xl text-xs font-bold border border-border-subtle hover:border-border-strong transition-all shadow-sm active:scale-95"
            >
              Open Journal
            </Link>
            <Link
              to="/ai-coach"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Ask AI Coach</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Account Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net P/L */}
        <div className="framer-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-content-muted">
            <span>Net Realized P/L</span>
            {isPositiveNet ? (
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><TrendingUp className="w-4 h-4" /></span>
            ) : (
              <span className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400"><TrendingDown className="w-4 h-4" /></span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold font-mono mt-2 ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositiveNet ? '+' : ''}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-content-muted mt-1.5 flex items-center justify-between">
            <span>Gross: ${(overview?.grossProfit || 0).toLocaleString()}</span>
            <span>Comm: ${(overview?.totalCommissions || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="framer-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-content-muted">
            <span>Win Rate</span>
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400"><Target className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-content-primary mt-2">
            {overview?.winRate || 0}%
          </div>
          <div className="text-[11px] text-content-muted mt-1.5">
            {overview?.winningTrades || 0} Wins / {overview?.losingTrades || 0} Losses ({overview?.totalTrades || 0} total)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="framer-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-content-muted">
            <span>Profit Factor</span>
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><Award className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-content-primary mt-2">
            {overview?.profitFactor || 0}
          </div>
          <div className="text-[11px] text-content-muted mt-1.5">
            Expectancy: +${overview?.expectancy || 0} / trade
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="framer-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-content-muted">
            <span>Max Drawdown</span>
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-2">
            ${(overview?.maxDrawdownAmount || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-content-muted mt-1.5">
            {overview?.maxDrawdownPct || 0}% Peak-to-Trough
          </div>
        </div>
      </div>

      {/* Charts Section: Equity Curve & Daily P/L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve (2 Cols) */}
        <div className="lg:col-span-2 framer-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-content-primary tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-500" />
                <span>Account Growth & Equity Curve</span>
              </h2>
              <p className="text-xs text-content-muted">Reconstructed 90-day MT5 cumulative trading progression</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-content-muted">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span>Equity ($)</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {overview?.equityCurve && overview.equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2942' : '#e2e8f0'} opacity={0.8} />
                  <XAxis dataKey="tradeIndex" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f1524' : '#ffffff',
                      borderColor: theme === 'dark' ? '#2d3b59' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Equity']}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2.5} fill="url(#equityGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-content-muted text-xs space-y-2">
                <BarChart3 className="w-8 h-8 text-content-subtle" />
                <span>No trade data synchronized yet. Connect MT5 Bridge to import 3-month history.</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily P/L Breakdown (1 Col) */}
        <div className="framer-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-content-primary tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Recent Daily P/L</span>
            </h2>
            <Link to="/calendar" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold">View Calendar</Link>
          </div>

          <div className="h-72 w-full">
            {overview?.dailyPerformance && overview.dailyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.dailyPerformance.slice(-10)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2942' : '#e2e8f0'} opacity={0.8} />
                  <XAxis dataKey="date" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f1524' : '#ffffff',
                      borderColor: theme === 'dark' ? '#2d3b59' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Daily P/L']}
                  />
                  <Bar
                    dataKey="netProfit"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-content-muted text-xs">
                <span>No daily records found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Risk Guardian & Recent Reconstructed Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Guardian Active Monitor Card */}
        <div className="framer-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-sm text-content-primary">Risk Guardian</h3>
            </div>
            <Link to="/risk-guardian" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold">Rules</Link>
          </div>

          {riskMonitor ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5">
                <div className="flex justify-between text-content-muted">
                  <span>Today's Loss Used:</span>
                  <span className="font-mono text-content-primary font-bold">${riskMonitor.todayLoss?.toFixed(2) || '0.00'} / ${riskMonitor.dailyLossLimit}</span>
                </div>
                <div className="w-full bg-border-strong h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (riskMonitor.todayLoss / (riskMonitor.dailyLossLimit || 500)) > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (riskMonitor.todayLoss / (riskMonitor.dailyLossLimit || 500)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between items-center">
                <span className="text-content-muted">Trades Executed Today:</span>
                <span className="font-mono text-content-primary font-bold">{riskMonitor.todayTrades} / {riskMonitor.dailyTradesLimit}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between items-center">
                <span className="text-content-muted">Consecutive Losses:</span>
                <span className={`font-mono font-bold ${riskMonitor.consecutiveLosses >= 2 ? 'text-rose-500' : 'text-content-primary'}`}>
                  {riskMonitor.consecutiveLosses}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-content-muted">
              Risk Guardian actively monitoring active session limits.
            </div>
          )}
        </div>

        {/* Recent Trades Table */}
        <div className="lg:col-span-2 framer-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Latest Reconstructed Positions</span>
            </h3>
            <Link to="/journal" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-content-muted font-semibold border-b border-border-subtle pb-2">
                <tr>
                  <th className="pb-2.5 font-medium">Symbol</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Volume</th>
                  <th className="pb-2.5 font-medium">Entry → Exit</th>
                  <th className="pb-2.5 font-medium">Net P/L</th>
                  <th className="pb-2.5 font-medium">Session</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-content-muted">No recent trades found</td>
                  </tr>
                ) : (
                  recentTrades.map(trade => {
                    const isWin = Number(trade.net_profit) >= 0;
                    return (
                      <tr key={trade.id} className="hover:bg-surface-secondary/70 transition-colors">
                        <td className="py-3 font-bold text-content-primary">{trade.symbol}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            trade.position_type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {trade.position_type}
                          </span>
                        </td>
                        <td className="py-3 text-content-secondary">{trade.total_volume}</td>
                        <td className="py-3 text-content-muted">
                          {trade.entry_price_avg} → {trade.exit_price_avg || 'Open'}
                        </td>
                        <td className={`py-3 font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isWin ? '+' : ''}${Number(trade.net_profit).toFixed(2)}
                        </td>
                        <td className="py-3 font-sans text-content-muted">{trade.session_name || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            trade.status === 'CLOSED' ? 'bg-surface-secondary text-content-muted border border-border-subtle' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
