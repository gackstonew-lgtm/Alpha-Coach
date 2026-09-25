import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlphaCoachLogo } from '../common/AlphaCoachLogo';
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
  LayoutDashboard
} from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Features', href: '/#features', icon: Sparkles },
    { name: 'Methodology', href: '/methodology', icon: Layers },
    { name: 'Security', href: '/security', icon: Shield },
    { name: 'Legal', href: '/terms', icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <AlphaCoachLogo size="md" showWordmark={true} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-content-secondary">
          {navLinks.map(link => {
            const isInternal = link.href.startsWith('/') && !link.href.includes('#');
            if (isInternal) {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`transition-colors duration-150 hover:text-content-primary ${
                    isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : ''
                  }`}
                >
                  {link.name}
                </Link>
              );
            }
            return (
              <a
                key={link.name}
                href={link.href}
                className="transition-colors duration-150 hover:text-content-primary"
              >
                {link.name}
              </a>
            );
          })}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all duration-150"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Open Trading Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-content-primary hover:bg-surface-secondary border border-border-subtle transition-all duration-150"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all duration-150"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-content-secondary hover:text-content-primary border border-border-subtle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-content-secondary">
            {navLinks.map(link => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-secondary text-content-primary"
              >
                <link.icon className="w-4 h-4 text-brand-500" />
                <span>{link.name}</span>
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Trading Terminal</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold text-content-primary border border-border-subtle bg-surface-secondary"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
