import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Globe,
  Flame,
  Award,
  Calendar
} from 'lucide-react';

export const SessionIntelligencePage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [sessions, setSessions] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSessionData();
  }, [selectedAccountId]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSessionAnalytics(selectedAccountId);
      setSessions(res.sessions || []);
      setHeatmap(res.hourlyHeatmap || []);
    } catch (err) {
      console.error('Failed to load session intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Session Intelligence & 24x7 Heatmap
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          London, New York, Asia, London/NY Overlap breakdowns & hourly statistical heatmaps
        </p>
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.map(sess => {
          const isWin = sess.netProfit >= 0;
          return (
            <div key={sess.sessionName} className="framer-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-content-primary text-sm">{sess.sessionName}</span>
                <span className="text-xs font-mono text-content-muted">{sess.tradeCount} trades</span>
              </div>
              <div className={`text-2xl font-extrabold font-mono ${isWin ? 'text-trade-profit' : 'text-trade-loss'}`}>
                {isWin ? '+' : ''}${sess.netProfit?.toFixed(2)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary pt-2 border-t border-border-subtle">
                <div>Win Rate: <strong className="text-content-primary font-mono">{sess.winRate}%</strong></div>
                <div>Profit Factor: <strong className="text-brand-primary font-mono">{sess.profitFactor}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 24x7 Hourly Heatmap */}
      <div className="framer-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
          <Globe className="w-4 h-4 text-brand-primary" />
          <span>Day of Week vs UTC Hour Trade Density & Profitability</span>
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-[720px] space-y-2 text-xs">
            {/* Hour header */}
            <div className="grid grid-cols-25 gap-1 text-[10px] text-content-muted font-mono text-center">
              <div className="text-left font-bold text-content-secondary">Day/Hour</div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {/* Days rows */}
            {[1, 2, 3, 4, 5].map(day => (
              <div key={day} className="grid grid-cols-25 gap-1 items-center">
                <div className="font-bold text-content-secondary text-xs">{dayNames[day]}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const cell = heatmap.find(item => item.dayOfWeek === day && item.hour === h);
                  const count = cell?.count || 0;
                  const profit = cell?.netProfit || 0;

                  let cellColor = 'bg-surface-secondary border-border-subtle';
                  if (count > 0) {
                    if (profit > 0) cellColor = 'bg-trade-profit/20 border-trade-profit/40 text-trade-profit font-bold';
                    else if (profit < 0) cellColor = 'bg-trade-loss/20 border-trade-loss/40 text-trade-loss font-bold';
                    else cellColor = 'bg-brand-primary/20 border-brand-primary/40 text-content-primary';
                  }

                  return (
                    <div
                      key={h}
                      title={`${dayNames[day]} ${h}:00 UTC - ${count} trades, $${profit.toFixed(2)}`}
                      className={`h-7 rounded-md border flex items-center justify-center text-[10px] font-mono cursor-pointer hover:scale-105 transition ${cellColor}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
