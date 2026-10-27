import React, { useState, useEffect, useMemo } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { PerformanceOverview } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Plus,
  Radio,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { MarketSessionsStrip } from '../components/dashboard/MarketSessionsStrip';
import { SkeletonMetricCard, SkeletonChart, SkeletonTable } from '../components/common/Skeleton';
import { BottomSheet } from '../components/common/BottomSheet';

interface WatchlistItem {
  code: string;
  ticker: string;
  name: string;
  price?: string | null;
  change?: string | null;
  isPositive?: boolean | null;
  status: 'live' | 'unavailable';
}

const INITIAL_WATCHLIST: WatchlistItem[] = [
  { code: 'EUR', ticker: 'EURUSD', name: 'Euro / US Dollar', status: 'unavailable' },
  { code: 'GBP', ticker: 'GBPUSD', name: 'British Pound / USD', status: 'unavailable' },
  { code: 'XAU', ticker: 'XAUUSD', name: 'Gold / US Dollar', status: 'unavailable' },
  { code: 'USD', ticker: 'USDJPY', name: 'US Dollar / Yen', status: 'unavailable' },
  { code: 'BTC', ticker: 'BTCUSD', name: 'Bitcoin / US Dollar', status: 'unavailable' },
  { code: 'US3', ticker: 'US30', name: 'Dow Jones Index', status: 'unavailable' }
];

export const DashboardPage: React.FC = () => {
  const { selectedAccountId, selectedAccount, accounts, isLoadingAccounts } = useAccounts();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [chartMode, setChartMode] = useState<'cumulative' | 'equity'>('cumulative');
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1 Week');

  // Trade Detail Sheet
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<any | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);

  // Watchlist items & Add Sheet
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [isWatchlistSheetOpen, setIsWatchlistSheetOpen] = useState<boolean>(false);
  const [newSymbolInput, setNewSymbolInput] = useState<string>('');

  // 1. REAL MT5 ACCOUNT BALANCE & LAST-SYNC COMPUTATION
  const balanceInfo = useMemo(() => {
    if (isLoadingAccounts) {
      return {
        status: 'loading',
        formattedBalance: 'Syncing...',
        lastSyncLabel: 'Checking MT5 terminal...'
      };
    }

    if (accounts.length === 0) {
      return {
        status: 'disconnected',
        formattedBalance: 'Unavailable',
        lastSyncLabel: 'No MT5 account connected'
      };
    }

    if (selectedAccountId !== 'ALL' && selectedAccount) {
      const bal = Number(selectedAccount.balance);
      if (isNaN(bal)) {
        return {
          status: 'unavailable',
          formattedBalance: 'Unavailable',
          lastSyncLabel: 'Awaiting first MT5 sync'
        };
      }
      const curr = selectedAccount.currency || 'USD';
      const currSymbol = curr === 'USD' ? '$' : `${curr} `;
      const syncTime = selectedAccount.last_synced_at
        ? `Synced ${new Date(selectedAccount.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Live Connected';

      return {
        status: 'connected',
        formattedBalance: `${currSymbol}${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        lastSyncLabel: syncTime
      };
    }

    // ALL accounts aggregated balance
    const totalBal = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const latestSync = accounts.reduce<string | undefined>((latest, a) => {
      if (!a.last_synced_at) return latest;
      if (!latest) return a.last_synced_at;
      return new Date(a.last_synced_at) > new Date(latest) ? a.last_synced_at : latest;
    }, undefined);

    const syncTime = latestSync
      ? `Synced ${new Date(latestSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Live Connected';

    return {
      status: 'connected',
      formattedBalance: `$${totalBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      lastSyncLabel: syncTime
    };
  }, [accounts, selectedAccountId, selectedAccount, isLoadingAccounts]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedAccountId, accounts.length]);

  useEffect(() => {
    loadWatchlistQuotes();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, tradesRes] = await Promise.all([
        api.getAnalytics({ accountId: selectedAccountId }),
        api.getTrades({ accountId: selectedAccountId, limit: 8 })
      ]);
      setOverview(analyticsRes?.overview || null);
      setRecentTrades(tradesRes?.trades || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt to fetch real candle quotes for watchlist instruments
  const loadWatchlistQuotes = async () => {
    try {
      const updated = await Promise.all(
        INITIAL_WATCHLIST.map(async (item) => {
          try {
            const res = await api.getCandles({
              symbol: item.ticker,
              timeframe: 'H1',
              limit: 2,
              allowExternalFetch: false
            });
            if (res && res.candles && res.candles.length > 0) {
              const lastCandle = res.candles[res.candles.length - 1];
              const prevCandle = res.candles.length > 1 ? res.candles[res.candles.length - 2] : lastCandle;
              const closePrice = Number(lastCandle.close);
              const prevClose = Number(prevCandle.close) || closePrice;
              const pctChange = prevClose !== 0 ? ((closePrice - prevClose) / prevClose) * 100 : 0;
              const isPos = pctChange >= 0;
              return {
                ...item,
                price: closePrice > 1000 ? `$${closePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : closePrice.toFixed(4),
                change: `${isPos ? '+' : ''}${pctChange.toFixed(2)}%`,
                isPositive: isPos,
                status: 'live' as const
              };
            }
          } catch {
            // Live quote feed unavailable for this symbol
          }
          return {
            ...item,
            price: null,
            change: null,
            isPositive: null,
            status: 'unavailable' as const
          };
        })
      );
      setWatchlist(updated);
    } catch {
      // Keep unavailable state
    }
  };

  const netProfit = overview?.netProfit || 0;
  const isPositiveNet = netProfit >= 0;

  // Real MT5 cumulative PnL or equity curve series
  const chartData = useMemo(() => {
    if (!overview?.equityCurve || overview.equityCurve.length === 0) {
      return [];
    }

    return overview.equityCurve.map((point, index) => {
      const d = new Date(point.date);
      const ts = !isNaN(d.getTime()) ? d.getTime() : Date.now() + index * 1000;
      return {
        ...point,
        timestamp: ts
      };
    });
  }, [overview?.equityCurve]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbolInput.trim()) return;
    const clean = newSymbolInput.trim().toUpperCase();
    const code = clean.slice(0, 3);
    setWatchlist(prev => [
      {
        code,
        ticker: clean,
        name: `${clean} Market Instrument`,
        price: null,
        change: null,
        isPositive: null,
        status: 'unavailable'
      },
      ...prev
    ]);
    setNewSymbolInput('');
    setIsWatchlistSheetOpen(false);
  };

  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonMetricCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8"><SkeletonChart /></div>
          <div className="lg:col-span-4"><SkeletonMetricCard /></div>
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const hasConnectedAccounts = accounts.length > 0;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP-LEVEL PERFORMANCE ANALYTICS (MOVED TO TOP OF DASHBOARD)            */}
      {/* ========================================================================= */}
      <section aria-label="Core Quantitative Edge Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))]">
          {/* Card 1: Net Realized P/L */}
          <div className="card-hover-interactive bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Net Realized P/L
              </span>
              <div className={`text-xl sm:text-2xl font-black mt-1 font-mono tabular-nums ${isPositiveNet ? 'text-profit' : 'text-loss'}`}>
                {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
              <span>{overview?.totalTrades || 0} reconstructed deals</span>
              <span className={`text-[10px] font-bold ${isPositiveNet ? 'text-profit' : 'text-loss'}`}>
                {isPositiveNet ? 'Profitable' : 'Drawdown'}
              </span>
            </div>
          </div>

          {/* Card 2: Win Rate */}
          <div className="card-hover-interactive bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Win Rate
              </span>
              <div className="text-xl sm:text-2xl font-black mt-1 text-foreground font-mono tabular-nums">
                {(overview?.winRate || 0).toFixed(1)}%
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
              <span>{overview?.winningTrades || 0}W / {overview?.losingTrades || 0}L</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Historical Deals</span>
            </div>
          </div>

          {/* Card 3: Profit Factor */}
          <div className="card-hover-interactive bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Profit Factor
              </span>
              <div className="text-xl sm:text-2xl font-black mt-1 text-foreground font-mono tabular-nums">
                {(overview?.profitFactor || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
              <span>Expectancy: ${(overview?.expectancy || 0).toFixed(2)}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Gross Ratio</span>
            </div>
          </div>

          {/* Card 4: Max Drawdown */}
          <div className="card-hover-interactive bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Max Drawdown
              </span>
              <div className={`text-xl sm:text-2xl font-black mt-1 font-mono tabular-nums ${overview?.maxDrawdownPct ? 'text-loss' : 'text-foreground'}`}>
                {(overview?.maxDrawdownPct || 0).toFixed(1)}%
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
              <span>Peak: ${(overview?.maxDrawdownAmount || 0).toFixed(2)}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Equity Dip</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN MAIN COCKPIT (CHART: MY PNL TREND + WATCHLIST)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: MAIN INTERACTIVE CHART CARD */}
        <section className="lg:col-span-8 card-hover-interactive bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-xs space-y-5">
          {/* Header Row: Title "My PNL Trend" + Real MT5 Account Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-primary dark:bg-surface-elevated dark:text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                    My PNL Trend
                  </h2>
                  {hasConnectedAccounts && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-live-bg text-live-text">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedAccountId !== 'ALL' && selectedAccount
                    ? `${selectedAccount.broker_name || 'MT5'} ····${selectedAccount.account_number.slice(-4)} (${selectedAccount.currency || 'USD'})`
                    : accounts.length > 0
                    ? `Consolidated MT5 Portfolio (${accounts.length} ${accounts.length === 1 ? 'Account' : 'Accounts'})`
                    : 'Awaiting MT5 Terminal Connection'}
                </p>
              </div>
            </div>

            {/* Real MT5 Account Balance display */}
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                MT5 Balance
              </span>
              <div className="text-xl sm:text-2xl font-black text-foreground font-mono tabular-nums tracking-tight">
                {balanceInfo.formattedBalance}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {balanceInfo.lastSyncLabel}
              </p>
            </div>
          </div>

          {/* Timeframe Pills Row & Mode Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border">
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
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>

            {/* Chart Mode Toggle */}
            <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-xl text-[11px] font-semibold text-muted-foreground">
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartMode === 'cumulative' ? 'bg-surface text-foreground shadow-xs font-bold' : ''
                }`}
              >
                P&L
              </button>
              <button
                type="button"
                onClick={() => setChartMode('equity')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartMode === 'equity' ? 'bg-surface text-foreground shadow-xs font-bold' : ''
                }`}
              >
                Equity
              </button>
            </div>
          </div>

          {/* Main Area Chart */}
          <div className="h-72 sm:h-80 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartTealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2a313c' : '#E6EAF2'} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(ts) => new Date(ts).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#9aa4b2' : '#7C89A1' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${Number(val).toLocaleString()}`}
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#9aa4b2' : '#7C89A1' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      const val = Number(chartMode === 'cumulative' ? d.cumulativeProfit : d.equity) || 0;
                      return (
                        <div className="bg-surface border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(d.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          <p className={`font-mono font-bold ${val >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {chartMode === 'cumulative' ? 'Cumulative P/L: ' : 'Equity: '}
                            ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'cumulative' ? 'cumulativeProfit' : 'equity'}
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#chartTealGradient)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-elevated/40 rounded-xl border border-dashed border-border text-muted-foreground space-y-2">
                <BarChart3 className="w-8 h-8 text-content-muted" />
                <p className="text-xs font-bold text-foreground">No Deal History Synchronized Yet</p>
                <p className="text-[11px] max-w-sm">
                  Connect your MT5 terminal via the Companion Bridge to automatically stream executed trades and render your real PnL growth curve.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: CIRCULAR MARKET-PAIR WATCHLIST */}
        <section className="lg:col-span-4 card-hover-interactive bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              My watchlist
            </h2>
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(true)}
              className="w-7 h-7 rounded-full bg-surface-elevated text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition shadow-xs"
              title="Add Symbol to Watchlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Circular Market-Pair Items */}
          <div className="space-y-1 divide-y divide-[#EDF0F6] dark:divide-slate-800">
            {watchlist.map((item) => (
              <div
                key={item.ticker}
                onClick={() => navigate(`/charts?symbol=${item.ticker}`)}
                className="pt-2.5 pb-2.5 first:pt-0 flex items-center justify-between hover:bg-surface-elevated px-2 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Distinct Circular Market-Pair Badge */}
                  <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-accent-tint text-primary dark:bg-surface-elevated dark:text-primary border border-accent-border/40 dark:border-border flex items-center justify-center font-black text-xs font-mono shadow-xs group-hover:scale-105 group-hover:border-primary transition-all shrink-0">
                    {item.code}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground font-mono leading-tight group-hover:text-primary transition-colors">
                      {item.ticker}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight truncate max-w-[130px] sm:max-w-[170px]">
                      {item.name}
                    </div>
                  </div>
                </div>

                {/* Price & Change: reliable live quote or clear Unavailable indicator */}
                <div className="text-right shrink-0">
                  {item.price ? (
                    <>
                      <div className="text-xs font-bold text-foreground font-mono tabular-nums">
                        {item.price}
                      </div>
                      <div className={`text-[10px] font-bold font-mono ${item.isPositive ? 'text-profit' : 'text-loss'}`}>
                        {item.change}
                      </div>
                    </>
                  ) : (
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        Unavailable
                      </span>
                      <span className="text-[9px] text-content-muted block">
                        No Live Feed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-slate-800 dark:hover:text-white hover:border-slate-400 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Instrument</span>
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE FOREX SESSIONS & RECENT EXECUTED TRADES                         */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-2">
        {/* Simplified Active Forex Market Sessions Strip */}
        <MarketSessionsStrip />

        {/* Recent Trades Table */}
        <div className="card-hover-interactive bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">
              Recent Executed Trades
            </h3>
            <Link to="/journal" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View Full Trading Journal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase font-bold text-muted-foreground">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Open Price</th>
                  <th className="py-2.5 px-3">Close Price</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F6] dark:divide-slate-800">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
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
                        className="hover:bg-surface-elevated cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 font-bold text-foreground">{t.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                          }`}>
                            {t.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{t.volume}</td>
                        <td className="py-2.5 px-3 font-mono">{t.open_price}</td>
                        <td className="py-2.5 px-3 font-mono">{t.close_price || '—'}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${isWin ? 'text-profit' : 'text-loss'}`}>
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
          <p className="text-xs text-muted-foreground">
            Enter a ticker symbol (e.g. EURUSD, GBPJPY, XAUUSD, NAS100) to monitor price alerts and market scanner sweeps.
          </p>
          <input
            type="text"
            required
            autoFocus
            value={newSymbolInput}
            onChange={e => setNewSymbolInput(e.target.value)}
            placeholder="e.g. US30, GBPJPY, ETHUSD"
            className="w-full bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground uppercase font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsWatchlistSheetOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-surface-elevated transition"
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
            <div className="grid grid-cols-2 gap-3 bg-surface-subtle p-3.5 rounded-xl">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Symbol</span>
                <div className="font-bold text-sm text-foreground">{selectedTradeDetail.symbol}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Action</span>
                <div className="font-bold text-sm text-foreground">{selectedTradeDetail.action} ({selectedTradeDetail.volume} lots)</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Open Price</span>
                <div className="font-mono">{selectedTradeDetail.open_price}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Close Price</span>
                <div className="font-mono">{selectedTradeDetail.close_price || 'Open Position'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-border">
              <span className="font-medium text-muted-foreground">Realized Profit / Loss</span>
              <span className={`text-base font-extrabold font-mono ${Number(selectedTradeDetail.profit) >= 0 ? 'text-profit' : 'text-loss'}`}>
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

export default DashboardPage;
