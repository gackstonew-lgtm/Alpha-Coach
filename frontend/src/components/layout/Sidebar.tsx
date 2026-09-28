import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  FlaskConical,
  ShieldAlert,
  Bot,
  Trophy,
  Cpu,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AlphaCoachLogo } from '../common/AlphaCoachLogo';

interface NavItem {
  id: string;
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Desktop only (lg+): shrink the sidebar to an icon rail */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse
}) => {
  // Cast keeps the build safe whether your AuthContext names it `logout` or `signOut`
  const auth = useAuth() as ReturnType<typeof useAuth> & {
    logout?: () => unknown;
    signOut?: () => unknown;
  };
  const { user } = auth;
  const location = useLocation();
  const navigate = useNavigate();

  // Text/labels hide only on desktop when collapsed. The mobile drawer is always full width.
  const hideWhenCollapsed = collapsed ? 'lg:hidden' : '';

  const handleLogout = async () => {
    onClose();
    try {
      const fn = auth.logout ?? auth.signOut;
      if (fn) await fn();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const navigationItems: NavItem[] = [
    { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { id: 'journal', name: 'Trading Journal', to: '/journal', icon: BookOpen },
    { id: 'performance', name: 'Performance', to: '/performance', icon: LineChart },
    { id: 'strategy-lab', name: 'Strategy Lab', to: '/strategy-lab', icon: FlaskConical },
    { id: 'risk-guardian', name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert },
    { id: 'ai-coach', name: 'AI Coach', to: '/ai-coach', icon: Bot },
    { id: 'rewards', name: 'Rewards', to: '/rewards', icon: Trophy },
    { id: 'bridge', name: 'Bridge', to: '/bridge', icon: Cpu },
    { id: 'settings', name: 'Settings', to: '/settings', icon: Settings },
    ...(user?.role === 'admin'
      ? [{ id: 'admin', name: 'Admin', to: '/admin', icon: ShieldCheck }]
      : [])
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } bg-surface border-r border-border-subtle flex flex-col transition-[transform,width] duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Desktop collapse / expand button, sits on the sidebar's right edge */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex absolute -right-3 top-[68px] z-10 w-6 h-6 items-center justify-center rounded-full bg-surface border border-border-subtle text-content-muted hover:text-content-primary hover:bg-surface-secondary shadow-md transition"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {/* Brand Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-border-subtle ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2 group">
            <span className={hideWhenCollapsed}>
              <AlphaCoachLogo size="sm" showWordmark={true} />
            </span>
            {collapsed && (
              <span className="hidden lg:block">
                <AlphaCoachLogo size="sm" showWordmark={false} />
              </span>
            )}
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === '/performance' && location.pathname === '/analytics');

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-white scale-105' : 'text-content-muted group-hover:text-brand-500'
                  }`}
                />
                <span className={`truncate ${hideWhenCollapsed}`}>{item.name}</span>
                {isActive && (
                  <span
                    className={`ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse ${hideWhenCollapsed}`}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout, pinned below the navigation list */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-content-secondary hover:text-red-500 hover:bg-red-500/10 transition-all ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={hideWhenCollapsed}>Log out</span>
          </button>
        </div>

        {/* Footer Meta */}
        <div
          className={`p-3.5 border-t border-border-subtle bg-surface-secondary/40 text-[11px] text-content-muted flex items-center justify-between ${hideWhenCollapsed}`}
        >
          <span className="font-medium">Meta Coach v1.0</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            MT5 Ready
          </span>
        </div>
      </aside>
    </>
  );
};
