import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [reportType, setReportType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReport();
  }, [selectedAccountId, reportType]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReport(reportType, selectedAccountId);
      setReportData(res.report);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    window.location.href = api.getExportCSVUrl(selectedAccountId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Weekly & Monthly Performance Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated executive digests, risk consistency audits & structured CSV exports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setReportType('WEEKLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === 'WEEKLY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportType('MONTHLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === 'MONTHLY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Document Presentation Card */}
      {reportData && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-2xl">
          {/* Report Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Executive Summary</div>
              <h2 className="text-xl font-extrabold text-white mt-1">{reportData.title}</h2>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Period: {new Date(reportData.period.startDate).toLocaleDateString()} — {new Date(reportData.period.endDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-right font-mono">
                <div className="text-[10px] text-slate-500 font-sans">Period Net P/L</div>
                <div className={`text-lg font-extrabold ${reportData.performance.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reportData.performance.netProfit >= 0 ? '+' : ''}${reportData.performance.netProfit?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportData.keyInsights.map((insight: string, i: number) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-sans">Total Trades</div>
              <div className="text-white font-bold text-sm mt-0.5">{reportData.performance.totalTrades}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-sans">Win Rate</div>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">{reportData.performance.winRate}%</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-sans">Profit Factor</div>
              <div className="text-blue-400 font-bold text-sm mt-0.5">{reportData.performance.profitFactor}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-sans">Max Period Drawdown</div>
              <div className="text-amber-400 font-bold text-sm mt-0.5">${reportData.performance.maxDrawdownAmount?.toFixed(0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
