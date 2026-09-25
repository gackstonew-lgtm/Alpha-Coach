import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { PerformanceOverview } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Award,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight
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
        api.getTrades({ accountId: selectedAccountId, limit: 5 })
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Alpha Coach Performance OS</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Trading Terminal & Performance Hub
          </h1>
          <p className="text-sm text-slate-400">
            {selectedAccount
              ? `Connected to ${selectedAccount.broker_name} (Account ••••${selectedAccount.account_number.slice(-4)})`
              : `Consolidated view across all connected MT5 trading accounts`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center space-x-3 z-10">
          <Link
            to="/journal"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition shadow"
          >
            Open Journal
          </Link>
          <Link
            to="/ai-coach"
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition"
          >
            Ask AI Coach
          </Link>
        </div>
      </div>

      {/* Account Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net P/L */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Net Realized P/L</span>
            {isPositiveNet ? (
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></span>
            ) : (
              <span className="p-1 rounded-lg bg-red-500/10 text-red-400"><TrendingDown className="w-4 h-4" /></span>
            )}
          </div>
          <div className={`text-2xl font-extrabold font-mono mt-2 ${isPositiveNet ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositiveNet ? '+' : ''}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Gross: ${(overview?.grossProfit || 0).toLocaleString()}</span>
            <span>Comm: ${(overview?.totalCommissions || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Win Rate</span>
            <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400"><Target className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">
            {overview?.winRate || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview?.winningTrades || 0} Wins / {overview?.losingTrades || 0} Losses ({overview?.totalTrades || 0} total)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Profit Factor</span>
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400"><Award className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">
            {overview?.profitFactor || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Expectancy: +${overview?.expectancy || 0} / trade
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Max Drawdown</span>
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-2">
            ${(overview?.maxDrawdownAmount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview?.maxDrawdownPct || 0}% Peak-to-Trough
          </div>
        </div>
      </div>

      {/* Charts Section: Equity Curve & Daily P/L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Account Growth & Equity Curve</span>
              </h2>
              <p className="text-xs text-slate-400">Reconstructed trade progression over the previous 3 months</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Equity ($)</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {overview?.equityCurve && overview.equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="tradeIndex" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Equity']}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2.5} fill="url(#equityGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <BarChart3 className="w-8 h-8 text-slate-600" />
                <span>No trade data synchronized yet. Connect MT5 Bridge to import 3-month history.</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily P/L Breakdown (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Recent Daily P/L</span>
            </h2>
            <Link to="/calendar" className="text-xs text-blue-400 hover:underline">View Calendar</Link>
          </div>

          <div className="h-72 w-full">
            {overview?.dailyPerformance && overview.dailyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.dailyPerformance.slice(-10)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
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
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No daily records found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Risk Guardian Alert Status & Recent Reconstructed Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Guardian Active Monitor Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Risk Guardian</h3>
            </div>
            <Link to="/risk-guardian" className="text-xs text-blue-400 hover:underline">Rules</Link>
          </div>

          {riskMonitor ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Today's Loss Used:</span>
                  <span className="font-mono text-white font-bold">${riskMonitor.todayLoss?.toFixed(2) || '0.00'} / ${riskMonitor.dailyLossLimit}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (riskMonitor.todayLoss / (riskMonitor.dailyLossLimit || 500)) > 0.8 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (riskMonitor.todayLoss / (riskMonitor.dailyLossLimit || 500)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Trades Executed Today:</span>
                <span className="font-mono text-white font-bold">{riskMonitor.todayTrades} / {riskMonitor.dailyTradesLimit}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Consecutive Losses:</span>
                <span className={`font-mono font-bold ${riskMonitor.consecutiveLosses >= 2 ? 'text-red-400' : 'text-slate-200'}`}>
                  {riskMonitor.consecutiveLosses}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              Risk Guardian actively monitoring active session limits.
            </div>
          )}
        </div>

        {/* Recent Trades Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Latest Reconstructed Positions</span>
            </h3>
            <Link to="/journal" className="text-xs text-blue-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Volume</th>
                  <th className="pb-2">Entry → Exit</th>
                  <th className="pb-2">Net P/L</th>
                  <th className="pb-2">Session</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">No recent trades found</td>
                  </tr>
                ) : (
                  recentTrades.map(trade => {
                    const isWin = trade.net_profit >= 0;
                    return (
                      <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 font-bold text-white">{trade.symbol}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.position_type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.position_type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300">{trade.total_volume}</td>
                        <td className="py-3 text-slate-400">
                          {trade.entry_price_avg} → {trade.exit_price_avg || 'Open'}
                        </td>
                        <td className={`py-3 font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isWin ? '+' : ''}${trade.net_profit?.toFixed(2)}
                        </td>
                        <td className="py-3 font-sans text-slate-400">{trade.session_name || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.status === 'CLOSED' ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 animate-pulse'
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
