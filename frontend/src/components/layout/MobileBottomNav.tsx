import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LineChart, Bot, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  /** Opens the existing <Sidebar /> drawer (holds Strategy Lab, Risk Guardian, Rewards, Bridge, Settings, Admin) */
  onMore: () => void;
}

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/performance', label: 'Performance', icon: LineChart },
  { to: '/ai-coach', label: 'Coach', icon: Bot },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMore }) => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-surface/95 backdrop-blur border-t border-border-subtle pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            pathname === to ||
            pathname.startsWith(to + '/') ||
            (to === '/performance' && pathname === '/analytics');

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors ${
                  active ? 'text-brand-500' : 'text-content-muted active:text-content-primary'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMore}
            aria-label="Open full menu"
            className="w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium text-content-muted active:text-content-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
