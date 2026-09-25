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
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Weekly & Monthly Performance Reports
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Automated executive digests, risk consistency audits & structured CSV exports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-surface-secondary border border-border-subtle p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setReportType('WEEKLY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === 'WEEKLY' ? 'bg-brand-primary text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportType('MONTHLY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === 'MONTHLY' ? 'bg-brand-primary text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={downloadCSV}
            className="framer-btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Document Presentation Card */}
      {reportData && (
        <div className="framer-card p-8 space-y-6">
          {/* Report Header */}
          <div className="border-b border-border-subtle pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Executive Summary</div>
              <h2 className="text-xl font-bold text-content-primary mt-1">{reportData.title}</h2>
              <div className="text-xs text-content-muted font-mono mt-1">
                Period: {new Date(reportData.period.startDate).toLocaleDateString()} — {new Date(reportData.period.endDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle text-right font-mono">
                <div className="text-[10px] text-content-muted font-sans">Period Net P/L</div>
                <div className={`text-lg font-extrabold ${reportData.performance.netProfit >= 0 ? 'text-trade-profit' : 'text-trade-loss'}`}>
                  {reportData.performance.netProfit >= 0 ? '+' : ''}${reportData.performance.netProfit?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted">Core Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportData.keyInsights.map((insight: string, i: number) => (
                <div key={i} className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle text-xs text-content-secondary flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-trade-profit shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-border-subtle">
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans">Total Trades</div>
              <div className="text-content-primary font-bold text-sm mt-0.5">{reportData.performance.totalTrades}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans">Win Rate</div>
              <div className="text-trade-profit font-bold text-sm mt-0.5">{reportData.performance.winRate}%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans">Profit Factor</div>
              <div className="text-brand-primary font-bold text-sm mt-0.5">{reportData.performance.profitFactor}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans">Max Period Drawdown</div>
              <div className="text-amber-500 font-bold text-sm mt-0.5">${reportData.performance.maxDrawdownAmount?.toFixed(0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
