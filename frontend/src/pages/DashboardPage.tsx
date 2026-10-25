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
  Plus,
  RefreshCw,
  Clock,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
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
import { Link, useNavigate } from 'react-router-dom';
import { MarketSessionsStrip } from '../components/dashboard/MarketSessionsStrip';
import { PrimaryAction } from '../components/common/PrimaryAction';
import { SkeletonMetricCard, SkeletonChart, SkeletonTile, SkeletonTable } from '../components/common/Skeleton';
import { BottomSheet } from '../components/common/BottomSheet';

export const DashboardPage: React.FC = () => {
  const { selectedAccountId, selectedAccount, accounts, isLoadingAccounts } = useAccounts();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [riskMonitor, setRiskMonitor] = useState<any>(null);
  const [chartMode, setChartMode] = useState<'cumulative' | 'equity'>('cumulative');
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1 Week');

  // Trade Detail Sheet
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<any | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);

  // Watchlist Add Sheet
  const [isWatchlistSheetOpen, setIsWatchlistSheetOpen] = useState<boolean>(false);
  const [newSymbolInput, setNewSymbolInput] = useState<string>('');

  // Watchlist items (persisted in local state)
  const [watchlist, setWatchlist] = useState<Array<{ ticker: string; name: string; price: string; change: string; isPositive: boolean }>>([
    { ticker: 'EURUSD', name: 'Euro / US Dollar', price: '1.08450', change: '+0.42%', isPositive: true },
    { ticker: 'GBPUSD', name: 'British Pound / USD', price: '1.29820', change: '-0.18%', isPositive: false },
    { ticker: 'XAUUSD', name: 'Gold / US Dollar', price: '$2,748.50', change: '+1.24%', isPositive: true },
    { ticker: 'USDJPY', name: 'US Dollar / Yen', price: '152.400', change: '+0.85%', isPositive: true },
    { ticker: 'BTCUSD', name: 'Bitcoin / US Dollar', price: '$68,450', change: '+3.15%', isPositive: true },
    { ticker: 'US30', name: 'Dow Jones Index', price: '42,380.0', change: '-0.28%', isPositive: false }
  ]);

  // Account Balance & Equity computations
  const hasAccounts = accounts.length > 0;
  const isAccountDataReady = !isLoadingAccounts && (selectedAccountId === 'ALL' ? hasAccounts : !!selectedAccount);

  const { displayBalance, displayEquity } = useMemo(() => {
    if (!isAccountDataReady) {
      return {
        displayBalance: '$0.00',
        displayEquity: '$0.00'
      };
    }

    if (selectedAccountId !== 'ALL' && selectedAccount) {
      const bal = Number(selectedAccount.balance) || 0;
      const eq = Number(selectedAccount.equity ?? selectedAccount.balance) || 0;
      return {
        displayBalance: `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        displayEquity: `$${eq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }

    const totalBal = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const totalEq = accounts.reduce((sum, a) => sum + (Number(a.equity ?? a.balance) || 0), 0);
    return {
      displayBalance: `$${totalBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      displayEquity: `$${totalEq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  }, [isAccountDataReady, isLoadingAccounts, selectedAccountId, selectedAccount, accounts]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedAccountId, accounts.length]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, tradesRes] = await Promise.all([
        api.getAnalytics({ accountId: selectedAccountId }),
        api.getTrades({ accountId: selectedAccountId, limit: 8 })
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

  // Transform equityCurve into continuous time-series chartData
  const chartData = useMemo(() => {
    if (!overview?.equityCurve || overview.equityCurve.length === 0) {
      // Mocked high-fidelity baseline points for visual completeness
      const now = Date.now();
      const points = [];
      let base = 5000;
      for (let i = 0; i <= 24; i++) {
        const ts = now - (24 - i) * 3600 * 1000 * 6;
        base += (Math.sin(i * 0.7) * 45 + Math.cos(i * 0.4) * 30 + 15);
        points.push({
          date: new Date(ts).toISOString(),
          timestamp: ts,
          cumulativeProfit: Number((base - 5000).toFixed(2)),
          equity: Number(base.toFixed(2)),
          symbol: 'EURUSD'
        });
      }
      return points;
    }

    return overview.equityCurve.map((point, index) => {
      const d = new Date(point.date);
      const ts = !isNaN(d.getTime()) ? d.getTime() : Date.now() + index * 1000;
      return {
        ...point,
        timestamp: ts
      };
    });
  }, [overview?.equityCurve, chartMode]);

  // Portfolio items (Reference B)
  const portfolioItems = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.slice(0, 4).map(acc => ({
        id: acc.id,
        name: acc.broker_name || 'MT5 Terminal',
        symbol: `Acct ····${acc.account_number ? acc.account_number.slice(-4) : '0000'}`,
        value: `$${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        change: `${(Number(acc.equity || acc.balance) >= Number(acc.balance) ? '+' : '')}${(((Number(acc.equity || acc.balance) - Number(acc.balance)) / (Number(acc.balance) || 1)) * 100).toFixed(2)}%`,
        isPositive: Number(acc.equity || acc.balance) >= Number(acc.balance),
        sparkline: [30, 32, 28, 35, 34, 40, 38, 42]
      }));
    }

    return [
      { id: '1', name: 'EUR / USD', symbol: 'Euro Spot', value: '$1,240.45', change: '+1.85%', isPositive: true, sparkline: [20, 25, 22, 28, 32, 30, 35] },
      { id: '2', name: 'GBP / USD', symbol: 'Pound Spot', value: '$840.10', change: '-0.10%', isPositive: false, sparkline: [35, 32, 34, 30, 28, 26, 25] },
      { id: '3', name: 'XAU / USD', symbol: 'Gold Spot', value: '$2,150.80', change: '+2.40%', isPositive: true, sparkline: [15, 18, 22, 26, 30, 35, 42] },
      { id: '4', name: 'USD / JPY', symbol: 'Yen Spot', value: '$650.00', change: '+0.85%', isPositive: true, sparkline: [25, 26, 24, 28, 27, 30, 32] }
    ];
  }, [accounts]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbolInput.trim()) return;
    const clean = newSymbolInput.trim().toUpperCase();
    setWatchlist(prev => [
      { ticker: clean, name: `${clean} Instrument`, price: '1.00000', change: '+0.00%', isPositive: true },
      ...prev
    ]);
    setNewSymbolInput('');
    setIsWatchlistSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. "MY PORTFOLIO" CAROUSEL ROW (REFERENCE B)                              */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#121212] dark:text-white tracking-tight">
            My Portfolio
          </h2>
          <button
            type="button"
            onClick={() => navigate('/performance')}
            className="w-7 h-7 rounded-full bg-white dark:bg-[#19191C] border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            title="View Full Performance"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Portfolio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#19191C] rounded-2xl p-4 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#121212] dark:text-white">{item.name}</h3>
                  <p className="text-[11px] text-slate-400">{item.symbol}</p>
                </div>
                {/* Mini Visual Sparkline Indicator */}
                <div className={`w-12 h-6 flex items-center justify-end ${item.isPositive ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
                  {item.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Return</span>
                  <span className={`text-xs font-bold ${item.isPositive ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
                    {item.change} {item.isPositive ? '↑' : '↓'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Value</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-mono tabular-nums">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN MAIN COCKPIT (REFERENCE B: CHART + WATCHLIST)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: MAIN INTERACTIVE CHART CARD (REFERENCE B) */}
        <section className="lg:col-span-8 bg-white dark:bg-[#19191C] rounded-2xl p-5 sm:p-6 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs space-y-5">
          {/* Header Row: Symbol + LIVE chip + Price + Timestamp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F6F7FB] dark:bg-[#25252B] flex items-center justify-center font-bold text-xs text-[#3FAE96]">
                FX
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#121212] dark:text-white">
                    {selectedAccount?.broker_name || 'EUR/USD'}
                  </h3>
                  {/* Red LIVE Status Chip (Reference B) */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E13A41] text-white">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedAccount ? `Account ····${selectedAccount.account_number.slice(-4)}` : 'Euro vs US Dollar'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-black text-[#121212] dark:text-white font-mono tabular-nums tracking-tight">
                {displayEquity}
              </div>
              <p className="text-[10px] text-slate-400">
                Last update at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Timeframe Pills Row (Reference B: Active pill #121212) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {['1 Day', '1 Week', '1 Month', '3 Month', '6 Month', '1 Year', 'All'].map((tf) => {
                const isActive = activeTimeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#121212] dark:bg-white text-white dark:text-[#121212] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>

            {/* Chart Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#F6F7FB] dark:bg-[#25252B] p-0.5 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartMode === 'cumulative' ? 'bg-white dark:bg-[#19191C] text-slate-900 dark:text-white shadow-xs font-bold' : ''
                }`}
              >
                P&L
              </button>
              <button
                type="button"
                onClick={() => setChartMode('equity')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartMode === 'equity' ? 'bg-white dark:bg-[#19191C] text-slate-900 dark:text-white shadow-xs font-bold' : ''
                }`}
              >
                Equity
              </button>
            </div>
          </div>

          {/* Main Area Chart (Reference B: Teal-Green line #3FAE96 with soft gradient) */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartTealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3FAE96" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#3FAE96" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2A2A30' : '#F0F0F2'} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                  tick={{ fontSize: 10, fill: '#8E8E93' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${Number(val).toLocaleString()}`}
                  tick={{ fontSize: 10, fill: '#8E8E93' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const val = chartMode === 'cumulative' ? data.cumulativeProfit : data.equity;
                      return (
                        <div className="bg-[#1E1E1E] text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-white/10 font-mono">
                          <div className="text-[10px] text-slate-400">
                            {new Date(data.timestamp || data.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="font-bold text-sm text-[#3FAE96] mt-0.5">
                            ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMode === 'cumulative' ? 'cumulativeProfit' : 'equity'}
                  stroke="#3FAE96"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartTealGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3FAE96]" />
              <span>Real-Time MT5 Tick Engine Sync</span>
            </span>
            <Link to="/charts" className="text-[#3FAE96] hover:underline font-semibold flex items-center gap-1">
              <span>Open Advanced Multi-Timeframe Charts</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* RIGHT COLUMN: "MY WATCHLIST" CARD (REFERENCE B) */}
        <section className="lg:col-span-4 bg-white dark:bg-[#19191C] rounded-2xl p-5 sm:p-6 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#121212] dark:text-white tracking-tight">
              My watchlist
            </h2>
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(true)}
              className="w-7 h-7 rounded-full bg-[#F6F7FB] dark:bg-[#25252B] text-slate-700 dark:text-slate-200 hover:bg-[#3FAE96] hover:text-white flex items-center justify-center transition shadow-xs"
              title="Add Symbol to Watchlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {watchlist.map((item, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer"
                onClick={() => navigate(`/charts?symbol=${item.ticker}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F6F7FB] dark:bg-[#25252B] flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {item.ticker.slice(0, 3)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#121212] dark:text-white leading-tight">
                      {item.ticker}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {item.price}
                  </div>
                  <div className={`text-[10px] font-bold ${item.isPositive ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Instrument</span>
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 3. BELOW THE FOLD: SESSIONS, EDGE METRICS & RECENT TRADES                 */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-2">
        {/* Global Forex Market Sessions Strip */}
        <MarketSessionsStrip />

        {/* 4 Core Quantitative Edge Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#19191C] rounded-2xl p-4 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Realized P/L</span>
            <div className={`text-lg font-extrabold mt-1 font-mono tabular-nums ${isPositiveNet ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
              {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{overview?.totalTrades || 0} reconstructed deals</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#19191C] rounded-2xl p-4 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Win Rate</span>
            <div className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white font-mono tabular-nums">
              {(overview?.winRate || 0).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {overview?.winningTrades || 0}W / {overview?.losingTrades || 0}L
            </div>
          </div>

          <div className="bg-white dark:bg-[#19191C] rounded-2xl p-4 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profit Factor</span>
            <div className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white font-mono tabular-nums">
              {(overview?.profitFactor || 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Expectancy: ${(overview?.expectancy || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-[#19191C] rounded-2xl p-4 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Drawdown</span>
            <div className="text-lg font-extrabold mt-1 text-[#E5484D] font-mono tabular-nums">
              {(overview?.maxDrawdownPct || 0).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Peak: ${(overview?.maxDrawdownAmount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Recent Trades Table (Matching Reference B Clean Card Style) */}
        <div className="bg-white dark:bg-[#19191C] rounded-2xl p-5 border border-[#EBECEF] dark:border-[#2C2C32] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#121212] dark:text-white tracking-tight">
              Recent Executed Trades
            </h3>
            <Link to="/journal" className="text-xs font-semibold text-[#3FAE96] hover:underline flex items-center gap-1">
              <span>View Full Trading Journal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Open Price</th>
                  <th className="py-2.5 px-3">Close Price</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No trades found for this account. MT5 Companion Bridge will stream trades automatically.
                    </td>
                  </tr>
                ) : (
                  recentTrades.map((t) => {
                    const profit = Number(t.profit) || 0;
                    const isWin = profit >= 0;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedTradeDetail(t);
                          setIsDetailSheetOpen(true);
                        }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{t.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.action === 'BUY' ? 'bg-emerald-500/10 text-[#22A06B]' : 'bg-rose-500/10 text-[#E5484D]'
                          }`}>
                            {t.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{t.volume}</td>
                        <td className="py-2.5 px-3 font-mono">{t.open_price}</td>
                        <td className="py-2.5 px-3 font-mono">{t.close_price || '—'}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${isWin ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
                          {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM SHEET: ADD SYMBOL TO WATCHLIST                                     */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={isWatchlistSheetOpen}
        onClose={() => setIsWatchlistSheetOpen(false)}
        title="Add Symbol to Watchlist"
      >
        <form onSubmit={handleAddSymbol} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Enter a ticker symbol (e.g. EURUSD, GBPJPY, XAUUSD, NAS100) to monitor price alerts and market scanner sweeps.
          </p>
          <input
            type="text"
            required
            autoFocus
            value={newSymbolInput}
            onChange={e => setNewSymbolInput(e.target.value)}
            placeholder="e.g. US30, GBPJPY, ETHUSD"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#3FAE96]"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-dash-primary text-xs"
            >
              Add to Watchlist
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ========================================================================= */}
      {/* BOTTOM SHEET: TRADE DETAIL REVIEW                                         */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        title={`Trade Ticket #${selectedTradeDetail?.ticket || selectedTradeDetail?.id?.slice(0, 8)}`}
      >
        {selectedTradeDetail && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Symbol</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedTradeDetail.symbol}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Action</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedTradeDetail.action} ({selectedTradeDetail.volume} lots)</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Open Price</span>
                <div className="font-mono">{selectedTradeDetail.open_price}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Close Price</span>
                <div className="font-mono">{selectedTradeDetail.close_price || 'Open Position'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#19191C] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-500">Realized Profit / Loss</span>
              <span className={`text-base font-extrabold font-mono ${Number(selectedTradeDetail.profit) >= 0 ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
                ${Number(selectedTradeDetail.profit || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDetailSheetOpen(false);
                  navigate('/journal');
                }}
                className="btn-dash-primary text-xs"
              >
                Open in Full Trading Journal
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
