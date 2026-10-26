import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Bell,
  Mail,
  Search,
  ChevronDown,
  RefreshCw,
  LogOut,
  Layers,
  Radio,
  Check,
  Settings,
  Sun,
  Moon,
  User,
  Shield,
  Menu
} from 'lucide-react';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, refreshAccounts } = useAccounts();
  const { settings, privacyMode } = useSettings();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
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

  const handleQuickSync = async () => {
    try {
      setIsSyncing(true);
      await refreshAccounts();
      await loadNotifications();
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

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.email?.split('@')[0] || 'Trader');

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 border-b border-border transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
        {/* Left: Mobile Menu Trigger + Search Input (Reference B) */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {/* Mobile hamburger menu */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Reference B Search Pill */}
          <div className="relative w-full max-w-[340px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              readOnly
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true });
                window.dispatchEvent(event);
              }}
              placeholder="Press 'K' to search symbols and pages"
              className="w-full bg-surface border border-border text-foreground hover:bg-surface-elevated rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs transition"
            />
          </div>

          {/* Account Selector Pill */}
          {accounts.length > 0 && (
            <div className="hidden xl:flex items-center gap-2 bg-surface border border-border text-foreground hover:bg-surface-elevated rounded-xl px-3 py-1.5 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL" className="bg-surface text-foreground">All MT5 Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-surface text-foreground">
                    {acc.broker_name || 'MT5'} ••••{acc.account_number.slice(-4)} ({privacyMode ? '••••' : `$${Number(acc.balance).toLocaleString()}`})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Actions, Badges & User Profile (Reference B) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick MT5 Sync Button */}
          <button
            type="button"
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated text-muted-foreground hover:text-slate-900 dark:hover:text-white shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Synchronize MT5 deals"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Theme Toggle (Light/Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated text-muted-foreground hover:text-slate-900 dark:hover:text-white shadow-xs transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mail / Inbox Icon with Dot (Reference B) */}
          <button
            type="button"
            onClick={() => alert('Arcade Fx Market Reports & Announcements Inbox is up to date.')}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated text-muted-foreground hover:text-slate-900 dark:hover:text-white shadow-xs transition relative"
            aria-label="Open messages"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Notification Bell with Red Dot Badge (Reference B: #E13A41) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated text-muted-foreground hover:text-slate-900 dark:hover:text-white shadow-xs transition relative"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E13A41] ring-2 ring-white dark:ring-[#19191C] animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface border border-border text-foreground hover:bg-surface-elevated rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No new notifications. MT5 sync active.
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={idx} className="py-2.5 text-xs space-y-0.5">
                        <div className="font-semibold text-foreground">{n.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Name (Reference B: circular avatar + name + chevron) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-[#121212] dark:bg-[#2C2C32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline-block text-xs font-bold text-foreground max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-surface border border-border text-foreground hover:bg-surface-elevated rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-foreground truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                </div>

                <div className="py-1">
                  <NavLink
                    to="/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings & Security</span>
                  </NavLink>
                  <NavLink
                    to="/bridge"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Radio className="w-4 h-4 text-slate-400" />
                    <span>MT5 Companion Bridge</span>
                  </NavLink>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserDropdown(false);
                      if (logout) await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
