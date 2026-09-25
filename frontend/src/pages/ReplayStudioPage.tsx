import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  PlayCircle,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Layers,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

export const ReplayStudioPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [trades, setTrades] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReplayTrades();
  }, [selectedAccountId]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentIndex < trades.length - 1) {
      timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 2000);
    } else if (currentIndex >= trades.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, trades.length]);

  const loadReplayTrades = async () => {
    try {
      setIsLoading(true);
      const res = await api.getTrades({ accountId: selectedAccountId, limit: 100 });
      const sorted = (res.trades || []).sort((a: any, b: any) =>
        new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
      );
      setTrades(sorted);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load replay trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTrade = trades[currentIndex] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <PlayCircle className="w-6 h-6 text-blue-400" />
          <span>Trading Replay Studio</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological simulation player to review historical entries, executions & emotion states
        </p>
      </div>

      {/* Main Replay Stage */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-6">
        {currentTrade ? (
          <div className="space-y-6">
            {/* Playback Controls & Progress Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1 text-xs"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
                </button>
                <button
                  onClick={() => setCurrentIndex(Math.min(trades.length - 1, currentIndex + 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setCurrentIndex(0); setIsPlaying(false); }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Trade <strong className="text-white">{currentIndex + 1}</strong> of {trades.length}
              </div>
            </div>

            {/* Simulated Execution Stage Card */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-extrabold text-white font-mono">{currentTrade.symbol}</span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      currentTrade.position_type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {currentTrade.position_type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-mono">
                      {currentTrade.total_volume} Lots
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Opened: {new Date(currentTrade.open_time).toUTCString()} ({currentTrade.session_name})
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-extrabold font-mono ${
                    currentTrade.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {currentTrade.net_profit >= 0 ? '+' : ''}${currentTrade.net_profit?.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Exit: {currentTrade.exit_reason}
                  </div>
                </div>
              </div>

              {/* Execution Details Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-sans">Average Entry</div>
                  <div className="text-white font-bold mt-0.5">{currentTrade.entry_price_avg}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-sans">Average Exit</div>
                  <div className="text-white font-bold mt-0.5">{currentTrade.exit_price_avg || 'Open'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-sans">R-Multiple</div>
                  <div className="text-blue-400 font-bold mt-0.5">{currentTrade.r_multiple ? `${currentTrade.r_multiple}R` : 'N/A'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-sans">Holding Time</div>
                  <div className="text-slate-300 font-bold mt-0.5">{Math.round(currentTrade.holding_seconds / 60)} mins</div>
                </div>
              </div>

              {/* Subjective Notes / Setup */}
              {currentTrade.setup_name && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-400">Logged Strategy / Confluence:</div>
                  <div className="text-emerald-400 font-semibold">{currentTrade.setup_name}</div>
                  {currentTrade.trader_notes && (
                    <p className="text-slate-300 italic pt-1">"{currentTrade.trader_notes}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs">
            No trades available for replay simulation.
          </div>
        )}
      </div>
    </div>
  );
};
