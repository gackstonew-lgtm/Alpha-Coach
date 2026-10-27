import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Grid,
  Columns,
  Square,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Check,
  RotateCcw,
  PenTool,
  Plus,
  Trash2,
  BookmarkCheck
} from 'lucide-react';
import { MetaHead } from '../components/common/MetaHead';
import { useAccounts } from '../context/AccountContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { TradingViewAdvancedChart } from '../components/chart/TradingViewAdvancedChart';
import { TradingChart, TradeOverlayData } from '../components/chart/TradingChart';
import {
  SUPPORTED_INSTRUMENTS,
  TIMEFRAME_PRESETS,
  resolveTradingViewSymbol
} from '../config/tradingViewSymbols';
import {
  loadChartWorkspace,
  saveChartWorkspace,
  resetChartWorkspace,
  loadSymbolDrawings,
  saveSymbolDrawings,
  TRADINGVIEW_STUDY_PRESETS,
  TRADINGVIEW_CHART_STYLES,
  ChartEngineMode,
  ChartLayoutMode,
  TradingViewChartStyle,
  PersistedDrawingItem
} from '../utils/chartWorkspaceStorage';

export const ChartsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { selectedAccountId } = useAccounts();

  // Load persisted charting workspace from browser cookies & localStorage on initial mount
  const persistedWorkspace = useMemo(() => loadChartWorkspace(), []);

  // Active Symbol and Timeframe Interval (URL params override saved workspace if explicitly present)
  const initialSymbol = (searchParams.get('symbol') || persistedWorkspace.activeSymbol).toUpperCase();
  const initialInterval = searchParams.get('interval') || persistedWorkspace.activeInterval;

  const [activeSymbol, setActiveSymbol] = useState<string>(initialSymbol);
  const [activeInterval, setActiveInterval] = useState<string>(initialInterval);
  const [engineMode, setEngineMode] = useState<ChartEngineMode>(persistedWorkspace.engineMode);
  const [layoutMode, setLayoutMode] = useState<ChartLayoutMode>(persistedWorkspace.layoutMode);
  const [dualSymbol, setDualSymbol] = useState<string>(persistedWorkspace.dualSymbol);
  const [chartStyle, setChartStyle] = useState<TradingViewChartStyle>(persistedWorkspace.chartStyle);
  const [activeStudies, setActiveStudies] = useState<string[]>(persistedWorkspace.activeStudies);
  const [hideSideToolbar, setHideSideToolbar] = useState<boolean>(persistedWorkspace.hideSideToolbar);

  // Per-symbol persisted drawings / price levels
  const [symbolDrawings, setSymbolDrawings] = useState<PersistedDrawingItem[]>(() =>
    loadSymbolDrawings(initialSymbol)
  );
  const [customLevelPrice, setCustomLevelPrice] = useState<string>('');
  const [customLevelLabel, setCustomLevelLabel] = useState<string>('Key Level');

  // Workspace & Indicators Popover state
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [workspaceSavedFlash, setWorkspaceSavedFlash] = useState<boolean>(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Overlays (from MT5 bridge & macro calendar)
  const [trades, setTrades] = useState<TradeOverlayData[]>([]);
  const [macroEvents, setMacroEvents] = useState<any[]>([]);

  // Close workspace popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isWorkspaceMenuOpen]);

  // Sync state with URL params when navigated externally
  useEffect(() => {
    const urlSym = searchParams.get('symbol');
    const urlInt = searchParams.get('interval');
    if (urlSym && urlSym.toUpperCase() !== activeSymbol) {
      setActiveSymbol(urlSym.toUpperCase());
    }
    if (urlInt && urlInt !== activeInterval) {
      setActiveInterval(urlInt);
    }
  }, [searchParams]);

  // Reload saved drawings whenever activeSymbol changes
  useEffect(() => {
    setSymbolDrawings(loadSymbolDrawings(activeSymbol));
  }, [activeSymbol]);

  // Automatically persist workspace changes to localStorage & 365-day browser cookie
  useEffect(() => {
    saveChartWorkspace({
      activeSymbol,
      activeInterval,
      engineMode,
      layoutMode,
      dualSymbol,
      chartStyle,
      activeStudies,
      hideSideToolbar
    });
    setWorkspaceSavedFlash(true);
    const t = setTimeout(() => setWorkspaceSavedFlash(false), 1200);
    return () => clearTimeout(t);
  }, [activeSymbol, activeInterval, engineMode, layoutMode, dualSymbol, chartStyle, activeStudies, hideSideToolbar]);

  const updateSymbol = (sym: string) => {
    const normalized = sym.trim().toUpperCase();
    if (!normalized) return;
    setActiveSymbol(normalized);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('symbol', normalized);
        return next;
      },
      { replace: true }
    );
  };

  const updateInterval = (intv: string) => {
    setActiveInterval(intv);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('interval', intv);
        return next;
      },
      { replace: true }
    );
  };

  const toggleStudy = (studyId: string) => {
    setActiveStudies((prev) =>
      prev.includes(studyId) ? prev.filter((id) => id !== studyId) : [...prev, studyId]
    );
  };

  const handleAddDrawingLevel = () => {
    const parsedPrice = parseFloat(customLevelPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;
    const newDrawing: PersistedDrawingItem = {
      id: `lvl_${Date.now()}`,
      type: 'horizontal',
      p1: { time: Date.now(), price: parsedPrice },
      text: customLevelLabel.trim() || 'Key Level',
      color: '#f59e0b',
      createdAt: new Date().toISOString()
    };
    const next = [...symbolDrawings, newDrawing];
    setSymbolDrawings(next);
    saveSymbolDrawings(activeSymbol, next);
    setCustomLevelPrice('');
  };

  const handleRemoveDrawing = (id: string) => {
    const next = symbolDrawings.filter((d) => d.id !== id);
    setSymbolDrawings(next);
    saveSymbolDrawings(activeSymbol, next);
  };

  const handleResetWorkspace = () => {
    const defaults = resetChartWorkspace();
    setActiveSymbol(defaults.activeSymbol);
    setActiveInterval(defaults.activeInterval);
    setEngineMode(defaults.engineMode);
    setLayoutMode(defaults.layoutMode);
    setDualSymbol(defaults.dualSymbol);
    setChartStyle(defaults.chartStyle);
    setActiveStudies(defaults.activeStudies);
    setHideSideToolbar(defaults.hideSideToolbar);
    setSearchParams({}, { replace: true });
    setIsWorkspaceMenuOpen(false);
  };

  // Load User's MT5 Trades & Economic Events
  useEffect(() => {
    loadChartOverlays();
  }, [selectedAccountId]);

  const loadChartOverlays = async () => {
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
    }
  };

  // Resolved metadata for active symbol
  const activeMeta = useMemo(() => {
    return resolveTradingViewSymbol(activeSymbol);
  }, [activeSymbol]);

  // Grouped instruments for compact header dropdown
  const groupedInstruments = useMemo(() => {
    const groups: Record<string, typeof SUPPORTED_INSTRUMENTS> = {
      Metals: SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'METALS'),
      'Forex Majors': SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'FOREX_MAJORS'),
      'Forex Crosses': SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'FOREX_CROSSES'),
      Indices: SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'INDICES'),
      Crypto: SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'CRYPTO'),
      Equities: SUPPORTED_INSTRUMENTS.filter((i) => i.category === 'STOCKS')
    };
    return groups;
  }, []);

  // Active timeframe label
  const activeTimeframeLabel = useMemo(() => {
    const found = TIMEFRAME_PRESETS.find((p) => p.interval === activeInterval);
    return found ? found.label : activeInterval;
  }, [activeInterval]);

  return (
    <div className="flex-1 flex flex-col w-full min-w-0 min-h-0 gap-2 sm:gap-2.5 animate-in fade-in duration-300">
      <MetaHead
        title={`${activeSymbol} Live Chart — TradingView Advanced Charts`}
        description={`Real-time interactive candlestick charts for ${activeSymbol} powered by TradingView Advanced Chart widgets with saved indicators, drawings, timeframes, and MT5 synchronization.`}
      />

      {/* Compact Top Workspace Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-surface border border-border-subtle px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl shadow-xs shrink-0">
        {/* Left: Active Instrument Selector & Live Status */}
        <div className="flex items-center justify-between lg:justify-start gap-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>

            {/* Compact Instrument Selector Dropdown */}
            <div className="flex items-center gap-1.5 min-w-0">
              <select
                aria-label="Select trading instrument"
                value={activeSymbol}
                onChange={(e) => updateSymbol(e.target.value)}
                className="bg-surface-secondary hover:bg-surface border border-border-subtle rounded-xl px-2.5 py-1 text-xs sm:text-sm font-bold text-content-primary font-mono focus:outline-none focus:border-accent-primary transition cursor-pointer"
              >
                {Object.entries(groupedInstruments).map(([groupLabel, items]) => (
                  <optgroup key={groupLabel} label={groupLabel}>
                    {items.map((item) => (
                      <option key={item.symbol} value={item.symbol}>
                        {item.symbol} — {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {!SUPPORTED_INSTRUMENTS.some((i) => i.symbol === activeSymbol) && (
                  <optgroup label="Custom Ticker">
                    <option value={activeSymbol}>{activeSymbol}</option>
                  </optgroup>
                )}
              </select>

              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0">
                {activeMeta.instrument ? activeMeta.instrument.exchange : 'TradingView'}
              </span>
            </div>
          </div>

          {/* Live Feed & Workspace Persistence Status Badge */}
          <div className="flex items-center gap-2 text-[11px] text-content-secondary font-mono shrink-0">
            <span className="hidden xl:inline text-content-muted">
              {activeMeta.instrument?.name || 'Live Candlesticks'} ({activeTimeframeLabel})
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border transition ${
                workspaceSavedFlash
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-surface-secondary text-content-muted border-border-subtle'
              }`}
              title="Your symbol, timeframe, indicators, drawings, and layout are automatically saved in browser cookies & local storage across sessions"
            >
              <BookmarkCheck className="w-3 h-3 text-emerald-400" />
              <span className="hidden md:inline">Session Saved</span>
            </span>
          </div>
        </div>

        {/* Right: Timeframe Presets, Workspace/Indicators Menu, Engine Switcher & Layouts */}
        <div className="flex items-center justify-between lg:justify-end gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* Timeframe Presets (Desktop & Tablet Inline, Mobile Scrollable below) */}
          {engineMode === 'tradingview' && (
            <div className="hidden md:flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-0.5 text-xs font-mono shrink-0">
              {TIMEFRAME_PRESETS.map((tf) => (
                <button
                  key={tf.interval}
                  type="button"
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

          <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
            {/* Workspace, Indicators & Drawings Persistence Popover */}
            <div className="relative" ref={workspaceMenuRef}>
              <button
                type="button"
                onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  isWorkspaceMenuOpen || activeStudies.length > 0 || symbolDrawings.length > 0
                    ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                    : 'bg-surface-secondary border-border-subtle text-content-secondary hover:text-content-primary'
                }`}
                title="Configure & persist indicators, chart style, and saved drawing levels"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Indicators & Workspace</span>
                {(activeStudies.length > 0 || symbolDrawings.length > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-accent-primary text-white text-[10px] font-mono">
                    {activeStudies.length + symbolDrawings.length}
                  </span>
                )}
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute right-0 mt-1.5 z-40 w-80 sm:w-96 bg-surface border border-border-subtle rounded-2xl shadow-2xl p-3.5 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <div>
                      <h3 className="font-bold text-content-primary text-xs">
                        Saved Charting Workspace
                      </h3>
                      <p className="text-[10px] text-content-muted">
                        Auto-saved to cookies &amp; local storage for next session
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetWorkspace}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-secondary hover:bg-rose-500/10 text-content-muted hover:text-rose-400 text-[10px] font-mono transition"
                      title="Reset workspace to default settings"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Chart Style Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted font-bold">
                      Candlestick / Bar Style
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {TRADINGVIEW_CHART_STYLES.map((st) => (
                        <button
                          key={st.style}
                          type="button"
                          onClick={() => setChartStyle(st.style)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                            chartStyle === st.style
                              ? 'bg-accent-primary/15 border-accent-primary/40 text-accent-primary font-bold'
                              : 'bg-surface-secondary border-border-subtle text-content-secondary hover:text-content-primary'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Persisted Technical Indicators (TradingView Studies) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted font-bold">
                        Persisted Indicators ({activeStudies.length} Active)
                      </span>
                      <button
                        type="button"
                        onClick={() => setHideSideToolbar((prev) => !prev)}
                        className="text-[10px] font-mono text-accent-primary hover:underline flex items-center gap-1"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>{hideSideToolbar ? 'Show Drawing Bar' : 'Drawing Bar Active'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {TRADINGVIEW_STUDY_PRESETS.map((study) => {
                        const isActive = activeStudies.includes(study.id);
                        return (
                          <button
                            key={study.id}
                            type="button"
                            onClick={() => toggleStudy(study.id)}
                            className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition ${
                              isActive
                                ? 'bg-accent-primary/15 border-accent-primary/40 text-accent-primary font-bold'
                                : 'bg-surface-secondary/60 border-border-subtle text-content-secondary hover:text-content-primary'
                            }`}
                            title={study.label}
                          >
                            <span className="truncate">{study.shortLabel}</span>
                            {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Persisted Symbol Key Levels / Drawings Record */}
                  <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted font-bold block">
                      Saved Price Levels &amp; Drawings ({activeSymbol})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        placeholder="Price (e.g. 2650.00)"
                        value={customLevelPrice}
                        onChange={(e) => setCustomLevelPrice(e.target.value)}
                        className="w-28 bg-surface-secondary border border-border-subtle rounded-lg px-2 py-1 text-xs font-mono text-content-primary focus:outline-none focus:border-accent-primary"
                      />
                      <input
                        type="text"
                        placeholder="Label (Support, TP...)"
                        value={customLevelLabel}
                        onChange={(e) => setCustomLevelLabel(e.target.value)}
                        className="flex-1 bg-surface-secondary border border-border-subtle rounded-lg px-2 py-1 text-xs text-content-primary focus:outline-none focus:border-accent-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddDrawingLevel}
                        className="p-1.5 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition shrink-0"
                        title="Save price level for this symbol"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {symbolDrawings.length > 0 ? (
                      <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                        {symbolDrawings.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-secondary border border-border-subtle text-[11px] font-mono"
                          >
                            <span className="truncate text-content-primary">
                              <strong>{item.p1.price}</strong> — {item.text || 'Level'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDrawing(item.id)}
                              className="text-content-muted hover:text-rose-400 p-0.5"
                              title="Remove saved level"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-content-muted italic">
                        No saved levels for {activeSymbol} yet. Add a price level above or use the chart drawing toolbar.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dual View Second Symbol Selector (only visible in Dual mode) */}
            {layoutMode === 'dual' && (
              <select
                aria-label="Select secondary comparison symbol"
                value={dualSymbol}
                onChange={(e) => setDualSymbol(e.target.value)}
                className="bg-surface-secondary border border-border-subtle rounded-xl px-2 py-1 text-xs font-mono font-bold text-content-primary focus:outline-none focus:border-accent-primary"
                title="Comparison Symbol (Right Pane)"
              >
                {SUPPORTED_INSTRUMENTS.map((inst) => (
                  <option key={inst.symbol} value={inst.symbol}>
                    vs {inst.symbol}
                  </option>
                ))}
              </select>
            )}

            {/* Engine Selector: TradingView Advanced vs MT5 Overlays */}
            <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEngineMode('tradingview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
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
                type="button"
                onClick={() => setEngineMode('mt5_overlay')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
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

            {/* Layout Mode Toggles */}
            <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('single')}
                className={`p-1.5 rounded-lg transition ${
                  layoutMode === 'single'
                    ? 'bg-surface text-content-primary font-bold shadow-xs'
                    : 'text-content-muted hover:text-content-primary'
                }`}
                title="Single Full-Workspace Chart View"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
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
                type="button"
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
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Compact Horizontal Timeframe Bar */}
      {engineMode === 'tradingview' && (
        <div className="flex md:hidden items-center gap-1 overflow-x-auto bg-surface border border-border-subtle px-2.5 py-1.5 rounded-xl text-xs font-mono shrink-0">
          <span className="text-[10px] text-content-muted uppercase shrink-0 mr-1">TF:</span>
          {TIMEFRAME_PRESETS.map((tf) => (
            <button
              key={tf.interval}
              type="button"
              onClick={() => updateInterval(tf.interval)}
              className={`px-2 py-0.5 rounded-lg font-medium shrink-0 transition ${
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

      {/* Full-Workspace Candlestick Chart Container (100% Width & Maximum Viewport Height) */}
      <div className="flex-1 flex flex-col w-full min-w-0 min-h-0">
        {engineMode === 'tradingview' ? (
          <>
            {layoutMode === 'single' && (
              <div className="flex-1 w-full min-w-0 h-[calc(100dvh-188px)] sm:h-[calc(100dvh-170px)] lg:h-[calc(100dvh-132px)] min-h-[460px] sm:min-h-[560px] lg:min-h-[660px]">
                <TradingViewAdvancedChart
                  symbol={activeSymbol}
                  interval={activeInterval}
                  theme={theme}
                  height="100%"
                  allowSymbolChange={true}
                  studies={activeStudies}
                  chartStyle={chartStyle}
                  hideSideToolbar={hideSideToolbar}
                />
              </div>
            )}

            {layoutMode === 'dual' && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 w-full min-w-0 min-h-[540px] lg:h-[calc(100dvh-132px)]">
                <div className="w-full min-w-0 h-[440px] sm:h-[520px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval={activeInterval}
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
                <div className="w-full min-w-0 h-[440px] sm:h-[520px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={dualSymbol}
                    interval={activeInterval}
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
              </div>
            )}

            {layoutMode === 'quad' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0 lg:h-[calc(100dvh-132px)] min-h-[760px]">
                <div className="w-full min-w-0 h-[360px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval="D"
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
                <div className="w-full min-w-0 h-[360px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval="240"
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
                <div className="w-full min-w-0 h-[360px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval="60"
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
                <div className="w-full min-w-0 h-[360px] lg:h-full">
                  <TradingViewAdvancedChart
                    symbol={activeSymbol}
                    interval="15"
                    theme={theme}
                    height="100%"
                    studies={activeStudies}
                    chartStyle={chartStyle}
                    hideSideToolbar={hideSideToolbar}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* --- ARCADE FX MT5 OVERLAYS ENGINE --- */
          <>
            {layoutMode === 'single' && (
              <div className="flex-1 w-full min-w-0">
                <TradingChart
                  symbol={activeSymbol}
                  initialTimeframe="H1"
                  height={660}
                  trades={trades}
                  macroEvents={macroEvents}
                />
              </div>
            )}

            {layoutMode === 'dual' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full min-w-0">
                <TradingChart
                  symbol={activeSymbol}
                  initialTimeframe="H4"
                  height={580}
                  trades={trades}
                  macroEvents={macroEvents}
                />
                <TradingChart
                  symbol={dualSymbol}
                  initialTimeframe="M15"
                  height={580}
                  trades={trades}
                  macroEvents={macroEvents}
                />
              </div>
            )}

            {layoutMode === 'quad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
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
  );
};
