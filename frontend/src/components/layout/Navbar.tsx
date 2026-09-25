import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Bell,
  Sun,
  Moon,
  Flame,
  ChevronDown,
  RefreshCw,
  LogOut,
  Layers,
  Radio,
  Menu,
  Check
} from 'lucide-react';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, refreshAccounts } = useAccounts();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [progression, setProgression] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadProgression();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const loadProgression = async () => {
    try {
      const res = await api.getGamificationProfile();
      setProgression(res.profile || res.progression);
    } catch {
      // ignore
    }
  };

  const handleQuickSync = async () => {
    try {
      setIsSyncing(true);
      await refreshAccounts();
      await loadNotifications();
      await loadProgression();
      setTimeout(() => setIsSyncing(false), 800);
    } catch {
      setIsSyncing(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 framer-glass border-b border-border-subtle px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Account Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Account Selector Pill */}
          <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 py-1.5 shadow-sm">
            <Layers className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <span className="text-xs font-medium text-content-muted hidden sm:inline">Account:</span>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-content-primary focus:outline-none cursor-pointer pr-2 max-w-[150px] sm:max-w-none truncate"
            >
              <option value="ALL" className="bg-surface text-content-primary">All Accounts (Consolidated)</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-surface text-content-primary">
                  {acc.broker_name} ••••{acc.account_number.slice(-4)} (${acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* MT5 Bridge Status Indicator */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span>Bridge Live</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Gamification Streak & Level Badge */}
          {progression && (
            <div className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{progression.currentStreakDays || progression.current_streak_days || 8}d Streak</span>
              <span className="text-content-subtle">•</span>
              <span className="text-brand-600 dark:text-brand-400 font-mono">Lv.{progression.currentLevel || progression.current_level || 4}</span>
            </div>
          )}

          {/* Quick Sync Button */}
          <button
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Synchronize MetaTrader 5 deals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Theme Toggle Button with Accessible Label */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary border border-border-subtle transition-all duration-200"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-brand-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary border border-border-subtle relative transition-all duration-200"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface border border-border-strong rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <span className="text-xs font-bold uppercase tracking-wider text-content-muted">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border-subtle my-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-content-muted">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`py-2.5 text-xs ${n.is_read ? 'opacity-60' : 'font-medium'}`}>
                        <div className="flex items-center justify-between text-content-primary">
                          <span className="font-semibold">{n.title}</span>
                          <span className="text-[10px] text-content-muted font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-content-muted text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-surface-secondary border border-border-subtle transition-all duration-200"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user?.first_name ? user.first_name[0] : 'T'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border-strong rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-border-subtle">
                  <div className="font-bold text-content-primary">{user?.first_name} {user?.last_name}</div>
                  <div className="text-[11px] text-content-muted truncate">{user?.email}</div>
                  <div className="mt-1 inline-block px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded text-[10px] font-bold border border-brand-500/20">
                    {user?.subscription_tier || 'PRO'} PLAN
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
