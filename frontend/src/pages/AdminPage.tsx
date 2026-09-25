import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Server,
  Users,
  Layers,
  Activity,
  Cpu,
  RefreshCw
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [adminData, setAdminData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAdminOverview();
      setAdminData(res);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            System Administration & Sync Diagnostics
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Cluster health, MT5 bridge checkpoints, sync audit logs & system throughput
        </p>
      </div>

      {/* Metrics Grid */}
      {adminData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="framer-card p-5">
            <div className="text-xs text-content-muted font-semibold">Registered Users</div>
            <div className="text-2xl font-extrabold text-content-primary font-mono mt-1">
              {adminData.metrics.usersCount}
            </div>
          </div>
          <div className="framer-card p-5">
            <div className="text-xs text-content-muted font-semibold">MT5 Trading Accounts</div>
            <div className="text-2xl font-extrabold text-content-primary font-mono mt-1">
              {adminData.metrics.accountsCount}
            </div>
          </div>
          <div className="framer-card p-5">
            <div className="text-xs text-content-muted font-semibold">Paired Bridge Devices</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              {adminData.metrics.devicesCount}
            </div>
          </div>
          <div className="framer-card p-5">
            <div className="text-xs text-content-muted font-semibold">Reconstructed Positions</div>
            <div className="text-2xl font-extrabold text-brand-primary font-mono mt-1">
              {adminData.metrics.positionsCount}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sync Logs */}
      {adminData && (
        <div className="framer-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
            <Activity className="w-4 h-4 text-brand-primary" />
            <span>Recent Synchronization Checkpoints</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/70 text-content-muted font-semibold border-b border-border-subtle uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Account</th>
                  <th className="p-3">Broker / Server</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Deals Ingested</th>
                  <th className="p-3">Trades Reconstructed</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {adminData.recentSyncs?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface-secondary/50 transition">
                    <td className="p-3 font-bold text-content-primary">••••{s.account_number?.slice(-4)}</td>
                    <td className="p-3 text-content-secondary font-sans">{s.broker_name} ({s.server_name})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.sync_status}
                      </span>
                    </td>
                    <td className="p-3 text-content-secondary">{s.deals_count} deals</td>
                    <td className="p-3 text-brand-primary font-bold">{s.trades_count} trades</td>
                    <td className="p-3 text-content-muted">{new Date(s.started_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
