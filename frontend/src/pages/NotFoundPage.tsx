import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { ShieldAlert, Home, LogIn, LayoutDashboard, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="404 — Page Not Found | Meta Coach"
        description="The requested page could not be found on Meta Coach. Return to the trading terminal or homepage."
        noIndex={true}
      />
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md w-full text-center space-y-6 framer-card p-8 sm:p-10 rounded-3xl bg-surface border border-border-strong shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-surface-secondary text-[11px] font-mono font-bold text-content-muted border border-border-subtle uppercase tracking-wider">
              Error 404 // Unrecognized Route
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              The page you are looking for has been moved, deleted, or does not exist on the Meta Coach network.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              <span>Enter Trading Dashboard</span>
            </Link>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-content-primary font-semibold text-xs border border-border-subtle transition-all active:scale-95"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Return to Homepage</span>
            </Link>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-content-muted hover:text-content-primary text-xs font-semibold transition"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Sign In with Existing Account</span>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
