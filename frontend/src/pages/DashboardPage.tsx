import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  ChevronRight,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedAccountId, selectedAccount, accounts } = useAccounts();
  const { theme } = useTheme();
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [riskMonitor, setRiskMonitor] = useState<any>(null);
  const [chartMode, setChartMode] = useState<'cumulative' | 'equity'>('cumulative');

  useEffect(() => {
    loadDashboardData();
  }, [selectedAccountId, accounts]);

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

  // Transform equityCurve into continuous time-series chartData with numeric timestamp
  const chartData = useMemo(() => {
    if (!overview?.equityCurve || overview.equityCurve.length === 0) return [];

    const parsedPoints = overview.equityCurve.map((point, index) => {
      const d = new Date(point.date);
      const ts = !isNaN(d.getTime()) ? d.getTime() : Date.now() + index * 1000;
      return {
        ...point,
        timestamp: ts,
        isBaseline: false,
      };
    });

    // If in cumulative mode, derive an initial starting anchor at $0.00
    if (chartMode === 'cumulative' && parsedPoints.length > 0) {
      const firstPoint = parsedPoints[0];
      const initialBalance = overview.initialBalance || (firstPoint.equity - firstPoint.cumulativeProfit);

      let baselineTs = firstPoint.timestamp - 3600 * 1000 * 4;
      if (parsedPoints.length > 1) {
        const avgGap = (parsedPoints[parsedPoints.length - 1].timestamp - firstPoint.timestamp) / (parsedPoints.length - 1);
        baselineTs = firstPoint.timestamp - Math.max(3600 * 1000, avgGap * 0.5);
      }

      const baselinePoint = {
        tradeIndex: 0,
        date: new Date(baselineTs).toISOString(),
        timestamp: baselineTs,
        netProfit: 0,
        cumulativeProfit: 0,
        equity: initialBalance,
        drawdown: 0,
        drawdownPct: 0,
        symbol: 'START',
        isBaseline: true,
      };

      return [baselinePoint, ...parsedPoints];
    }

    return parsedPoints;
  }, [overview?.equityCurve, overview?.initialBalance, chartMode]);

  // Data-aware Y-axis domain with visual breathing room
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return ['auto', 'auto'];
    const vals = chartData.map(d => chartMode === 'cumulative' ? Number(d.cumulativeProfit) : Number(d.equity));
    if (chartMode === 'cumulative') {
      vals.push(0); // include zero baseline for cumulative profit
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min;
    if (range === 0) {
      const padding = max === 0 ? 10 : Math.max(5, Math.abs(max) * 0.25);
      return [min - padding, max + padding];
    }
    const padding = range * 0.15;
    return [min - padding, max + padding];
  }, [chartData, chartMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Welcome & Quick Stats */}
      <div className="framer-card p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-surface">
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

      {/* Real MT5 User Profitability & Equity Trend Graph */}
      <div className="framer-card p-6 sm:p-7 rounded-3xl space-y-4 relative overflow-hidden bg-surface border border-border-subtle shadow-sm w-full">
        {/* Chart Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 mt-0.5 sm:mt-0 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-content-primary">
                  Profitability & Equity Trend
                </h2>
                <span className="text-sky-500 dark:text-sky-400 text-xs sm:text-sm font-semibold">
                  ({selectedAccount ? `${selectedAccount.currency || 'USD'} • ${selectedAccount.broker_name}` : 'Consolidated • All Accounts'})
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                {overview?.equityCurve && overview.equityCurve.length > 0
                  ? (() => {
                      const first = new Date(overview.equityCurve[0].date);
                      const last = new Date(overview.equityCurve[overview.equityCurve.length - 1].date);
                      const isSameYear = first.getFullYear() === last.getFullYear();
                      const d1 = first.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: isSameYear ? undefined : 'numeric' });
                      const d2 = last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      return `Reconstructed MT5 cumulative trading progression • ${d1} - ${d2} (${overview.equityCurve.length} trades)`;
                    })()
                  : 'Reconstructed MT5 cumulative trading progression'}
              </p>
            </div>
          </div>

          {/* Micro KPI Badges & View Controls */}
          {overview?.equityCurve && overview.equityCurve.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              {/* View Toggle */}
              <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-1 gap-1">
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartMode === 'cumulative'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  Cumulative P/L
                </button>
                <button
                  onClick={() => setChartMode('equity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartMode === 'equity'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  Account Equity
                </button>
              </div>

              {/* Cumulative Net Growth */}
              <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                (overview.netProfit || 0) >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                <span className="text-[11px] font-bold">Net P/L:</span>
                <span className="text-xs font-mono font-extrabold">
                  {(overview.netProfit || 0) >= 0 ? '+' : ''}${Number(overview.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Current Reconstructed Equity */}
              <div className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle flex items-center gap-1.5">
                <span className="text-[11px] text-content-muted font-medium">Equity:</span>
                <span className="text-xs font-mono font-extrabold text-content-primary">
                  ${(overview.equityCurve[overview.equityCurve.length - 1]?.equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Profit Factor */}
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle items-center gap-1.5">
                <span className="text-[11px] text-content-muted font-medium">PF:</span>
                <span className="text-xs font-mono font-extrabold text-sky-500 dark:text-sky-400">
                  {overview.profitFactor || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart Canvas */}
        <div className="h-80 sm:h-96 w-full relative z-10 pt-2">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 4 }}
              >
                {/* Clean Subtle Horizontal Grid Lines */}
                <CartesianGrid
                  stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                {/* Zero Reference Line for Cumulative Profit view */}
                {chartMode === 'cumulative' && (
                  <ReferenceLine
                    y={0}
                    stroke={theme === 'dark' ? '#334155' : '#cbd5e1'}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                )}

                {/* X-Axis: Time/Date scale using continuous timestamp */}
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  stroke={theme === 'dark' ? '#475569' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}
                  minTickGap={35}
                  tickFormatter={(timestamp: number) => {
                    if (!timestamp || isNaN(timestamp)) return '';
                    const d = new Date(timestamp);
                    if (isNaN(d.getTime())) return '';
                    const day = d.getDate();
                    const month = d.toLocaleDateString(undefined, { month: 'short' });
                    return `${day}. ${month}`;
                  }}
                />

                {/* Y-Axis Formatted with Currency and Data-Aware Domain */}
                <YAxis
                  stroke={theme === 'dark' ? '#475569' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={yDomain as any}
                  tickFormatter={(val: number) => {
                    if (chartMode === 'cumulative') {
                      if (val === 0) return '$0';
                      const prefix = val > 0 ? '+$' : '-$';
                      const abs = Math.abs(val);
                      if (abs >= 1000000) return `${prefix}${(abs / 1000000).toFixed(1)}M`;
                      if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}k`;
                      return `${prefix}${abs.toFixed(0)}`;
                    } else {
                      const abs = Math.abs(val);
                      const sign = val < 0 ? '-' : '';
                      if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
                      if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
                      return `${sign}$${abs.toFixed(0)}`;
                    }
                  }}
                />

                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.isBaseline) return null;
                      const d = data.date ? new Date(data.date) : (data.timestamp ? new Date(data.timestamp) : null);
                      const dateLabel = d && !isNaN(d.getTime())
                        ? d.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : `Trade #${data.tradeIndex}`;
                      const isWin = Number(data.netProfit) >= 0;
                      const isCumulWin = Number(data.cumulativeProfit) >= 0;

                      return (
                        <div className="p-3.5 rounded-2xl bg-[#0b101d]/95 backdrop-blur-md border border-[#1e293b] shadow-2xl space-y-2.5 text-xs min-w-[240px] text-content-primary animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                            <span className="text-[11px] font-semibold text-content-muted">{dateLabel}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono font-bold text-[10px]">
                              #{data.tradeIndex} • {data.symbol || 'MT5'}
                            </span>
                          </div>

                          <div className="space-y-1.5 font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-content-muted font-sans text-[11px]">Trade Net P/L:</span>
                              <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isWin ? '+' : ''}${Number(data.netProfit).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-content-muted font-sans text-[11px]">Cumulative Realized:</span>
                              <span className={`font-extrabold ${isCumulWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isCumulWin ? '+' : ''}${Number(data.cumulativeProfit).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                              <span className="text-content-muted font-sans text-[11px]">Reconstructed Equity:</span>
                              <span className="font-extrabold text-content-primary text-xs">
                                ${Number(data.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            {data.drawdownPct > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-amber-400 font-sans">Drawdown from Peak:</span>
                                <span className="text-amber-400 font-semibold">
                                  -{Number(data.drawdownPct).toFixed(1)}% (-${Number(data.drawdown).toFixed(2)})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Monotone Smooth Solid-Fill Area Trend Line (No Gradients) */}
                <Area
                  type="monotone"
                  dataKey={chartMode === 'cumulative' ? 'cumulativeProfit' : 'equity'}
                  stroke={
                    chartMode === 'cumulative'
                      ? isPositiveNet
                        ? '#06b6d4'
                        : '#f43f5e'
                      : '#3b82f6'
                  }
                  strokeWidth={2}
                  fill={
                    chartMode === 'cumulative'
                      ? isPositiveNet
                        ? '#06b6d4'
                        : '#f43f5e'
                      : '#3b82f6'
                  }
                  fillOpacity={0.08}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{
                    r: 5.5,
                    fill: '#38bdf8',
                    stroke: theme === 'dark' ? '#0f172a' : '#ffffff',
                    strokeWidth: 2,
                    className: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-content-muted text-xs space-y-3 p-6 text-center">
              <div className="p-3.5 rounded-2xl bg-surface-secondary text-brand-500 border border-border-subtle">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-content-primary text-sm">No trading history available</p>
                <p className="text-[11px] max-w-sm text-content-muted">
                  Sync your MT5 account to view profitability & reconstructed equity trends.
                </p>
              </div>
              <Link
                to="/bridge"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition"
              >
                Configure MT5 Bridge
              </Link>
            </div>
          )}
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
