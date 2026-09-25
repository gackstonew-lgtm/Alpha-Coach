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
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Dna className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Trader DNA Profile
          </h1>
        </div>
        <div className="mt-3 p-3.5 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-brand-primary flex items-center space-x-2">
          <Info className="w-4 h-4 shrink-0" />
          <span><strong>Descriptive Notice:</strong> This profile is derived strictly from your empirical MT5 journal records. It describes historical behavioral tendencies without asserting causal certainties.</span>
        </div>
      </div>

      {/* Behavioral Summary Card */}
      <div className="framer-card p-6 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-pink-400">
          <Sparkles className="w-4 h-4" />
          <span>Behavioral Synopsis</span>
        </div>
        <p className="text-sm text-content-secondary leading-relaxed font-sans">
          {dna?.behavioralSummary || 'Analyzing trading logs...'}
        </p>
      </div>

      {/* DNA Attribute Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Traded Market */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Primary Market</span>
          </div>
          <div className="text-xl font-extrabold text-content-primary font-mono">
            {dna?.mostTradedSymbol?.symbol || 'Multi-Asset'}
          </div>
          <div className="text-xs text-content-muted font-mono">
            {dna?.mostTradedSymbol ? `${dna.mostTradedSymbol.count} trades (${dna.mostTradedSymbol.winRate}% WR)` : 'N/A'}
          </div>
        </div>

        {/* Most Active Session */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Active Session Focus</span>
          </div>
          <div className="text-xl font-extrabold text-content-primary font-mono">
            {dna?.mostActiveSession?.session || 'All Sessions'}
          </div>
          <div className="text-xs text-content-muted font-mono">
            {dna?.mostActiveSession ? `${dna.mostActiveSession.count} trades (+$${dna.mostActiveSession.netProfit})` : 'N/A'}
          </div>
        </div>

        {/* Average Holding Duration */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Holding Duration Tendency</span>
          </div>
          <div className="text-xl font-extrabold text-content-primary font-mono">
            {dna?.avgDurationMinutes || 0} Minutes
          </div>
          <div className="text-xs text-content-muted">
            {dna?.avgDurationMinutes && dna.avgDurationMinutes < 60 ? 'Intraday Scalp / Momentum Profile' : 'Intraday Swing Profile'}
          </div>
        </div>

        {/* Long vs Short Tendency */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <Scale className="w-4 h-4 text-brand-primary" />
            <span>Long / Short Distribution</span>
          </div>
          <div className="text-xl font-extrabold text-content-primary font-mono">
            {dna?.longShortRatio?.longPct || 50}% Long / {dna?.longShortRatio?.shortPct || 50}% Short
          </div>
          <div className="w-full bg-surface-secondary h-2.5 rounded-full overflow-hidden flex border border-border-subtle">
            <div className="bg-trade-profit h-full" style={{ width: `${dna?.longShortRatio?.longPct || 50}%` }} />
            <div className="bg-trade-loss h-full" style={{ width: `${dna?.longShortRatio?.shortPct || 50}%` }} />
          </div>
        </div>

        {/* Top Tagged Mistake */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <AlertTriangle className="w-4 h-4 text-trade-loss" />
            <span>Most Common Friction Point</span>
          </div>
          <div className="text-lg font-extrabold text-trade-loss truncate">
            {dna?.mostCommonMistake?.name || 'Zero Recurring Mistakes Logged'}
          </div>
          <div className="text-xs text-content-muted">
            {dna?.mostCommonMistake ? `Logged in ${dna.mostCommonMistake.count} journal entries (${dna.mostCommonMistake.category})` : 'Discipline maintained'}
          </div>
        </div>

        {/* Risk Discipline Score */}
        <div className="framer-card p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-content-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Risk Discipline Score</span>
          </div>
          <div className="text-xl font-extrabold text-brand-primary font-mono">
            {dna?.riskDisciplineScore || 100} / 100
          </div>
          <div className="text-xs text-content-muted">
            Based on stop loss consistency and rule adherence
          </div>
        </div>
      </div>
    </div>
  );
};
