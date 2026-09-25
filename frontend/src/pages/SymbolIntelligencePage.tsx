import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Layers
} from 'lucide-react';

export const SymbolIntelligencePage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [symbols, setSymbols] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSymbolData();
  }, [selectedAccountId]);

  const loadSymbolData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSymbolAnalytics(selectedAccountId);
      setSymbols(res.symbols || []);
    } catch (err) {
      console.error('Failed to load symbol intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Coins className="w-6 h-6 text-amber-400" />
          <span>Symbol Intelligence</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Descriptive statistical ranking across symbols (XAUUSD, EURUSD, BTCUSD, NAS100)
        </p>
      </div>

      {/* Symbol Table */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Total Trades</th>
                <th className="p-4">Win Rate</th>
                <th className="p-4">Net P/L</th>
                <th className="p-4">Profit Factor</th>
                <th className="p-4">Avg R</th>
                <th className="p-4">Total Volume (Lots)</th>
                <th className="p-4">Best Win</th>
                <th className="p-4">Worst Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">Loading symbol analytics...</td>
                </tr>
              ) : symbols.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">No symbol trading history available</td>
                </tr>
              ) : (
                symbols.map(s => {
                  const isWin = s.netProfit >= 0;
                  return (
                    <tr key={s.symbol} className="hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-white font-sans flex items-center space-x-2">
                        <span>{s.symbol}</span>
                      </td>
                      <td className="p-4 text-slate-300">{s.tradeCount} trades</td>
                      <td className="p-4 text-emerald-400 font-bold">{s.winRate}%</td>
                      <td className={`p-4 font-bold text-sm ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}${s.netProfit?.toFixed(2)}
                      </td>
                      <td className="p-4 text-blue-400 font-bold">{s.profitFactor}</td>
                      <td className="p-4 text-purple-400">{s.averageR ? `${s.averageR}R` : '-'}</td>
                      <td className="p-4 text-slate-300">{s.totalVolume}</td>
                      <td className="p-4 text-emerald-400">+${s.largestWin?.toFixed(2)}</td>
                      <td className="p-4 text-red-400">-${s.largestLoss?.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
