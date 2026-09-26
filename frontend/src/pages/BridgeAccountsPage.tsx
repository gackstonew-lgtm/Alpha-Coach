import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Cpu,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Layers,
  ShieldCheck,
  Download,
  Laptop,
  CheckCircle2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export const BridgeAccountsPage: React.FC = () => {
  const { accounts, refreshAccounts } = useAccounts();
  const [devices, setDevices] = useState<any[]>([]);
  const [newDeviceName, setNewDeviceName] = useState<string>('Local Windows Terminal');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showDevMode, setShowDevMode] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<any>(null);

  useEffect(() => {
    loadDevices();
    checkStatus();
  }, []);

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
    await Promise.all([loadDevices(), refreshAccounts(), checkStatus()]);
    setIsRefreshing(false);
  };

  const handlePairDevice = async () => {
    try {
      const res = await api.pairBridgeDevice(newDeviceName || 'Windows MT5 Bridge');
      setGeneratedToken(res.deviceToken);
      await loadDevices();
    } catch (err: any) {
      alert(err.message || 'Failed to generate token');
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

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        <button
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border-subtle text-xs font-semibold text-content-primary transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Zero Password Security Banner */}
      <div className="p-5 rounded-3xl bg-surface-secondary border border-border-subtle space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Password Security Architecture</span>
        </div>
        <p className="text-content-secondary">
          Alpha Coach <strong>never asks for, receives, or stores your broker login password</strong>. The Alpha Coach MT5 Bridge runs locally on your Windows PC, connects to your active desktop MT5 terminal via the official MetaTrader API, and securely transmits read-only orders and deal histories.
        </p>
      </div>

      {/* 3-Step Seamless Onboarding Card */}
      <div className="framer-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span>Connect MetaTrader 5</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Official Windows App
              </span>
            </h2>
            <p className="text-xs text-content-secondary">
              Install the companion application to automatically synchronize your trade history and open positions.
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

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <Laptop className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Install Companion App</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              Download and run <strong>Alpha Coach MT5 Companion</strong> on the Windows machine where MetaTrader 5 is installed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                2
              </span>
              <CheckCircle2 className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">1-Click Authorization</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              Launching the Bridge automatically opens your browser to authorize your device. No manual token copying required.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-[11px]">
                3
              </span>
              <Activity className="w-4 h-4 text-content-muted" />
            </div>
            <h3 className="font-bold text-content-primary">Automatic Background Sync</h3>
            <p className="text-content-secondary text-[11px] leading-relaxed">
              The bridge imports your last 90 days of trade history and runs quietly in the system tray to keep your journal updated.
            </p>
          </div>
        </div>

        {/* Dynamic Connection Pipeline Status */}
        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-content-secondary font-sans">Alpha Coach Cloud:</span>
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
              No MT5 accounts synchronized yet. Pair your device above to import your 3-month history.
            </div>
          ) : (
            accounts.map(acc => (
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
                    <div className="text-content-primary font-bold">${acc.balance?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-content-muted font-sans">Leverage</div>
                    <div className="text-content-secondary font-bold">1:{acc.leverage}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-content-muted font-sans">Closed Trades</div>
                    <div className="text-brand-primary font-bold">{acc.total_closed_trades || 0}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-content-muted pt-2 border-t border-border-subtle font-mono">
                  <span>Last Sync: {acc.last_synced_at ? new Date(acc.last_synced_at).toLocaleTimeString() : 'Never'}</span>
                  <span className="text-emerald-400 font-bold font-sans">Encrypted TLS</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Developer & Diagnostics Collapsible Drawer */}
      <div className="framer-card p-5 space-y-4">
        <button
          onClick={() => setShowDevMode(!showDevMode)}
          className="w-full flex items-center justify-between text-xs font-bold text-content-secondary hover:text-content-primary transition"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-primary" />
            <span>Developer & Diagnostics Mode</span>
          </span>
          {showDevMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDevMode && (
          <div className="space-y-4 pt-3 border-t border-border-subtle text-xs animate-in fade-in">
            <p className="text-content-muted text-[11px]">
              Advanced pairing tools for headless server environments, CLI scripts, and developer troubleshooting.
            </p>

            <div className="space-y-2">
              <label className="block text-content-secondary font-medium">Manual Device Token Generator</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={e => setNewDeviceName(e.target.value)}
                  placeholder="Device Name (e.g. My Custom VPS)"
                  className="bg-surface-secondary border border-border-subtle rounded-xl px-4 py-2 text-xs text-content-primary flex-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <button
                  onClick={handlePairDevice}
                  className="framer-btn-primary px-4 py-2 shrink-0"
                >
                  Generate Manual Token
                </button>
              </div>
            </div>

            {generatedToken && (
              <div className="p-4 rounded-2xl bg-surface-secondary border border-emerald-500/30 space-y-2">
                <div className="text-[11px] font-bold text-emerald-400">Manual Device Pairing Token:</div>
                <div className="flex items-center space-x-2 bg-surface p-2.5 rounded-xl font-mono text-xs text-content-primary border border-border-subtle">
                  <span className="truncate flex-1 select-all">{generatedToken}</span>
                  <button
                    onClick={copyToken}
                    className="p-1.5 bg-surface-secondary hover:bg-surface text-content-primary rounded-lg border border-border-subtle transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-content-muted" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
