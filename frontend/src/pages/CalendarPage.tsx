import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  X,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';

export const CalendarPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<Map<string, { netProfit: number; tradesCount: number; winCount: number; lossCount: number }>>(new Map());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayTrades, setDayTrades] = useState<any[]>([]);
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCalendarPerformance();
  }, [selectedAccountId, currentMonth]);

  const loadCalendarPerformance = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics({ accountId: selectedAccountId });
      const map = new Map<string, any>();
      (res.overview?.dailyPerformance || []).forEach((d: any) => {
        map.set(d.date, d);
      });
      setDailyData(map);
    } catch (err) {
      console.error('Failed to load calendar analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = async (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(day);
    try {
      const res = await api.getTrades({
        accountId: selectedAccountId,
        search: dateStr,
        limit: 50
      });
      setDayTrades(res.trades || []);
      setIsDayDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load day trades:', err);
    }
  };

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            <span>Interactive Trading Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual day-by-day P/L distribution, trade volume & session consistency
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[140px] text-center font-mono">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-2xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-600">Sat</div>
          <div className="text-slate-600">Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayPerf = dailyData.get(dateKey);
            const inMonth = isSameMonth(day, currentMonth);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            let badgeClass = 'bg-slate-950/40 border-slate-850 text-slate-500';
            if (dayPerf) {
              if (dayPerf.netProfit > 0) {
                badgeClass = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:border-emerald-400';
              } else if (dayPerf.netProfit < 0) {
                badgeClass = 'bg-red-950/30 border-red-500/30 text-red-400 hover:border-red-400';
              } else {
                badgeClass = 'bg-slate-900 border-slate-700 text-slate-300';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`min-h-[90px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !inMonth ? 'opacity-30' : ''
                } ${isWeekend ? 'bg-slate-950/20' : ''} ${badgeClass}`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-mono font-bold ${inMonth ? 'text-slate-200' : 'text-slate-600'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayPerf && (
                    <span className="text-[10px] text-slate-400 font-sans">
                      {dayPerf.tradesCount}t
                    </span>
                  )}
                </div>

                {dayPerf ? (
                  <div className="mt-2 text-right">
                    <div className="text-xs sm:text-sm font-extrabold font-mono">
                      {dayPerf.netProfit >= 0 ? '+' : ''}${Math.round(dayPerf.netProfit)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dayPerf.winCount}W / {dayPerf.lossCount}L
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-700 text-center py-2">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Trades Drawer Modal */}
      {isDayDrawerOpen && selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0d121f] border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Trades for {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <p className="text-xs text-slate-400">{dayTrades.length} trades recorded on this date</p>
              </div>
              <button onClick={() => setIsDayDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {dayTrades.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No trades on this date</div>
              ) : (
                dayTrades.map(trade => {
                  const isWin = trade.net_profit >= 0;
                  return (
                    <div key={trade.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-white text-xs">
                          <span>{trade.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            trade.position_type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.position_type}
                          </span>
                        </div>
                        <div className={`font-mono font-bold text-sm ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isWin ? '+' : ''}${trade.net_profit?.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>{trade.total_volume} Lots @ {trade.entry_price_avg} → {trade.exit_price_avg}</span>
                        <span>{trade.session_name || 'Session'}</span>
                      </div>
                      {trade.setup_name && (
                        <div className="text-[11px] text-slate-300 font-sans pt-1 border-t border-slate-800/60">
                          Setup: <span className="font-semibold text-blue-400">{trade.setup_name}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
