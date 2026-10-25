import { PrimaryAction } from '../components/common/PrimaryAction';
import { BottomSheet } from '../components/common/BottomSheet';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  Calendar,
  Grid,
  Columns,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { TradingChart, TradeOverlayData } from '../components/chart/TradingChart';
import { MetaHead } from '../components/common/MetaHead';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';

const WATCHLIST_SYMBOLS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', spread: '0.8', category: 'Major' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', spread: '1.0', category: 'Major' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', spread: '0.9', category: 'Major' },
  { symbol: 'XAUUSD', name: 'Spot Gold / US Dollar', spread: '1.8', category: 'Metals' },
  { symbol: 'AUDUSD', name: 'Aussie / US Dollar', spread: '1.1', category: 'Major' },
  { symbol: 'USDCAD', name: 'US Dollar / Loonie', spread: '1.2', category: 'Major' },
  { symbol: 'GBPJPY', name: 'Pound / Yen Cross', spread: '1.8', category: 'Cross' },
  { symbol: 'EURJPY', name: 'Euro / Yen Cross', spread: '1.5', category: 'Cross' }
];

export const ChartsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramSymbol = searchParams.get('symbol');
  const { selectedAccountId } = useAccounts();
  const [activeSymbol, setActiveSymbol] = useState<string>(paramSymbol || 'EURUSD');
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (paramSymbol && paramSymbol !== activeSymbol) {
      setActiveSymbol(paramSymbol);
    }
  }, [paramSymbol]);
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual' | 'quad'>('single');
  const [dualSymbol, setDualSymbol] = useState<string>('GBPUSD');
  const [trades, setTrades] = useState<TradeOverlayData[]>([]);
  const [macroEvents, setMacroEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(true);

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

  const filteredWatchlist = WATCHLIST_SYMBOLS.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <MetaHead
        title="Interactive Charts"
        description="Professional multi-timeframe interactive Forex and CFD charts powered by TradingView Lightweight Charts with MT5 trade overlays and indicators."
      />

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border-subtle p-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-content-primary flex items-center gap-2">
              <span>Interactive Charts</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                Lightweight v4
              </span>
            </h1>
            <p className="text-[11px] text-content-secondary">
              Multi-timeframe charting with live MT5 execution overlays, technical indicators & drawing tools
            </p>
          </div>
        </div>

        {/* Multi-Pane Layout Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-xl p-1 text-xs">
            <button
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                layoutMode === 'single'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="Single Chart View"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Single</span>
            </button>
            <button
              onClick={() => setLayoutMode('dual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                layoutMode === 'dual'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="Dual Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dual</span>
            </button>
            <button
              onClick={() => setLayoutMode('quad')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                layoutMode === 'quad'
                  ? 'bg-surface text-content-primary font-bold shadow-xs'
                  : 'text-content-muted hover:text-content-primary'
              }`}
              title="4-Grid Multi-Timeframe View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quad</span>
            </button>
          </div>

          <button
            onClick={loadChartOverlays}
            disabled={isLoadingTrades}
            className="p-2 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-xl text-content-muted hover:text-content-primary transition disabled:opacity-50"
            title="Refresh Trade Overlays"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingTrades ? 'animate-spin' : ''}`} />
          </button>

          <PrimaryAction
            label={activeSymbol}
            icon={<Search className="w-4 h-4" />}
            onClick={() => setIsSymbolPickerOpen(true)}
            title="Change active chart symbol"
          />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Watchlist Rail (Desktop only: 3 cols) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-surface border border-border-subtle rounded-2xl overflow-hidden p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted font-mono">
              Market Watchlist
            </span>
            <span className="text-[10px] text-content-muted font-mono">10 Pairs</span>
          </div>

          {/* Watchlist Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search currency or metal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {/* Symbol Cards */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[640px] pr-1">
            {filteredWatchlist.map((item) => {
              const isSelected = activeSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => setActiveSymbol(item.symbol)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 shadow-xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-content-secondary hover:text-content-primary'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-xs text-content-primary group-hover:text-brand-500 transition">
                        {item.symbol}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-surface border border-border-subtle text-content-muted uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-content-muted truncate max-w-[130px]">{item.name}</p>
                  </div>
                  <div className="text-right font-mono text-[10px] text-content-muted">
                    <span>Spr: {item.spread}p</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Banner */}
          <div className="p-2.5 bg-surface-secondary rounded-xl border border-border-subtle text-[11px] space-y-1 font-mono text-content-muted">
            <div className="flex justify-between">
              <span>My Overlay Trades:</span>
              <strong className="text-content-primary font-bold">{trades.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Macro Events:</span>
              <strong className="text-content-primary font-bold">{macroEvents.length}</strong>
            </div>
          </div>
        </div>

        {/* Right Chart Canvas Area (9 cols on desktop, full width on mobile/tablet) */}
        <div className="lg:col-span-9 space-y-4">
          {layoutMode === 'single' && (
            <TradingChart
              symbol={activeSymbol}
              initialTimeframe="H1"
              height={560}
              trades={trades}
              macroEvents={macroEvents}
            />
          )}

          {layoutMode === 'dual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TradingChart
                symbol={activeSymbol}
                initialTimeframe="H4"
                height={520}
                trades={trades}
                macroEvents={macroEvents}
              />
              <TradingChart
                symbol={dualSymbol}
                initialTimeframe="M15"
                height={520}
                trades={trades}
                macroEvents={macroEvents}
              />
            </div>
          )}

          {layoutMode === 'quad' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TradingChart symbol={activeSymbol} initialTimeframe="D1" height={360} trades={trades} />
              <TradingChart symbol={activeSymbol} initialTimeframe="H4" height={360} trades={trades} />
              <TradingChart symbol={activeSymbol} initialTimeframe="H1" height={360} trades={trades} />
              <TradingChart symbol={activeSymbol} initialTimeframe="M15" height={360} trades={trades} />
            </div>
          )}
        </div>
      </div>

      {/* Symbol Search & Watchlist BottomSheet */}
      <BottomSheet
        isOpen={isSymbolPickerOpen}
        onClose={() => setIsSymbolPickerOpen(false)}
        title="Market Watchlist"
        subtitle="Select currency pair or metal to render on TradingView chart"
        secondaryAction={{
          label: 'Close',
          onClick: () => setIsSymbolPickerOpen(false)
        }}
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search symbol, category or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs text-content-primary focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredWatchlist.map((item) => {
              const isSelected = activeSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    setActiveSymbol(item.symbol);
                    setIsSymbolPickerOpen(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-500 font-bold'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-content-secondary hover:text-content-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-xs">{item.symbol}</span>
                    <span className="text-[10px] text-content-muted font-sans">{item.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-content-muted font-mono">
                    {item.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
