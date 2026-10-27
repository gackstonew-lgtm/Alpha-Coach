import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Bot, Newspaper, BookOpen } from 'lucide-react';

export interface MobileBottomNavProps {
  /** Optional callback preserved for backwards compatibility with layout props */
  onMore?: () => void;
}

export interface MobileNavTabItem {
  id: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths: string[];
}

export const MOBILE_BOTTOM_NAV_TABS: MobileNavTabItem[] = [
  {
    id: 'home',
    to: '/dashboard',
    label: 'Home',
    icon: Home,
    matchPaths: ['/dashboard']
  },
  {
    id: 'charts',
    to: '/charts',
    label: 'Charts',
    icon: TrendingUp,
    matchPaths: ['/charts', '/intelligence']
  },
  {
    id: 'coach',
    to: '/ai-coach',
    label: 'Coach',
    icon: Bot,
    matchPaths: ['/ai-coach']
  },
  {
    id: 'news',
    to: '/macro-calendar',
    label: 'News',
    icon: Newspaper,
    matchPaths: ['/macro-calendar', '/news', '/economic-calendar']
  },
  {
    id: 'journal',
    to: '/journal',
    label: 'Journal',
    icon: BookOpen,
    matchPaths: ['/journal', '/calendar']
  }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Mobile and Tablet Primary Navigation"
      style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-background border-t border-border text-content-primary pb-[max(0.35rem,env(safe-area-inset-bottom))] transition-colors duration-150"
    >
      <ul className="grid grid-cols-5 items-center h-16 max-w-screen-md mx-auto px-1">
        {MOBILE_BOTTOM_NAV_TABS.map(({ id, to, label, icon: Icon, matchPaths }) => {
          const active = matchPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

          return (
            <li key={id} className="flex items-center justify-center min-w-0">
              <NavLink
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex flex-col items-center justify-center gap-1 min-h-[48px] py-1.5 px-1 rounded-xl text-[11px] leading-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'text-primary font-bold'
                    : 'text-content-secondary hover:text-content-primary active:text-content-primary'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-6 rounded-lg transition-colors ${
                    active ? 'bg-accent-subtle text-primary' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'stroke-[2.25]' : 'stroke-[1.85]'}`} />
                </div>
                <span className="truncate max-w-full tracking-tight">{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
