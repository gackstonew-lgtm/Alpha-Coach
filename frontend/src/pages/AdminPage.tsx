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
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>System Administration & Sync Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cluster health, MT5 bridge checkpoints, sync audit logs & system throughput
        </p>
      </div>

      {/* Metrics Grid */}
      {adminData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold">Registered Users</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {adminData.metrics.usersCount}
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold">MT5 Trading Accounts</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {adminData.metrics.accountsCount}
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold">Paired Bridge Devices</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              {adminData.metrics.devicesCount}
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold">Reconstructed Positions</div>
            <div className="text-2xl font-extrabold text-blue-400 font-mono mt-1">
              {adminData.metrics.positionsCount}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sync Logs */}
      {adminData && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Recent Synchronization Checkpoints</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Account</th>
                  <th className="p-3">Broker / Server</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Deals Ingested</th>
                  <th className="p-3">Trades Reconstructed</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {adminData.recentSyncs?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">••••{s.account_number?.slice(-4)}</td>
                    <td className="p-3 text-slate-400 font-sans">{s.broker_name} ({s.server_name})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        {s.sync_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{s.deals_count} deals</td>
                    <td className="p-3 text-blue-400 font-bold">{s.trades_count} trades</td>
                    <td className="p-3 text-slate-500">{new Date(s.started_at).toLocaleTimeString()}</td>
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
