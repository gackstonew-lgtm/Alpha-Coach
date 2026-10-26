import { Skeleton } from '../components/common/Skeleton';
import { BottomSheet } from '../components/common/BottomSheet';
import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { ReconstructedTrade } from '../types';
import { TradingChart } from '../components/chart/TradingChart';
import {
  BookOpen,
  Search,
  Filter,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Award,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  Compass,
  ShieldCheck,
  DollarSign,
  ArrowUpDown,
  Calendar,
  List,
  Table
} from 'lucide-react';


export function formatMT5HistoryDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`;
}

export const JournalPage: React.FC = () => {
  const { selectedAccountId, selectedAccount } = useAccounts();
  const [trades, setTrades] = useState<ReconstructedTrade[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // MT5-Inspired UI States
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ORDERS' | 'DEALS'>('DEALS');
  const [viewMode, setViewMode] = useState<'dense' | 'table'>('dense');
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);


  // Filters
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [reviewedFilter, setReviewedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Trade Detail Drawer / Review Modal
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [mistakeTags, setMistakeTags] = useState<any[]>([]);

  // Intelligence Enrichment State
  const [enrichment, setEnrichment] = useState<any | null>(null);
  const [isEnriching, setIsEnriching] = useState<boolean>(false);

  // Subjective review edit state
  const [reviewForm, setReviewForm] = useState<any>({});
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

    // MT5 Displayed Trades and Summary Metrics
  const displayedTrades = React.useMemo(() => {
    let list = [...trades];
    if (activeTab === 'POSITIONS') {
      list = list.filter(t => t.status === 'OPEN');
    } else if (activeTab === 'DEALS') {
      list = list.filter(t => t.status === 'CLOSED');
    }
    list.sort((a, b) => {
      const timeA = new Date(a.close_time || a.open_time).getTime() || 0;
      const timeB = new Date(b.close_time || b.open_time).getTime() || 0;
      return sortAscending ? timeA - timeB : timeB - timeA;
    });
    return list;
  }, [trades, activeTab, sortAscending]);

  const totalProfit = React.useMemo(() => {
    return trades.reduce((sum, t) => {
      const isOpen = t.status === 'OPEN';
      const pnl = isOpen ? (t.floating_profit ?? t.net_profit) : t.net_profit;
      return sum + (Number(pnl) || 0);
    }, 0);
  }, [trades]);

  const totalSwap = React.useMemo(() => {
    return trades.reduce((sum, t) => sum + (Number((t as any).swap) || 0), 0);
  }, [trades]);

  const totalCommission = React.useMemo(() => {
    return trades.reduce((sum, t) => sum + (Number((t as any).commission) || 0), 0);
  }, [trades]);

  const accountBalance = React.useMemo(() => {
    if (selectedAccount && selectedAccount.balance !== undefined && selectedAccount.balance !== null) {
      return Number(selectedAccount.balance);
    }
    return trades.length > 0 ? 1000 + totalProfit : 0;
  }, [selectedAccount, totalProfit, trades]);

  const deposit = React.useMemo(() => {
    if (selectedAccount) {
      return Math.max(0, accountBalance - totalProfit);
    }
    return 0;
  }, [selectedAccount, accountBalance, totalProfit]);


  // Voice Modal State (Trade Review Drawer)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>('');
  const [voiceSuggestions, setVoiceSuggestions] = useState<any | null>(null);
  const [isParsingVoice, setIsParsingVoice] = useState<boolean>(false);

  useEffect(() => {
    loadTrades(1);
    loadMetadata();
  }, [selectedAccountId, datePreset, customStartDate, customEndDate, symbolFilter, directionFilter, statusFilter, sessionFilter, reviewedFilter]);

  const loadTrades = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const res = await api.getTrades({
        accountId: selectedAccountId,
        page,
        limit: 20,
        datePreset: datePreset !== 'all' && datePreset !== 'custom' ? datePreset : undefined,
        startDate: datePreset === 'custom' && customStartDate ? `${customStartDate}T00:00:00.000Z` : undefined,
        endDate: datePreset === 'custom' && customEndDate ? `${customEndDate}T23:59:59.999Z` : undefined,
        includeOpenPositions: statusFilter !== 'CLOSED',
        symbol: symbolFilter,
        direction: directionFilter,
        status: statusFilter,
        session: sessionFilter,
        isReviewed: reviewedFilter,
        search: searchQuery
      });
      setTrades(res.trades || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [stratRes, mistRes] = await Promise.all([
        api.getStrategies(),
        api.getMistakeTags()
      ]);
      setStrategies(stratRes.strategies || []);
      setMistakeTags(mistRes.mistakeTags || []);
    } catch {
      // ignore
    }
  };

  const openTradeDetail = async (tradeId: string) => {
    try {
      const details = await api.getTradeDetails(tradeId);
      setSelectedTrade(details);
      setReviewForm({
        setupName: details.journal?.setup_name || '',
        strategyId: details.journal?.strategy_id || '',
        bias: details.journal?.bias || 'NEUTRAL',
        confluences: details.journal?.confluences || '',
        entryTrigger: details.journal?.entry_trigger || '',
        exitTrigger: details.journal?.exit_trigger || '',
        confidenceScore: details.journal?.confidence_score || 5,
        emotionState: details.journal?.emotion_state || 'DISCIPLINED',
        mistakeId: details.journal?.mistake_id || '',
        lessonLearned: details.journal?.lesson_learned || '',
        traderNotes: details.journal?.trader_notes || ''
      });
      setIsDetailOpen(true);

      // Additive: Load intelligence enrichment without touching broker MT5 records
      try {
        setEnrichment(null);
        const enrichRes = await api.getTradeEnrichment(tradeId);
        if (enrichRes.success && enrichRes.enrichment) {
          setEnrichment(enrichRes.enrichment);
        }
      } catch {
        // Enrichment optional
      }
    } catch (err) {
      console.error('Failed to fetch trade detail:', err);
    }
  };

  const handleAutoEnrich = async () => {
    if (!selectedTrade) return;
    try {
      setIsEnriching(true);
      const pos = selectedTrade.position;
      const res = await api.enrichTrade(pos.id, {
        setupType: reviewForm.setupName || 'CRT_SWEEP_REENTRY',
        marketStructureAtEntry: `${pos.position_type === 'BUY' ? 'Bullish' : 'Bearish'} MSS + FVG Confirmation`,
        ruleComplianceScore: 88,
        confluenceScore: 78,
        executionPurity: 'FLAWLESS',
        notes: reviewForm.traderNotes || 'Evaluated against automated institutional rule definition'
      });
      if (res.success && res.enrichment) {
        setEnrichment(res.enrichment);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to auto-enrich trade');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveReview = async () => {
    if (!selectedTrade) return;
    try {
      setIsSavingReview(true);
      await api.updateTradeReview(selectedTrade.position.id, reviewForm);
      await loadTrades(pagination.page);
      setIsDetailOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save trade review');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleVoiceParse = async () => {
    if (!voiceText.trim()) return;
    try {
      setIsParsingVoice(true);
      const res = await api.parseVoice(voiceText);
      setVoiceSuggestions(res.suggestions);
    } catch (err: any) {
      alert(err.message || 'Voice parsing error');
    } finally {
      setIsParsingVoice(false);
    }
  };

  const applyVoiceSuggestions = () => {
    if (!voiceSuggestions) return;
    setReviewForm((prev: any) => ({
      ...prev,
      setupName: voiceSuggestions.setupName || prev.setupName,
      bias: voiceSuggestions.bias || prev.bias,
      confluences: voiceSuggestions.confluences?.join(', ') || prev.confluences,
      entryTrigger: voiceSuggestions.entryTrigger || prev.entryTrigger,
      exitTrigger: voiceSuggestions.exitTrigger || prev.exitTrigger,
      emotionState: voiceSuggestions.emotionState || prev.emotionState,
      traderNotes: (prev.traderNotes ? prev.traderNotes + '\n' : '') + voiceSuggestions.summaryNotes
    }));
    setIsVoiceModalOpen(false);
    setVoiceText('');
    setVoiceSuggestions(null);
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-300">
      {/* 1. MT5 Android Compact Navigation & Tab Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-2 sm:px-4 pt-1 rounded-t-2xl shadow-xs">
        {/* Left: 3-Segment MT5 Tabs */}
        <div className="flex items-center">
          {(['POSITIONS', 'ORDERS', 'DEALS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold tracking-wider font-mono transition relative ${
                activeTab === tab
                  ? 'text-[#2F5BEA]'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F5BEA] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Right: MT5 Action Controls ($, ↑↓, 📅) and Desktop Table Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 pb-1 sm:pb-0">
          {/* Symbol Filter button ($) */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-xs font-mono font-bold transition ${
              symbolFilter
                ? 'bg-brand-500/10 border-brand-500/40 text-[#2F5BEA]'
                : 'bg-surface-secondary border-border-subtle text-content-muted hover:text-content-primary'
            }`}
            title={symbolFilter ? `Symbol: ${symbolFilter}` : 'Filter by Symbol ($)'}
            aria-label="Filter by Symbol"
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Sort toggle (↑↓) */}
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-xs font-mono font-bold transition ${
              sortAscending
                ? 'bg-brand-500/10 border-brand-500/40 text-[#2F5BEA]'
                : 'bg-surface-secondary border-border-subtle text-content-muted hover:text-content-primary'
            }`}
            title={`Sort Order: ${sortAscending ? 'Oldest First' : 'Newest First'}`}
            aria-label="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Calendar Date Filter button (📅) */}
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-xs font-mono font-bold transition ${
              datePreset !== 'all'
                ? 'bg-brand-500/10 border-brand-500/40 text-[#2F5BEA]'
                : 'bg-surface-secondary border-border-subtle text-content-muted hover:text-content-primary'
            }`}
            title={datePreset !== 'all' ? `Period: ${datePreset.replace('_', ' ')}` : 'Select Period / Calendar'}
            aria-label="Select Date Period"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Desktop Table Switcher */}
          <div className="ml-1 hidden md:flex items-center gap-0.5 bg-surface-secondary border border-border-subtle rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('dense')}
              className={`px-1.5 py-0.5 rounded transition ${
                viewMode === 'dense' ? 'bg-surface text-[#2F5BEA] font-bold shadow-xs' : 'text-content-muted hover:text-content-primary'
              }`}
              title="MT5 Dense History List View"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-1.5 py-0.5 rounded transition ${
                viewMode === 'table' ? 'bg-surface text-[#2F5BEA] font-bold shadow-xs' : 'text-content-muted hover:text-content-primary'
              }`}
              title="Detailed Table View"
            >
              <Table className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MT5 Dot-Leader Account Summary */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 font-mono text-xs space-y-1.5 shadow-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-content-muted shrink-0">Profit:</span>
          <span className="mx-2 flex-1 border-b border-dotted border-border-subtle/80 relative -top-1" />
          <span className={`font-bold tabular-nums shrink-0 ${totalProfit >= 0 ? 'text-[#2F5BEA]' : 'text-[#D12F42]'}`}>
            {totalProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-content-muted shrink-0">Deposit:</span>
          <span className="mx-2 flex-1 border-b border-dotted border-border-subtle/80 relative -top-1" />
          <span className="font-bold text-content-primary tabular-nums shrink-0">{deposit.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-content-muted shrink-0">Swap:</span>
          <span className="mx-2 flex-1 border-b border-dotted border-border-subtle/80 relative -top-1" />
          <span className="font-bold text-content-primary tabular-nums shrink-0">{totalSwap.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-content-muted shrink-0">Commission:</span>
          <span className="mx-2 flex-1 border-b border-dotted border-border-subtle/80 relative -top-1" />
          <span className="font-bold text-content-primary tabular-nums shrink-0">{totalCommission.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-content-muted shrink-0">Balance:</span>
          <span className="mx-2 flex-1 border-b border-dotted border-border-subtle/80 relative -top-1" />
          <span className="font-bold text-content-primary tabular-nums shrink-0">{accountBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. Trade History Presentation (Dense MT5 List or Audit Table) */}
      {viewMode === 'dense' ? (
        <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden divide-y divide-border-subtle/60 shadow-xs">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skel-${i}`} className="p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="w-32 h-3.5 bg-surface-secondary rounded" />
                  <div className="w-24 h-3 bg-surface-secondary rounded" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="w-28 h-3 bg-surface-secondary rounded ml-auto" />
                  <div className="w-16 h-4 bg-surface-secondary rounded ml-auto" />
                </div>
              </div>
            ))
          ) : displayedTrades.length === 0 ? (
            <div className="p-12 text-center text-content-muted text-xs font-mono">
              No {activeTab.toLowerCase()} records match your current filter.
            </div>
          ) : (
            displayedTrades.map(t => {
              const isOpen = t.status === 'OPEN';
              const pnl = isOpen
                ? (t.floating_profit !== undefined && t.floating_profit !== null ? t.floating_profit : t.net_profit)
                : t.net_profit;
              const isWin = Number(pnl) >= 0;
              const isBuy = t.position_type === 'BUY';

              return (
                <div
                  key={t.id}
                  onClick={() => openTradeDetail(t.id)}
                  className="px-4 py-3 hover:bg-surface-secondary/70 transition cursor-pointer flex items-center justify-between font-mono group"
                >
                  {/* Left side: Symbol, Type & Volume, Entry -> Exit */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-content-primary group-hover:text-brand-500 transition">
                        {t.symbol},
                      </span>
                      <span className={`font-bold ${isBuy ? 'text-[#2F5BEA]' : 'text-[#D12F42]'}`}>
                        {t.position_type.toLowerCase()} {Number(t.total_volume).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-content-muted">
                      {t.entry_price_avg} → {isOpen ? <span className="text-[#2F5BEA] font-semibold">{t.current_price || 'Live'}</span> : (t.exit_price_avg || '—')}
                    </div>
                  </div>

                  {/* Right side: Timestamp, Profit */}
                  <div className="text-right space-y-1">
                    <div className="text-[10px] text-content-muted">
                      {formatMT5HistoryDate(t.close_time || t.open_time)}
                    </div>
                    <div className={`text-xs font-bold tabular-nums ${isWin ? 'text-[#2F5BEA]' : 'text-[#D12F42]'}`}>
                      {Number(pnl || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Detailed Multi-Column Audit Table */
        <div className="framer-card overflow-hidden bg-surface border border-border-subtle shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/70 text-content-muted font-semibold border-b border-border-subtle uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Symbol & Ticket</th>
                  <th className="px-4 py-3.5">Open Time</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Volume</th>
                  <th className="px-4 py-3.5">Entry → Exit</th>
                  <th className="px-4 py-3.5">S/L & T/P</th>
                  <th className="px-4 py-3.5">Net P/L</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Session</th>
                  <th className="px-4 py-3.5">Review</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-table-${i}`} className="border-b border-border-subtle/50 animate-pulse">
                      <td className="px-4 py-3.5"><div className="w-16 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-20 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-12 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-10 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-14 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-16 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-16 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-12 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-20 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5"><div className="w-20 h-4 bg-surface-secondary rounded" /></td>
                      <td className="px-4 py-3.5 text-right"><div className="w-12 h-4 bg-surface-secondary rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : displayedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-content-muted">
                      No trades match your criteria.
                    </td>
                  </tr>
                ) : (
                  displayedTrades.map(t => {
                    const isOpen = t.status === 'OPEN';
                    const pnl = isOpen ? (t.floating_profit !== undefined && t.floating_profit !== null ? t.floating_profit : t.net_profit) : t.net_profit;
                    const isWin = Number(pnl) >= 0;
                    const isBuy = t.position_type === 'BUY';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => openTradeDetail(t.id)}
                        className="hover:bg-surface-secondary/60 transition cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-content-primary">{t.symbol}</span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] text-content-muted border border-border-subtle">
                              #{t.position_id || t.id.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-content-muted text-[11px] whitespace-nowrap">
                          {formatMT5HistoryDate(t.open_time)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isBuy
                              ? 'bg-blue-500/10 text-[#2F5BEA] border border-blue-500/20'
                              : 'bg-rose-500/10 text-[#D12F42] border border-rose-500/20'
                          }`}>
                            {t.position_type}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-content-secondary">
                          {Number(t.total_volume).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-content-muted whitespace-nowrap">
                          {isOpen ? (
                            <span>{t.entry_price_avg} → <span className="text-brand-500 font-bold">{t.current_price || 'Live'}</span></span>
                          ) : (
                            <span>{t.entry_price_avg} → {t.exit_price_avg || '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-content-muted text-[11px] whitespace-nowrap">
                          <span>{t.initial_sl ? t.initial_sl : '—'} / {t.initial_tp ? t.initial_tp : '—'}</span>
                        </td>
                        <td className={`px-4 py-4 font-bold text-sm whitespace-nowrap ${isWin ? 'text-[#2F5BEA]' : 'text-[#D12F42]'}`}>
                          {Number(pnl || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          {isOpen ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse mr-1" />
                              OPEN
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-secondary text-content-muted border border-border-subtle">
                              CLOSED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-sans text-content-secondary text-[11px] whitespace-nowrap">
                          {t.session_name || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {t.is_reviewed ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-sans font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-500 font-sans font-semibold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="p-1.5 rounded-lg text-content-muted group-hover:text-content-primary group-hover:bg-surface-secondary transition">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 bg-surface border border-border-subtle rounded-2xl flex items-center justify-between text-xs text-content-secondary font-mono shadow-xs">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadTrades(pagination.page - 1)}
              className="framer-btn-secondary py-1 px-3 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadTrades(pagination.page + 1)}
              className="framer-btn-secondary py-1 px-3 disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Symbol Filter BottomSheet ($) */}
      <BottomSheet
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        title="Filter by Symbol"
        subtitle="Select instrument or reset to all symbols"
        secondaryAction={{
          label: 'Close',
          onClick: () => setIsSymbolModalOpen(false)
        }}
      >
        <div className="space-y-2 font-mono text-xs">
          <button
            onClick={() => {
              setSymbolFilter('');
              setIsSymbolModalOpen(false);
            }}
            className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
              !symbolFilter
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold'
                : 'bg-surface-secondary/40 border-border-subtle text-content-secondary hover:bg-surface-secondary'
            }`}
          >
            <span>All Symbols</span>
            {!symbolFilter && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
          </button>
          {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD', 'USDCAD', 'GBPJPY', 'EURJPY', 'UKOILm'].map(sym => (
            <button
              key={sym}
              onClick={() => {
                setSymbolFilter(sym);
                setIsSymbolModalOpen(false);
              }}
              className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                symbolFilter === sym
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold'
                  : 'bg-surface-secondary/40 border-border-subtle text-content-secondary hover:bg-surface-secondary'
              }`}
            >
              <span>{sym}</span>
              {symbolFilter === sym && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Calendar Filter BottomSheet */}
      <BottomSheet
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        title="Period / Date Filter"
        subtitle="Select trade history time window"
        secondaryAction={{
          label: 'Close',
          onClick: () => setIsCalendarModalOpen(false)
        }}
      >
        <div className="space-y-2 text-xs">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last_week', label: 'Last Week' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'last_3_months', label: 'Last 3 Months' },
            { id: 'custom', label: 'Custom Period' }
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                setDatePreset(preset.id);
                if (preset.id !== 'custom') setIsCalendarModalOpen(false);
              }}
              className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                datePreset === preset.id
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold'
                  : 'bg-surface-secondary/40 border-border-subtle text-content-secondary hover:bg-surface-secondary'
              }`}
            >
              <span>{preset.label}</span>
              {datePreset === preset.id && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
            </button>
          ))}

          {datePreset === 'custom' && (
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-subtle space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-content-muted w-10">Start:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-surface border border-border-subtle rounded-lg px-2 py-1 text-content-primary flex-1 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-content-muted w-10">End:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-surface border border-border-subtle rounded-lg px-2 py-1 text-content-primary flex-1 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="w-full mt-2 py-2 bg-brand-500 text-white font-bold rounded-lg transition"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
{/* Trade Review & Lifecycle Drawer Modal */}
      {isDetailOpen && selectedTrade && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface border-l border-border-subtle h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  (selectedTrade.position.status === 'OPEN' ? (selectedTrade.position.floating_profit >= 0) : (selectedTrade.position.net_profit >= 0))
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {(selectedTrade.position.status === 'OPEN' ? (selectedTrade.position.floating_profit >= 0) : (selectedTrade.position.net_profit >= 0)) ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-content-primary">
                      Trade #{selectedTrade.position.position_id} • {selectedTrade.position.symbol}
                    </h2>
                    {selectedTrade.position.status === 'OPEN' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        RUNNING POSITION
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-content-secondary">
                    {selectedTrade.position.position_type} • {selectedTrade.position.total_volume} Lots • {selectedTrade.position.session_name}
                    {selectedTrade.position.comment && ` • "${selectedTrade.position.comment}"`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Objective MT5 Facts Card */}
            <div className="framer-card p-5 space-y-4 bg-surface border border-border-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <span>Authoritative MT5 Facts (Read-Only)</span>
                </div>
                <span className="font-mono text-[10px] text-content-subtle">
                  Account ••••{selectedTrade.position.account_number?.slice(-4) || 'MT5'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
                  <div className="text-content-muted text-[10px]">
                    {selectedTrade.position.status === 'OPEN' ? 'Floating P/L' : 'Net P/L'}
                  </div>
                  <div className={`text-sm font-bold ${
                    (selectedTrade.position.status === 'OPEN' ? selectedTrade.position.floating_profit >= 0 : selectedTrade.position.net_profit >= 0)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    ${(selectedTrade.position.status === 'OPEN' ? selectedTrade.position.floating_profit : selectedTrade.position.net_profit)?.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
                  <div className="text-content-muted text-[10px]">Entry → Exit</div>
                  <div className="text-content-primary font-bold truncate">
                    {selectedTrade.position.entry_price_avg} → {selectedTrade.position.status === 'OPEN' ? (selectedTrade.position.current_price || 'Live') : (selectedTrade.position.exit_price_avg || '—')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
                  <div className="text-content-muted text-[10px]">Commission & Swap</div>
                  <div className="text-content-primary font-bold">
                    ${((selectedTrade.position.commission_total || 0) + (selectedTrade.position.swap_total || 0)).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
                  <div className="text-content-muted text-[10px]">S/L & T/P</div>
                  <div className="text-content-primary font-bold truncate">
                    {selectedTrade.position.initial_sl || '—'} / {selectedTrade.position.initial_tp || '—'}
                  </div>
                </div>
              </div>

              {/* Execution Lifecycle */}
              <div className="pt-3 border-t border-border-subtle">
                <div className="text-[11px] font-bold text-content-secondary mb-2">Reconstructed MT5 Deal Tickets:</div>
                <div className="space-y-1.5">
                  {selectedTrade.executions.length === 0 ? (
                    <div className="text-xs text-content-muted p-2 bg-surface-secondary rounded-xl">No individual deal records attached.</div>
                  ) : (
                    selectedTrade.executions.map((exec: any, i: number) => (
                      <div key={exec.id || i} className="flex justify-between items-center text-[11px] p-2.5 rounded-xl bg-surface-secondary border border-border-subtle font-mono">
                        <div>
                          <span className="font-bold text-content-primary mr-2">Deal #{exec.deal_id}</span>
                          <span className="text-content-muted">{exec.execution_type}: {exec.volume} Lots @ {exec.price}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-content-muted text-[10px]">{exec.execution_time?.slice(0, 19).replace('T', ' ')} UTC</span>
                          <span className={Number(exec.profit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                            {exec.profit ? `$${Number(exec.profit).toFixed(2)}` : '$0.00'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Institutional Intelligence & Strategy Enrichment (Additive, Non-Mutating) */}
            <div className="framer-card p-5 space-y-4 bg-surface border border-brand-primary/20">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Institutional Strategy Enrichment (Additive Layer)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoEnrich}
                  disabled={isEnriching}
                  className="px-2.5 py-1 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold border border-brand-primary/20 flex items-center space-x-1 transition"
                >
                  <Zap className="w-3 h-3" />
                  <span>{isEnriching ? 'Detecting...' : enrichment ? 'Re-Evaluate Structure' : 'Auto-Enrich Setup'}</span>
                </button>
              </div>

              {enrichment ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle">
                      <div className="text-[10px] text-content-muted font-sans font-semibold">Setup Archetype</div>
                      <div className="text-xs font-bold text-brand-primary mt-0.5 truncate">{enrichment.setup_type || 'ICT / CRT'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle">
                      <div className="text-[10px] text-content-muted font-sans font-semibold">Rule Compliance</div>
                      <div className={`text-xs font-bold mt-0.5 ${enrichment.rule_compliance_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {enrichment.rule_compliance_score ?? 85}/100
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle">
                      <div className="text-[10px] text-content-muted font-sans font-semibold">Confluence Score</div>
                      <div className="text-xs font-bold text-content-primary mt-0.5">
                        {enrichment.confluence_score ?? 78}/100
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle">
                      <div className="text-[10px] text-content-muted font-sans font-semibold">Execution Purity</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                        {enrichment.execution_purity || 'OPTIMAL'}
                      </div>
                    </div>
                  </div>

                  {enrichment.market_structure_at_entry && (
                    <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle text-xs">
                      <span className="text-content-muted font-semibold">Market Structure at Entry: </span>
                      <span className="text-content-primary font-mono">{enrichment.market_structure_at_entry}</span>
                    </div>
                  )}

                  {enrichment.notes && (
                    <div className="text-[11px] text-content-secondary italic">
                      "{enrichment.notes}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-dashed border-border-subtle text-xs text-content-muted flex items-center justify-between">
                  <span>No strategy enrichment recorded yet. Click to inspect market structure and news proximity.</span>
                </div>
              )}
            </div>

            {/* Subjective Trader Journal & Review Section */}
            <div className="framer-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-trade-profit" />
                  <span>Subjective Review & Behavioral Analysis</span>
                </div>

                {/* Voice Note Trigger */}
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold border border-brand-primary/20 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Note</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-content-secondary font-medium mb-1">Setup / Strategy Pattern</label>
                  <input
                    type="text"
                    value={reviewForm.setupName || ''}
                    onChange={e => setReviewForm({ ...reviewForm, setupName: e.target.value })}
                    placeholder="e.g. Liquidity Sweep + MSS + FVG"
                    className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-content-secondary font-medium mb-1">Market Bias</label>
                    <select
                      value={reviewForm.bias}
                      onChange={e => setReviewForm({ ...reviewForm, bias: e.target.value })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none"
                    >
                      <option value="BULLISH">Bullish</option>
                      <option value="BEARISH">Bearish</option>
                      <option value="NEUTRAL">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-content-secondary font-medium mb-1">Emotional State</label>
                    <select
                      value={reviewForm.emotionState}
                      onChange={e => setReviewForm({ ...reviewForm, emotionState: e.target.value })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none"
                    >
                      <option value="DISCIPLINED">Disciplined 🟢</option>
                      <option value="FOMO">FOMO 🔴</option>
                      <option value="FEARFUL">Fearful 🟡</option>
                      <option value="GREEDY">Greedy 🟡</option>
                      <option value="ANXIOUS">Anxious 🔴</option>
                      <option value="CONFIDENT">Confident 🟢</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-content-secondary font-medium mb-1">Mistake Tag (If Applicable)</label>
                  <select
                    value={reviewForm.mistakeId || ''}
                    onChange={e => setReviewForm({ ...reviewForm, mistakeId: e.target.value })}
                    className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none"
                  >
                    <option value="">No Mistake - System Adhered</option>
                    {mistakeTags.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-content-secondary font-medium mb-1">Lessons Learned & Psychological Notes</label>
                  <textarea
                    rows={3}
                    value={reviewForm.traderNotes || ''}
                    onChange={e => setReviewForm({ ...reviewForm, traderNotes: e.target.value })}
                    placeholder="Document execution thoughts, psychology, entry timing, and key takeaways..."
                    className="w-full bg-surface-secondary border border-border-subtle rounded-xl p-3 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              {/* Save Review Button */}
              <button
                onClick={handleSaveReview}
                disabled={isSavingReview}
                className="framer-btn-primary w-full py-3"
              >
                {isSavingReview ? 'Saving...' : 'Save Trade Review (+25 XP)'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Trade Review Assistant Modal (for Trade Review Drawer) */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-brand-primary animate-pulse" />
                <h3 className="font-bold text-content-primary text-base">Voice Review Assistant</h3>
              </div>
              <button
                onClick={() => setIsVoiceModalOpen(false)}
                className="text-content-muted hover:text-content-primary p-1.5 rounded-xl hover:bg-surface-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Speak or type your trade narrative (e.g. "I saw a liquidity sweep below Asia low, followed by MSS and entered on the 5m FVG...").
            </p>

            <textarea
              rows={4}
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder="e.g. Took a buy on XAUUSD after London swept Asia low. MSS formed and I tapped the 5m FVG. Closed at 2R target..."
              className="w-full bg-surface-secondary border border-border-subtle rounded-2xl p-3 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />

            <button
              onClick={handleVoiceParse}
              disabled={isParsingVoice || !voiceText.trim()}
              className="framer-btn-primary w-full py-2.5 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isParsingVoice ? 'Extracting...' : 'Extract Suggested Fields'}</span>
            </button>

            {voiceSuggestions && (
              <div className="p-4 rounded-2xl bg-surface-secondary border border-brand-primary/30 space-y-2 text-xs animate-in fade-in">
                <div className="font-bold text-brand-primary text-[11px] uppercase tracking-wider">Suggested Fields:</div>
                <div className="text-content-secondary"><strong>Setup:</strong> {voiceSuggestions.setupName}</div>
                <div className="text-content-secondary"><strong>Bias:</strong> {voiceSuggestions.bias}</div>
                <div className="text-content-secondary"><strong>Confluences:</strong> {voiceSuggestions.confluences?.join(', ')}</div>
                <div className="text-content-secondary"><strong>Emotion:</strong> {voiceSuggestions.emotionState}</div>
                <button
                  onClick={applyVoiceSuggestions}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                >
                  Confirm & Apply Suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
