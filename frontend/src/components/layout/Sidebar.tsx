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

  // Desktop / Tablet expansion state
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocusWithin, setIsFocusWithin] = useState<boolean>(false);
  const [tabletExpanded, setTabletExpanded] = useState<boolean>(false);

  // Expandable Market Intelligence sub-group
  const isMarketIntelActive = MARKET_INTEL_GROUP.basePaths.some(p =>
    location.pathname.startsWith(p)
  );
  const [isIntelOpen, setIsIntelOpen] = useState<boolean>(true);

  // Timers for hover-intent enter and exit delays
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  // Derived effective expanded state for desktop & tablet
  const isExpanded = isHovered || isFocusWithin || tabletExpanded;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Keyboard navigation: Escape key collapses if focus is inside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsHovered(false);
          setIsFocusWithin(false);
          setTabletExpanded(false);
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
    // 90ms enter intent delay prevents flicker when skimming across
    enterTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 90);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    // 180ms leave delay ensures brief boundary exits do not collapse the sidebar
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  }, []);

  // Focus-within handlers for keyboard accessibility
  const handleFocus = useCallback(() => {
    setIsFocusWithin(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // If the newly focused element is still inside the sidebar, remain expanded
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

  // Nav item renderer with active indicators, tooltips, and badges
  const renderNavItem = (item: NavItemConfig, isSubItem: boolean = false) => {
    if (item.adminOnly && user?.role !== 'admin') {
      return null;
    }

    const Icon = item.icon;
    const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'));

    return (
      <NavLink
        key={item.id}
        to={item.to}
        onClick={() => {
          setTabletExpanded(false);
          onClose();
        }}
        aria-label={item.name}
        aria-current={active ? 'page' : undefined}
        title={!isExpanded ? item.name : undefined}
        className={`group relative flex items-center min-h-[44px] rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          isSubItem ? 'py-2 px-3 text-[11px]' : 'py-2.5 px-3.5 text-xs'
        } ${
          active
            ? 'bg-sidebar-active text-white font-bold shadow-xs'
            : 'text-sidebar-muted hover:text-white hover:bg-sidebar-hover'
        } ${!isExpanded ? 'justify-center' : 'justify-between'}`}
      >
        {/* Active Pill / Indicator Bar */}
        {active && (
          <span
            className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-sidebar-indicator shadow-[0_0_8px_rgba(63,174,150,0.6)]"
            aria-hidden="true"
          />
        )}

        <div className={`flex items-center gap-3.5 ${!isExpanded ? 'justify-center' : 'min-w-0'}`}>
          {/* Fixed-size Icon Container (never moves during animation) */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <Icon
              className={`w-4 h-4 transition-transform duration-150 group-hover:scale-105 ${
                active ? 'text-sidebar-icon-active' : 'text-sidebar-icon opacity-90'
              }`}
            />
            {/* Collapsed dot badge indicator */}
            {!isExpanded && item.badge && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sidebar-badge ring-2 ring-sidebar"
                aria-label={`Notification: ${item.badge}`}
              />
            )}
          </div>

          {/* Animated Text Label */}
          <span
            className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
              isExpanded
                ? 'opacity-100 translate-x-0 delay-75 max-w-[160px]'
                : 'opacity-0 -translate-x-2 pointer-events-none max-w-0'
            }`}
          >
            {item.name}
          </span>
        </div>

        {/* Expanded full badge */}
        {isExpanded && item.badge && (
          <span
            className="shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sidebar-badge text-white shadow-xs"
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  // Main interior content of the sidebar
  const sidebarBody = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-text border-r border-sidebar-border select-none overflow-hidden">
      {/* 1. Header with Logo & Tablet Toggle */}
      <div className={`pt-4 pb-3 flex items-center transition-all duration-200 border-b border-sidebar-border ${
        isExpanded ? 'px-4 justify-between' : 'px-2 justify-center'
      }`}>
        <NavLink
          to="/dashboard"
          onClick={() => {
            setTabletExpanded(false);
            onClose();
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-xl flex items-center"
          aria-label="Arcade Fx Dashboard"
        >
          {/* Logo Cross-fade between Candlestick Mark (Collapsed) and Full Wordmark (Expanded) */}
          <div className="relative flex items-center justify-center min-h-[44px]">
            {isExpanded ? (
              <div className="flex items-center gap-2 px-2 py-1 bg-black/30 rounded-xl border border-white/10 shadow-xs animate-in fade-in duration-200">
                <ArcadeFxLogo size="sm" showWordmark={true} variant="dark" />
              </div>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 shadow-xs hover:scale-105 transition-transform duration-150">
                <img
                  src="/brand/arcade-fx-badge.png"
                  alt="Arcade Fx"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain"
                />
              </div>
            )}
          </div>
        </NavLink>

        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden p-2 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tablet Tap-to-Expand Toggle (visible on tablet screens 768px-1023px) */}
        <button
          type="button"
          onClick={() => setTabletExpanded(!tabletExpanded)}
          aria-label={tabletExpanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={tabletExpanded}
          className="hidden md:inline-flex lg:hidden p-1.5 rounded-lg text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition"
        >
          {tabletExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Navigation Items List (Vertically cleanly aligned directly beneath header) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 text-xs font-medium no-scrollbar">
        {/* Primary Items */}
        {PRIMARY_NAV_ITEMS.map(item => renderNavItem(item))}

        {/* Expandable "Market Intelligence" Group */}
        <div className="pt-1.5">
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) {
                // If collapsed, clicking expands the sidebar
                setIsHovered(true);
                setIsIntelOpen(true);
              } else {
                setIsIntelOpen(!isIntelOpen);
              }
            }}
            aria-expanded={isIntelOpen}
            aria-label="Market Intelligence Navigation Group"
            title={!isExpanded ? 'Market Intelligence' : undefined}
            className={`w-full group flex items-center min-h-[44px] rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary py-2.5 px-3.5 ${
              isMarketIntelActive
                ? 'bg-sidebar-active text-white font-bold'
                : 'text-sidebar-muted hover:text-white hover:bg-sidebar-hover'
            } ${!isExpanded ? 'justify-center' : 'justify-between'}`}
          >
            <div className={`flex items-center gap-3.5 ${!isExpanded ? 'justify-center' : 'min-w-0'}`}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Layers
                  className={`w-4 h-4 transition-transform duration-150 group-hover:scale-105 ${
                    isMarketIntelActive ? 'text-sidebar-icon-active' : 'text-sidebar-icon opacity-90'
                  }`}
                />
              </div>
              <span
                className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
                  isExpanded
                    ? 'opacity-100 translate-x-0 delay-75 max-w-[160px]'
                    : 'opacity-0 -translate-x-2 pointer-events-none max-w-0'
                }`}
              >
                Market Intelligence
              </span>
            </div>

            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-sidebar-muted transition-transform duration-200 shrink-0 ${
                  isIntelOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Sub-items (shown only when expanded) */}
          {isExpanded && isIntelOpen && (
            <div className="pl-4 pr-1 py-1 space-y-1 animate-in fade-in duration-150">
              {MARKET_INTEL_GROUP.items.map(sub => renderNavItem(sub, true))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-2.5 border-t border-sidebar-border" />

        {/* Bottom Utility Items */}
        {BOTTOM_NAV_ITEMS.map(item => renderNavItem(item))}
      </div>

      {/* 3. Bottom Sign Out Action */}
      <div className={`p-2.5 border-t border-sidebar-border transition-all duration-200 ${
        isExpanded ? 'px-3' : 'px-2 flex justify-center'
      }`}>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign Out"
          title={!isExpanded ? 'Sign Out' : undefined}
          className={`group flex items-center min-h-[44px] rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
            isExpanded ? 'w-full gap-3 px-3.5 py-2' : 'w-10 justify-center p-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span
            className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
              isExpanded
                ? 'opacity-100 translate-x-0 delay-75 max-w-[140px]'
                : 'opacity-0 -translate-x-2 pointer-events-none max-w-0'
            }`}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP HOVER-EXPAND SIDEBAR (OVERLAY WITH ZERO LAYOUT SHIFT)           */}
      {/* ========================================================================= */}
      {/* Stationary placeholder anchor maintaining exactly 72px flex space */}
      <div
        className="hidden lg:block w-[72px] shrink-0 h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Animated Desktop Floating Overlay Rail */}
      <aside
        ref={sidebarContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Main Navigation"
        className={`sidebar-animated hidden lg:flex flex-col absolute top-0 bottom-0 left-0 z-40 transition-[width,box-shadow] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded
            ? 'w-[248px] shadow-[8px_0_32px_rgba(0,0,0,0.4)]'
            : 'w-[72px] shadow-sm'
        }`}
      >
        {sidebarBody}
      </aside>

      {/* ========================================================================= */}
      {/* 2. TABLET TOGGLE RAIL (768px - 1023px)                                    */}
      {/* ========================================================================= */}
      <div
        className="hidden md:block lg:hidden w-[72px] shrink-0 h-full pointer-events-none"
        aria-hidden="true"
      />
      <aside
        aria-label="Tablet Navigation"
        className={`sidebar-animated hidden md:flex lg:hidden flex-col absolute top-0 bottom-0 left-0 z-40 transition-[width,box-shadow] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          tabletExpanded
            ? 'w-[248px] shadow-[8px_0_32px_rgba(0,0,0,0.4)]'
            : 'w-[72px] shadow-sm'
        }`}
      >
        {sidebarBody}
      </aside>

      {/* ========================================================================= */}
      {/* 3. MOBILE OFF-CANVAS DRAWER (<768px)                                      */}
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[280px] flex flex-col transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarBody}
      </aside>
    </>
  );
};

export default Sidebar;
