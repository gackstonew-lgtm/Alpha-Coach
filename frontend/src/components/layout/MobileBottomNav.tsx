import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, BookOpen, Newspaper, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  /** Opens the expanded <Sidebar /> drawer containing all remaining modules */
  onMore: () => void;
}

const TABS = [
  { to: '/dashboard', label: 'Home', icon: Home, matchPaths: ['/dashboard'] },
  { to: '/charts', label: 'Charts', icon: TrendingUp, matchPaths: ['/charts', '/intelligence'] },
  { to: '/journal', label: 'Journal', icon: BookOpen, matchPaths: ['/journal'] },
  { to: '/macro-calendar', label: 'News', icon: Newspaper, matchPaths: ['/macro-calendar', '/news', '/economic-calendar'] },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMore }) => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-[#080D14]/95 dark:bg-[#080D14]/95 backdrop-blur-md border-t border-white/10 text-white pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      <ul className="flex items-center justify-around h-14">
        {TABS.map(({ to, label, icon: Icon, matchPaths }) => {
          const active = matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-[#38BDF8] font-bold'
                    : 'text-[#A9BBCB] hover:text-white active:text-white'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${active ? 'bg-[#38BDF8]/15 text-[#38BDF8]' : ''}`}>
                  <Icon className={`w-4.5 h-4.5 ${active ? 'scale-105 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                </div>
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMore}
            aria-label="Open more navigation modules"
            className="w-full flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-1 text-[10px] sm:text-[11px] font-medium text-[#A9BBCB] hover:text-white active:text-white transition-colors"
          >
            <div className="p-1 rounded-xl hover:bg-white/10 transition-all">
              <Menu className="w-4.5 h-4.5 stroke-[1.8]" />
            </div>
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
