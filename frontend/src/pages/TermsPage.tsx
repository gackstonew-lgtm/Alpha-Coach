import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { FileText, ShieldAlert, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Terms of Service & Conditions
              </h1>
              <p className="text-xs text-content-muted">
                Last updated: September 2026 • Effective Immediately
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="framer-card p-6 sm:p-10 rounded-3xl space-y-8 text-xs sm:text-sm text-content-secondary leading-relaxed border border-border-subtle">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or using the Alpha Coach software application, website, local MT5 bridge, or related services (collectively, the "Platform"), provided by [COMPANY LEGAL NAME] ("we", "us", or "our"), you agree to be bound by these Terms of Service and Conditions ("Terms"). If you do not agree with any part of these Terms, you must immediately cease all use of the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">2. Nature of the Software & Financial Disclaimer</h2>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <div className="flex items-center gap-2 font-bold text-content-primary">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Non-Advisory & Analytical Scope</span>
              </div>
              <p className="text-xs text-content-muted">
                Alpha Coach is strictly a personal software application designed for trade journaling, statistical performance analysis, position reconstruction, and behavioral self-reflection. Alpha Coach is NOT a registered financial advisor, broker-dealer, commodity trading advisor, or investment manager. Nothing on the Platform constitutes personalized financial, investment, legal, or tax advice.
              </p>
            </div>
            <p>
              Trading financial markets (including Forex, indices, commodities, and equities) involves substantial risk of loss and is not suitable for every investor. You acknowledge that all trading decisions are made solely by you at your own discretion and risk. Past performance recorded in your journal is not indicative of future market outcomes.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">3. User Eligibility & Account Registration</h2>
            <p>
              You must be at least 18 years of age or the age of legal majority in your jurisdiction to create an account. You agree to provide accurate, current, and complete registration information and to maintain the security and confidentiality of your credentials. You are solely responsible for all activities that occur under your account.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">4. MT5 Connection & Zero-Password Model</h2>
            <p>
              Alpha Coach utilizes a local desktop bridge script that interacts with your locally installed MetaTrader 5 client via official IPC APIs. Alpha Coach does not request, receive, or store your MT5 or broker login passwords. You are solely responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-content-muted text-xs">
              <li>Maintaining the security of your local desktop machine and MT5 terminal installation.</li>
              <li>Safeguarding your rotating Device Pairing Tokens generated by the Platform.</li>
              <li>Ensuring your use of the local bridge complies with your broker&apos;s terms and policies.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">5. Acceptable & Prohibited Use</h2>
            <p>
              You agree to use the Platform only for lawful, personal trading performance analysis. You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-content-muted text-xs">
              <li>Reverse engineer, decompile, or disassemble any part of the proprietary cloud performance engine.</li>
              <li>Interfere with, disrupt, or place an unreasonable load on the Platform&apos;s infrastructure.</li>
              <li>Attempt to gain unauthorized access to accounts, systems, or databases belonging to other users.</li>
              <li>Use the Platform to transmit malicious code, automated scraping agents, or fraudulent data.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">6. User-Generated Data & Privacy</h2>
            <p>
              You retain all ownership rights to your trading data, notes, voice journal recordings, and subjective reflections. By using the Platform, you grant [COMPANY LEGAL NAME] a limited, non-exclusive license to process, store, and display your data solely to provide and operate the analytical features requested by you. Please review our <Link to="/privacy" className="text-brand-600 dark:text-brand-400 underline">Privacy Policy</Link> for details on data processing.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">7. Service Availability & Modifications</h2>
            <p>
              We strive to maintain continuous platform availability. However, we do not guarantee uninterrupted, error-free operation. We reserve the right to modify, update, suspend, or discontinue any feature of the Platform at any time with or without prior notice.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, [COMPANY LEGAL NAME], its directors, employees, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, trading losses, loss of data, or operational disruptions arising out of or related to your use of the Platform.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">9. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [GOVERNING JURISDICTION], without regard to its conflict of law principles. Any legal disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts of [GOVERNING JURISDICTION].
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-content-primary">10. Contact Information</h2>
            <p>
              If you have any questions concerning these Terms, please contact:
            </p>
            <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle text-xs space-y-1">
              <div><strong>Company:</strong> [COMPANY LEGAL NAME]</div>
              <div><strong>Email:</strong> [CONTACT EMAIL]</div>
              <div><strong>Address:</strong> [REGISTERED ADDRESS]</div>
              <div><strong>Jurisdiction:</strong> [GOVERNING JURISDICTION]</div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
