import React, { useState, useEffect } from 'react';
import { SkeletonTable } from '../components/common/Skeleton';
import { Calendar, RefreshCw, AlertTriangle, Filter, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

const getPrimaryPair = (currency: string) => {
  switch (currency) {
    case 'USD': return 'EURUSD';
    case 'EUR': return 'EURUSD';
    case 'GBP': return 'GBPUSD';
    case 'JPY': return 'USDJPY';
    case 'AUD': return 'AUDUSD';
    case 'CAD': return 'USDCAD';
    case 'CHF': return 'USDCHF';
    case 'NZD': return 'NZDUSD';
    default: return 'EURUSD';
  }
};

export const MacroCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.getEconomicCalendar({});
      if (res?.events) {
        setEconomicEvents(res.events);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load economic calendar events.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = economicEvents.filter((ev: any) => {
    if (impactFilter === 'HIGH' && ev.impact !== 'HIGH') return false;
    if (currencyFilter !== 'ALL' && ev.currency !== currencyFilter) return false;
    return true;
  });

  const currencies = ['ALL', ...Array.from(new Set(economicEvents.map((e: any) => e.currency))).filter(Boolean)];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MetaHead
        title="Economic Calendar & News"
        description="Scheduled macroeconomic releases, high-impact interest rate decisions, inflation, and employment data releases."
      />

      {/* Clean Page Header (Promotional text & Refresh button removed) */}
      <div className="flex items-center justify-between gap-3 bg-surface border border-border-subtle p-3 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            <Calendar className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Economic Calendar & News
            </h1>
            <p className="text-xs text-content-secondary mt-0.5">
              Scheduled macroeconomic releases, central bank decisions & market indicators
            </p>
          </div>
        </div>

        {/* Minimal Impact Legend */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-content-muted" aria-label="Impact level indicators">
          <span className="flex items-center gap-1.5" title="Red: High Impact">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
            <span className="hidden sm:inline">High</span>
          </span>
          <span className="flex items-center gap-1.5" title="Orange: Medium Impact">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span className="hidden sm:inline">Medium</span>
          </span>
          <span className="flex items-center gap-1.5" title="Yellow: Low Impact">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/20" />
            <span className="hidden sm:inline">Low</span>
          </span>
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border-subtle p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-content-muted" />
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">Filters:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setImpactFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                impactFilter === 'ALL'
                  ? 'bg-accent-primary text-white font-semibold'
                  : 'bg-surface-secondary text-content-muted hover:text-content-primary'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setImpactFilter('HIGH')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                impactFilter === 'HIGH'
                  ? 'bg-red-500 text-white font-semibold'
                  : 'bg-surface-secondary text-content-muted hover:text-content-primary'
              }`}
            >
              High Impact Only
            </button>
          </div>
        </div>

        {currencies.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] text-content-muted font-mono uppercase">Currency:</span>
            {currencies.slice(0, 8).map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrencyFilter(cur)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  currencyFilter === cur
                    ? 'bg-brand-600 text-white font-bold'
                    : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Releases Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border-subtle bg-surface-secondary text-xs font-bold text-content-muted font-mono uppercase flex items-center justify-between">
          <span>Scheduled & Published Macro Releases</span>
          <span className="text-[11px] text-content-muted normal-case font-sans">
            Showing {filteredEvents.length} events
          </span>
        </div>
        <div className="divide-y divide-border-subtle text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-content-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
              <span>Loading economic calendar releases...</span>
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((ev: any) => (
              <div key={ev.id} className="p-3 flex items-center justify-between hover:bg-surface-secondary/40 transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-content-primary font-mono">{ev.currency}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
                        ev.impact === 'HIGH'
                          ? 'bg-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                          : ev.impact === 'MEDIUM'
                          ? 'bg-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-yellow-400 ring-2 ring-yellow-400/20 shadow-xs'
                      }`}
                      title={`${ev.impact || 'LOW'} Impact`}
                      aria-label={`${ev.impact || 'LOW'} Impact`}
                    />
                    <span className="text-content-primary font-medium">{ev.title}</span>
                  </div>
                  <span className="text-[10px] text-content-muted font-mono block">
                    {new Date(ev.eventTime).toLocaleString()} ({ev.status})
                  </span>
                </div>

                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="text-right font-mono text-xs">
                    <div>Act: <span className="font-bold text-content-primary">{ev.actualValue ?? 'Pending'}</span></div>
                    <div className="text-content-muted text-[10px]">Fcst: {ev.forecastValue ?? '-'} | Prev: {ev.previousValue ?? '-'}</div>
                  </div>
                  <button
                    onClick={() => navigate(`/charts?symbol=${getPrimaryPair(ev.currency)}`)}
                    title={`Open ${getPrimaryPair(ev.currency)} Chart`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface text-content-muted hover:text-accent-primary border border-border-subtle transition text-xs font-mono"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-accent-primary" />
                    <span className="hidden sm:inline font-medium">Chart</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-content-muted">
              No economic calendar releases found matching the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
