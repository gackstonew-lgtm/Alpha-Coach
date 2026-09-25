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
  Radio,
  Layers,
  ShieldCheck,
  AlertCircle,
  Zap
} from 'lucide-react';

export const BridgeAccountsPage: React.FC = () => {
  const { accounts, refreshAccounts } = useAccounts();
  const [devices, setDevices] = useState<any[]>([]);
  const [newDeviceName, setNewDeviceName] = useState<string>('Local Windows Terminal');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await api.getBridgeDevices();
      setDevices(res.devices || []);
    } catch {
      // ignore
    }
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

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account and purge its local trade history?')) return;
    try {
      await api.deleteAccount(id);
      await refreshAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
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

      {/* Security Architecture Principle Card */}
      <div className="p-5 rounded-3xl bg-surface-secondary border border-border-subtle space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Password Security Architecture</span>
        </div>
        <p className="text-content-secondary">
          Alpha Coach <strong>never asks for, receives, or stores your broker login password</strong>. The Local MT5 Bridge runs securely on your machine, queries your running MT5 desktop terminal via the official MetaTrader API, and transmits only read-only trading orders and deal histories.
        </p>
      </div>

      {/* Bridge Pairing Token Generator */}
      <div className="framer-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
            <Key className="w-4 h-4" />
            <span>Generate Bridge Device Pairing Token</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newDeviceName}
            onChange={e => setNewDeviceName(e.target.value)}
            placeholder="Device Name (e.g. My Windows PC)"
            className="bg-surface-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-content-primary flex-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <button
            onClick={handlePairDevice}
            className="framer-btn-primary px-5 py-2.5 shrink-0"
          >
            Generate Pairing Token
          </button>
        </div>

        {generatedToken && (
          <div className="p-4 rounded-2xl bg-surface-secondary border border-emerald-500/30 space-y-2 animate-in fade-in">
            <div className="text-[11px] font-bold text-emerald-400">Copy this token into your MT5 Bridge Terminal:</div>
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
                    className="p-2 text-content-muted hover:text-trade-loss hover:bg-trade-loss/10 rounded-xl transition"
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
    </div>
  );
};
