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
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Interactive Trading Calendar
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Visual day-by-day P/L distribution, trade volume & session consistency
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-3 bg-surface-secondary border border-border-subtle p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-content-primary min-w-[140px] text-center font-mono">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="framer-card p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-content-muted uppercase tracking-wider mb-3">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="opacity-40">Sat</div>
          <div className="opacity-40">Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayPerf = dailyData.get(dateKey);
            const inMonth = isSameMonth(day, currentMonth);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            let badgeClass = 'bg-surface-secondary/40 border-border-subtle text-content-muted';
            if (dayPerf) {
              if (dayPerf.netProfit > 0) {
                badgeClass = 'bg-trade-profit/10 border-trade-profit/30 text-trade-profit hover:border-trade-profit';
              } else if (dayPerf.netProfit < 0) {
                badgeClass = 'bg-trade-loss/10 border-trade-loss/30 text-trade-loss hover:border-trade-loss';
              } else {
                badgeClass = 'bg-surface-secondary border-border-strong text-content-primary';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`min-h-[90px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !inMonth ? 'opacity-30' : ''
                } ${isWeekend ? 'opacity-50' : ''} ${badgeClass}`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-mono font-bold ${inMonth ? 'text-content-primary' : 'text-content-muted'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayPerf && (
                    <span className="text-[10px] text-content-muted font-sans font-medium">
                      {dayPerf.tradesCount}t
                    </span>
                  )}
                </div>

                {dayPerf ? (
                  <div className="mt-2 text-right">
                    <div className="text-xs sm:text-sm font-extrabold font-mono">
                      {dayPerf.netProfit >= 0 ? '+' : ''}${Math.round(dayPerf.netProfit)}
                    </div>
                    <div className="text-[10px] text-content-muted font-mono">
                      {dayPerf.winCount}W / {dayPerf.lossCount}L
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-content-muted text-center py-2">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Trades Drawer Modal */}
      {isDayDrawerOpen && selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-surface border-l border-border-subtle h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <h2 className="text-lg font-bold text-content-primary">
                  Trades for {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <p className="text-xs text-content-secondary">{dayTrades.length} trades recorded on this date</p>
              </div>
              <button
                onClick={() => setIsDayDrawerOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {dayTrades.length === 0 ? (
                <div className="py-12 text-center text-content-muted text-xs font-sans">
                  No reconstructed trades found for this day.
                </div>
              ) : (
                dayTrades.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-content-primary">{t.symbol} • {t.position_type}</span>
                      <span className={`font-mono font-bold ${t.net_profit >= 0 ? 'text-trade-profit' : 'text-trade-loss'}`}>
                        {t.net_profit >= 0 ? '+' : ''}${t.net_profit?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-content-muted font-mono">
                      <span>Volume: {t.total_volume} Lots</span>
                      <span>{t.session_name || 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
