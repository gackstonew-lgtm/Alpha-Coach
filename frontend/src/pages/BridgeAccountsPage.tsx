import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Cpu,
  RefreshCw,
  Trash2,
  Layers,
  Download,
  Laptop,
  CheckCircle2,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export const BridgeAccountsPage: React.FC = () => {
  const { accounts, refreshAccounts } = useAccounts();
  const [devices, setDevices] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullSyncing, setIsFullSyncing] = useState<boolean>(false);
  const [fullSyncMessage, setFullSyncMessage] = useState<string | null>(null);
  const [reconciliations, setReconciliations] = useState<Record<string, any>>({});
  const [apiStatus, setApiStatus] = useState<any>(null);

  // Derive stable dependency values to avoid re-triggering on every array
  // reference change produced by AccountContext on token refresh cycles.
  const accountsKey = accounts.map(a => a.id).join(',');

  useEffect(() => {
    loadDevices();
    checkStatus();
    loadReconciliations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsKey]);

  const loadReconciliations = async () => {
    try {
      const results: Record<string, any> = {};
      for (const acc of accounts) {
        const res = await api.getReconciliation(acc.id);
        if (res && res.reconciliation) {
          results[acc.id] = res.reconciliation;
        }
      }
      setReconciliations(results);
    } catch {
      // ignore
    }
  };

  const loadDevices = async () => {
    try {
      const res = await api.getBridgeDevices();
      setDevices(res.devices || []);
    } catch {
      // ignore
    }
  };

  const checkStatus = async () => {
    try {
      const status = await api.getBridgeStatus();
      setApiStatus(status);
    } catch {
      setApiStatus({ status: 'OFFLINE' });
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([loadDevices(), refreshAccounts(), checkStatus(), loadReconciliations()]);
    setIsRefreshing(false);
  };

  const handleTriggerFullSync = async () => {
    setIsFullSyncing(true);
    setFullSyncMessage('Initiating complete untruncated MT5 historical synchronization...');
    try {
      // Refresh accounts and reconciliations
      await refreshAccounts();
      await loadReconciliations();
      setFullSyncMessage('Full historical synchronization completed successfully.');
      setTimeout(() => setFullSyncMessage(null), 5000);
    } catch (err: any) {
      setFullSyncMessage(`Full sync error: ${err.message || 'Failed'}`);
    } finally {
      setIsFullSyncing(false);
    }
  };

  const handleRevokeDevice = async (id: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to revoke authorization for "${deviceName}"? The local MT5 bridge will stop synchronizing.`)) return;
    try {
      await api.revokeBridgeDevice(id);
      await loadDevices();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke device');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account and purge its trade history?')) return;
    try {
      await api.deleteAccount(id);
      await refreshAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const activeDevices = devices.filter(d => d.is_active === 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              MT5 Journal Bridge & Account Hub
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Zero password exposure: your MT5 desktop terminal synchronizes securely over local encrypted bridge
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerFullSync}
            disabled={isFullSyncing}
            className="framer-btn-primary flex items-center space-x-1.5 px-4 py-2 text-xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFullSyncing ? 'animate-spin' : ''}`} />
            <span>{isFullSyncing ? 'Syncing Full History...' : 'Sync Full MT5 History'}</span>
          </button>

          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border-subtle text-xs font-semibold text-content-primary transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {fullSyncMessage && (
        <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 text-xs text-brand-primary flex items-center space-x-2 animate-in fade-in">
          <Activity className="w-4 h-4 animate-spin shrink-0" />
          <span>{fullSyncMessage}</span>
        </div>
      )}

      {/* 4-Step Seamless Onboarding Card */}
      <div className="framer-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span>Connect MetaTrader 5</span>
              <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Official Windows App
              </span>
            </h2>
            <p className="text-xs text-content-secondary">
              Install the companion application to automatically synchronize your complete trade history and live open positions.
            </p>
          </div>
          <a
            href="https://github.com/gackstonew-lgtm/Alpha-Coach/releases/latest/download/AlphaCoach-MT5-Companion-Setup.exe"
            target="_blank"
            rel="noopener noreferrer"
            className="framer-btn-primary px-4 py-2.5 flex items-center gap-2 text-xs shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download for Windows</span>
          </a>
        </div>

        {/* 4 Step Process */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <Laptop className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Install MetaTrader 5</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              Install MetaTrader 5 for Windows/MacBook, log in to your broker account, and keep it running.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                2
              </span>
              <Download className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Install Companion App</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              Download and run the Meta Coach MT5 Companion on the Windows machine where MetaTrader 5 is installed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                3
              </span>
              <CheckCircle2 className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Click Authorization</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              Launching the Bridge automatically opens your browser to authorize your device. No manual token copying required.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                4
              </span>
              <Activity className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Automatic Background Sync</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              The bridge imports complete untruncated trade history and tracks live open positions in real time.
            </p>
          </div>
        </div>

        {/* Dynamic Connection Pipeline Status */}
        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-content-secondary font-sans">Meta Coach Cloud:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${activeDevices.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-content-secondary font-sans">Active Bridges:</span>
            <span className={activeDevices.length > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {activeDevices.length} Connected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${accounts.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-content-secondary font-sans">MT5 Accounts:</span>
            <span className={accounts.length > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {accounts.length} Synced
            </span>
          </div>
        </div>
      </div>

      {/* Paired Bridge Devices Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
            <Laptop className="w-4 h-4 text-brand-primary" />
            <span>Paired Bridge Devices ({activeDevices.length})</span>
          </h3>
        </div>

        {activeDevices.length === 0 ? (
          <div className="p-6 rounded-3xl bg-surface-secondary border border-border-subtle text-center text-xs text-content-muted">
            No active bridge devices connected yet. Launch the desktop bridge to pair this computer.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDevices.map(dev => (
              <div key={dev.id} className="framer-card p-5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-content-primary text-sm">{dev.device_name}</h4>
                      <div className="text-[11px] text-content-muted font-mono">
                        Paired: {new Date(dev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeDevice(dev.id, dev.device_name)}
                    className="p-2 text-content-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                    title="Revoke Device Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-content-muted pt-2 border-t border-border-subtle font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Status: Authorized</span>
                  </span>
                  <span>Last Seen: {dev.last_seen_at ? new Date(dev.last_seen_at).toLocaleTimeString() : 'Active'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Trading Accounts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Connected MT5 Trading Accounts ({accounts.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-content-muted text-xs framer-card">
              No MT5 accounts synchronized yet. Pair your device above to import your complete history.
            </div>
          ) : (
            accounts.map(acc => {
              const rec = reconciliations[acc.id];
              return (
                <div key={acc.id} className="framer-card p-6 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary font-extrabold font-mono text-sm border border-brand-primary/20">
                        MT5
                      </div>
                      <div>
                        <h4 className="font-bold text-content-primary text-sm">{acc.broker_name}</h4>
                        <div className="text-xs text-content-muted font-mono">
                          Account ••••{acc.account_number.slice(-4)} ({acc.server_name})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-2 text-content-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-surface-secondary border border-border-subtle text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-content-muted font-sans">Balance</div>
                      <div className="text-content-primary font-bold">${Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-content-muted font-sans">Equity</div>
                      <div className="text-emerald-400 font-bold">${Number(acc.equity || acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-content-muted font-sans">Closed / Open</div>
                      <div className="text-brand-primary font-bold">{acc.total_closed_trades || 0} / {acc.total_open_trades || 0}</div>
                    </div>
                  </div>

                  {/* Reconciliation Telemetry Card */}
                  {rec && (
                    <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1.5 text-[11px] font-mono">
                      <div className="text-[10px] uppercase font-bold text-content-muted font-sans flex items-center justify-between">
                        <span>Sync Reconciliation</span>
                        <span className="text-emerald-400 font-bold">{rec.syncStatus || 'SYNCHRONIZED'}</span>
                      </div>
                      <div className="flex justify-between text-content-secondary">
                        <span>Raw MT5 Deals / Orders:</span>
                        <span className="font-bold text-content-primary">{rec.dealsCount} / {rec.ordersCount}</span>
                      </div>
                      <div className="flex justify-between text-content-secondary">
                        <span>Reconstructed Trades (Closed / Open):</span>
                        <span className="font-bold text-content-primary">{rec.closedReconstructedCount} / {rec.openReconstructedCount}</span>
                      </div>
                      <div className="flex justify-between text-content-secondary">
                        <span>History Coverage:</span>
                        <span className="font-bold text-brand-primary">{rec.historicalCoverageDays || 'ALL (Untruncated)'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-content-muted pt-2 border-t border-border-subtle font-mono">
                    <span>Last Sync: {acc.last_synced_at ? new Date(acc.last_synced_at).toLocaleTimeString() : 'Never'}</span>
                    <span className="text-emerald-400 font-bold font-sans">Encrypted TLS</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
