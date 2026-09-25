import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Shield, Lock, ArrowLeft, CheckCircle2, Database, Key } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-content-muted">
                Last updated: September 2026 • Committed to Trader Data Privacy
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
              [COMPANY LEGAL NAME] ("we", "us", or "Alpha Coach") values your privacy. This Privacy Policy outlines what information we collect, how it is processed, stored, and protected when you use our web platform, APIs, and local MT5 bridge integration.
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
                  Alpha Coach does not ask for, intercept, receive, or store your MT5 master passwords, investor passwords, or broker credentials. All communication with MetaTrader 5 occurs on your local machine using the official MetaTrader5 Python desktop library.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 - Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">3. Information We Collect</h2>
            <p>
              We only collect data necessary to provide analytical, journaling, and performance features:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <div className="flex items-center gap-2 font-bold text-content-primary">
                  <Key className="w-4 h-4 text-brand-500" />
                  <span>Account Information</span>
                </div>
                <ul className="text-xs text-content-muted list-disc pl-4 space-y-1">
                  <li>Name and email address provided during registration</li>
                  <li>Account preferences (timezone, preferred currency)</li>
                  <li>Hashed and salted authentication credentials managed securely via Supabase Auth</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <div className="flex items-center gap-2 font-bold text-content-primary">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>Trading & Journal Data</span>
                </div>
                <ul className="text-xs text-content-muted list-disc pl-4 space-y-1">
                  <li>Closed deal tickets (symbol, lots, execution timestamps, prices, profit, commission, swap)</li>
                  <li>Reconstructed position lifecycles and R-multiples</li>
                  <li>Subjective setup tags, psychological tags, voice transcripts, and notes entered by you</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 - How Data is Used */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">4. How We Use Your Information</h2>
            <p>Your data is processed strictly for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-content-muted text-xs">
              <li>Computing performance analytics, equity curves, session heatmaps, and win/loss statistics.</li>
              <li>Powering the Trader DNA and Risk Guardian decision-support tools.</li>
              <li>Answering your inquiries in the Grounded AI Trading Coach using solely your own historical records.</li>
              <li>Synchronizing newly closed MT5 deals via your authorized local bridge token.</li>
            </ul>
            <p className="text-xs font-semibold text-content-primary">
              We never sell, rent, monetize, or share your proprietary trading records with third-party advertisers, proprietary trading firms, or external brokerages.
            </p>
          </section>

          {/* Section 5 - Storage & Security */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">5. Data Storage & Isolation</h2>
            <p>
              Your analytical data is hosted on enterprise-grade cloud databases with strict Row-Level Security (RLS) enforcement. Only authenticated sessions with your specific user ID are permitted to read or mutate your trading accounts and journal records.
            </p>
          </section>

          {/* Section 6 - AI Feature Privacy */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">6. AI Trading Coach Privacy</h2>
            <p>
              When you submit questions to the AI Trading Coach, only the relevant aggregated journal metrics necessary to answer your prompt are transmitted for natural-language processing. No personal identifying information (such as your email or account numbers) is passed to the language model.
            </p>
          </section>

          {/* Section 7 - User Rights */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">7. Your Data Rights & Deletion</h2>
            <p>
              You have the right to access, export, or permanently delete your trading records and account data at any time from within the application Settings or by contacting support. Upon account deletion, all associated trade reconstructions, accounts, and journal notes are permanently removed from our primary database.
            </p>
          </section>

          {/* Section 8 - Contact */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">8. Contact Us</h2>
            <p>
              For any privacy or data protection inquiries, please contact:
            </p>
            <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle text-xs space-y-1">
              <div><strong>Data Controller:</strong> [COMPANY LEGAL NAME]</div>
              <div><strong>Privacy Email:</strong> [CONTACT EMAIL]</div>
              <div><strong>Registered Address:</strong> [REGISTERED ADDRESS]</div>
              <div><strong>Jurisdiction:</strong> [GOVERNING JURISDICTION]</div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
