import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  RefreshCw,
  AlertTriangle,
  Filter,
  TrendingUp,
  AlertCircle,
  Clock,
  Newspaper,
  Globe,
  ExternalLink,
  Search,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

type ActiveTab = 'calendar' | 'news' | 'macro';
type TimeframeFilter = 'today' | 'tomorrow' | 'this_week' | 'all';
type ImpactFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface CalendarEventItem {
  id: string;
  title: string;
  country: string;
  currency: string;
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  eventTime: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'REVISED';
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  revisedPrevious?: string | null;
  unit?: string | null;
  countdownMs?: number;
  countdownText?: string;
  isUpcoming?: boolean;
  surpriseDirection?: 'POSITIVE_SURPRISE' | 'NEGATIVE_SURPRISE' | 'IN_LINE' | 'UNAVAILABLE' | 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string | null;
}

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  publishedAt: string;
  currencies: string[];
  category: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  relatedSymbols?: string[];
}

interface MacroSummaryData {
  overview: string;
  majorCurrencies: Array<{
    currency: string;
    centralBank: string;
    policyRatePct: number;
    cpiYoYPct: number;
    policyStance: string;
    inflationTrend: string;
    growthMomentum: string;
    fundamentalScore: number;
    supportingFactors: string[];
    opposingFactors: string[];
  }>;
  topPairs: Array<{
    pair: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rateDifferentialBps: number;
    yieldDifferential10YBps: number;
    divergenceSummary: string;
    nextHighImpactEvent?: {
      title: string;
      currency: string;
      eventTime: string;
      hoursUntil: number;
    } | null;
  }>;
  upcomingHighImpactCount: number;
  nextHighImpactEvent?: {
    id: string;
    title: string;
    currency: string;
    eventTime: string;
    hoursUntil: number;
    impact: 'HIGH';
  } | null;
  lastUpdated: string;
}

const getPrimaryPair = (currency: string) => {
  switch (currency?.toUpperCase()) {
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

const formatRelativeTime = (isoString: string): string => {
  try {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
};

export const MacroCalendarPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');

  // Calendar State
  const [economicEvents, setEconomicEvents] = useState<CalendarEventItem[]>([]);
  const [nextHighImpact, setNextHighImpact] = useState<any | null>(null);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // News State
  const [newsArticles, setNewsArticles] = useState<NewsItem[]>([]);
  const [newsCurrencyFilter, setNewsCurrencyFilter] = useState<string>('ALL');
  const [newsImpactFilter, setNewsImpactFilter] = useState<string>('ALL');
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>('');

  // Macro Intelligence State
  const [macroSummary, setMacroSummary] = useState<MacroSummaryData | null>(null);

  // Common UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const [calRes, newsRes, macroRes] = await Promise.allSettled([
        api.getEconomicCalendar({ timeframe: timeframeFilter }),
        api.getForexNews({ limit: 40 }),
        api.getMacroSummary()
      ]);

      if (calRes.status === 'fulfilled' && calRes.value?.events) {
        setEconomicEvents(calRes.value.events);
        setNextHighImpact(calRes.value.nextHighImpactEvent || null);
      }

      if (newsRes.status === 'fulfilled' && newsRes.value?.news) {
        setNewsArticles(newsRes.value.news);
      }

      if (macroRes.status === 'fulfilled' && macroRes.value?.summary) {
        setMacroSummary(macroRes.value.summary);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh market intelligence data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Re-fetch calendar when timeframe changes
  const handleTimeframeChange = async (tf: TimeframeFilter) => {
    setTimeframeFilter(tf);
    setIsLoading(true);
    try {
      const res = await api.getEconomicCalendar({ timeframe: tf });
      if (res?.events) {
        setEconomicEvents(res.events);
        setNextHighImpact(res.nextHighImpactEvent || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update calendar for selected timeframe.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Calendar Events
  const filteredEvents = useMemo(() => {
    return economicEvents.filter((ev) => {
      if (impactFilter !== 'ALL' && ev.impact !== impactFilter) return false;
      if (currencyFilter !== 'ALL' && ev.currency !== currencyFilter) return false;
      return true;
    });
  }, [economicEvents, impactFilter, currencyFilter]);

  // Available Currencies for calendar
  const calendarCurrencies = useMemo(() => {
    const list = Array.from(new Set(economicEvents.map((e) => e.currency))).filter(Boolean);
    return ['ALL', ...list];
  }, [economicEvents]);

  // Filtered News Items
  const filteredNews = useMemo(() => {
    return newsArticles.filter((item) => {
      if (newsCurrencyFilter !== 'ALL' && !item.currencies.includes(newsCurrencyFilter)) return false;
      if (newsImpactFilter !== 'ALL' && item.impact !== newsImpactFilter) return false;
      if (newsSearchQuery.trim()) {
        const q = newsSearchQuery.toLowerCase();
        return (
          item.headline.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [newsArticles, newsCurrencyFilter, newsImpactFilter, newsSearchQuery]);

  const majorCurrenciesList = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MetaHead
        title="Live Forex News, Economic Calendar & Macro Intelligence"
        description="Real-time forex economic calendar, high-impact countdowns, central bank news feed, and macroeconomic divergence intelligence."
      />

      {/* Top Header & Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border-subtle p-3.5 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0">
            {activeTab === 'calendar' ? (
              <Calendar className="w-5 h-5" />
            ) : activeTab === 'news' ? (
              <Newspaper className="w-5 h-5" />
            ) : (
              <Globe className="w-5 h-5" />
            )}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-content-primary">
                Forex Intelligence & News
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Institutional economic calendar, real-time market drivers & macroeconomic divergence
            </p>
          </div>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border-subtle rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'calendar'
                ? 'bg-accent-primary text-white shadow-xs'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'news'
                ? 'bg-accent-primary text-white shadow-xs'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('macro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'macro'
                ? 'bg-accent-primary text-white shadow-xs'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Macro Pulse</span>
          </button>

          <button
            onClick={() => loadAllData(true)}
            disabled={isRefreshing}
            title="Refresh Intelligence Data"
            className="p-1.5 rounded-lg text-content-muted hover:text-accent-primary hover:bg-surface transition ml-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* High-Impact Imminent Event Banner */}
      {nextHighImpact && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-surface border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white">
                  HIGH IMPACT
                </span>
                <span className="font-mono font-bold text-xs text-content-primary">
                  {nextHighImpact.currency}
                </span>
                <span className="text-[11px] text-content-muted font-mono">
                  {new Date(nextHighImpact.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                </span>
              </div>
              <h2 className="text-sm font-bold text-content-primary mt-1">
                {nextHighImpact.title}
              </h2>
              <div className="text-[11px] text-content-secondary mt-0.5 flex items-center gap-3 font-mono">
                <span>Forecast: <strong className="text-content-primary">{nextHighImpact.forecast || '-'}</strong></span>
                <span>Prior: <strong className="text-content-primary">{nextHighImpact.previous || '-'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-mono text-content-muted uppercase tracking-wider">Releases In</div>
              <div className="text-base font-black font-mono text-rose-400 tracking-tight flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{nextHighImpact.countdownText || 'Approaching'}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/charts?symbol=${getPrimaryPair(nextHighImpact.currency)}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trade {getPrimaryPair(nextHighImpact.currency)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-between">
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

      {/* TAB 1: ECONOMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Filter Controls */}
          <div className="bg-surface border border-border-subtle p-3.5 rounded-2xl space-y-3 shadow-xs">
            {/* Row 1: Timeframe & Impact Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-mono text-content-muted uppercase mr-1">Range:</span>
                {(['today', 'tomorrow', 'this_week', 'all'] as TimeframeFilter[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      timeframeFilter === tf
                        ? 'bg-accent-primary text-white shadow-xs'
                        : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                    }`}
                  >
                    {tf.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Impact Filter & Legend */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-content-muted uppercase">Impact:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setImpactFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      impactFilter === 'ALL'
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setImpactFilter('HIGH')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      impactFilter === 'HIGH'
                        ? 'bg-rose-500 text-white'
                        : 'bg-surface-secondary text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>High Only</span>
                  </button>
                  <button
                    onClick={() => setImpactFilter('MEDIUM')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      impactFilter === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-surface-secondary text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>Medium</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Currency Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-content-muted uppercase shrink-0 mr-1">Currency:</span>
              {majorCurrenciesList.map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrencyFilter(cur)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition shrink-0 ${
                    currencyFilter === cur
                      ? 'bg-accent-primary text-white font-bold'
                      : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Table */}
          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-border-subtle bg-surface-secondary/70 text-xs font-bold text-content-muted font-mono uppercase flex items-center justify-between">
              <span>Forex Economic Releases</span>
              <span className="text-[11px] normal-case font-sans">
                Showing {filteredEvents.length} events
              </span>
            </div>

            <div className="divide-y divide-border-subtle text-xs">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-content-muted flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-accent-primary" />
                  <span>Loading live macroeconomic calendar...</span>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary/40 transition"
                  >
                    {/* Left: Timing, Currency, Impact, Title */}
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Impact Dot */}
                      <span
                        className={`w-3 h-3 rounded-full mt-1 sm:mt-0 shrink-0 ${
                          ev.impact === 'HIGH'
                            ? 'bg-rose-500 ring-4 ring-rose-500/20'
                            : ev.impact === 'MEDIUM'
                            ? 'bg-amber-500 ring-4 ring-amber-500/20'
                            : 'bg-yellow-400 ring-4 ring-yellow-400/20'
                        }`}
                        title={`${ev.impact} Impact`}
                        aria-label={`${ev.impact} Impact`}
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-content-primary font-mono font-bold text-[11px]">
                            {ev.currency}
                          </span>
                          <span className="font-semibold text-content-primary text-sm">
                            {ev.title}
                          </span>
                          {ev.status === 'REVISED' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              REVISED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-content-muted">
                          <span>{new Date(ev.eventTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span>•</span>
                          <span className={ev.isUpcoming ? 'text-accent-primary font-semibold' : 'text-content-muted'}>
                            {ev.countdownText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actual, Forecast, Previous Values + Chart Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 ml-6 sm:ml-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50">
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-content-muted block uppercase">Act</span>
                          <span
                            className={`font-bold ${
                              ev.actual
                                ? (ev.surpriseDirection === 'POSITIVE_SURPRISE' || ev.surpriseDirection === 'BULLISH')
                                  ? 'text-emerald-400'
                                  : (ev.surpriseDirection === 'NEGATIVE_SURPRISE' || ev.surpriseDirection === 'BEARISH')
                                  ? 'text-rose-400'
                                  : 'text-content-primary'
                                : 'text-content-muted'
                            }`}
                          >
                            {ev.actual ?? 'Pending'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-content-muted block uppercase">Fcst</span>
                          <span className="text-content-secondary font-medium">{ev.forecast ?? '-'}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-content-muted block uppercase">Prev</span>
                          <span className="text-content-muted">{ev.previous ?? '-'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/charts?symbol=${getPrimaryPair(ev.currency)}`)}
                        title={`Open ${getPrimaryPair(ev.currency)} Live Chart`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface text-content-muted hover:text-accent-primary border border-border-subtle transition text-xs font-mono shrink-0 shadow-xs"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-accent-primary" />
                        <span className="font-semibold">{getPrimaryPair(ev.currency)}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-content-muted">
                  No economic calendar releases match the selected filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE FOREX NEWS */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          {/* News Filter Bar */}
          <div className="bg-surface border border-border-subtle p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search headlines, central banks, CPI, inflation, yields..."
                value={newsSearchQuery}
                onChange={(e) => setNewsSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-accent-primary transition"
              />
            </div>

            {/* Currency & Impact Selectors */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={newsCurrencyFilter}
                onChange={(e) => setNewsCurrencyFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs text-content-primary font-mono focus:outline-none focus:border-accent-primary"
              >
                {majorCurrenciesList.map((c) => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Currencies' : c}</option>
                ))}
              </select>

              <select
                value={newsImpactFilter}
                onChange={(e) => setNewsImpactFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs text-content-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="ALL">All Impact</option>
                <option value="HIGH">High Impact</option>
                <option value="MEDIUM">Medium Impact</option>
                <option value="LOW">Low Impact</option>
              </select>
            </div>
          </div>

          {/* News Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredNews.length > 0 ? (
              filteredNews.map((article) => (
                <div
                  key={article.id}
                  className="bg-surface border border-border-subtle hover:border-accent-primary/40 rounded-2xl p-4 flex flex-col justify-between transition shadow-xs group"
                >
                  <div className="space-y-2">
                    {/* Header tags: Source, Time, Impact, Currencies */}
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-content-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-content-secondary">{article.source}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(article.publishedAt)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            article.impact === 'HIGH'
                              ? 'bg-rose-500 ring-2 ring-rose-500/20'
                              : article.impact === 'MEDIUM'
                              ? 'bg-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-yellow-400 ring-2 ring-yellow-400/20'
                          }`}
                          title={`${article.impact} Impact`}
                        />
                        <span className="uppercase font-bold text-[10px] text-content-secondary">
                          {article.impact}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-content-primary group-hover:text-accent-primary transition line-clamp-2 block leading-snug"
                    >
                      {article.headline}
                    </a>

                    {/* Summary */}
                    <p className="text-xs text-content-secondary line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* Footer: Currencies & Direct Chart Actions */}
                  <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {article.currencies.map((cur) => (
                        <button
                          key={cur}
                          onClick={() => navigate(`/charts?symbol=${getPrimaryPair(cur)}`)}
                          title={`View ${getPrimaryPair(cur)} Chart`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-secondary hover:bg-accent-primary/10 text-content-primary hover:text-accent-primary border border-border-subtle transition flex items-center gap-1"
                        >
                          <span>{cur}</span>
                          <TrendingUp className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 shrink-0"
                    >
                      <span>Story</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center text-xs text-content-muted bg-surface border border-border-subtle rounded-2xl">
                No market news found matching your filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MACRO INTELLIGENCE */}
      {activeTab === 'macro' && macroSummary && (
        <div className="space-y-6">
          {/* Executive Macro Summary Card */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-4.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-content-muted font-mono uppercase tracking-wider">
              <Activity className="w-4 h-4 text-accent-primary" />
              <span>Global Macroeconomic Divergence & Central Bank Stance</span>
            </div>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              {macroSummary.overview}
            </p>
          </div>

          {/* Major Currency Pairs Fundamental Divergence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-content-primary">
                Major FX Pairs — Fundamental Bias & Rate Differentials
              </h2>
              <span className="text-xs text-content-muted font-mono">
                {macroSummary.topPairs.length} Pairs Analyzed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {macroSummary.topPairs.map((pair) => (
                <div
                  key={pair.pair}
                  className="bg-surface border border-border-subtle hover:border-accent-primary/40 rounded-2xl p-4 flex flex-col justify-between transition shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-base text-content-primary">
                        {pair.pair}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                          pair.bias === 'BULLISH'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : pair.bias === 'BEARISH'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {pair.bias === 'BULLISH' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : pair.bias === 'BEARISH' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <Activity className="w-3 h-3" />
                        )}
                        <span>{pair.bias}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-surface-secondary p-2.5 rounded-xl border border-border-subtle/50">
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">Rate Diff</span>
                        <span className="font-bold text-content-primary">
                          {pair.rateDifferentialBps > 0 ? `+${pair.rateDifferentialBps}` : pair.rateDifferentialBps} bps
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">10Y Spread</span>
                        <span className="font-bold text-content-primary">
                          {pair.yieldDifferential10YBps > 0 ? `+${pair.yieldDifferential10YBps}` : pair.yieldDifferential10YBps} bps
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-content-secondary leading-relaxed line-clamp-3">
                      {pair.divergenceSummary}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                    {pair.nextHighImpactEvent ? (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Event risk in {pair.nextHighImpactEvent.hoursUntil}h</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-content-muted">
                        No immediate 24h event risk
                      </span>
                    )}

                    <button
                      onClick={() => navigate(`/charts?symbol=${pair.pair}`)}
                      className="flex items-center gap-1 text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition"
                    >
                      <span>Chart</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* G8 Economies & Central Banks Health */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-content-primary">
              G8 Central Banks & Macro Health Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {macroSummary.majorCurrencies.map((c) => (
                <div
                  key={c.currency}
                  className="bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold font-mono text-content-primary">
                        {c.currency}
                      </span>
                      <span className="text-[11px] text-content-muted block truncate max-w-[130px]" title={c.centralBank}>
                        {c.centralBank}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-content-muted block uppercase">Policy Rate</span>
                      <span className="text-sm font-black text-accent-primary">
                        {c.policyRatePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono border-t border-border-subtle/60 pt-2">
                    <div>
                      <span className="text-[10px] text-content-muted block">CPI YoY</span>
                      <span className="font-bold text-content-primary">{c.cpiYoYPct.toFixed(1)}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-content-muted block">Stance</span>
                      <span
                        className={`font-bold text-[11px] ${
                          c.policyStance.includes('HAWKISH')
                            ? 'text-emerald-400'
                            : c.policyStance.includes('DOVISH')
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {c.policyStance.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {c.supportingFactors && c.supportingFactors.length > 0 && (
                    <div className="text-[11px] text-content-secondary line-clamp-2 bg-surface-secondary/50 p-2 rounded-lg border border-border-subtle/40">
                      • {c.supportingFactors[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
