import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { CheckCircle2, Mail, Radio, ArrowRight, RefreshCw, LayoutDashboard, ShieldCheck } from 'lucide-react';

export const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Welcome to Meta Coach — Next Steps"
        description="Your Meta Coach account has been successfully initialized. Follow these 3 steps to pair your MT5 terminal and reconstruct your trading history."
        noIndex={true}
      />
      <PublicNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
            Account Created Successfully!
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
            Welcome to the Meta Coach institutional trading operating system. Complete the 3 quick steps below to start journaling with mathematical precision.
          </p>
        </div>

        {/* 3 Clear Next Steps */}
        <div className="space-y-4">
          {/* Step 1: Email Verification */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle framer-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
              01
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500" aria-hidden="true" />
                <h2 className="text-sm font-bold text-content-primary">Verify Your Email Address</h2>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                Check your inbox for a verification email from Meta Coach. Clicking the confirmation link ensures you receive daily performance digests, risk breach warnings, and weekly playbooks.
              </p>
            </div>
          </div>

          {/* Step 2: Connect MT5 Bridge */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle framer-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              02
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-500" aria-hidden="true" />
                <h2 className="text-sm font-bold text-content-primary">Connect Your MT5 Bridge</h2>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                Download the lightweight Windows Companion app onto the machine where MetaTrader 5 runs. Click authorize in your browser to pair without entering any broker passwords.
              </p>
              <div className="pt-2">
                <Link
                  to="/pair"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>Open Pairing Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Step 3: First Deal Sync */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle framer-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              03
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <h2 className="text-sm font-bold text-content-primary">First Sync & Journal Review</h2>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                Once paired, Meta Coach imports your historical deal tickets and groups multi-order executions into full position lifecycles. Review your first trade and tag entry confluences!
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            <span>Go to Trading Dashboard</span>
          </Link>
          <Link
            to="/pair"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-secondary hover:bg-surface-hover text-content-primary font-semibold text-xs border border-border-subtle transition active:scale-95"
          >
            <Radio className="w-4 h-4 text-brand-500" aria-hidden="true" />
            <span>Pair MT5 Companion Now</span>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
