import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { useAuth } from '../context/AuthContext';
import { FAQ_ITEMS, getFAQSchema } from '../data/faqData';
import {
  ArrowRight,
  LineChart,
  BookOpen,
  Scan,
  ShieldAlert,
  Bot,
  Trophy,
  Cpu,
  Layers,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Scale,
  TrendingUp,
  FileText,
  CreditCard,
  Check,
  Shield,
  Zap
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: "Arcade Fx",
  operatingSystem: 'Windows, macOS, Linux, iOS, Android, Web',
  applicationCategory: 'FinanceApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description:
    'Automated MT5 Trading Journal & Quantitative Performance Operating System for modern discretionary and systematic traders.',
  softwareVersion: '1.0.6'
};

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const coreFeatures = [
    {
      icon: LineChart,
      title: 'Edge Analytics',
      description: 'Track equity curves, win rates, profit factor, and drawdown.',
      badge: 'Analytics'
    },
    {
      icon: Layers,
      title: 'Trade Reconstruction',
      description: 'Reconstruct MT5 deals, partial closes, commissions, and swaps.',
      badge: 'Engine'
    },
    {
      icon: BookOpen,
      title: 'Trade Journal',
      description: 'Log confluences, timeframe bias, and execution discipline.',
      badge: 'Journal'
    },
    {
      icon: TrendingUp,
      title: 'Live Charts',
      description: 'Candlestick charts with trade markers and session overlays.',
      badge: 'Charts'
    },
    {
      icon: Scan,
      title: 'Market Scanner',
      description: 'Scan liquidity sweeps, gaps, and breakouts across pairs.',
      badge: 'Scanner'
    },
    {
      icon: Calendar,
      title: 'Economic Calendar',
      description: 'Track central bank decisions, rate changes, and volatility.',
      badge: 'Macro'
    },
    {
      icon: Scale,
      title: 'Currency Matrix',
      description: 'Compare strength across 8 currencies to spot momentum.',
      badge: 'Matrix'
    },
    {
      icon: FileText,
      title: 'Institutional Flows',
      description: 'Monitor insider transactions and institutional disclosures.',
      badge: 'Flows'
    },
    {
      icon: ShieldAlert,
      title: 'Risk Guardian',
      description: 'Set stop-loss rules, position limits, and drawdown alerts.',
      badge: 'Risk'
    },
    {
      icon: Bot,
      title: 'AI Coach',
      description: 'Get empirical feedback based on verified MT5 metrics.',
      badge: 'Coach'
    },
    {
      icon: Trophy,
      title: 'Discipline Rewards',
      description: 'Earn XP for following risk rules and journaling.',
      badge: 'Rewards'
    },
    {
      icon: Cpu,
      title: 'Multi-Account Hub',
      description: 'Manage live, demo, and prop firm accounts together.',
      badge: 'Accounts'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <MetaHead
        title="Arcade Fx — Automated MT5 Trading Journal & Performance OS"
        description="Automated MetaTrader 5 trading journal, mathematical trade reconstruction, disciplined risk parameters, and grounded AI coaching."
        canonicalPath="/"
        structuredData={[SOFTWARE_APPLICATION_SCHEMA, getFAQSchema()]}
      />
      <PublicNavbar />

      <main className="flex-1 space-y-16 sm:space-y-24 pb-20">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (CLEAN PLAIN BACKGROUND — NO JPG ASSETS)                  */}
        {/* ========================================================================= */}
        <section className="relative w-full border-b border-border/40 bg-background overflow-hidden">
          {/* Subtle accent glow matching ArcadeFX theme */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0B1B2B]/20 dark:bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Brand & Hero CTA */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Large Transparent ArcadeFX 3D Gold Logo */}
                <div className="flex justify-start">
                  <Logo size={135} className="w-auto h-28 sm:h-32 lg:h-36 object-contain drop-shadow-xs" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-foreground tracking-tight font-sans">
                    Forex Intelligence & MT5 Journal
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium max-w-xl">
                    Track trades, calculate risk, and journal MT5 performance with automated execution analytics.
                  </p>
                </div>

                {/* Target CTA Pill Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="h-11 px-8 rounded-full bg-[#38BDF8] hover:bg-[#0284c7] text-[#080D14] hover:text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(56,189,248,0.4)] hover:shadow-[0_8px_24px_rgba(56,189,248,0.6)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center transition-all duration-200"
                  >
                    {user ? 'DASHBOARD' : 'START FREE'}
                  </Link>
                  {!user && (
                    <Link
                      to="/login"
                      className="h-11 px-8 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs uppercase tracking-wider shadow-xs hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center transition-all duration-200"
                    >
                      LOG IN
                    </Link>
                  )}
                </div>

                {/* 3 Feature Badges */}
                <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#0369a1] dark:text-[#38BDF8] border border-[#38BDF8]/30 select-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" /> MT5 Sync
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#0369a1] dark:text-[#38BDF8] border border-[#38BDF8]/30 select-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" /> No Passwords
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#0369a1] dark:text-[#38BDF8] border border-[#38BDF8]/30 select-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" /> Offline Ready
                  </span>
                </div>
              </div>

              {/* Right Column: Clean Themed Showcase Card */}
              <div className="lg:col-span-5 hidden lg:block">
                <div className="rounded-3xl border border-border/60 bg-surface/70 dark:bg-[#0B1B2B]/60 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest font-semibold">
                      Arcade Fx OS v1.0.6
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-surface-elevated/70 dark:bg-[#0A1522]/80 border border-border/30 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center shrink-0 text-[#38BDF8]">
                        <LineChart className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Sub-Millisecond MT5 Deal Sync</div>
                        <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                          Instant execution reconstruction directly via local Python bridge.
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-elevated/70 dark:bg-[#0A1522]/80 border border-border/30 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center shrink-0 text-[#38BDF8]">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Quantitative Discipline Engine</div>
                        <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                          Empirical rule compliance analysis without manual spreadsheets.
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-elevated/70 dark:bg-[#0A1522]/80 border border-border/30 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center shrink-0 text-[#38BDF8]">
                        <Shield className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Zero Broker Credentials Stored</div>
                        <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                          Bank-grade security: your MT5 passwords never leave your local terminal.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CORE FEATURES (REFERENCE DESIGN SYSTEM SURFACES & ELEVATION)           */}
        {/* ========================================================================= */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-20">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
              Engineered For Modern Traders
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Trading Operating System
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Unified MT5 analytics, charting, and risk tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-surface rounded-2xl p-6 sm:p-8 border border-border hover:border-[#38BDF8]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between group card-hover-interactive"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-muted-foreground">
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-foreground group-hover:text-[#38BDF8] transition-colors tracking-tight">
                        {feat.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. TRANSPARENT TRADING PLATFORM PRICING (MATCHING billing.quantumcode.co.ke) */}
        {/* ========================================================================= */}
        <section id="pricing" className="py-16 md:py-24 bg-surface-subtle border-y border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transparent Trading Platform Pricing</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Simple Pricing That Scales With Your Trading
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Align platform costs directly with your active MetaTrader 5 accounts and journaling operations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* 1. Free Starter */}
              <div className="w-full p-6 sm:p-8 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Demo & Practice</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground tracking-tight">Free Starter</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 min-h-[40px]">
                      For discretionary and demo traders exploring automated MT5 performance analytics.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">$0</div>
                    <div className="text-xs font-bold text-muted-foreground mt-1.5">free forever · 1 active MT5 terminal</div>
                  </div>
                  <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground font-semibold">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>1 Local MT5 Terminal Bridge</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Automated Trade Journaling</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Core PnL & Win Rate Metrics</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Zero-Password Local Security</span></li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3.5 px-5 rounded-xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-elevated hover:-translate-y-0.5 active:scale-[0.98] text-foreground text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Start free trial</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              </div>

              {/* 2. Pro Trader (Featured Plan) */}
              <div className="w-full p-6 sm:p-8 rounded-2xl bg-surface border-2 border-primary shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                    Most Popular
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Live & Prop Firm</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground tracking-tight">Pro Trader</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 min-h-[40px]">
                      For active live and funded traders requiring multi-account sync and risk guardrails.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">$29</div>
                    <div className="text-xs font-bold text-muted-foreground mt-1.5">per month · billed monthly</div>
                  </div>
                  <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground font-semibold">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span className="text-foreground font-bold">Unlimited MT5 Accounts & Terminals</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Real-Time Risk Guardian Alerts</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>AI Coach Execution Breakdown</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Market Scanner Structure Detection</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Full Historical Export (CSV/JSON)</span></li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3.5 px-5 rounded-xl bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] text-primary-foreground text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Start Pro trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* 3. Institutional / Enterprise */}
              <div className="w-full p-6 sm:p-8 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border text-primary flex items-center justify-center font-bold text-sm">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trading Desks</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground tracking-tight">Institutional</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 min-h-[40px]">
                      For prop desk managers, multi-trader teams, and institutional fleet deployments.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">Custom</div>
                    <div className="text-xs font-bold text-muted-foreground mt-1.5">volume deployment · SLA included</div>
                  </div>
                  <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground font-semibold">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Dedicated Cloud Bridge Relays</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Multi-Trader Permission Controls</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Webhook & REST API Direct Feed</span></li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success shrink-0" /><span>Dedicated 24/7 Priority Support</span></li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3.5 px-5 rounded-xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-elevated hover:-translate-y-0.5 active:scale-[0.98] text-foreground text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Contact Enterprise</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CALL TO ACTION BANNER                                                  */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface rounded-2xl p-8 sm:p-12 text-center text-foreground space-y-6 shadow-sm relative overflow-hidden border border-border">
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Track Your Trading Edge
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Connect MetaTrader 5 in seconds. No broker passwords.
              </p>
              <div className="pt-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#38BDF8] hover:bg-[#0284c7] active:scale-[0.98] text-[#080D14] hover:text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(56,189,248,0.4)] transition"
                >
                  START FREE
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. FREQUENTLY ASKED QUESTIONS                                             */}
        {/* ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Key details on companion security, data, and sync.
            </p>
          </div>

          <div className="divide-y divide-border bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-xs">
            {FAQ_ITEMS.slice(0, 6).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-foreground focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-2.5 text-xs text-muted-foreground leading-relaxed pr-6 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
