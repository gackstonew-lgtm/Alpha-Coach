import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  FlaskConical,
  Plus,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';

export const StrategyLabPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [confluences, setConfluences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newStrategy, setNewStrategy] = useState({ name: '', description: '', rules: '', colorTag: '#3b82f6' });

  useEffect(() => {
    loadStrategyData();
  }, [selectedAccountId]);

  const loadStrategyData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getStrategyAnalytics(selectedAccountId);
      setStrategies(res.strategies || []);
      setConfluences(res.confluences || []);
    } catch (err) {
      console.error('Failed to load Strategy Lab:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newStrategy.name.trim()) return;
    try {
      await api.createStrategy(newStrategy);
      setIsCreateModalOpen(false);
      setNewStrategy({ name: '', description: '', rules: '', colorTag: '#3b82f6' });
      await loadStrategyData();
    } catch (err: any) {
      alert(err.message || 'Failed to create strategy');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FlaskConical className="w-6 h-6 text-purple-400" />
            <span>Strategy Lab & Confluence Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical historical performance across custom setups (Liquidity Sweep, MSS, FVG, Order Block, Breakers)
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Strategy Setup</span>
        </button>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map(strat => (
          <div key={strat.strategyId} className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: strat.colorTag }} />
                <h3 className="font-bold text-white text-sm truncate max-w-[200px]">{strat.name}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{strat.totalTrades} trades</span>
            </div>

            {strat.description && (
              <p className="text-xs text-slate-400 line-clamp-2">{strat.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans font-semibold">Win Rate</div>
                <div className="text-xs font-extrabold text-white mt-0.5">{strat.winRate}%</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans font-semibold">Net P/L</div>
                <div className={`text-xs font-extrabold mt-0.5 ${strat.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${strat.netProfit.toFixed(0)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans font-semibold">Profit Factor</div>
                <div className="text-xs font-extrabold text-blue-400 mt-0.5">{strat.profitFactor}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Confluences Ranking Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Top Setup Confluences (e.g. Sweep + MSS + FVG)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">Confluence Tag</th>
                <th className="p-3">Sample Size</th>
                <th className="p-3">Win Rate</th>
                <th className="p-3">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {confluences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">No confluences tagged yet in journals</td>
                </tr>
              ) : (
                confluences.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-white">{c.confluence}</td>
                    <td className="p-3 text-slate-400">{c.count} trades</td>
                    <td className="p-3 text-emerald-400 font-bold">{c.winRate}%</td>
                    <td className={`p-3 font-bold ${c.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${c.netProfit.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white">Create Strategy Definition</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Strategy Name</label>
                <input
                  type="text"
                  value={newStrategy.name}
                  onChange={e => setNewStrategy({ ...newStrategy, name: e.target.value })}
                  placeholder="e.g. Asian Range Sweep + 1m FVG"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description / Rules</label>
                <textarea
                  rows={3}
                  value={newStrategy.description}
                  onChange={e => setNewStrategy({ ...newStrategy, description: e.target.value })}
                  placeholder="Define entry criteria, higher timeframe bias, and risk parameters..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
            >
              Save Strategy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
