import { PrimaryAction } from '../components/common/PrimaryAction';
import { SkeletonMetricCard } from '../components/common/Skeleton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

export const CurrencyStrengthPage: React.FC = () => {
  const navigate = useNavigate();
  const [currencyStrengthData, setCurrencyStrengthData] = useState<any>(null);
  const [lookback, setLookback] = useState<string>('24H');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStrengthData();
  }, [lookback]);

  const loadStrengthData = async (refresh: boolean = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.getCurrencyStrength(lookback);
      if (res?.model) {
        setCurrencyStrengthData(res.model);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to calculate currency strength matrix.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MetaHead
        title="Currency Strength"
        description="Relative G8 currency strength rankings, composite score heatmaps, and divergence watchlists for high-expectancy pairs."
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Scale className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Currency Strength
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Real-time multi-timeframe G8 currency rankings and divergence pairing matrix
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Lookback Selector */}
          <div className="flex items-center bg-surface border border-border-subtle rounded-xl p-1 text-xs font-mono">
            {['4H', '24H', '7D'].map((lb) => (
              <button
                key={lb}
                onClick={() => setLookback(lb)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  lookback === lb
                    ? 'bg-accent-primary text-white font-bold shadow-sm'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                {lb}
              </button>
            ))}
          </div>

          <PrimaryAction
            label={isRefreshing ? 'Updating...' : 'Refresh Matrix'}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => loadStrengthData(true)}
            loading={isRefreshing}
          />
        </div>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* G8 Currency Ranking Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-content-muted font-mono uppercase tracking-wider">
          G8 Composite Relative Strength Rankings ({lookback})
        </h2>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-content-muted flex items-center justify-center gap-2 bg-surface border border-border-subtle rounded-xl">
            <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
            <span>Computing relative strength coefficients...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {currencyStrengthData?.rankings?.map((item: any) => {
              const isBull = item.compositeStrengthScore > 0;
              return (
                <div
                  key={item.currency}
                  className="p-3.5 bg-surface border border-border-subtle rounded-xl text-center space-y-1.5 shadow-sm hover:border-accent-primary transition"
                >
                  <span className="text-[10px] font-mono text-content-muted block font-semibold">
                    RANK #{item.rank}
                  </span>
                  <span className="text-xl font-black text-content-primary block tracking-tight">
                    {item.currency}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {isBull ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span
                      className={`text-xs font-mono font-bold ${
                        isBull ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isBull ? '+' : ''}
                      {item.compositeStrengthScore}
                    </span>
                  </div>
                  <span className="text-[9px] text-content-muted block truncate font-medium">
                    {item.alignmentStatus}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strongest vs Weakest Pair Watchlist */}
      <div className="p-5 bg-surface border border-border-subtle rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider flex items-center gap-2">
            <span>Strongest vs Weakest Divergence Watchlist</span>
          </h3>
          <span className="text-[11px] text-content-muted">
            Click any pair to analyze in the workspace
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {currencyStrengthData?.topRankedPairs?.map((pair: any) => (
            <div
              key={pair.symbol}
              onClick={() => navigate(`/charts?symbol=${pair.symbol}`)}
              className="p-3.5 bg-surface-secondary/70 border border-border-subtle rounded-xl hover:border-accent-primary hover:bg-surface cursor-pointer transition space-y-2 shadow-xs group"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="text-content-primary text-sm font-mono group-hover:text-accent-primary transition">
                  {pair.symbol}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    pair.directionBias === 'BULLISH'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {pair.directionBias}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-content-muted font-mono">
                <span>Spread Score: <strong className="text-content-primary">{pair.strengthSpread > 0 ? '+' : ''}{pair.strengthSpread}</strong></span>
                <span className="truncate max-w-[130px]">{pair.correlationGroup}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border-subtle/60">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/charts?symbol=${pair.symbol}`);
                  }}
                  className="flex-1 py-1 px-2 text-[11px] font-semibold text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 rounded transition text-center"
                >
                  Chart →
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/charts?symbol=${pair.symbol}`);
                  }}
                  className="flex-1 py-1 px-2 text-[11px] font-semibold text-content-muted hover:text-content-primary hover:bg-surface-secondary rounded transition text-center"
                >
                  Workspace →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
