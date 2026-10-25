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
  Sparkles,
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
    { name: 'Interactive Charts', href: '/charts', icon: Sparkles, desc: 'TradingView candlesticks & trade overlays' },
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
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none" aria-label="Arcade Fx home">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-content-secondary">
            <Link
              to="/#features"
              className="transition-colors duration-150 hover:text-content-primary"
            >
              Features
            </Link>
            <Link
              to="/methodology"
              className={`transition-colors duration-150 hover:text-content-primary ${
                location.pathname === '/methodology' ? 'text-brand-500 font-bold' : ''
              }`}
            >
              Methodology
            </Link>
            <Link
              to="/security"
              className={`transition-colors duration-150 hover:text-content-primary ${
                location.pathname === '/security' ? 'text-brand-500 font-bold' : ''
              }`}
            >
              Security
            </Link>
            <Link
              to="/faq"
              className={`transition-colors duration-150 hover:text-content-primary ${
                location.pathname === '/faq' ? 'text-brand-500 font-bold' : ''
              }`}
            >
              FAQ
            </Link>
            <Link
              to="/terms"
              className={`transition-colors duration-150 hover:text-content-primary ${
                location.pathname === '/terms' ? 'text-brand-500 font-bold' : ''
              }`}
            >
              Legal
            </Link>
          </nav>

          {/* Action Buttons & Theme Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary border border-border-subtle transition-all duration-150"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="hostinger-btn-primary"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hostinger-btn-secondary"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hostinger-btn-primary"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-xl text-content-muted hover:text-content-primary border border-border-subtle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-xl text-content-secondary hover:text-content-primary border border-border-subtle"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HOSTINGER MOBILE SLIDE-OUT MENU SHEET                                     */}
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
        className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-[340px] bg-surface border-l border-border-subtle flex flex-col transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sheet Header: Logo & Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Section: PRODUCTS */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold tracking-wider uppercase text-content-muted">
              PRODUCTS
            </div>
            <div className="divide-y divide-border-subtle/50">
              {productLinks.map((prod) => {
                const Icon = prod.icon;
                return (
                  <Link
                    key={prod.name}
                    to={prod.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-2 rounded-xl text-sm font-medium text-content-primary hover:bg-surface-secondary transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="font-semibold text-xs text-content-primary">{prod.name}</div>
                        <div className="text-[11px] text-content-muted">{prod.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-muted/60" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: RESOURCES & COMPANY */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold tracking-wider uppercase text-content-muted">
              RESOURCES
            </div>
            <div className="divide-y divide-border-subtle/50">
              {resourceLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-2 rounded-xl text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-content-muted" />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-muted/50" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sheet Footer: Language & Account / CTA */}
        <div className="p-4 border-t border-border-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-content-muted px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              <span>English (US)</span>
            </span>
            <span className="text-[11px] font-mono">v1.0.4</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-2 hostinger-btn-primary w-full"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hostinger-btn-secondary text-center text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hostinger-btn-primary text-center text-xs"
                >
                  Get Started
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
