import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  LineChart,
  FlaskConical,
  Clock,
  Coins,
  Dna,
  ShieldAlert,
  PlayCircle,
  Trophy,
  Bot,
  FileSpreadsheet,
  Cpu,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AlphaCoachLogo } from '../common/AlphaCoachLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const primaryNavigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Trading Journal', to: '/journal', icon: BookOpen },
    { name: 'Trading Calendar', to: '/calendar', icon: Calendar },
    { name: 'Analytics Engine', to: '/analytics', icon: LineChart },
    { name: 'Strategy Lab', to: '/strategy-lab', icon: FlaskConical },
    { name: 'Session Intelligence', to: '/sessions', icon: Clock },
    { name: 'Symbol Intelligence', to: '/symbols', icon: Coins },
    { name: 'Trader DNA', to: '/trader-dna', icon: Dna },
    { name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert },
    { name: 'Replay Studio', to: '/replay', icon: PlayCircle },
    { name: 'Gamification & XP', to: '/gamification', icon: Trophy },
    { name: 'AI Trading Coach', to: '/ai-coach', icon: Bot },
    { name: 'Reports & Export', to: '/reports', icon: FileSpreadsheet },
    { name: 'MT5 Bridge & Accounts', to: '/bridge', icon: Cpu },
  ];

  if (user?.role === 'admin') {
    primaryNavigation.push({ name: 'Admin Operations', to: '/admin', icon: ShieldCheck });
  }

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

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-content-subtle uppercase">
            Performance OS
          </div>

          {primaryNavigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-content-muted group-hover:text-brand-500'}`} />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="pt-3 px-3 py-1.5 text-[10px] font-bold tracking-wider text-content-subtle uppercase">
            System
          </div>
          <NavLink
            to="/settings"
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-content-muted group-hover:text-brand-500'}`} />
                <span>Settings & Preferences</span>
              </>
            )}
          </NavLink>
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
