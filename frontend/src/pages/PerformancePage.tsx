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
  Activity,
  AlertTriangle,
  DollarSign,
  Info
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { selectedAccountId, selectedAccount } = useAccounts();
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

  const isDemoAccount =
    selectedAccount?.is_demo === 1 ||
    selectedAccount?.is_demo === true ||
    selectedAccount?.mode === 'DEMO' ||
    selectedAccount?.trade_mode === 'demo';

  const totalTrades = overview?.totalTrades || 0;
  const isSmallSample = totalTrades < 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            Empirical MT5 deal reconstruction, statistical confidence intervals, cost breakdown & mathematical expectancy
          </p>
        </div>

        {/* Demo / Sample Data Label if applicable */}
        {isDemoAccount && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SAMPLE DATA — DEMO ACCOUNT</span>
          </div>
        )}
      </div>

      {/* Small Sample Size Warning Banner (Rule 6.1) */}
      {isSmallSample && totalTrades > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold uppercase tracking-wider text-[11px]">
              Statistical Significance Warning (N = {totalTrades} &lt; 30 trades)
            </div>
            <p className="text-content-secondary dark:text-amber-300/80 leading-relaxed">
              {overview?.sampleSizeWarning?.message ||
                `Sample size is small (${totalTrades} closed trade${totalTrades === 1 ? '' : 's'}). Performance metrics, win rate, and profit factor have wide error margins and should not be used to extrapolate future profitability.`}
            </p>
          </div>
        </div>
      )}

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
          <div className="text-[10px] text-content-muted mt-1 font-mono">Gross: ${overview?.grossProfit?.toFixed(0) || 0}</div>
        </div>

        {/* Win Rate with 95% Wilson Confidence Interval */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Win Rate (95% CI)</div>
          <div className="text-xl font-extrabold font-mono text-content-primary mt-1">
            {overview?.winRate || 0}%
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">
            {overview?.winRateCi
              ? `[${overview.winRateCi.lower}% – ${overview.winRateCi.upper}%]`
              : `${overview?.winningTrades || 0}W / ${overview?.losingTrades || 0}L`}
          </div>
        </div>

        {/* Profit Factor */}
        <div className="framer-card p-4">
          <div className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Profit Factor</div>
          <div className="text-xl font-extrabold font-mono text-brand-primary mt-1">
            {overview?.profitFactor || 0}
          </div>
          <div className="text-[10px] text-content-muted mt-1 font-mono">
            Loss: ${overview?.grossLoss?.toFixed(0) || 0}
          </div>
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
          <div className="text-xl font-extrabold font-mono text-sky-400 mt-1">
            {overview?.averageR ? `${overview.averageR}R` : 'N/A'}
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

      {/* Cost Paid Breakdown (Spread, Commission, Swap, Total Fees) */}
      <div className="framer-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-content-primary flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-brand-primary" />
            <span>Friction & Costs Paid Breakdown (MT5 Deal Ledger)</span>
          </h3>
          <span className="text-[10px] font-mono text-content-muted">Reconstructed Broker Deductions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
            <span className="text-content-secondary font-sans">Commissions:</span>
            <span className="font-bold text-content-primary">${overview?.costs?.commissions?.toFixed(2) || overview?.totalCommissions?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
            <span className="text-content-secondary font-sans">Financing Swaps:</span>
            <span className="font-bold text-content-primary">${overview?.costs?.swaps?.toFixed(2) || overview?.totalSwaps?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
            <span className="text-content-secondary font-sans">Broker Fees:</span>
            <span className="font-bold text-content-primary">${overview?.costs?.fees?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex justify-between">
            <span className="text-content-secondary font-sans font-bold">Total Friction:</span>
            <span className="font-black text-rose-500">${overview?.costs?.totalCost?.toFixed(2) || ((overview?.totalCommissions || 0) + (overview?.totalSwaps || 0)).toFixed(2)}</span>
          </div>
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

      {/* Mandatory Performance Risk Disclosure Footer Banner */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle text-[11px] text-content-muted leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-content-primary">Empirical Performance & Risk Disclosure: </span>
          All quantitative metrics, expectancy calculations, and drawdown statistics displayed above are reconstructed exclusively from executed MetaTrader 5 deals recorded in your account ledger. Past trading results are not indicative of future performance. Trading foreign exchange, CFDs, and financial derivatives carries substantial risk of capital loss. Arcade Fx does not provide investment or financial advice.
        </div>
      </div>
    </div>
  );
};
