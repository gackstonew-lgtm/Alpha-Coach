import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

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
  const [currentUtc, setCurrentUtc] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtc(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentUtc.getUTCHours();
  const isLondonOpen = isSessionActive(7, 16, currentHour);
  const isNyOpen = isSessionActive(12, 21, currentHour);
  const isOverlap = isLondonOpen && isNyOpen;

  // Filter to show ONLY currently active forex sessions
  const activeSessions = SESSIONS.filter(s => isSessionActive(s.openUtc, s.closeUtc, currentHour));

  return (
    <div className="p-4 bg-surface border border-border rounded-2xl shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Active Forex Sessions
          </h3>
          {isOverlap && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-amber-500" />
              <span>London / NY Overlap</span>
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          {activeSessions.length} {activeSessions.length === 1 ? 'Market Open' : 'Markets Open'}
        </span>
      </div>

      {activeSessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeSessions.map((s) => (
            <div
              key={s.name}
              className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between transition shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <div>
                  <div className="text-xs font-extrabold text-foreground font-mono">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {String(s.openUtc).padStart(2, '0')}:00 – {String(s.closeUtc).padStart(2, '0')}:00 UTC
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-muted-foreground bg-surface-elevated rounded-xl border border-border">
          No major forex trading sessions currently active (Market Closed / Weekend)
        </div>
      )}
    </div>
  );
};

export default MarketSessionsStrip;
