import React from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { Shield, Lock, AlertTriangle, CheckCircle2, Database, Key } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Privacy Policy & Trader Data Sovereignty [DRAFT FOR LEGAL REVIEW] | Arcade Fx"
        description="Arcade Fx privacy policy: Zero-Password architecture, local read-only MT5 integration, data encryption, and GDPR compliance."
        canonicalPath="/privacy"
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'Legal', path: '/privacy' }, { name: 'Privacy Policy', path: '/privacy' }]} />

        {/* Legal Review Draft Watermark Banner */}
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-start gap-3.5 text-xs leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-sm">
              DRAFT FOR LEGAL COUNSEL REVIEW — NOT FINALIZED
            </span>
            <p>
              This document represents our preliminary privacy disclosure draft and is currently pending formal legal review. The policies below define our strict Zero-Password and encryption standards.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Privacy Policy & Data Sovereignty
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
            <h2 className="text-base sm:text-lg font-bold text-content-primary">1. Introduction & Scope</h2>
            <p>
              Arcade Fx values your privacy and trader sovereignty. This Privacy Policy outlines what information is collected, how it is processed, stored, and protected when you use our web platform, APIs, and local MT5 bot agent.
            </p>
          </section>

          {/* Section 2 - Core Guarantee */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">2. Absolute Zero-Password Guarantee</h2>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-content-primary">We Never Collect Broker Credentials</div>
                <p className="text-xs text-content-muted">
                  Arcade Fx does not ask for, intercept, receive, or store your MT5 master passwords, investor passwords, or broker credentials. All communication with MetaTrader 5 occurs strictly on your local machine using official desktop libraries. The cloud management console never has the capability to log into your brokerage account.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 - Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">3. Information We Collect</h2>
            <p>
              We only collect data necessary to provide analytical, journaling, and bot management features:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-content-muted text-xs">
              <li>Account credentials (email, hashed password, optional TOTP 2FA secret).</li>
              <li>Reconstructed execution facts: open/close prices, timestamps, lot volume, commissions, swaps, net profit.</li>
              <li>Bot telemetry: online state, version, masked account number, balance, equity, and open positions count.</li>
              <li>Operational audit logs: command dispatches, configuration adjustments, and pairing session timestamps.</li>
            </ul>
          </section>

          {/* Section 4 - GDPR & Data Subject Rights */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">4. GDPR & CCPA Data Rights (Export and Permanent Deletion)</h2>
            <p>
              You possess complete rights over your personal and financial telemetry:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-content-muted text-xs">
              <li>
                <strong>Right to Data Portability (Export):</strong> You can export a complete machine-readable JSON archive of all your accounts, trades, journals, risk configurations, and bot instances at any time via the Settings page.
              </li>
              <li>
                <strong>Right to Erasure (Account Deletion):</strong> You may permanently delete your account and all associated database records. Deletion cascades across all tables and cannot be undone.
              </li>
            </ul>
          </section>

          {/* Section 5 - Security & Encryption */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">5. Cryptographic Security Standards</h2>
            <p>
              All data in transit is protected using TLS 1.3 encryption. Cloud-to-agent commands are authenticated with HMAC signatures with nonce replay protection. Device pairing tokens are stored securely in OS credential stores (Windows Credential Manager) on your local machine and stored hashed on the server.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicyPage;
