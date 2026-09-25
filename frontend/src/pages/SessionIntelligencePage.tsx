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
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Clock className="w-6 h-6 text-emerald-400" />
          <span>Session Intelligence & 24x7 Heatmap</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          London, New York, Asia, London/NY Overlap breakdowns & hourly statistical heatmaps
        </p>
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.map(sess => {
          const isWin = sess.netProfit >= 0;
          return (
            <div key={sess.sessionName} className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{sess.sessionName}</span>
                <span className="text-xs font-mono text-slate-400">{sess.tradeCount} trades</span>
              </div>
              <div className={`text-2xl font-extrabold font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                {isWin ? '+' : ''}${sess.netProfit?.toFixed(2)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div>Win Rate: <strong className="text-white">{sess.winRate}%</strong></div>
                <div>Profit Factor: <strong className="text-blue-400">{sess.profitFactor}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 24x7 Hourly Heatmap */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Day of Week vs UTC Hour Trade Density & Profitability</span>
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-[700px] space-y-1.5 text-xs">
            {/* Hour header */}
            <div className="grid grid-cols-25 gap-1 text-[10px] text-slate-500 font-mono text-center">
              <div className="text-left font-bold text-slate-400">Day/Hour</div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {/* Days rows */}
            {[1, 2, 3, 4, 5].map(day => (
              <div key={day} className="grid grid-cols-25 gap-1 items-center">
                <div className="font-bold text-slate-400 text-xs">{dayNames[day]}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const cell = heatmap.find(item => item.dayOfWeek === day && item.hour === h);
                  const count = cell?.count || 0;
                  const profit = cell?.netProfit || 0;

                  let cellColor = 'bg-slate-900 border-slate-800/50';
                  if (count > 0) {
                    if (profit > 0) cellColor = 'bg-emerald-600/40 border-emerald-500/40 text-emerald-300 font-bold';
                    else if (profit < 0) cellColor = 'bg-red-600/40 border-red-500/40 text-red-300 font-bold';
                    else cellColor = 'bg-blue-600/30 border-blue-500/30 text-white';
                  }

                  return (
                    <div
                      key={h}
                      title={`${dayNames[day]} ${h}:00 UTC - ${count} trades, $${profit.toFixed(2)}`}
                      className={`h-7 rounded-md border flex items-center justify-center text-[10px] font-mono cursor-pointer hover:scale-110 transition ${cellColor}`}
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
