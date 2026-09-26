import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems: NavItem[] = [
    { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { id: 'journal', name: 'Trading Journal', to: '/journal', icon: BookOpen },
    { id: 'performance', name: 'Performance', to: '/performance', icon: LineChart },
    { id: 'strategy-lab', name: 'Strategy Lab', to: '/strategy-lab', icon: FlaskConical },
    { id: 'risk-guardian', name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert },
    { id: 'ai-coach', name: 'AI Coach', to: '/ai-coach', icon: Bot },
    { id: 'gamification', name: 'Gamification', to: '/gamification', icon: Trophy },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border-subtle flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Official Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2 group">
            <AlphaCoachLogo size="sm" showWordmark={true} />
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items - Continuous Clean List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to === '/performance' && location.pathname === '/analytics');

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
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
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Meta */}
        <div className="p-3.5 border-t border-border-subtle bg-surface-secondary/40 text-[11px] text-content-muted flex items-center justify-between">
          <span className="font-medium">Alpha Coach v1.0</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            MT5 Ready
          </span>
        </div>
      </aside>
    </>
  );
};
