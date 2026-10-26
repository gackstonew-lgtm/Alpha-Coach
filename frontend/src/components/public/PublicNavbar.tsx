import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  Shield,
  Layers,
  LineChart,
  BookOpen,
  LayoutDashboard,
  ChevronRight,
  Globe,
  LogIn
} from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const productLinks = [
    { name: 'Trading Journal', href: '/journal', icon: BookOpen, desc: 'Automated deal grouping & lifecycle math' },
    { name: 'Interactive Charts', href: '/charts', icon: LineChart, desc: 'TradingView candlesticks & trade overlays' },
    { name: 'Market Scanner', href: '/scanner', icon: Layers, desc: 'Structure alerts & ICT/SMC setup detection' },
    { name: 'Macro Calendar', href: '/macro-calendar', icon: Globe, desc: 'High-impact central bank announcements' }
  ];

  const resourceLinks = [
    { name: 'Methodology', href: '/methodology', icon: Layers },
    { name: 'Security & Privacy', href: '/security', icon: Shield },
    { name: 'FAQ', href: '/faq', icon: BookOpen },
    { name: 'Terms of Service', href: '/terms', icon: BookOpen }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-all duration-200 bg-background/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none" aria-label="Arcade Fx home">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links (QC NetCore Reference Style) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <a
              href="/#features"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="/#pricing"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/methodology"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === '/methodology' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Methodology
            </Link>
            <Link
              to="/security"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === '/security' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Security
            </Link>
            <Link
              to="/faq"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === '/faq' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              FAQ
            </Link>
          </nav>

          {/* Action Buttons & Theme Switcher (QC NetCore Reference Style) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle visual theme"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface border border-border text-foreground flex items-center justify-center hover:bg-surface-elevated hover:border-primary/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 shadow-xs cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-foreground" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] text-primary-foreground text-xs font-bold transition-all duration-200 shadow-xs flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2.5 px-4 rounded-xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-elevated hover:-translate-y-0.5 active:scale-[0.98] text-foreground text-xs font-bold transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] text-primary-foreground text-xs font-bold transition-all duration-200 shadow-xs flex items-center gap-1.5"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu & Theme Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="w-9 h-9 rounded-xl bg-surface border border-border text-foreground flex items-center justify-center hover:bg-surface-elevated transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-foreground" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="w-9 h-9 rounded-xl bg-surface border border-border text-foreground flex items-center justify-center hover:bg-surface-elevated transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT MENU SHEET                                               */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label="Navigation Menu"
        className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-[340px] bg-surface border-l border-border flex flex-col transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sheet Header: Logo & Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="w-9 h-9 rounded-xl bg-surface-subtle border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Section: PRODUCTS */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              PLATFORM & TOOLS
            </div>
            <div className="divide-y divide-border/60">
              {productLinks.map((prod) => {
                const Icon = prod.icon;
                return (
                  <Link
                    key={prod.name}
                    to={prod.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-2 rounded-xl text-sm font-medium text-foreground hover:bg-surface-elevated transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="font-semibold text-xs text-foreground">{prod.name}</div>
                        <div className="text-[11px] text-muted-foreground">{prod.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: RESOURCES & COMPANY */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              RESOURCES
            </div>
            <div className="divide-y divide-border/60">
              <a
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition"
              >
                <span>Pricing Plans</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </a>
              {resourceLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sheet Footer: Language & Account / CTA */}
        <div className="p-4 border-t border-border bg-surface-subtle space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>English (US)</span>
            </span>
            <span className="text-[11px] font-mono">v1.0.4</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-2 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold text-center transition"
              >
                <LayoutDashboard className="w-4 h-4 inline mr-1.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated text-center text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-center text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default PublicNavbar;
