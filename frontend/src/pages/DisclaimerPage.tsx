import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { AlertTriangle, ShieldAlert, Cpu, ExternalLink, Scale, CheckCircle2 } from 'lucide-react';

export const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Financial Risk & Analytical Disclaimer [DRAFT FOR LEGAL REVIEW] | Arcade Fx"
        description="Important legal disclaimer regarding trading risk, margin leverage, lack of personalized financial advice, and empirical software utility."
        canonicalPath="/disclaimer"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/terms' }, { name: 'Risk Disclaimer', path: '/disclaimer' }]} />

        {/* Legal Review Draft Watermark Banner */}
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-start gap-3.5 text-xs leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-sm">
              DRAFT FOR LEGAL COUNSEL REVIEW — NOT FINALIZED
            </span>
            <p>
              This document represents an operational compliance draft. Commercial subscriptions remain disabled until regulatory clearance is obtained in relevant subscriber jurisdictions.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>High Risk Disclosure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
            Financial & Algorithmic Risk Disclaimer
          </h1>
          <p className="text-xs text-content-muted">
            Version 2026.1-draft • Effective Date: Pending Regulatory Review
          </p>
        </div>

        <article className="space-y-6 leading-relaxed">
          {/* Card 1: High Risk of Loss */}
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-3 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>1. Trading Carries a Substantial Risk of Capital Loss</span>
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Trading spot foreign exchange (Forex), contracts for difference (CFDs), commodities, equity indices, and cryptocurrencies carries an inherently high degree of financial risk and may not be suitable for all investors. Leveraged trading allows exposure to large positions with modest margin deposits; however, leverage can work severely against you as well as for you. You could lose some or all of your deposited investment capital. Never trade with capital that you cannot afford to lose entirely.
            </p>
          </div>

          {/* Card 2: Past Performance */}
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-3 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>2. Past Performance Does Not Guarantee Future Results</span>
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Historical performance metrics, simulated backtests, win rates, profit factors, mathematical expectancy, and reconstructed deal records displayed on this platform are for empirical record-keeping and retrospective analysis only. Past market conditions and execution outcomes do not predict or guarantee future performance. Live market liquidity, slippage, latency, broker spread widenings, and macro events will cause live performance to diverge from past records.
            </p>
          </div>

          {/* Card 3: Software Only, Not Advice */}
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-3 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              <span>3. Software Tool Only — No Investment Advice or Managed Accounts</span>
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Arcade Fx is strictly a software engineering application providing trade journaling, quantitative performance analytics, and a companion bridge to your local MetaTrader 5 terminal. Arcade Fx is NOT a financial advisory firm, broker-dealer, commodity trading advisor (CTA), portfolio manager, or signal provider. No content generated by the web application, Bot Assistant, or Telegram integration constitutes financial, investment, legal, or tax advice. All trading decisions remain 100% under your sole discretion and judgment.
            </p>
          </div>

          {/* Card 4: Broker & Prop Firm Rules Responsibility */}
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-3 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>4. Sole Responsibility for Broker & Proprietary Firm Compliance</span>
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              You are exclusively responsible for your brokerage account and ensuring that your automated or discretionary trading conforms to all terms, margin rules, and prop firm challenges (e.g. daily drawdown caps, total drawdown rules, weekend holding rules, news restrictions). Arcade Fx accepts no responsibility for disqualifications, account closures, or financial penalties imposed by your broker or prop firm.
            </p>
          </div>

          {/* Card 5: Local Risk Ceiling Supremacy */}
          <div className="p-6 rounded-2xl bg-surface border border-border-strong space-y-3 framer-card">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>5. Local Hard Limits & Zero Broker Password Isolation</span>
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">
              The MT5 Bot engine runs locally on your own machine. Your broker passwords are never stored or transmitted. The cloud management dashboard can only issue safe command requests, and local risk limits configured on your machine (<code className="text-xs font-mono">local_limits.json</code>) always take strict precedence over any cloud instruction. Live trading requires physical local confirmation on your machine.
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

export default DisclaimerPage;
