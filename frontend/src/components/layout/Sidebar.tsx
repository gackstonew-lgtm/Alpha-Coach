import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronDown,
  LogOut,
  Layers,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ArcadeFxLogo } from '../common/AlphaCoachLogo';
import {
  PRIMARY_NAV_ITEMS,
  MARKET_INTEL_GROUP,
  BOTTOM_NAV_ITEMS,
  NavItemConfig
} from '../../config/navigation';

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

  // Expansion state: tabletExpanded defaults to true so tablet displays expanded readable labels by default
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocusWithin, setIsFocusWithin] = useState<boolean>(false);
  const [tabletExpanded, setTabletExpanded] = useState<boolean>(true);

  // Market Intelligence expandable group
  const isMarketIntelActive = MARKET_INTEL_GROUP.basePaths.some(p =>
    location.pathname.startsWith(p)
  );
  const [isIntelOpen, setIsIntelOpen] = useState<boolean>(true);

  // Timers for hover intent
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  // Expanded on desktop hover/focus, on tablet by default, or when mobile drawer is open
  const isExpanded = isHovered || isFocusWithin || tabletExpanded || isOpen;

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Keyboard navigation: Escape key collapses/closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsHovered(false);
          setIsFocusWithin(false);
          if (sidebarContainerRef.current) {
            sidebarContainerRef.current.blur();
          }
        }
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isOpen, onClose]);

  // Hover intent handlers (desktop)
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 90);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocusWithin(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (sidebarContainerRef.current && !sidebarContainerRef.current.contains(e.relatedTarget as Node)) {
      setIsFocusWithin(false);
    }
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

  // Nav item renderer matching sky-blue-to-black theme
  const renderNavItem = (item: NavItemConfig, isSubItem: boolean = false) => {
    if (item.adminOnly && user?.role !== 'admin') {
      return null;
    }

    const Icon = item.icon;
    const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'));

    if (!isExpanded) {
      // COLLAPSED: Circular icon button on transparent background
      return (
        <div key={item.id} className="flex justify-center py-1">
          <NavLink
            to={item.to}
            onClick={() => {
              onClose();
            }}
            aria-label={item.name}
            aria-current={active ? 'page' : undefined}
            title={item.name}
            className={`group relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
              active
                ? 'bg-[#38BDF8]/20 text-[#38BDF8] ring-2 ring-[#38BDF8] scale-105 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                : 'bg-transparent hover:bg-white/10 text-[#A9BBCB] hover:text-white'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                active ? 'text-[#38BDF8] stroke-[2.5]' : 'text-[#A9BBCB] group-hover:text-white'
              }`}
            />

            {/* Notification Badge Dot when collapsed */}
            {item.badge && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#E13A41] ring-2 ring-[#0B1B2B]"
                aria-label={`Notification: ${item.badge}`}
              />
            )}
          </NavLink>
        </div>
      );
    }

    // EXPANDED: Clean row with white labels, sky-blue active indicator and subtle translucent background
    return (
      <div key={item.id} className="py-0.5 relative">
        <NavLink
          to={item.to}
          onClick={() => {
            onClose();
          }}
          aria-label={item.name}
          aria-current={active ? 'page' : undefined}
          className={`group relative flex items-center justify-between min-h-[44px] rounded-xl px-3.5 border-0 shadow-none outline-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-[0.98] ${
            isSubItem ? 'text-[11px] py-2' : 'text-xs py-2.5'
          } ${
            active
              ? 'bg-[#38BDF8]/15 text-white font-extrabold shadow-xs'
              : 'bg-transparent text-[#A9BBCB] hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          {/* Sleek left sky-blue accent indicator bar for active item */}
          {active && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              aria-hidden="true"
            />
          )}

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon
                className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                  active ? 'text-[#38BDF8] stroke-[2.5]' : 'text-[#A9BBCB] group-hover:text-white'
                }`}
              />
            </div>
            <span className="whitespace-nowrap truncate font-heading tracking-tight">
              {item.name}
            </span>
          </div>

          {/* Expanded full badge pill */}
          {item.badge && (
            <span
              className="shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E13A41] text-white shadow-xs"
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      </div>
    );
  };

  // Main interior content of the floating glass capsule
  const capsuleContent = (
    <div className="sidebar-glass-capsule flex flex-col h-full text-white select-none overflow-hidden p-2.5">
      {/* 1. Header with Logo & Toggle Button */}
      <div className={`pb-2.5 pt-1 flex items-center border-b border-white/10 ${
        isExpanded ? 'px-2 justify-between' : 'justify-center'
      }`}>
        <NavLink
          to="/dashboard"
          onClick={() => {
            onClose();
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-full flex items-center"
          aria-label="Arcade Fx Dashboard"
        >
          {isExpanded ? (
            <div className="flex items-center gap-2 px-2 py-1 bg-black/30 rounded-full border border-white/10 shadow-xs animate-in fade-in duration-200">
              <ArcadeFxLogo size="sm" showWordmark={true} variant="dark" />
            </div>
          ) : (
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/[0.12] border border-white/20 flex items-center justify-center shadow-xs hover:scale-105 transition-transform duration-200">
              <img
                src="/brand/arcade-fx-badge.png"
                alt="Arcade Fx"
                width={26}
                height={26}
                className="w-6.5 h-6.5 object-contain"
              />
            </div>
          )}
        </NavLink>

        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-full text-[#A9BBCB] hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tablet / Touch Toggle Button */}
        {isExpanded && (
          <button
            type="button"
            onClick={() => setTabletExpanded(!tabletExpanded)}
            aria-label={tabletExpanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={tabletExpanded}
            className="hidden md:inline-flex lg:hidden w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 items-center justify-center text-white/90 hover:text-white transition shadow-xs"
          >
            {tabletExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-1.5 text-xs font-medium no-scrollbar">
        {/* Primary Items */}
        {PRIMARY_NAV_ITEMS.map(item => renderNavItem(item))}

        {/* Expandable "Market Intelligence" Group */}
        <div className="pt-1">
          {!isExpanded ? (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={() => {
                  setIsHovered(true);
                  setIsIntelOpen(true);
                }}
                aria-expanded={isIntelOpen}
                aria-label="Market Intelligence Navigation Group"
                title="Market Intelligence"
                className={`group w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
                  isMarketIntelActive
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] ring-2 ring-[#38BDF8] scale-105 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                    : 'bg-transparent hover:bg-white/10 text-[#A9BBCB] hover:text-white'
                }`}
              >
                <Layers
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isMarketIntelActive ? 'text-[#38BDF8] stroke-[2.5]' : 'text-[#A9BBCB] group-hover:text-white'
                  }`}
                />
              </button>
            </div>
          ) : (
            <div className="py-0.5">
              <button
                type="button"
                onClick={() => setIsIntelOpen(!isIntelOpen)}
                aria-expanded={isIntelOpen}
                aria-label="Market Intelligence Navigation Group"
                className={`w-full group relative flex items-center justify-between min-h-[44px] rounded-xl px-3.5 border-0 shadow-none outline-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-[0.98] ${
                  isMarketIntelActive
                    ? 'bg-[#38BDF8]/15 text-white font-extrabold shadow-xs'
                    : 'bg-transparent text-[#A9BBCB] hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                {/* Sleek left accent indicator bar if active */}
                {isMarketIntelActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Layers
                      className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                        isMarketIntelActive ? 'text-[#38BDF8] stroke-[2.5]' : 'text-[#A9BBCB] group-hover:text-white'
                      }`}
                    />
                  </div>
                  <span className="whitespace-nowrap truncate font-heading tracking-tight">
                    Market Intelligence
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    isIntelOpen ? 'rotate-180' : ''
                  } ${isMarketIntelActive ? 'text-[#38BDF8]' : 'text-[#A9BBCB] group-hover:text-white'}`}
                />
              </button>

              {/* Sub-items */}
              {isIntelOpen && (
                <div className="pl-3 pr-1 py-1 space-y-1 animate-in fade-in duration-150">
                  {MARKET_INTEL_GROUP.items.map(sub => renderNavItem(sub, true))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-white/10" />

        {/* Bottom Utility Items */}
        {BOTTOM_NAV_ITEMS.map(item => renderNavItem(item))}
      </div>

      {/* 3. Bottom Sign Out Action */}
      <div className="pt-2 border-t border-white/10">
        {!isExpanded ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign Out"
              title="Sign Out"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/30 flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign Out"
            className="w-full flex items-center gap-3 min-h-[44px] rounded-xl px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/30 font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap font-heading tracking-tight">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP FLOATING GLASS CAPSULE (HOVER-EXPAND OVERLAY)                  */}
      {/* ========================================================================= */}
      <div
        className="hidden lg:block w-[92px] shrink-0 h-full pointer-events-none"
        aria-hidden="true"
      />

      <aside
        ref={sidebarContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Main Navigation"
        className={`sidebar-animated hidden lg:flex flex-col fixed top-3 bottom-3 left-3 z-40 transition-[width,box-shadow] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded
            ? 'w-[248px] shadow-[0_20px_50px_rgba(0,0,0,0.65)]'
            : 'w-[72px] shadow-[0_12px_36px_rgba(0,0,0,0.4)]'
        }`}
      >
        {capsuleContent}
      </aside>

      {/* ========================================================================= */}
      {/* 2. TABLET FLOATING CAPSULE (768px - 1023px) — EXPANDED & READABLE BY DEFAULT */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:block lg:hidden shrink-0 h-full pointer-events-none transition-[width] duration-[240ms] ${
          tabletExpanded ? 'w-[268px]' : 'w-[92px]'
        }`}
        aria-hidden="true"
      />
      <aside
        aria-label="Tablet Navigation"
        className={`sidebar-animated hidden md:flex lg:hidden flex-col fixed top-3 bottom-3 left-3 z-40 transition-[width,box-shadow] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          tabletExpanded
            ? 'w-[248px] shadow-[0_20px_50px_rgba(0,0,0,0.65)]'
            : 'w-[72px] shadow-[0_12px_36px_rgba(0,0,0,0.4)]'
        }`}
      >
        {capsuleContent}
      </aside>

      {/* ========================================================================= */}
      {/* 3. MOBILE OFF-CANVAS CAPSULE DRAWER (<768px) — EXPANDED ON OPEN           */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
        />
      )}
      <aside
        role="dialog"
        aria-label="Navigation Menu"
        aria-modal={isOpen}
        className={`fixed top-3 bottom-3 left-3 z-50 w-full max-w-[280px] flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        {capsuleContent}
      </aside>
    </>
  );
};

export default Sidebar;
