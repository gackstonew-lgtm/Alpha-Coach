import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  Calendar,
  Grid,
  Columns,
  Square,
  LineChart,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PrimaryAction } from '../components/common/PrimaryAction';
import { BottomSheet } from '../components/common/BottomSheet';
import { MetaHead } from '../components/common/MetaHead';
import { useAccounts } from '../context/AccountContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  TradingViewAdvancedChart
} from '../components/chart/TradingViewAdvancedChart';
import {
  TradingChart,
  TradeOverlayData
} from '../components/chart/TradingChart';
import {
  SUPPORTED_INSTRUMENTS,
  TIMEFRAME_PRESETS,
  DEFAULT_INSTRUMENT_SYMBOL,
  DEFAULT_TIMEFRAME_INTERVAL,
  MarketCategory,
  resolveTradingViewSymbol,
  TradingViewInstrument
} from '../config/tradingViewSymbols';

export const ChartsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { selectedAccountId } = useAccounts();

  // Active Symbol and Timeframe Interval (from URL or Defaults)
  const initialSymbol = searchParams.get('symbol') || DEFAULT_INSTRUMENT_SYMBOL;
  const initialInterval = searchParams.get('interval') || DEFAULT_TIMEFRAME_INTERVAL;

  const [activeSymbol, setActiveSymbol] = useState<string>(initialSymbol);
  const [activeInterval, setActiveInterval] = useState<string>(initialInterval);

  // Chart Engine Mode: TradingView Advanced Chart (Default) vs MT5 Trade Overlays
  const [engineMode, setEngineMode] = useState<'tradingview' | 'mt5_overlay'>('tradingview');

  // Multi-pane Layout Mode
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual' | 'quad'>('single');
  const [dualSymbol, setDualSymbol] = useState<string>('EURUSD');

  // Watchlist & Search State
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overlays (from MT5 bridge)
  const [trades, setTrades] = useState<TradeOverlayData[]>([]);
  const [macroEvents, setMacroEvents] = useState<any[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(true);

  // Sync state with URL params
  useEffect(() => {
    const urlSym = searchParams.get('symbol');
    const urlInt = searchParams.get('interval');
    if (urlSym && urlSym !== activeSymbol) {
      setActiveSymbol(urlSym);
    }
    if (urlInt && urlInt !== activeInterval) {
      setActiveInterval(urlInt);
    }
  }, [searchParams]);

  const updateSymbol = (sym: string) => {
    setActiveSymbol(sym);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('symbol', sym);
      return next;
    });
  };

  const updateInterval = (intv: string) => {
    setActiveInterval(intv);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('interval', intv);
      return next;
    });
  };

  // Load User's MT5 Trades & Economic Events
  useEffect(() => {
    loadChartOverlays();
  }, [selectedAccountId]);

  const loadChartOverlays = async () => {
    setIsLoadingTrades(true);
    try {
      const [tradesRes, calRes] = await Promise.all([
        api.getTrades({ accountId: selectedAccountId, limit: 50 }).catch(() => ({ trades: [] })),
        api.getEconomicCalendar({ limit: 20 }).catch(() => ({ events: [] }))
      ]);

      if (tradesRes && tradesRes.trades) {
        const mappedTrades: TradeOverlayData[] = tradesRes.trades.map((t: any) => ({
          id: t.id,
          symbol: t.symbol,
          direction: t.position_type as any,
          openTime: t.entry_time,
          closeTime: t.exit_time,
          openPrice: Number(t.entry_price),
          closePrice: t.exit_price ? Number(t.exit_price) : undefined,
          stopLoss: t.initial_sl ? Number(t.initial_sl) : undefined,
          takeProfit: t.initial_tp ? Number(t.initial_tp) : undefined,
          pnl: t.realized_pnl ? Number(t.realized_pnl) : undefined,
          rMultiple: t.r_multiple ? Number(t.r_multiple) : undefined
        }));
        setTrades(mappedTrades);
      }

      if (calRes && calRes.events) {
        setMacroEvents(calRes.events);
      }
    } catch (err) {
      console.error('Failed to load chart overlay data:', err);
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Resolved metadata for active symbol
  const activeMeta = useMemo(() => {
    return resolveTradingViewSymbol(activeSymbol);
  }, [activeSymbol]);

  // Filtered market catalog
  const filteredInstruments = useMemo(() => {
    return SUPPORTED_INSTRUMENTS.filter((inst) => {
      // Category match
      if (selectedCategory !== 'ALL' && inst.category !== selectedCategory) {
        return false;
      }
      // Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          inst.symbol.toLowerCase().includes(q) ||
          inst.name.toLowerCase().includes(q) ||
          inst.exchange.toLowerCase().includes(q) ||
          inst.tvSymbol.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Active timeframe label
  const activeTimeframeLabel = useMemo(() => {
    const found = TIMEFRAME_PRESETS.find(p => p.interval === activeInterval);
    return found ? found.label : activeInterval;
  }, [activeInterval]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <MetaHead
        title={`${activeSymbol} Live Chart — TradingView Advanced Charts`}
        description={`Real-time interactive candlestick charts for ${activeSymbol} powered by TradingView Advanced Chart widgets with indicators, timeframes, and MT5 synchronization.`}
      />

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border-subtle p-3 rounded-2xl shadow-xs">
        {/* Left: Active Instrument Badge & Engine Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-content-primary tracking-tight font-mono">
                {activeSymbol}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                {activeMeta.instrument ? activeMeta.instrument.exchange : 'TradingView'}
              </span>
              <span className="text-[11px] text-content-muted hidden md:inline">
                {activeMeta.instrument?.name || 'Live Candlesticks'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-content-secondary mt-0.5 font-mono">
              <span>Interval: <strong className="text-content-primary">{activeTimeframeLabel}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Feed</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Engine Switcher, Timeframe Presets, Layouts & Symbol Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Engine Selector: TradingView Advanced vs MT5 Overlays */}
          <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-1 text-xs">
            <button
              onClick={() => setEngineMode('tradingview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                engineMode === 'tradingview'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="Official TradingView Advanced Chart with indicators and drawings"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TradingView</span>
            </button>
            <button
              onClick={() => setEngineMode('mt5_overlay')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                engineMode === 'mt5_overlay'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="ArcadeFX MT5 Trade Execution & SL/TP Markers"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MT5 Trades</span>
            </button>
          </div>

          {/* Timeframe Presets (TradingView Engine) */}
          {engineMode === 'tradingview' && (
            <div className="hidden md:flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-0.5 text-xs font-mono">
              {TIMEFRAME_PRESETS.map((tf) => (
                <button
                  key={tf.interval}
                  onClick={() => updateInterval(tf.interval)}
                  className={`px-2 py-1 rounded-lg font-medium transition ${
                    activeInterval === tf.interval
                      ? 'bg-surface text-accent-primary font-bold shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                  title={tf.longLabel}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}

          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setLayoutMode('single')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'single'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="Single Chart View"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('dual')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'dual'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="Dual Split View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('quad')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'quad'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="4-Grid Multi-Timeframe View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Symbol Selector Button */}
          <PrimaryAction
            label={activeSymbol}
            icon={<Search className="w-3.5 h-3.5" />}
            onClick={() => setIsSymbolPickerOpen(true)}
            title="Search and select market instrument"
          />
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Timeframe Bar */}
      {engineMode === 'tradingview' && (
        <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 bg-surface border border-border-subtle p-2 rounded-xl text-xs font-mono">
          <span className="text-[10px] text-content-muted uppercase shrink-0 mr-1">Timeframe:</span>
          {TIMEFRAME_PRESETS.map((tf) => (
            <button
              key={tf.interval}
              onClick={() => updateInterval(tf.interval)}
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition ${
                activeInterval === tf.interval
                  ? 'bg-accent-primary text-white font-bold'
                  : 'bg-surface-secondary text-content-muted hover:text-content-primary'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Market Directory Rail (Desktop: 3 cols) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-surface border border-border-subtle rounded-2xl overflow-hidden p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted font-mono">
              Market Catalog
            </span>
            <span className="text-[10px] text-content-muted font-mono">
              {filteredInstruments.length} Available
            </span>
          </div>

          {/* Market Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Gold, EURUSD, BTC, S&P..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-accent-primary font-mono placeholder-content-muted"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['ALL', 'METALS', 'FOREX_MAJORS', 'INDICES', 'CRYPTO'] as MarketCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 transition ${
                  selectedCategory === cat
                    ? 'bg-accent-primary text-white font-bold'
                    : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                }`}
              >
                {cat === 'FOREX_MAJORS' ? 'MAJORS' : cat}
              </button>
            ))}
          </div>

          {/* Scrollable Instrument List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[640px] pr-1">
            {filteredInstruments.map((item) => {
              const isSelected = activeSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => updateSymbol(item.symbol)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary shadow-xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-content-secondary hover:text-content-primary'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-xs text-content-primary group-hover:text-accent-primary transition">
                        {item.symbol}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-surface border border-border-subtle text-content-muted uppercase font-mono">
                        {item.exchange}
                      </span>
                    </div>
                    <p className="text-[10px] text-content-muted truncate max-w-[140px]">{item.name}</p>
                  </div>
                  <div className="text-right font-mono text-[10px] text-content-muted">
                    <span>{item.spread}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Banner */}
          <div className="p-2.5 bg-surface-secondary rounded-xl border border-border-subtle text-[11px] space-y-1 font-mono text-content-muted">
            <div className="flex justify-between">
              <span>MT5 Synchronized Trades:</span>
              <strong className="text-content-primary font-bold">{trades.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Macro Calendar Releases:</span>
              <strong className="text-content-primary font-bold">{macroEvents.length}</strong>
            </div>
          </div>
        </div>

        {/* Right Chart Canvas Area (9 cols on desktop, full width on mobile/tablet) */}
        <div className="lg:col-span-9 space-y-4">
          {engineMode === 'tradingview' ? (
            /* --- OFFICIAL TRADINGVIEW ADVANCED CHART WIDGET --- */
            <>
              {layoutMode === 'single' && (
                <TradingViewAdvancedChart
                  symbol={activeSymbol}
                  interval={activeInterval}
                  theme={theme}
                  height={620}
                  allowSymbolChange={true}
                />
              )}

              {layoutMode === 'dual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval={activeInterval}
                    theme={theme}
                    height={540}
                  />
                  <TradingViewAdvancedChart
                    symbol={dualSymbol}
                    interval={activeInterval}
                    theme={theme}
                    height={540}
                  />
                </div>
              )}

              {layoutMode === 'quad' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TradingViewAdvancedChart symbol={activeSymbol} interval="D" theme={theme} height={380} />
                  <TradingViewAdvancedChart symbol={activeSymbol} interval="240" theme={theme} height={380} />
                  <TradingViewAdvancedChart symbol={activeSymbol} interval="60" theme={theme} height={380} />
                  <TradingViewAdvancedChart symbol={activeSymbol} interval="15" theme={theme} height={380} />
                </div>
              )}
            </>
          ) : (
            /* --- ARCADEx MT5 OVERLAYS ENGINE --- */
            <>
              {layoutMode === 'single' && (
                <TradingChart
                  symbol={activeSymbol}
                  initialTimeframe="H1"
                  height={620}
                  trades={trades}
                  macroEvents={macroEvents}
                />
              )}

              {layoutMode === 'dual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TradingChart
                    symbol={activeSymbol}
                    initialTimeframe="H4"
                    height={540}
                    trades={trades}
                    macroEvents={macroEvents}
                  />
                  <TradingChart
                    symbol={dualSymbol}
                    initialTimeframe="M15"
                    height={540}
                    trades={trades}
                    macroEvents={macroEvents}
                  />
                </div>
              )}

              {layoutMode === 'quad' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TradingChart symbol={activeSymbol} initialTimeframe="D1" height={380} trades={trades} />
                  <TradingChart symbol={activeSymbol} initialTimeframe="H4" height={380} trades={trades} />
                  <TradingChart symbol={activeSymbol} initialTimeframe="H1" height={380} trades={trades} />
                  <TradingChart symbol={activeSymbol} initialTimeframe="M15" height={380} trades={trades} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Symbol Search & Watchlist BottomSheet for Mobile / Tablet */}
      <BottomSheet
        isOpen={isSymbolPickerOpen}
        onClose={() => setIsSymbolPickerOpen(false)}
        title="Market Directory"
        subtitle="Select Forex pair, metal, index, or cryptocurrency to render live candlesticks"
        secondaryAction={{
          label: 'Close',
          onClick: () => setIsSymbolPickerOpen(false)
        }}
      >
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search symbol, exchange or name (e.g. Gold, BTC, SPX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs text-content-primary focus:outline-none focus:border-accent-primary font-mono placeholder-content-muted"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 'METALS', 'FOREX_MAJORS', 'FOREX_CROSSES', 'INDICES', 'CRYPTO', 'STOCKS'] as MarketCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono shrink-0 transition ${
                  selectedCategory === cat
                    ? 'bg-accent-primary text-white font-bold'
                    : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* List of Instruments */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredInstruments.length > 0 ? (
              filteredInstruments.map((item) => {
                const isSelected = activeSymbol === item.symbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => {
                      updateSymbol(item.symbol);
                      setIsSymbolPickerOpen(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary font-bold'
                        : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs">{item.symbol}</span>
                      <span className="text-[10px] text-content-muted font-sans truncate max-w-[170px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-content-muted font-mono">
                      {item.exchange}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-content-muted space-y-2">
                <p>No catalog instrument matches "{searchQuery}".</p>
                {searchQuery.trim().length >= 2 && (
                  <button
                    onClick={() => {
                      updateSymbol(searchQuery.trim().toUpperCase());
                      setIsSymbolPickerOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-accent-primary text-white text-xs font-semibold"
                  >
                    Load Custom Ticker "{searchQuery.trim().toUpperCase()}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
