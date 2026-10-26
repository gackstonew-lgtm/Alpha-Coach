import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronDown,
  LogOut,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

  // Desktop hover and focus intent
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocusWithin, setIsFocusWithin] = useState<boolean>(false);
  const [tabletExpanded, setTabletExpanded] = useState<boolean>(false);

  // Live Local Clock & Date (User device timezone)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Market Intelligence expandable group
  const isMarketIntelActive = MARKET_INTEL_GROUP.basePaths.some(p =>
    location.pathname.startsWith(p)
  );
  const [isIntelOpen, setIsIntelOpen] = useState<boolean>(true);

  // Timers for hover intent
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  // Desktop expands strictly on pointer hover or keyboard focus
  const isDesktopExpanded = isHovered || isFocusWithin;

  // Tablet expands on tap toggle, or hover if trackpad/mouse connected
  const isTabletExpanded = tabletExpanded || isHovered || isFocusWithin;

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
        setIsHovered(false);
        setIsFocusWithin(false);
        setTabletExpanded(false);
        if (sidebarContainerRef.current) {
          sidebarContainerRef.current.blur();
        }
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Hover intent handlers (desktop)
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 60);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
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
  const renderNavItem = (item: NavItemConfig, isSubItem: boolean = false, isExpanded: boolean = false) => {
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
            className={`group relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5BEA] active:scale-95 ${
              active
                ? 'bg-[#2F5BEA] text-white ring-2 ring-[#2F5BEA] scale-105 shadow-[0_0_12px_rgba(47,91,234,0.5)]'
                : 'bg-transparent hover:bg-[var(--sidebar-item-hover-bg)] text-[var(--sidebar-icon)] hover:text-[var(--sidebar-icon-hover)]'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                active ? 'text-white stroke-[2.5]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-hover)]'
              }`}
            />

            {/* Notification Badge Dot when collapsed */}
            {item.badge && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[var(--sidebar-danger-icon)] ring-2 ring-[var(--sidebar-bg)]"
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
          className={`group relative flex items-center justify-between min-h-[44px] rounded-xl px-3.5 border-0 shadow-none outline-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5BEA] active:scale-[0.98] ${
            isSubItem ? 'text-[11px] py-2' : 'text-xs py-2.5'
          } ${
            active
              ? 'bg-[#2F5BEA]/15 text-[var(--sidebar-icon-hover)] font-extrabold shadow-xs'
              : 'bg-transparent text-[var(--sidebar-icon)] hover:text-[var(--sidebar-icon-hover)] hover:bg-[var(--sidebar-item-hover-bg)] font-medium'
          }`}
        >
          {/* Sleek left sky-blue accent indicator bar for active item */}
          {active && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#2F5BEA] shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              aria-hidden="true"
            />
          )}

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon
                className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                  active ? 'text-[#2F5BEA] stroke-[2.5]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-hover)]'
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
              className="shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--sidebar-danger-bg)] text-[var(--sidebar-danger-icon)] border border-[var(--sidebar-danger-icon)]/20 shadow-xs"
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      </div>
    );
  };

  // Main interior content of the floating glass capsule
  const renderCapsuleContent = (isExpanded: boolean) => (
    <div className="sidebar-glass-capsule flex flex-col h-full text-[var(--sidebar-text)] select-none overflow-hidden p-2.5">
      {/* 1. Header with Clock/Date (when expanded) or Circular Logo (when collapsed) */}
      <div className={`pb-2.5 pt-1 flex items-center border-b border-[var(--sidebar-divider)] ${
        isExpanded ? 'px-2 justify-between' : 'justify-center'
      }`}>
        {isExpanded ? (
          <div className="flex flex-col justify-center min-h-[44px] px-1 select-none animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[var(--sidebar-icon-hover)] tracking-wide tabular-nums font-mono">
              <Clock className="w-3.5 h-3.5 text-[#2F5BEA] shrink-0" aria-hidden="true" />
              <span>{formattedTime}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-[var(--sidebar-icon)] truncate">
              {formattedDate}
            </div>
          </div>
        ) : (
          <NavLink
            to="/dashboard"
            onClick={() => {
              onClose();
              if (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024) {
                setTabletExpanded(true);
              }
            }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5BEA] rounded-full flex items-center justify-center"
            aria-label="Arcade Fx Dashboard"
          >
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-logo-ring)] flex items-center justify-center shadow-xs hover:scale-105 transition-all duration-200">
              <img
                src="/brand/arcade-fx-badge.png"
                alt="Arcade Fx"
                width={26}
                height={26}
                className="w-6.5 h-6.5 object-contain"
              />
            </div>
          </NavLink>
        )}

        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-full text-[var(--sidebar-icon)] hover:text-[var(--sidebar-icon-hover)] hover:bg-[var(--sidebar-item-hover-bg)] transition"
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
            className="hidden md:inline-flex lg:hidden w-8 h-8 rounded-full bg-[var(--sidebar-item-hover-bg)] hover:bg-[var(--sidebar-border)] border border-[var(--sidebar-border)] items-center justify-center text-[var(--sidebar-text)] hover:text-[var(--sidebar-icon-hover)] transition shadow-xs"
          >
            {tabletExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-1.5 text-xs font-medium no-scrollbar">
        {/* Primary Items */}
        {PRIMARY_NAV_ITEMS.map(item => renderNavItem(item, false, isExpanded))}

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
                className={`group w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5BEA] active:scale-95 ${
                  isMarketIntelActive
                    ? 'bg-[#2F5BEA] text-white ring-2 ring-[#2F5BEA] scale-105 shadow-[0_0_12px_rgba(47,91,234,0.5)]'
                    : 'bg-transparent hover:bg-[var(--sidebar-item-hover-bg)] text-[var(--sidebar-icon)] hover:text-[var(--sidebar-icon-hover)]'
                }`}
              >
                <Layers
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isMarketIntelActive ? 'text-[#2F5BEA] stroke-[2.5]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-hover)]'
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
                className={`w-full group relative flex items-center justify-between min-h-[44px] rounded-xl px-3.5 border-0 shadow-none outline-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5BEA] active:scale-[0.98] ${
                  isMarketIntelActive
                    ? 'bg-[#2F5BEA]/15 text-[var(--sidebar-icon-hover)] font-extrabold shadow-xs'
                    : 'bg-transparent text-[var(--sidebar-icon)] hover:text-[var(--sidebar-icon-hover)] hover:bg-[var(--sidebar-item-hover-bg)] font-medium'
                }`}
              >
                {/* Sleek left accent indicator bar if active */}
                {isMarketIntelActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#2F5BEA] shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Layers
                      className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                        isMarketIntelActive ? 'text-[#2F5BEA] stroke-[2.5]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-hover)]'
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
                  } ${isMarketIntelActive ? 'text-[#2F5BEA]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-hover)]'}`}
                />
              </button>

              {/* Sub-items */}
              {isIntelOpen && (
                <div className="pl-3 pr-1 py-1 space-y-1 animate-in fade-in duration-150">
                  {MARKET_INTEL_GROUP.items.map(sub => renderNavItem(sub, true, isExpanded))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-[var(--sidebar-divider)]" />

        {/* Bottom Utility Items */}
        {BOTTOM_NAV_ITEMS.map(item => renderNavItem(item, false, isExpanded))}
      </div>

      {/* 3. Bottom Sign Out Action */}
      <div className="pt-2 border-t border-[var(--sidebar-divider)]">
        {!isExpanded ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign Out"
              title="Sign Out"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--sidebar-danger-bg)] text-[var(--sidebar-danger-icon)] hover:bg-[var(--sidebar-danger-icon)] hover:text-white border border-[var(--sidebar-danger-icon)]/30 flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-danger-icon)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign Out"
            className="w-full flex items-center gap-3 min-h-[44px] rounded-xl px-3.5 py-2.5 bg-[var(--sidebar-danger-bg)] text-[var(--sidebar-danger-icon)] hover:bg-[var(--sidebar-danger-icon)] hover:text-white border border-[var(--sidebar-danger-icon)]/30 font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-danger-icon)]"
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
        className={`sidebar-animated hidden lg:flex flex-col fixed top-3 bottom-3 left-3 z-40 rounded-[28px] transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isDesktopExpanded ? 'w-[248px]' : 'w-[72px]'
        }`}
      >
        {renderCapsuleContent(isDesktopExpanded)}
      </aside>

      {/* ========================================================================= */}
      {/* 2. TABLET FLOATING CAPSULE (768px - 1023px) — EXPAND/COLLAPSE ON TAP     */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:block lg:hidden shrink-0 h-full pointer-events-none transition-[width] duration-[240ms] ${
          isTabletExpanded ? 'w-[268px]' : 'w-[92px]'
        }`}
        aria-hidden="true"
      />
      <aside
        aria-label="Tablet Navigation"
        className={`sidebar-animated hidden md:flex lg:hidden flex-col fixed top-3 bottom-3 left-3 z-40 rounded-[28px] transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isTabletExpanded ? 'w-[248px]' : 'w-[72px]'
        }`}
      >
        {renderCapsuleContent(isTabletExpanded)}
      </aside>

      {/* ========================================================================= */}
      {/* 3. MOBILE OFF-CANVAS CAPSULE DRAWER (<768px)                             */}
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
        className={`fixed top-3 bottom-3 left-3 z-50 w-full max-w-[280px] flex flex-col rounded-[28px] transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        {renderCapsuleContent(true)}
      </aside>
    </>
  );
};

export default Sidebar;
