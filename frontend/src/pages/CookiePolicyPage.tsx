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
        title="Cookie & Local Storage Policy | Meta Coach"
        description="Meta Coach transparent storage policy: essential session authentication and anonymous telemetry without third-party tracking pixels."
        canonicalPath="/cookies"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/cookies' }, { name: 'Cookie Policy', path: '/cookies' }]} />

        {/* Legal Review Draft Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Notice to Users & Compliance Reviewers</span>
            <span>
              This document represents our preliminary cookie and storage disclosure draft and is currently pending formal legal review. The disclosures below enumerate all local browser keys utilized by Meta Coach.
            </span>
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
                Last updated: September 2026 • Transparent Local Storage Usage
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="framer-card p-6 sm:p-10 rounded-3xl space-y-8 text-xs sm:text-sm text-content-secondary leading-relaxed border border-border-subtle">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">1. Overview</h2>
            <p>
              This Cookie Policy explains how [COMPANY LEGAL NAME] ("Meta Coach", "we", "us") utilizes browser cookies and local client-side storage technologies when you access our web application.
            </p>
          </section>

          {/* Section 2 - No Tracking Guarantee */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">2. Zero Third-Party Tracking Cookies</h2>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <div className="flex items-center gap-2 font-bold text-content-primary">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Strictly Essential Storage Only</span>
              </div>
              <p className="text-xs text-content-muted">
                Meta Coach does <strong>NOT</strong> use third-party advertising cookies, cross-site trackers, or behavioral profiling pixels. We only utilize essential browser storage mechanisms required for authentication and interface rendering.
              </p>
            </div>
          </section>

          {/* Section 3 - Local Storage Items */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">3. Exact Browser Storage Items Used</h2>
            <p>
              The application uses HTML5 <code className="px-1.5 py-0.5 rounded bg-surface-secondary font-mono text-xs">localStorage</code> strictly for essential platform functionality:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-content-primary">alpha_coach_token</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-brand-500/10 text-brand-600 rounded">Essential / Auth</span>
                </div>
                <p className="text-xs text-content-muted">
                  Stores your encrypted JWT session authentication token to maintain your signed-in state between page reloads and API communications.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-content-primary">theme</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded">Preference</span>
                </div>
                <p className="text-xs text-content-muted">
                  Remembers your selected visual mode (<code className="font-mono text-xs">dark</code> or <code className="font-mono text-xs">light</code>) to prevent screen flickering upon application boot.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 - Managing Storage */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">4. How to Manage or Clear Local Storage</h2>
            <p>
              You can clear or inspect your browser storage at any time via your browser settings or developer console (Application &gt; Storage &gt; Local Storage). Please note that clearing <code className="font-mono text-xs">alpha_coach_token</code> will sign you out of your current session.
            </p>
          </section>

          {/* Section 5 - Contact */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">5. Contact Information</h2>
            <p>
              If you have any questions regarding our cookie and storage policy, please reach out to:
            </p>
            <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle text-xs space-y-1">
              <div><strong>Company:</strong> [COMPANY LEGAL NAME]</div>
              <div><strong>Email:</strong> [CONTACT EMAIL]</div>
              <div><strong>Jurisdiction:</strong> [GOVERNING JURISDICTION]</div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
