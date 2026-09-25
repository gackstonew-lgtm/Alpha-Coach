import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { RiskRule } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Bell,
  CheckCircle,
  Save,
  Zap,
  Info
} from 'lucide-react';

export const RiskGuardianPage: React.FC = () => {
  const { selectedAccountId, accounts } = useAccounts();
  const [rules, setRules] = useState<RiskRule | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [monitor, setMonitor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadRiskData();
  }, [selectedAccountId]);

  const loadRiskData = async () => {
    try {
      setIsLoading(true);
      const accId = selectedAccountId === 'ALL' && accounts.length > 0 ? accounts[0].id : selectedAccountId;
      const [rulesRes, alertsRes] = await Promise.all([
        api.getRiskRules(accId),
        api.getRiskAlerts(accId)
      ]);
      setRules(rulesRes.rules);
      setFormData(rulesRes.rules || {});
      setAlerts(alertsRes.alerts || []);

      if (accId && accId !== 'ALL') {
        const monRes = await api.getRiskMonitor(accId);
        setMonitor(monRes.monitor);
      }
    } catch (err) {
      console.error('Failed to load risk guardian:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const accId = selectedAccountId === 'ALL' && accounts.length > 0 ? accounts[0].id : selectedAccountId;
      await api.updateRiskRules(formData, accId);
      alert('Risk Guardian parameters saved successfully.');
      await loadRiskData();
    } catch (err: any) {
      alert(err.message || 'Failed to save rules');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAckAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: 1 } : a));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Risk Guardian Monitoring Engine
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Active threshold alerts for daily loss caps, position sizing limits & consecutive loss safeguards
        </p>
      </div>

      {/* Live Monitor Gauges */}
      {monitor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Loss Gauge */}
          <div className="framer-card p-6 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-content-secondary">
              <span>Daily Loss Exposure</span>
              <span className="font-mono text-content-primary">${monitor.todayLoss?.toFixed(2)} / ${monitor.dailyLossLimit}</span>
            </div>
            <div className="w-full bg-surface-secondary h-3 rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (monitor.todayLoss / (monitor.dailyLossLimit || 500)) > 0.8 ? 'bg-trade-loss' : 'bg-trade-profit'
                }`}
                style={{ width: `${Math.min(100, (monitor.todayLoss / (monitor.dailyLossLimit || 500)) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-content-muted">
              {( (monitor.todayLoss / (monitor.dailyLossLimit || 500)) * 100 ).toFixed(1)}% of configured daily limit reached
            </div>
          </div>

          {/* Daily Trades Count */}
          <div className="framer-card p-6 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-content-secondary">
              <span>Trades Executed Today</span>
              <span className="font-mono text-content-primary">{monitor.todayTrades} / {monitor.dailyTradesLimit}</span>
            </div>
            <div className="w-full bg-surface-secondary h-3 rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-500"
                style={{ width: `${Math.min(100, (monitor.todayTrades / (monitor.dailyTradesLimit || 5)) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-content-muted">
              {Math.max(0, (monitor.dailyTradesLimit || 5) - monitor.todayTrades)} trades remaining today
            </div>
          </div>

          {/* Consecutive Losses */}
          <div className="framer-card p-6 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-content-secondary">
              <span>Consecutive Losses</span>
              <span className={`font-mono font-bold ${monitor.consecutiveLosses >= 2 ? 'text-trade-loss' : 'text-trade-profit'}`}>
                {monitor.consecutiveLosses} detected
              </span>
            </div>
            <div className="text-xs text-content-secondary font-sans">
              {monitor.consecutiveLosses >= 3 ? (
                <span className="text-trade-loss font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Threshold reached: Take a cooling break to avoid revenge trading.</span>
                </span>
              ) : (
                <span className="text-trade-profit font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execution discipline within safety limits.</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rules Config Form & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules Form */}
        <form onSubmit={handleSave} className="framer-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
            <Settings className="w-4 h-4" />
            <span>Configure Risk Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Daily Loss ($ Amount)</label>
              <input
                type="number"
                value={formData.max_daily_loss_amount ?? 500}
                onChange={e => setFormData({ ...formData, max_daily_loss_amount: parseFloat(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Trades Per Day</label>
              <input
                type="number"
                value={formData.max_trades_per_day ?? 5}
                onChange={e => setFormData({ ...formData, max_trades_per_day: parseInt(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Consecutive Losses</label>
              <input
                type="number"
                value={formData.max_consecutive_losses ?? 3}
                onChange={e => setFormData({ ...formData, max_consecutive_losses: parseInt(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Position Size (Lots)</label>
              <input
                type="number"
                step="0.01"
                value={formData.max_position_size ?? 5.0}
                onChange={e => setFormData({ ...formData, max_position_size: parseFloat(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="framer-btn-primary w-full py-2.5 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Rules...' : 'Save Risk Guardian Parameters'}</span>
          </button>
        </form>

        {/* Alerts Log */}
        <div className="framer-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-500">
            <Bell className="w-4 h-4" />
            <span>Triggered Risk Alerts Log</span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-content-muted">No active or historical risk alerts triggered.</div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`p-3.5 rounded-2xl border ${
                  a.severity === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                } flex items-start justify-between gap-2`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-[11px] text-content-muted font-mono">
                        {new Date(a.triggered_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-content-primary text-xs">{a.message}</p>
                  </div>
                  {!a.is_acknowledged && (
                    <button
                      onClick={() => handleAckAlert(a.id)}
                      className="px-2.5 py-1 bg-surface-secondary hover:bg-surface text-content-primary rounded-lg text-[10px] font-semibold shrink-0 border border-border-subtle transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
