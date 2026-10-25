import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertTriangle, Filter } from 'lucide-react';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

export const MacroCalendarPage: React.FC = () => {
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [policySummary, setPolicySummary] = useState<string>('Global monetary policy diverging between Federal Reserve higher-for-longer regime and dovish Asian liquidity.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async (refresh: boolean = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.getEconomicCalendar({});
      if (res?.events) {
        setEconomicEvents(res.events);
      }
      // Also query workspace data for live policy divergence summary if available
      try {
        const wsRes = await api.getWorkspace({ symbol: 'EURUSD' });
        if (wsRes?.workspace?.fundamentals?.policyDivergenceSummary) {
          setPolicySummary(wsRes.workspace.fundamentals.policyDivergenceSummary);
        }
      } catch {
        // Workspace summary optional
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load economic calendar events.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
        title="Macro & Calendar"
        description="G8 macroeconomic calendar, scheduled interest rate decisions, inflation, employment data releases, and policy divergence analysis."
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Macro & Calendar
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            G8 macroeconomic releases, high-impact interest rate decisions, and central bank policy divergence
          </p>
        </div>

        <button
          onClick={() => loadCalendarData(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-xl text-xs font-semibold text-content-primary transition disabled:opacity-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Calendar'}</span>
        </button>
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

      {/* Policy Divergence Summary Card */}
      <div className="p-4 bg-surface border border-border-subtle rounded-xl space-y-3">
        <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent-primary" />
          <span>G8 Macroeconomic Profiles & Policy Divergence</span>
        </h2>
        <div className="p-3 bg-surface-secondary rounded-lg text-xs text-content-primary font-mono border border-border-subtle">
          {policySummary}
        </div>
      </div>

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
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ev.impact === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {ev.impact}
                    </span>
                    <span className="text-content-primary font-medium">{ev.title}</span>
                  </div>
                  <span className="text-[10px] text-content-muted font-mono block">
                    {new Date(ev.eventTime).toLocaleString()} ({ev.status})
                  </span>
                </div>

                <div className="text-right font-mono text-xs flex-shrink-0 ml-4">
                  <div>Act: <span className="font-bold text-content-primary">{ev.actualValue ?? 'Pending'}</span></div>
                  <div className="text-content-muted text-[10px]">Fcst: {ev.forecastValue ?? '-'} | Prev: {ev.previousValue ?? '-'}</div>
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
