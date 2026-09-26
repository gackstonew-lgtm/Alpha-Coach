import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { ReconstructedTrade } from '../types';
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
  Sparkles,
  Award,
  Layers,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';

export const JournalPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [trades, setTrades] = useState<ReconstructedTrade[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Subjective review edit state
  const [reviewForm, setReviewForm] = useState<any>({});
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  // Voice Modal
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
    } catch (err) {
      console.error('Failed to fetch trade detail:', err);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Automated Trading Journal
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Reconstructed MT5 trade lifecycles, objective execution metrics & qualitative review logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="framer-btn-primary flex items-center space-x-2"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Journal</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="framer-card p-4 space-y-3">
        {/* Date Filter Presets */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border-subtle">
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider mr-1">Period:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last_week', label: 'Last Week' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'last_3_months', label: 'Last 3 Months' },
            { id: 'custom', label: 'Custom Period' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                datePreset === preset.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-secondary text-content-secondary hover:text-content-primary hover:bg-surface-secondary/80'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center space-x-2 ml-auto animate-in fade-in">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-lg px-2.5 py-1 focus:outline-none"
              />
              <span className="text-content-muted text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center space-x-2 bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-content-muted" />
            <input
              type="text"
              placeholder="Search symbol, ticket, comment, notes, setup..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTrades(1)}
              className="bg-transparent text-xs text-content-primary placeholder-content-muted focus:outline-none w-full"
            />
          </div>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value)}
            className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Directions</option>
            <option value="BUY">BUY Only</option>
            <option value="SELL">SELL Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="CLOSED">Closed Trades</option>
            <option value="OPEN">Open Positions</option>
          </select>

          {/* Session Filter */}
          <select
            value={sessionFilter}
            onChange={e => setSessionFilter(e.target.value)}
            className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Sessions</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="London/NY Overlap">London/NY Overlap</option>
            <option value="Asia">Asia</option>
            <option value="Off-Hours">Off-Hours</option>
          </select>

          {/* Review Filter */}
          <select
            value={reviewedFilter}
            onChange={e => setReviewedFilter(e.target.value)}
            className="bg-surface-secondary border border-border-subtle text-xs text-content-primary rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">Review Status: All</option>
            <option value="1">Reviewed</option>
            <option value="0">Pending Review (+25 XP)</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
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
                <th className="px-4 py-3.5">Setup / Tags</th>
                <th className="px-4 py-3.5">Review</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-content-muted">
                    <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Synchronizing journal entries from MT5...</div>
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-content-muted">
                    No reconstructed trades match your criteria.
                  </td>
                </tr>
              ) : (
                trades.map(t => {
                  const isOpen = t.status === 'OPEN';
                  const pnl = isOpen ? (t.floating_profit !== undefined && t.floating_profit !== null ? t.floating_profit : t.net_profit) : t.net_profit;
                  const isWin = Number(pnl) >= 0;
                  const formattedOpenTime = t.open_time
                    ? new Date(t.open_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => openTradeDetail(t.id)}
                      className="hover:bg-surface-secondary/60 transition cursor-pointer group"
                    >
                      {/* Symbol & MT5 Ticket */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-content-primary">{t.symbol}</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] text-content-muted border border-border-subtle">
                            #{t.position_id || t.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>

                      {/* Open Time */}
                      <td className="px-4 py-4 text-content-muted text-[11px] whitespace-nowrap">
                        {formattedOpenTime}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.position_type === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.position_type}
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-4 font-bold text-content-secondary">
                        {Number(t.total_volume).toFixed(2)}
                      </td>

                      {/* Entry -> Exit */}
                      <td className="px-4 py-4 text-content-muted whitespace-nowrap">
                        {isOpen ? (
                          <span>{t.entry_price_avg} → <span className="text-brand-500 font-bold">{t.current_price || 'Live'}</span></span>
                        ) : (
                          <span>{t.entry_price_avg} → {t.exit_price_avg || '—'}</span>
                        )}
                      </td>

                      {/* S/L & T/P */}
                      <td className="px-4 py-4 text-content-muted text-[11px] whitespace-nowrap">
                        <span>{t.initial_sl ? t.initial_sl : '—'} / {t.initial_tp ? t.initial_tp : '—'}</span>
                      </td>

                      {/* Net P/L */}
                      <td className={`px-4 py-4 font-bold text-sm whitespace-nowrap ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isOpen && <span className="text-[10px] font-normal text-content-muted mr-1">Float:</span>}
                        {isWin ? '+' : ''}${Number(pnl || 0).toFixed(2)}
                      </td>

                      {/* Status */}
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

                      {/* Session */}
                      <td className="px-4 py-4 font-sans text-content-secondary text-[11px] whitespace-nowrap">
                        {t.session_name || 'N/A'}
                      </td>

                      {/* Setup / Tags */}
                      <td className="px-4 py-4 font-sans text-content-secondary">
                        {t.setup_name ? (
                          <span className="truncate max-w-[120px] inline-block font-medium">{t.setup_name}</span>
                        ) : (
                          <span className="text-content-muted">-</span>
                        )}
                      </td>

                      {/* Review */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {t.is_reviewed ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-sans font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-500 font-sans font-semibold text-[11px] animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Review (+25XP)</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-secondary/40 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
            <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total trades)</span>
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
      </div>

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

      {/* Voice Journaling Assistant Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-brand-primary animate-pulse" />
                <h3 className="font-bold text-content-primary text-base">Voice Journal Assistant</h3>
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
              <Sparkles className="w-4 h-4" />
              <span>{isParsingVoice ? 'Extracting...' : 'Extract Suggested Fields'}</span>
            </button>

            {voiceSuggestions && (
              <div className="p-4 rounded-2xl bg-surface-secondary border border-brand-primary/30 space-y-2 text-xs animate-in fade-in">
                <div className="font-bold text-brand-primary text-[11px] uppercase tracking-wider">Suggested Fields (Requires Confirmation):</div>
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
