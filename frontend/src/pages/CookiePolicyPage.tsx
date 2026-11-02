import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { Cookie, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Cookie & Local Storage Policy [DRAFT FOR LEGAL REVIEW] | Arcade Fx"
        description="Arcade Fx transparent storage policy: essential session authentication and anonymous telemetry without third-party tracking pixels."
        canonicalPath="/cookies"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/cookies' }, { name: 'Cookie Policy', path: '/cookies' }]} />

        {/* Legal Review Draft Watermark Banner */}
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-start gap-3.5 text-xs leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-sm">
              DRAFT FOR LEGAL COUNSEL REVIEW — NOT FINALIZED
            </span>
            <p>
              This document represents our preliminary cookie and local storage policy draft and is currently pending formal legal review.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Cookie className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Cookie & Storage Policy
              </h1>
              <p className="text-xs text-content-muted">
                Version 2026.1-draft • Effective Date: Pending Legal Sign-Off
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="framer-card p-6 sm:p-10 rounded-3xl space-y-8 text-xs sm:text-sm text-content-secondary leading-relaxed border border-border-subtle">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">1. Overview</h2>
            <p>
              Arcade Fx uses strictly essential cookies and browser local storage items required for session authentication, theme preference, and device pairing token handling. We do not use third-party behavioral advertising pixels, cross-site trackers, or data-broker cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">2. Essential Browser Keys</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-content-muted text-xs">
              <li><code className="text-xs font-mono font-bold">sb-access-token</code>: Secure JWT authentication token for your logged-in session.</li>
              <li><code className="text-xs font-mono font-bold">theme</code>: Stores UI appearance preference (Dark or Light mode).</li>
              <li><code className="text-xs font-mono font-bold">selected_account_id</code>: Remembers the active MT5 trading account view in your dashboard.</li>
            </ul>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CookiePolicyPage;
