import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { AlertTriangle, ShieldAlert, FileText, ExternalLink } from 'lucide-react';

export const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Financial Risk & Analytical Disclaimer | Meta Coach"
        description="Important legal disclaimer regarding trading risk, margin leverage, lack of personalized financial advice, and empirical software utility."
        canonicalPath="/disclaimer"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/terms' }, { name: 'Risk Disclaimer', path: '/disclaimer' }]} />

        {/* Legal Review Draft Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Notice to Users & Compliance Reviewers</span>
            <span>
              This document represents our preliminary disclosure draft and is currently pending formal legal review. The terms below reflect Meta Coach's software-only operational boundaries.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>High Risk Disclosure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
            Financial Risk Disclaimer
          </h1>
          <p className="text-xs text-content-muted">
            Last Updated: September 28, 2026 • Effective Immediately
          </p>
        </div>

        <article className="prose prose-invert prose-xs sm:prose-sm max-w-none text-content-secondary space-y-6 leading-relaxed">
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-4 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              1. Not Financial or Investment Advice
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Meta Coach (the "Software", "Platform", or "Service") is strictly an analytical and journaling software application. Meta Coach is NOT a registered investment advisor, broker-dealer, commodity trading advisor (CTA), or financial intermediary. Nothing on the Meta Coach website, companion application, automated trade reconstruction summaries, or AI Coach prompts constitutes personalized investment advice, trading recommendations, solicitation, or endorsement to buy or sell any financial asset.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-4 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              2. Trading Involves Substantial Risk of Capital Loss
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Trading spot foreign exchange (Forex), contracts for difference (CFDs), futures, options, equities, and cryptocurrencies carries high risk and is not suitable for all investors. A high percentage of retail investor accounts lose money when trading CFDs and leveraged derivatives. You should carefully evaluate your financial situation, experience level, and risk appetite before allocating risk capital. You may sustain a total loss of your initial deposit or exceed your balance depending on broker execution mechanics. Never trade with capital you cannot afford to lose.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-4 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              3. Historical Journaling and Hypothetical Performance
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Past performance recorded in historical trading journals, equity curves, or Strategy Lab models does not guarantee, predict, or imply future performance. Trading conditions in live markets—including latency, slippage, liquidity gaps, broker commissions, and swap charges—may produce outcomes fundamentally different from backtested, journaled, or simulated records.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-4 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              4. Grounded AI Insights & Algorithmic Computations
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              The AI Coach feature analyzes your user-provided journal tags and closed MT5 execution timestamps using statistical pattern matching. AI responses do not represent predictive price forecasts, trade signals, or autonomous decision-making. You retain 100% individual discretion and responsibility for every trading decision executed on your brokerage terminal.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-4 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              5. Governing Law and Independent Inquiries
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              For regulatory inquiries, compliance audits, or data rights regarding these disclosures, please contact{' '}
              <a href="mailto:support@metacoach.io" className="text-brand-500 hover:underline font-mono font-semibold">
                support@metacoach.io
              </a>
              . We reply to all inquiries within 24 hours.
            </p>
          </div>
        </article>

        <div className="pt-6 border-t border-border-subtle flex flex-wrap gap-4 text-xs font-semibold text-content-muted">
          <Link to="/terms" className="hover:text-content-primary transition flex items-center gap-1">
            <span>Terms of Service</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
          <Link to="/privacy" className="hover:text-content-primary transition flex items-center gap-1">
            <span>Privacy Policy</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
          <Link to="/security" className="hover:text-content-primary transition flex items-center gap-1">
            <span>Security Specifications</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
