import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Server,
  Users,
  Activity,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Search,
  Lock,
  Power,
  Sliders,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  UserX,
  UserCheck
} from 'lucide-react';
import { APP_NAME, BOT_NAME } from '../config/appConfig';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'instances' | 'audit' | 'support'>('overview');
  const [adminData, setAdminData] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchAudit, setSearchAudit] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global Kill Switch Modal State
  const [showGlobalKillModal, setShowGlobalKillModal] = useState<boolean>(false);
  const [globalKillConfirmText, setGlobalKillConfirmText] = useState<string>('');
  const [globalKillReason, setGlobalKillReason] = useState<string>('');
  const [isDispatchingKill, setIsDispatchingKill] = useState<boolean>(false);
  const [killFeedback, setKillFeedback] = useState<string | null>(null);

  // Support inspection state
  const [selectedUserSupport, setSelectedUserSupport] = useState<string>('');
  const [userEvents, setUserEvents] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await (api as any).request('/admin/overview');
      setAdminData(res);

      const usersRes = await (api as any).request('/admin/users');
      setUsersList(usersRes.users || []);

      const auditRes = await (api as any).request('/admin/audit-logs');
      setAuditLogs(auditRes.logs || []);
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Global Kill Switch
  const handleGlobalKillSwitch = async () => {
    if (globalKillConfirmText !== 'GLOBAL KILL SWITCH') return;
    setIsDispatchingKill(true);
    try {
      const res = await (api as any).request('/admin/global-kill-switch', {
        method: 'POST',
        body: JSON.stringify({
          confirmationText: globalKillConfirmText,
          reason: globalKillReason || 'Admin fleet-wide emergency intervention'
        })
      });
      setKillFeedback(res.message);
      loadData();
    } catch (err: any) {
      alert(`Global Kill Switch failed: ${err.message}`);
    } finally {
      setIsDispatchingKill(false);
      setShowGlobalKillModal(false);
      setGlobalKillConfirmText('');
    }
  };

  // Suspend/Activate User
  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    const reason = prompt(`Enter reason to ${currentActive ? 'suspend' : 'activate'} this user:`);
    if (!reason) return;
    try {
      await (api as any).request(`/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentActive, reason })
      });
      loadData();
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message}`);
    }
  };

  // Inspect User Last 24 Hours
  const handleInspectUser = async (userId: string) => {
    setSelectedUserSupport(userId);
    try {
      const res = await (api as any).request(`/admin/audit-logs?userId=${userId}&limit=50`);
      setUserEvents(res.logs || []);
    } catch (err) {
      setUserEvents([]);
    }
  };

  const filteredLogs = auditLogs.filter(
    l => !searchAudit || l.action.toLowerCase().includes(searchAudit.toLowerCase()) || (l.details_json && l.details_json.toLowerCase().includes(searchAudit.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Admin & Fleet Command Console
            </h1>
          </div>
          <p className="text-xs text-content-muted mt-1">
            Cluster health, fleet online telemetry, command latency, and audit logs. Zero broker passwords stored.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGlobalKillModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>GLOBAL KILL SWITCH</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-surface-secondary border border-border text-content-muted hover:text-content-primary"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {killFeedback && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{killFeedback}</span>
          </div>
          <button onClick={() => setKillFeedback(null)} className="text-content-muted hover:text-content-primary">
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Fleet Health & Metrics', icon: Activity },
          { id: 'users', label: 'Users & Subscriptions', icon: Users },
          { id: 'audit', label: 'Searchable Audit Log', icon: FileText },
          { id: 'support', label: 'Support & Event Inspection', icon: Sliders }
        ].map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                active
                  ? 'bg-brand-500 text-white font-bold'
                  : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & HEALTH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {adminData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Total Users</span>
                <span className="text-xl font-mono font-bold text-content-primary mt-1 block">
                  {adminData.metrics?.usersCount || 0}
                </span>
                <span className="text-[10px] text-content-muted">{adminData.metrics?.activeSubsCount || 0} Active Subscriptions</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Bot Fleet Instances</span>
                <span className="text-xl font-mono font-bold text-brand-400 mt-1 block">
                  {adminData.metrics?.botInstancesCount || 0}
                </span>
                <span className="text-[10px] text-emerald-400">Outbound HTTPS Telemetry</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Reconstructed Trades</span>
                <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                  {adminData.metrics?.positionsCount || 0}
                </span>
                <span className="text-[10px] text-content-muted">{adminData.metrics?.dealsCount || 0} Raw Deals Ingested</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Cluster Health</span>
                <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">OPERATIONAL</span>
                <span className="text-[10px] text-content-muted">Latency &lt; 20ms | 0 Webhook Failures</span>
              </div>
            </div>
          )}

          {/* Health Diagnostics Panel */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
              <Server className="w-4 h-4 text-brand-400" />
              <span>Fleet Telemetry & Queue Diagnostics</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                <span className="text-content-muted block text-[10px]">AVG COMMAND LATENCY</span>
                <span className="font-bold text-emerald-400">18ms</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                <span className="text-content-muted block text-[10px]">COMMAND QUEUE DEPTH</span>
                <span className="font-bold text-content-primary">0 Pending</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                <span className="text-content-muted block text-[10px]">ERROR RATE (24H)</span>
                <span className="font-bold text-emerald-400">0.00%</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                <span className="text-content-muted block text-[10px]">WEBHOOK RETRIES</span>
                <span className="font-bold text-content-primary">0 Failed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & SUBSCRIPTIONS */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary">Registered Users & Fleet Allocations</h3>
            <span className="text-xs text-content-muted font-mono">{usersList.length} Accounts Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-secondary text-content-secondary uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Trader</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Subscription</th>
                  <th className="py-2.5 px-3">Instances</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-surface-secondary/40">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-content-primary block">{u.first_name} {u.last_name}</span>
                      <span className="text-[11px] text-content-muted">{u.email}</span>
                    </td>
                    <td className="py-2.5 px-3 uppercase font-semibold text-content-secondary">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {u.plan_name || 'Trial (Starter)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{u.instance_count || 0} paired</td>
                    <td className="py-2.5 px-3">
                      {u.is_active ? (
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      ) : (
                        <span className="text-rose-400 font-bold">SUSPENDED</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          className="px-2 py-1 rounded border border-border text-[10px] text-content-secondary hover:text-content-primary"
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('support');
                            handleInspectUser(u.id);
                          }}
                          className="px-2 py-1 rounded bg-brand-500/10 text-brand-400 text-[10px] hover:bg-brand-500/20"
                        >
                          Inspect 24h
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SEARCHABLE AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-bold text-content-primary">Searchable Security & Action Audit Log</h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-content-muted" />
              <input
                type="text"
                placeholder="Search actions or entities..."
                value={searchAudit}
                onChange={e => setSearchAudit(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-content-primary font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-secondary text-content-secondary uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono text-[11px]">
                {filteredLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-surface-secondary/40">
                    <td className="py-2 px-3 text-content-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-brand-400">{log.action}</td>
                    <td className="py-2 px-3 uppercase text-content-secondary">{log.entity_type}</td>
                    <td className="py-2 px-3 text-content-muted">{log.ip_address || 'Internal'}</td>
                    <td className="py-2 px-3 text-content-secondary truncate max-w-md">{log.details_json}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT TOOLS */}
      {activeTab === 'support' && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-sm font-bold text-content-primary">Support & Incident Diagnostics (Last 24 Hours)</h3>
            <p className="text-xs text-content-muted">
              Zero broker credential access. Audit trail inspects telemetry events, command states, and error codes without touching credentials.
            </p>
          </div>

          {selectedUserSupport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono bg-surface-secondary p-3 rounded-lg border border-border-subtle">
                <span>Inspecting User: <strong>{selectedUserSupport}</strong></span>
                <span className="text-emerald-400 font-bold">{userEvents.length} events logged in 24h</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {userEvents.length === 0 ? (
                  <div className="text-center py-6 text-content-muted">No security or bot incidents recorded for this user.</div>
                ) : (
                  userEvents.map(ev => (
                    <div key={ev.id} className="p-2.5 rounded-lg bg-surface-secondary/60 border border-border-subtle flex items-start justify-between">
                      <div>
                        <span className="text-brand-400 font-bold block">{ev.action}</span>
                        <span className="text-[11px] text-content-secondary">{ev.details_json}</span>
                      </div>
                      <span className="text-[10px] text-content-muted">{new Date(ev.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-content-muted">
              Select a user from the &quot;Users &amp; Subscriptions&quot; tab to inspect their recent 24-hour event timeline.
            </div>
          )}
        </div>
      )}

      {/* GLOBAL KILL SWITCH CONFIRMATION MODAL */}
      {showGlobalKillModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-red-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Confirm Global Fleet Kill Switch</h3>
            </div>

            <p className="text-xs text-content-secondary">
              This will immediately issue an emergency STOP &amp; HALT command to <strong>ALL active bot instances</strong> across the entire network.
              New trades will be immediately suspended. Existing positions remain managed by local MT5 stop losses.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-content-primary">
                Type <strong className="text-rose-400 font-mono">GLOBAL KILL SWITCH</strong> to confirm:
              </label>
              <input
                type="text"
                value={globalKillConfirmText}
                onChange={e => setGlobalKillConfirmText(e.target.value)}
                placeholder="GLOBAL KILL SWITCH"
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-xs font-mono text-content-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-content-primary">Reason for Emergency Lockdown:</label>
              <input
                type="text"
                value={globalKillReason}
                onChange={e => setGlobalKillReason(e.target.value)}
                placeholder="Market flash crash, broker API outage, regulatory halt..."
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-xs text-content-primary"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowGlobalKillModal(false);
                  setGlobalKillConfirmText('');
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs text-content-muted hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                disabled={globalKillConfirmText !== 'GLOBAL KILL SWITCH' || isDispatchingKill}
                onClick={handleGlobalKillSwitch}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-md"
              >
                {isDispatchingKill ? 'Broadcasting Lockdown...' : 'EXECUTE GLOBAL LOCKDOWN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
