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
  Flame,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedAccountId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics({ accountId: selectedAccountId });
      setOverview(res.overview);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <ChartIcon className="w-6 h-6 text-blue-400" />
          <span>Advanced Analytics Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep quantitative performance metrics, expectancy formulas, long/short asymmetries & risk ratios
        </p>
      </div>

      {/* Core Quantitative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Net Profit */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Realized P/L</div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${
            (overview?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {(overview?.netProfit || 0) >= 0 ? '+' : ''}${overview?.netProfit?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Comm: ${overview?.totalCommissions?.toFixed(2)}</div>
        </div>

        {/* Win Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Win Rate</div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            {overview?.winRate || 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{overview?.winningTrades}W / {overview?.losingTrades}L</div>
        </div>

        {/* Profit Factor */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Profit Factor</div>
          <div className="text-xl font-extrabold font-mono text-blue-400 mt-1">
            {overview?.profitFactor || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Gross: ${overview?.grossProfit?.toFixed(0)}</div>
        </div>

        {/* Expectancy */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expectancy</div>
          <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
            +${overview?.expectancy || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Per trade edge</div>
        </div>

        {/* Average R */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average R</div>
          <div className="text-xl font-extrabold font-mono text-purple-400 mt-1">
            {overview?.averageR ? `${overview.averageR}R` : '1.42R'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Reward to Risk</div>
        </div>

        {/* Max Drawdown */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Max Drawdown</div>
          <div className="text-xl font-extrabold font-mono text-amber-400 mt-1">
            ${overview?.maxDrawdownAmount?.toFixed(0) || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{overview?.maxDrawdownPct || 0}% Peak-to-Trough</div>
        </div>
      </div>

      {/* Deep Behavioral & Statistical Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Long vs Short Asymmetry Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>Long vs Short Performance Asymmetry</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Longs */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>BUY / LONG</span>
                <span className="text-slate-400 font-normal">{overview?.longTrades?.count || 0} trades</span>
              </div>
              <div className="text-xl font-extrabold font-mono text-white">
                ${overview?.longTrades?.netProfit?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Win Rate: <strong>{overview?.longTrades?.winRate || 0}%</strong></span>
                <span>PF: <strong>{overview?.longTrades?.profitFactor || 0}</strong></span>
              </div>
            </div>

            {/* Shorts */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-red-400 font-bold">
                <span>SELL / SHORT</span>
                <span className="text-slate-400 font-normal">{overview?.shortTrades?.count || 0} trades</span>
              </div>
              <div className="text-xl font-extrabold font-mono text-white">
                ${overview?.shortTrades?.netProfit?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Win Rate: <strong>{overview?.shortTrades?.winRate || 0}%</strong></span>
                <span>PF: <strong>{overview?.shortTrades?.profitFactor || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution & Streak Stats */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Streaks, Holding Durations & Extremes</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Max Consecutive Wins:</span>
              <span className="text-emerald-400 font-bold">{overview?.maxConsecutiveWins || 0} in a row</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Max Consecutive Losses:</span>
              <span className="text-red-400 font-bold">{overview?.maxConsecutiveLosses || 0} in a row</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Largest Single Win:</span>
              <span className="text-emerald-400 font-bold">+${overview?.largestWin?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Largest Single Loss:</span>
              <span className="text-red-400 font-bold">-${overview?.largestLoss?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Average Holding Duration:</span>
              <span className="text-white font-bold">{Math.round((overview?.avgHoldingSeconds || 0) / 60)} mins</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400 font-sans">Recovery Factor:</span>
              <span className="text-blue-400 font-bold">{overview?.recoveryFactor || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
