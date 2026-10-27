import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { PRIMARY_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../config/navigation';
import { SUPPORTED_INSTRUMENTS } from '../../config/tradingViewSymbols';
import {
  Bell,
  Search,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen = false,
  onToggleSidebar
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Close notifications popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  // Global keyboard shortcut (Ctrl+K / Cmd+K) and Escape handler for Search & Notifications
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  // Searchable navigation pages & market symbols
  const allNavDestinations = useMemo(() => {
    return [...PRIMARY_NAV_ITEMS, ...BOTTOM_NAV_ITEMS].filter(
      (item) => !item.adminOnly || user?.role === 'admin'
    );
  }, [user?.role]);

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allNavDestinations;
    return allNavDestinations.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.to.toLowerCase().includes(q)
    );
  }, [allNavDestinations, searchQuery]);

  const filteredSymbols = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_INSTRUMENTS.slice(0, 8);
    return SUPPORTED_INSTRUMENTS.filter(
      (inst) =>
        inst.symbol.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        inst.exchange.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery]);

  const isSettingsActive = location.pathname.startsWith('/settings');

  // Shared rounded-square header control styling matching Reference Image 2
  const headerButtonClass =
    'w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-surface hover:bg-surface-secondary border border-border text-content-primary flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95';

  return (
    <>
      <header
        style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        className="sticky top-0 z-30 bg-background border-b border-border px-3 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150"
      >
        <div className="flex items-center justify-between gap-3 w-full">
          {/* LEFT SIDE: 1. Menu Button & 2. Search Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 1. Menu Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
              title="Toggle navigation menu"
              className={`${headerButtonClass} ${
                isSidebarOpen ? 'border-primary text-primary bg-accent-subtle' : ''
              }`}
            >
              <Menu className="w-5 h-5 stroke-[1.85]" />
            </button>

            {/* 2. Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open global search"
              aria-expanded={isSearchOpen}
              title="Search pages and market symbols (Ctrl+K)"
              className={`${headerButtonClass} ${
                isSearchOpen ? 'border-primary text-primary bg-accent-subtle' : ''
              }`}
            >
              <Search className="w-5 h-5 stroke-[1.85]" />
            </button>
          </div>

          {/* RIGHT SIDE: 3. Notifications, 4. Theme Toggle & 5. Settings */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 3. Notifications Button */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Open notifications"
                aria-expanded={showNotifications}
                title="Notifications"
                className={`${headerButtonClass} relative ${
                  showNotifications ? 'border-primary text-primary bg-accent-subtle' : ''
                }`}
              >
                <Bell className="w-5 h-5 stroke-[1.85]" />
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread notifications`}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-surface"
                  />
                )}
              </button>

              {/* Notification Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-popover border border-border text-popover-foreground rounded-2xl shadow-pop z-50 p-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h4 className="text-xs font-bold text-content-primary">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-border py-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-content-secondary">
                        No new notifications. MT5 sync active.
                      </div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="py-2.5 text-xs space-y-0.5">
                          <div className="font-semibold text-content-primary">{n.title}</div>
                          <div className="text-[11px] text-content-secondary">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={headerButtonClass}
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 stroke-[1.85] text-content-primary" />
              ) : (
                <Moon className="w-5 h-5 stroke-[1.85] text-content-primary" />
              )}
            </button>

            {/* 5. Settings Button */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              aria-label="Open settings"
              aria-current={isSettingsActive ? 'page' : undefined}
              title="Settings"
              className={`${headerButtonClass} ${
                isSettingsActive ? 'border-primary text-primary bg-accent-subtle' : ''
              }`}
            >
              <Settings className="w-5 h-5 stroke-[1.85]" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Modal (Pages & Live Chart Symbols) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-16 sm:pt-24 px-3"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global Search"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-popover border border-border rounded-2xl shadow-pop overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border bg-surface">
              <Search className="w-4 h-4 text-content-secondary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, tools, or symbols (e.g. XAUUSD, EURUSD, Coach)..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-content-primary placeholder:text-content-secondary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results Body */}
            <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
              {/* Navigation Destinations */}
              {filteredPages.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-content-secondary font-bold">
                    Application Pages
                  </div>
                  <div className="space-y-0.5">
                    {filteredPages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate(page.to);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-content-primary hover:bg-surface-secondary transition"
                        >
                          <span className="flex items-center gap-2.5 font-medium">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <span>{page.name}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-content-secondary" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Market Symbols (Jump to Live Chart) */}
              {filteredSymbols.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-content-secondary font-bold">
                    Live Chart Instruments
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {filteredSymbols.map((inst) => (
                      <button
                        key={inst.symbol}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/charts?symbol=${encodeURIComponent(inst.symbol)}`);
                        }}
                        className="flex items-center justify-between px-2.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-left transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-xs font-bold font-mono text-content-primary">
                              {inst.symbol}
                            </span>
                          </div>
                          <div className="text-[10px] text-content-secondary truncate">
                            {inst.name}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-secondary text-content-secondary border border-border shrink-0">
                          {inst.exchange}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPages.length === 0 && filteredSymbols.length === 0 && (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No matching pages or instruments found for &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
