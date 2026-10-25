import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  ShieldAlert,
  Bot,
  Trophy,
  Cpu,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  TrendingUp,
  Scan,
  Calendar,
  Scale,
  FileText,
  ChevronRight,
  Globe,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ArcadeFxLogo } from '../common/AlphaCoachLogo';

interface NavItem {
  id: string;
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const auth = useAuth() as ReturnType<typeof useAuth> & {
    logout?: () => unknown;
    signOut?: () => unknown;
  };
  const { user } = auth;
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop Hover-Intent & Focus State
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = isHovered || isFocusedWithin;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // 120ms hover-intent delay to prevent accidental flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleLogout = async () => {
    onClose();
    try {
      const fn = auth.logout ?? auth.signOut;
      if (fn) await fn();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Sections with Analysis Hub and Strategy Lab removed
  const navSections: NavSection[] = [
    {
      title: 'Platform',
      items: [
        { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { id: 'journal', name: 'Trading Journal', to: '/journal', icon: BookOpen },
        { id: 'performance', name: 'Performance', to: '/performance', icon: LineChart },
        { id: 'ai-coach', name: 'AI Coach', to: '/ai-coach', icon: Bot }
      ]
    },
    {
      title: 'Market Intelligence',
      items: [
        { id: 'charts', name: 'Interactive Charts', to: '/charts', icon: TrendingUp },
        { id: 'scanner', name: 'Market Scanner', to: '/scanner', icon: Scan },
        { id: 'macro-calendar', name: 'Macro & Calendar', to: '/macro-calendar', icon: Calendar },
        { id: 'currency-strength', name: 'Currency Strength', to: '/currency-strength', icon: Scale },
        { id: 'sec-tracker', name: 'SEC & Politician Tracker', to: '/sec-tracker', icon: FileText }
      ]
    },
    {
      title: 'Risk & Execution',
      items: [
        { id: 'risk-guardian', name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert }
      ]
    },
    {
      title: 'System & Terminal',
      items: [
        { id: 'rewards', name: 'Rewards', to: '/rewards', icon: Trophy },
        { id: 'bridge', name: 'Bridge', to: '/bridge', icon: Cpu },
        { id: 'settings', name: 'Settings', to: '/settings', icon: Settings },
        ...(user?.role === 'admin'
          ? [{ id: 'admin', name: 'Admin', to: '/admin', icon: ShieldCheck }]
          : [])
      ]
    }
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE SLIDE-OUT DRAWER (HOSTINGER WHITE/DARK SHEET PATTERN)         */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        role="dialog"
        aria-label="Navigation Menu"
        aria-modal={isOpen}
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[320px] bg-surface border-r border-border-subtle flex flex-col transition-transform duration-300 ease-out lg:hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header: Logo + Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface">
          <NavLink to="/dashboard" onClick={onClose} className="focus:outline-none">
            <ArcadeFxLogo size="sm" showWordmark={true} />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav Items with Hostinger Chevron Rows */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-content-muted">
                  {section.title}
                </div>
              )}
              <div className="divide-y divide-border-subtle/50">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.to ||
                    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm font-medium transition ${
                        active
                          ? 'bg-brand-500/10 text-brand-500 font-semibold'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`p-1.5 rounded-lg ${
                            active
                              ? 'bg-brand-500 text-white'
                              : 'bg-surface-secondary text-content-muted'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-content-muted/60" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer: Language + Account / Logout */}
        <div className="p-4 border-t border-border-subtle bg-surface-secondary/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-content-muted px-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-brand-500">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{user?.email?.split('@')[0] || 'Trader'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP SUPABASE-STYLE HOVER-EXPAND SIDEBAR (OVERLAY WITHOUT REFLOW)  */}
      {/* ========================================================================= */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsFocusedWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocusedWithin(false);
          }
        }}
        aria-label="Desktop Navigation"
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-50 flex-col bg-surface border-r border-border-subtle select-none transition-[width,box-shadow] duration-200 ease-out ${
          isExpanded
            ? 'w-64 shadow-2xl shadow-black/40'
            : 'w-[68px] shadow-sm'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-border-subtle overflow-hidden">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
            aria-label="Arcade Fx Dashboard"
          >
            {isExpanded ? (
              <ArcadeFxLogo size="sm" showWordmark={true} className="transition-opacity duration-200" />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center">
                <ArcadeFxLogo size="sm" showWordmark={false} variant="badge" />
              </div>
            )}
          </NavLink>
        </div>

        {/* Nav Sections Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div
                  className={`text-[10px] font-bold tracking-wider uppercase text-content-muted px-2.5 pt-1 transition-all duration-150 ${
                    isExpanded
                      ? 'opacity-100 max-h-6'
                      : 'opacity-0 max-h-0 pointer-events-none'
                  }`}
                >
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    title={!isExpanded ? item.name : undefined}
                    aria-label={item.name}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-3.5 h-10 px-2.5 rounded-xl text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      active
                        ? 'bg-brand-500/10 text-brand-500 font-semibold'
                        : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {/* Active vertical indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r" />
                    )}

                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
                        active ? 'text-brand-500 scale-105' : 'text-content-muted'
                      }`}
                    />

                    {/* Label with slide + fade stagger */}
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-150 ${
                        isExpanded
                          ? 'opacity-100 max-w-[170px] translate-x-0'
                          : 'opacity-0 max-w-0 -translate-x-1 pointer-events-none'
                      }`}
                    >
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer: Settings */}
        <div className="p-2.5 border-t border-border-subtle bg-surface-secondary/30">
          <div className="flex items-center justify-between overflow-hidden">
            <NavLink
              to="/settings"
              title="Settings"
              aria-label="Settings"
              className="flex items-center gap-3 h-10 px-2.5 rounded-xl text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition w-full"
            >
              <Settings className="w-5 h-5 shrink-0 text-content-muted" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-150 ${
                  isExpanded
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-1 pointer-events-none'
                }`}
              >
                Settings
              </span>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
