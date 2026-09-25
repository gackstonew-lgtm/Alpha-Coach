import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Bell,
  Sun,
  Moon,
  Zap,
  Flame,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  LogOut,
  Layers,
  Radio,
  Menu
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
      setProgression(res.progression);
    } catch {
      // ignore
    }
  };

  const handleQuickSync = async () => {
    try {
      setIsSyncing(true);
      // Trigger bridge refresh check
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
    <header className="sticky top-0 z-40 bg-[#0a0d14]/90 dark:bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Account Selector */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Account Switcher */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Account:</span>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Accounts (Consolidated)</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.broker_name} ••••{acc.account_number.slice(-4)} (${acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* MT5 Bridge Live Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Bridge Active</span>
          </div>
        </div>

        {/* Right: Gamification XP & Streak, Sync Button, Theme, Notifications, Profile */}
        <div className="flex items-center space-x-3">
          {/* Gamification Streak & Level Badge */}
          {progression && (
            <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold text-amber-400">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
              <span>{progression.current_streak_days}d Streak</span>
              <span className="text-slate-600 dark:text-slate-500">•</span>
              <span className="text-blue-400 font-mono">Lv.{progression.current_level}</span>
            </div>
          )}

          {/* Quick Sync Button */}
          <button
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900 animate-ping" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50 my-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`py-2.5 text-xs ${n.is_read ? 'opacity-60' : 'font-medium'}`}>
                        <div className="flex items-center justify-between text-slate-200">
                          <span className="font-semibold">{n.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
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
              className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                {user?.first_name ? user.first_name[0] : 'T'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="font-bold text-white">{user?.first_name} {user?.last_name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
                    {user?.subscription_tier || 'PRO'} PLAN
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-2 flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition text-left"
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
