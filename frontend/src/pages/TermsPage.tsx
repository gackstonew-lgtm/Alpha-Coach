import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { FileText, ShieldAlert, AlertTriangle, ShieldCheck, Scale, Cpu, Lock } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Terms of Service & Conditions [DRAFT FOR LEGAL REVIEW] | Arcade Fx"
        description="Terms of service, software license, local MT5 Bot management boundaries, user responsibilities, and legal disclaimers for Arcade Fx."
        canonicalPath="/terms"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/terms' }, { name: 'Terms of Service', path: '/terms' }]} />

        {/* Legal Review Draft Watermark Banner */}
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-start gap-3.5 text-xs leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-sm">
              DRAFT FOR LEGAL COUNSEL REVIEW — NOT FINALIZED
            </span>
            <p>
              This document represents an operational compliance and engineering specification draft. It is currently undergoing legal review. Commercial transactions and public consumer subscriptions remain disabled under feature flags until licensed regulatory approval and counsel sign-off are completed.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Terms of Service & Subscriber Agreement
              </h1>
              <p className="text-xs text-content-muted">
                Version 2026.1-draft • Effective Date: Pending Legal Sign-Off
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="framer-card p-6 sm:p-10 rounded-3xl space-y-8 text-xs sm:text-sm text-content-secondary leading-relaxed border border-border-subtle">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-primary" />
              <span>1. Acceptance of Terms & Eligibility (18+ Age Gate)</span>
            </h2>
            <p>
              By accessing, browsing, registering an account, or downloading the local daemon for Arcade Fx (the "Platform" or "Service"), you agree to be bound by these Terms of Service. You affirm that you are at least eighteen (18) years of age (or the legal age of majority in your jurisdiction) and possess full legal capacity to enter into these terms. If you are under 18 or reside in a blocked/sanctioned jurisdiction, you are strictly prohibited from using the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>2. Software Only — No Investment Advice or Brokerage</span>
            </h2>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <p className="font-bold text-content-primary text-xs">
                NON-FINANCIAL ADVICE NOTICE:
              </p>
              <p className="text-xs text-content-muted leading-relaxed">
                Arcade Fx is strictly a software technology application providing analytical tools, historical trade reconstruction, and cloud management companion interfaces for MetaTrader 5 terminals. Arcade Fx does not offer financial advice, investment recommendations, commodity trading advice, signal services, managed accounts, or brokerage execution. All trades executed on your MT5 terminal are solely your responsibility.
              </p>
            </div>
            <p>
              Trading foreign exchange (Forex), contracts for difference (CFDs), and leveraged financial instruments involves substantial risk of loss, including the possible loss of your entire investment principal. Past performance recorded in journals or shown in backtests does not guarantee future results.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-primary" />
              <span>3. MT5 Bot Management System & Architecture Boundaries</span>
            </h2>
            <p>
              The MT5 Bot management features operate under strict security boundaries designed to protect user funds and isolate broker credentials:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-content-muted text-xs">
              <li>
                <strong>Local Execution:</strong> The MT5 Bot engine and local Python agent run exclusively on your own personal Windows computer or VPS adjacent to your MetaTrader 5 terminal. Outbound HTTPS/WebSocket connections only are initiated; no inbound open ports are required or accepted.
              </li>
              <li>
                <strong>Zero Password Storage:</strong> The Platform never asks for, transmits, receives, or stores your broker account passwords or trading credentials. The website cannot log into your broker.
              </li>
              <li>
                <strong>Safe Cloud Commands:</strong> Cloud dispatches are limited to operational control signals: Start, Stop, Pause, Resume, Close All Positions, Kill Switch, and safe config updates within limits.
              </li>
              <li>
                <strong>Local Limit Supremacy:</strong> The cloud can NEVER force live trading, nor raise risk percentage ceilings, lot size caps, or maximum drawdown limits above what you configured locally on your machine in <code className="text-xs font-mono">local_limits.json</code>. Local machine ceilings always strictly override any cloud command.
              </li>
              <li>
                <strong>Local Confirmation for Live Trading:</strong> Enabling live real-money execution requires explicit, physical confirmation on the machine running MetaTrader 5.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>4. Proprietary Trading Firm (Prop Firm) & Broker Rules Compliance</span>
            </h2>
            <p>
              Subscribers utilizing Arcade Fx with proprietary trading firm evaluation or funded accounts are exclusively responsible for verifying compliance with their respective firm&apos;s rules, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-content-muted text-xs">
              <li>Prohibitions against specific automated strategies, martingale, grid, or high-frequency trading.</li>
              <li>IP address consistency and VPS location restrictions.</li>
              <li>News event holding restrictions and weekend holding bans.</li>
              <li>Daily and maximum overall drawdown calculation methodologies.</li>
            </ul>
            <p className="text-xs text-content-muted">
              Arcade Fx accepts zero liability for account disqualifications, breaches, slippage, margin calls, or liquidation resulting from prop firm policy enforcement.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary" />
              <span>5. Subscription Entitlements & Position Safeguard Policy</span>
            </h2>
            <p>
              When a subscription expires, fails renewal, or is cancelled:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-content-muted text-xs">
              <li>
                <strong>New Positions Blocked:</strong> Opening new trade positions is immediately blocked across the server and local agent upon expiration of the 3-day grace period.
              </li>
              <li>
                <strong>No Silent Abandonment:</strong> The local agent will NEVER silently abandon open positions. Existing trades will continue to be safely monitored and managed per their pre-set Stop Loss and Take Profit levels until natural closure.
              </li>
              <li>
                <strong>Manual Close Supported:</strong> You retain the ability to manually close positions directly inside your MetaTrader 5 terminal at any time.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">6. Prohibited Jurisdictions</h2>
            <p>
              Arcade Fx is not offered to residents or citizens of countries subject to comprehensive international sanctions (including North Korea, Iran, Cuba, Syria, Russia, Belarus) or jurisdictions where automated trading software marketing requires local financial regulatory licensing.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">7. Data Privacy, Export & Deletion</h2>
            <p>
              In compliance with data protection laws (including GDPR and CCPA), you retain full ownership of your trading data. You may download a full machine-readable JSON archive of your records at any time via Settings, or request permanent deletion of your account and all associated telemetry.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">8. Limitation of Liability</h2>
            <p>
              Under no circumstances shall Arcade Fx, its creators, engineers, or operators be liable for trading losses, slippage, connectivity interruptions, VPS outages, broker execution errors, or missed market opportunities arising from the use of this software.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TermsPage;
