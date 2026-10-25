import React, { useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { ArcadeFxLogo } from '../common/AlphaCoachLogo';

interface NavItem {
  id: string;
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
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
  const { accounts, selectedAccount } = useAccounts();
  const location = useLocation();
  const navigate = useNavigate();

  // Expandable Market Intelligence sub-group (matching "Stock & fund" in Reference B)
  const isMarketIntelActive = ['/charts', '/scanner', '/macro-calendar', '/currency-strength', '/sec-tracker'].some(
    p => location.pathname.startsWith(p)
  );
  const [isIntelOpen, setIsIntelOpen] = useState<boolean>(true);

  // Derive Total Investment / Equity data from real connected accounts
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const totalEquity = accounts.reduce((sum, acc) => sum + (Number(acc.equity ?? acc.balance) || 0), 0);
  const hasAccounts = accounts.length > 0;
  const displayEquity = hasAccounts
    ? `$${(totalEquity || totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$5,380.90';

  const handleLogout = async () => {
    onClose();
    try {
      const fn = auth.logout ?? auth.signOut;
      if (fn) await fn();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Primary platform nav items (Reference B)
  const primaryNavItems: NavItem[] = [
    { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { id: 'journal', name: 'Trading Journal', to: '/journal', icon: BookOpen },
    { id: 'performance', name: 'Performance', to: '/performance', icon: LineChart },
    { id: 'ai-coach', name: 'AI Coach', to: '/ai-coach', icon: Bot },
    { id: 'risk-guardian', name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert }
  ];

  // Market Intelligence sub-items
  const intelSubItems: NavItem[] = [
    { id: 'charts', name: 'Interactive Charts', to: '/charts', icon: TrendingUp },
    { id: 'scanner', name: 'Market Scanner', to: '/scanner', icon: Scan },
    { id: 'macro-calendar', name: 'Macro & Calendar', to: '/macro-calendar', icon: Calendar },
    { id: 'currency-strength', name: 'Currency Strength', to: '/currency-strength', icon: Scale },
    { id: 'sec-tracker', name: 'SEC & Politician Tracker', to: '/sec-tracker', icon: FileText }
  ];

  // Bottom utility items (Reference B)
  const bottomNavItems: NavItem[] = [
    { id: 'rewards', name: 'Our Community', to: '/rewards', icon: Trophy },
    { id: 'bridge', name: 'MT5 Bridge', to: '/bridge', icon: Cpu },
    { id: 'settings', name: 'Settings', to: '/settings', icon: Settings, badge: '!' },
    ...(user?.role === 'admin'
      ? [{ id: 'admin', name: 'Admin Terminal', to: '/admin', icon: ShieldCheck }]
      : [])
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#19191C] text-slate-800 dark:text-slate-200">
      {/* 1. Header with Logo (Reference B) */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <NavLink to="/dashboard" onClick={onClose} className="focus:outline-none">
          <div className="bg-[#0A0F1D] px-3 py-1.5 rounded-xl border border-white/10 shadow-sm flex items-center gap-2">
            <ArcadeFxLogo size="sm" showWordmark={true} />
          </div>
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Total Investment Card (Reference B: Charcoal black card directly below logo) */}
      <div className="px-4 py-2">
        <div className="bg-[#191919] dark:bg-[#111113] rounded-xl p-3.5 text-white shadow-md relative overflow-hidden border border-white/5">
          {/* Subtle decorative contour waves */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full border border-white/10 pointer-events-none opacity-40" />
          <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-white/5 pointer-events-none opacity-20" />

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Investment
            </span>
            {/* Green Positive Change Chip (Reference B) */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1B3B2B] text-[#22A06B] border border-[#22A06B]/30">
              <span>+18.30%</span>
              <span>↑</span>
            </span>
          </div>

          <div className="text-xl font-bold tracking-tight text-white tabular-nums font-mono">
            {displayEquity}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
            <span>{hasAccounts ? `${accounts.length} Active MT5 Account(s)` : 'Demo Portfolio (Live MT5 Ready)'}</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation List (Reference B: Rounded Active Pill #F6F7FB) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs font-medium no-scrollbar">
        {/* Primary Items */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;

          return (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                active
                  ? 'bg-[#F6F7FB] dark:bg-[#25252B] text-[#121212] dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#3FAE96] dark:text-[#48B89F]' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Expandable "Market Intelligence" Group (Matching "Stock & fund" in Reference B) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsIntelOpen(!isIntelOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
              isMarketIntelActive
                ? 'text-[#121212] dark:text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className={`w-4 h-4 shrink-0 ${isMarketIntelActive ? 'text-[#3FAE96] dark:text-[#48B89F]' : 'text-slate-400'}`} />
              <span>Market Intelligence</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isIntelOpen ? 'rotate-180' : ''}`} />
          </button>

          {isIntelOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1">
              {intelSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = location.pathname === sub.to;

                return (
                  <NavLink
                    key={sub.id}
                    to={sub.to}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-all duration-150 ${
                      subActive
                        ? 'bg-[#F6F7FB] dark:bg-[#25252B] text-[#3FAE96] dark:text-[#48B89F] font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{sub.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider (Reference B) */}
        <div className="my-3 border-t border-[#EBECEF] dark:border-[#2C2C32]" />

        {/* Bottom Utility Items */}
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;

          return (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                active
                  ? 'bg-[#F6F7FB] dark:bg-[#25252B] text-[#121212] dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#3FAE96] dark:text-[#48B89F]' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {/* Red Notification Badge Dot (Reference B) */}
              {item.badge && (
                <span className="w-2 h-2 rounded-full bg-[#E13A41]" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* 4. Bottom Sign Out Row */}
      <div className="p-3 border-t border-[#EBECEF] dark:border-[#2C2C32]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Static Desktop Sidebar (Reference B: 220px white sidebar on desktop) */}
      <aside className="hidden lg:flex flex-col w-[230px] shrink-0 border-r border-[#EBECEF] dark:border-[#2C2C32] h-full bg-white dark:bg-[#19191C]">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer (Mobile screens) */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}
      <aside
        role="dialog"
        aria-label="Navigation Menu"
        aria-modal={isOpen}
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[280px] bg-white dark:bg-[#19191C] flex flex-col transition-transform duration-300 ease-out lg:hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
