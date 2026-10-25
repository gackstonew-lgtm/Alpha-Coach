import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Globe, TrendingUp, Scan, Zap } from 'lucide-react';

interface MarketSession {
  name: string;
  city: string;
  openUtc: number; // UTC hour
  closeUtc: number; // UTC hour
  color: string;
}

const SESSIONS: MarketSession[] = [
  { name: 'Sydney', city: 'Sydney', openUtc: 21, closeUtc: 6, color: '#38bdf8' },
  { name: 'Tokyo', city: 'Tokyo', openUtc: 0, closeUtc: 9, color: '#f43f5e' },
  { name: 'London', city: 'London', openUtc: 7, closeUtc: 16, color: '#10b981' },
  { name: 'New York', city: 'New York', openUtc: 12, closeUtc: 21, color: '#f59e0b' },
];

function isSessionActive(openUtc: number, closeUtc: number, currentHour: number): boolean {
  if (openUtc < closeUtc) {
    return currentHour >= openUtc && currentHour < closeUtc;
  }
  // Wraps over midnight (e.g., 21 to 6)
  return currentHour >= openUtc || currentHour < closeUtc;
}

export const MarketSessionsStrip: React.FC = () => {
  const navigate = useNavigate();
  const [currentUtc, setCurrentUtc] = useState<Date>(new Date());
  const [selectedQuickSymbol, setSelectedQuickSymbol] = useState<string>('EURUSD');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtc(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentUtc.getUTCHours();
  const currentMinutes = currentUtc.getUTCMinutes();
  const isLondonOpen = isSessionActive(7, 16, currentHour);
  const isNyOpen = isSessionActive(12, 21, currentHour);
  const isOverlap = isLondonOpen && isNyOpen;

  const utcTimeStr = currentUtc.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="p-4 bg-surface border border-border-subtle rounded-2xl space-y-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Market Clock & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-content-primary font-mono">
                Global Forex Sessions
              </span>
              {isOverlap && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  <span>London/NY Overlap</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-content-muted font-mono mt-0.5">
              <Clock className="w-3 h-3" />
              <span>Current UTC: <strong>{utcTimeStr}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedQuickSymbol}
            onChange={(e) => setSelectedQuickSymbol(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono text-content-primary focus:outline-none"
          >
            {['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD', 'USDCHF', 'XAUUSD', 'BTCUSD'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => navigate(`/charts?symbol=${selectedQuickSymbol}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Launch Chart</span>
          </button>

          <button
            onClick={() => navigate('/scanner')}
            className="p-1.5 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-xl text-content-muted hover:text-content-primary transition"
            title="Open Market Scanner"
          >
            <Scan className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {SESSIONS.map((s) => {
          const active = isSessionActive(s.openUtc, s.closeUtc, currentHour);
          return (
            <div
              key={s.name}
              className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                active
                  ? 'bg-surface-secondary/90 border-accent-primary/40 shadow-xs'
                  : 'bg-surface-secondary/40 border-border-subtle/60 opacity-75'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? s.color : '#64748b' }}
                  />
                  <span className="text-xs font-bold text-content-primary font-mono">{s.name}</span>
                </div>
                <span className="text-[10px] text-content-muted font-mono block">
                  {String(s.openUtc).padStart(2, '0')}:00 – {String(s.closeUtc).padStart(2, '0')}:00 UTC
                </span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/10 text-content-muted border border-border-subtle'
                }`}
              >
                {active ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
