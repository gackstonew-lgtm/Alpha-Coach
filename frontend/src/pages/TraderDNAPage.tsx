import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { TraderDNAProfile } from '../types';
import {
  Dna,
  Clock,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';

export const TraderDNAPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [dna, setDna] = useState<TraderDNAProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDNA();
  }, [selectedAccountId]);

  const loadDNA = async () => {
    try {
      setIsLoading(true);
      const res = await api.getTraderDNA(selectedAccountId);
      setDna(res.dna);
    } catch (err) {
      console.error('Failed to load Trader DNA:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Disclaimer Banner */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Dna className="w-6 h-6 text-pink-400" />
          <span>Trader DNA Profile</span>
        </h1>
        <div className="mt-2 p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span><strong>Descriptive Notice:</strong> This profile is derived strictly from your empirical MT5 journal records. It describes historical behavioral tendencies without asserting causal certainties.</span>
        </div>
      </div>

      {/* Behavioral Summary Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-pink-400">
          <Sparkles className="w-4 h-4" />
          <span>Behavioral Synopsis</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {dna?.behavioralSummary || 'Analyzing trading logs...'}
        </p>
      </div>

      {/* DNA Attribute Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Traded Market */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Primary Market</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {dna?.mostTradedSymbol?.symbol || 'Multi-Asset'}
          </div>
          <div className="text-xs text-slate-500">
            {dna?.mostTradedSymbol ? `${dna.mostTradedSymbol.count} trades (${dna.mostTradedSymbol.winRate}% WR)` : 'N/A'}
          </div>
        </div>

        {/* Most Active Session */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Active Session Focus</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {dna?.mostActiveSession?.session || 'All Sessions'}
          </div>
          <div className="text-xs text-slate-500">
            {dna?.mostActiveSession ? `${dna.mostActiveSession.count} trades (+$${dna.mostActiveSession.netProfit})` : 'N/A'}
          </div>
        </div>

        {/* Average Holding Duration */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Holding Duration Tendency</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {dna?.avgDurationMinutes || 0} Minutes
          </div>
          <div className="text-xs text-slate-500">
            {dna?.avgDurationMinutes && dna.avgDurationMinutes < 60 ? 'Intraday Scalp / Momentum Profile' : 'Intraday Swing Profile'}
          </div>
        </div>

        {/* Long vs Short Tendency */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>Long / Short Distribution</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {dna?.longShortRatio?.longPct || 50}% Long / {dna?.longShortRatio?.shortPct || 50}% Short
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${dna?.longShortRatio?.longPct || 50}%` }} />
            <div className="bg-red-500 h-full" style={{ width: `${dna?.longShortRatio?.shortPct || 50}%` }} />
          </div>
        </div>

        {/* Top Tagged Mistake */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Most Common Friction Point</span>
          </div>
          <div className="text-lg font-extrabold text-red-400 truncate">
            {dna?.mostCommonMistake?.name || 'Zero Recurring Mistakes Logged'}
          </div>
          <div className="text-xs text-slate-500">
            {dna?.mostCommonMistake ? `Logged in ${dna.mostCommonMistake.count} journal entries (${dna.mostCommonMistake.category})` : 'Discipline maintained'}
          </div>
        </div>

        {/* Risk Discipline Score */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Risk Discipline Score</span>
          </div>
          <div className="text-xl font-extrabold text-blue-400 font-mono">
            {dna?.riskDisciplineScore || 100} / 100
          </div>
          <div className="text-xs text-slate-500">
            Based on stop loss consistency and rule adherence
          </div>
        </div>
      </div>
    </div>
  );
};
