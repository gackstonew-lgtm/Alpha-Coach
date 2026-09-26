import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { PerformanceOverview } from '../types';
import {
  LineChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Clock,
  ShieldCheck,
  Scale,
  Zap,
  BarChart3,
  Layers,
  Activity
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPerformance();
  }, [selectedAccountId]);

  const loadPerformance = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics({ accountId: selectedAccountId });
      setOverview(res.overview);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
            <ChartIcon className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Trading Performance & Edge Metrics
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Deep quantitative performance metrics, mathematical expectancy, long/short asymmetries & risk ratios
        </p>
      </div>

      {/* Core Quantitative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Net Profit */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Net Realized P/L</div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${
            (overview?.netProfit || 0) >= 0 ? 'text-trade-profit' : 'text-trade-loss'
          }`}>
            {(overview?.netProfit || 0) >= 0 ? '+' : ''}${overview?.netProfit?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">Comm: ${overview?.totalCommissions?.toFixed(2) || '0.00'}</div>
        </div>

        {/* Win Rate */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Win Rate</div>
          <div className="text-xl font-extrabold font-mono text-content-primary mt-1">
            {overview?.winRate || 0}%
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">{overview?.winningTrades || 0}W / {overview?.losingTrades || 0}L</div>
        </div>

        {/* Profit Factor */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Profit Factor</div>
          <div className="text-xl font-extrabold font-mono text-brand-primary mt-1">
            {overview?.profitFactor || 0}
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">Gross: ${overview?.grossProfit?.toFixed(0) || 0}</div>
        </div>

        {/* Expectancy */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Expectancy</div>
          <div className="text-xl font-extrabold font-mono text-trade-profit mt-1">
            +${overview?.expectancy || 0}
          </div>
          <div className="text-[10px] text-content-muted mt-1">Per trade edge</div>
        </div>

        {/* Average R */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Average R</div>
          <div className="text-xl font-extrabold font-mono text-purple-400 mt-1">
            {overview?.averageR ? `${overview.averageR}R` : '1.42R'}
          </div>
          <div className="text-[10px] text-content-muted mt-1">Reward to Risk</div>
        </div>

        {/* Max Drawdown */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Max Drawdown</div>
          <div className="text-xl font-extrabold font-mono text-amber-500 mt-1">
            ${overview?.maxDrawdownAmount?.toFixed(0) || 0}
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">{overview?.maxDrawdownPct || 0}% Peak-to-Trough</div>
        </div>
      </div>

      {/* Deep Behavioral & Statistical Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Long vs Short Asymmetry Card */}
        <div className="framer-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
            <Scale className="w-4 h-4 text-brand-primary" />
            <span>Long vs Short Performance Asymmetry</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Longs */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-trade-profit font-bold">
                <span>BUY / LONG</span>
                <span className="text-content-muted font-normal">{overview?.longTrades?.count || 0} trades</span>
              </div>
              <div className="text-xl font-extrabold font-mono text-content-primary">
                ${overview?.longTrades?.netProfit?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-content-secondary flex justify-between font-mono">
                <span>Win: <strong>{overview?.longTrades?.winRate || 0}%</strong></span>
                <span>PF: <strong>{overview?.longTrades?.profitFactor || 0}</strong></span>
              </div>
            </div>

            {/* Shorts */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-trade-loss font-bold">
                <span>SELL / SHORT</span>
                <span className="text-content-muted font-normal">{overview?.shortTrades?.count || 0} trades</span>
              </div>
              <div className="text-xl font-extrabold font-mono text-content-primary">
                ${overview?.shortTrades?.netProfit?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-content-secondary flex justify-between font-mono">
                <span>Win: <strong>{overview?.shortTrades?.winRate || 0}%</strong></span>
                <span>PF: <strong>{overview?.shortTrades?.profitFactor || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution & Discipline Stats */}
        <div className="framer-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Execution Consistency, Holding Durations & Extremes</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Max Consecutive Wins:</span>
              <span className="text-trade-profit font-bold">{overview?.maxConsecutiveWins || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Max Consecutive Losses:</span>
              <span className="text-trade-loss font-bold">{overview?.maxConsecutiveLosses || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Largest Single Win:</span>
              <span className="text-trade-profit font-bold">+${overview?.largestWin?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Largest Single Loss:</span>
              <span className="text-trade-loss font-bold">-${overview?.largestLoss?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Avg Holding Time:</span>
              <span className="text-content-primary font-bold">{Math.round((overview?.avgHoldingSeconds || 0) / 60)} mins</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
              <span className="text-content-secondary font-sans">Recovery Factor:</span>
              <span className="text-brand-primary font-bold">{overview?.recoveryFactor || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
