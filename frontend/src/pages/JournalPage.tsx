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
  Layers
} from 'lucide-react';

export const JournalPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [trades, setTrades] = useState<ReconstructedTrade[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
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
  }, [selectedAccountId, symbolFilter, directionFilter, statusFilter, sessionFilter, reviewedFilter]);

  const loadTrades = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const res = await api.getTrades({
        accountId: selectedAccountId,
        page,
        limit: 20,
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <span>Automatic Trading Journal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconstructed MT5 trade lifecycles, objective execution metrics & subjective review logs
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbol, notes, setup..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadTrades(1)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* Direction Filter */}
        <select
          value={directionFilter}
          onChange={e => setDirectionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">All Directions</option>
          <option value="BUY">BUY Only</option>
          <option value="SELL">SELL Only</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="CLOSED">Closed Trades</option>
          <option value="OPEN">Open Positions</option>
        </select>

        {/* Session Filter */}
        <select
          value={sessionFilter}
          onChange={e => setSessionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
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
          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">Review Status: All</option>
          <option value="1">Reviewed</option>
          <option value="0">Pending Review (+25 XP)</option>
        </select>
      </div>

      {/* Trades Table */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Symbol</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Volume</th>
                <th className="px-4 py-3.5">Entry → Exit</th>
                <th className="px-4 py-3.5">Net P/L</th>
                <th className="px-4 py-3.5">R-Multiple</th>
                <th className="px-4 py-3.5">Session</th>
                <th className="px-4 py-3.5">Exit Reason</th>
                <th className="px-4 py-3.5">Setup / Tags</th>
                <th className="px-4 py-3.5">Review</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading journal entries...</div>
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No reconstructed trades match your criteria.
                  </td>
                </tr>
              ) : (
                trades.map(t => {
                  const isWin = t.net_profit >= 0;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openTradeDetail(t.id)}
                      className="hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-bold text-white flex items-center space-x-2">
                        <span>{t.symbol}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.position_type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {t.position_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{t.total_volume}</td>
                      <td className="px-4 py-4 text-slate-400">
                        {t.entry_price_avg} → {t.exit_price_avg || 'Open'}
                      </td>
                      <td className={`px-4 py-4 font-bold text-sm ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}${t.net_profit?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-semibold">
                        {t.r_multiple !== null && t.r_multiple !== undefined ? `${t.r_multiple}R` : '-'}
                      </td>
                      <td className="px-4 py-4 font-sans text-slate-400">{t.session_name || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {t.exit_reason}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-sans text-slate-300">
                        {t.setup_name ? (
                          <span className="truncate max-w-[120px] inline-block">{t.setup_name}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {t.is_reviewed ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-sans font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-sans font-semibold text-[11px] animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Review (+25XP)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="p-1.5 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition">
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
          <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total trades)</span>
            <div className="flex space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadTrades(pagination.page - 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white font-semibold transition"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadTrades(pagination.page + 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white font-semibold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trade Review & Lifecycle Drawer Modal */}
      {isDetailOpen && selectedTrade && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#0d121f] border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${
                  selectedTrade.position.net_profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {selectedTrade.position.net_profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    Trade #{selectedTrade.position.position_id} • {selectedTrade.position.symbol}
                  </h2>
                  <div className="text-xs text-slate-400">
                    {selectedTrade.position.position_type} • {selectedTrade.position.total_volume} Lots • {selectedTrade.position.session_name}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Objective MT5 Facts Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Objective MT5 Execution Facts</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-slate-500 text-[10px]">Net P/L</div>
                  <div className={`text-sm font-bold ${selectedTrade.position.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${selectedTrade.position.net_profit?.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-slate-500 text-[10px]">Commission</div>
                  <div className="text-slate-300 font-bold">${selectedTrade.position.commission_total?.toFixed(2)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-slate-500 text-[10px]">Swap</div>
                  <div className="text-slate-300 font-bold">${selectedTrade.position.swap_total?.toFixed(2)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-slate-500 text-[10px]">R-Multiple</div>
                  <div className="text-blue-400 font-bold">{selectedTrade.position.r_multiple ? `${selectedTrade.position.r_multiple}R` : 'N/A'}</div>
                </div>
              </div>

              {/* Execution Lifecyle */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-bold text-slate-400 mb-2">Reconstructed Deal Flow:</div>
                <div className="space-y-1.5">
                  {selectedTrade.executions.map((exec: any, i: number) => (
                    <div key={exec.id || i} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800/50">
                      <span className="font-bold text-slate-300">{exec.execution_type}: {exec.volume} Lots @ {exec.price}</span>
                      <span className="text-slate-500 font-mono">{exec.execution_time?.slice(11, 19)} UTC</span>
                      <span className={exec.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {exec.profit ? `$${exec.profit.toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subjective Trader Journal & Review Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subjective Review & Behavioral Analysis</span>
                </div>

                {/* Voice Note Trigger */}
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Note</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Setup / Strategy Pattern</label>
                  <input
                    type="text"
                    value={reviewForm.setupName || ''}
                    onChange={e => setReviewForm({ ...reviewForm, setupName: e.target.value })}
                    placeholder="e.g. Liquidity Sweep + MSS + FVG"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Market Bias</label>
                    <select
                      value={reviewForm.bias}
                      onChange={e => setReviewForm({ ...reviewForm, bias: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="BULLISH">Bullish</option>
                      <option value="BEARISH">Bearish</option>
                      <option value="NEUTRAL">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Emotional State</label>
                    <select
                      value={reviewForm.emotionState}
                      onChange={e => setReviewForm({ ...reviewForm, emotionState: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
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
                  <label className="block text-slate-400 font-medium mb-1">Mistake Tag (If Applicable)</label>
                  <select
                    value={reviewForm.mistakeId || ''}
                    onChange={e => setReviewForm({ ...reviewForm, mistakeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">No Mistake - System Adhered</option>
                    {mistakeTags.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Lessons Learned & Psychological Notes</label>
                  <textarea
                    rows={3}
                    value={reviewForm.traderNotes || ''}
                    onChange={e => setReviewForm({ ...reviewForm, traderNotes: e.target.value })}
                    placeholder="Document execution thoughts, psychology, entry timing, and key takeaways..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Save Review Button */}
              <button
                onClick={handleSaveReview}
                disabled={isSavingReview}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition text-xs"
              >
                {isSavingReview ? 'Saving...' : 'Save Trade Review (+25 XP)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Journaling Assistant Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="font-extrabold text-white text-base">Voice Journal Assistant</h3>
              </div>
              <button onClick={() => setIsVoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Speak or type your trade narrative (e.g. "I saw a liquidity sweep below Asia low, followed by MSS and entered on the 5m FVG...").
            </p>

            <textarea
              rows={4}
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder="e.g. Took a buy on XAUUSD after London swept Asia low. MSS formed and I tapped the 5m FVG. Closed at 2R target..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={handleVoiceParse}
              disabled={isParsingVoice || !voiceText.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isParsingVoice ? 'Extracting...' : 'Extract Suggested Fields'}</span>
            </button>

            {voiceSuggestions && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-2 text-xs animate-in fade-in">
                <div className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">Suggested Fields (Requires Confirmation):</div>
                <div className="text-slate-300"><strong>Setup:</strong> {voiceSuggestions.setupName}</div>
                <div className="text-slate-300"><strong>Bias:</strong> {voiceSuggestions.bias}</div>
                <div className="text-slate-300"><strong>Confluences:</strong> {voiceSuggestions.confluences?.join(', ')}</div>
                <div className="text-slate-300"><strong>Emotion:</strong> {voiceSuggestions.emotionState}</div>
                <button
                  onClick={applyVoiceSuggestions}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
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
