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
  FileText
} from 'lucide-react';
import { ArcadeFxLogo } from '../components/common/AlphaCoachLogo';

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
      title: 'Performance & Edge Analytics',
      description: 'Live high-water mark equity curves, net profit, win rate, profit factor, max drawdown, and mathematical expectancy.',
      badge: 'Core Analytics'
    },
    {
      icon: Layers,
      title: 'Trade Reconstruction Engine',
      description: 'Reconstructs complex MT5 deal tickets into complete lifecycles: scale-ins, partial closes, commissions, and swaps.',
      badge: 'Automated'
    },
    {
      icon: BookOpen,
      title: 'Structured Journal & Confluences',
      description: 'Pair immutable MT5 execution tickets with your market bias, entry reasons, timeframe alignment, and psychology.',
      badge: 'Journaling'
    },
    {
      icon: TrendingUp,
      title: 'Interactive Multi-Asset Charts',
      description: 'Full-featured TradingView and lightweight charts with multi-timeframe candle sync and technical indicators.',
      badge: 'Charting'
    },
    {
      icon: Scan,
      title: 'Real-Time Market Scanner',
      description: 'Monitor liquidity sweeps, fair value gaps, order blocks, and key breakout levels across Forex, Gold, and Indices.',
      badge: 'Scanner'
    },
    {
      icon: Calendar,
      title: 'Macro & Economic Calendar',
      description: 'High-impact central bank announcements, non-farm payrolls, CPI releases, and historical volatility impacts.',
      badge: 'Macro'
    },
    {
      icon: Scale,
      title: 'Currency Strength Matrix',
      description: 'Dynamic 8-major currency momentum matrix to pair strongest with weakest currencies for high-probability setups.',
      badge: 'Currency Matrix'
    },
    {
      icon: FileText,
      title: 'SEC & Institutional Tracker',
      description: 'Track institutional insider disclosures, politician stock transactions, and large corporate filings.',
      badge: 'Institutional'
    },
    {
      icon: ShieldAlert,
      title: 'Risk Guardian & Position Sizing',
      description: 'Strict account risk parameters, dynamic pip valuation, and automated drawdown alerts.',
      badge: 'Risk Control'
    },
    {
      icon: Bot,
      title: 'Empirical AI Trading Coach',
      description: 'Context-grounded analytical feedback derived exclusively from your verified MT5 execution statistics.',
      badge: 'AI Coach'
    },
    {
      icon: Trophy,
      title: 'Discipline Master / Rewards',
      description: 'XP progression rewards for journaling consistency, sticking to risk limits, and reviewing losing trades.',
      badge: 'Discipline'
    },
    {
      icon: Cpu,
      title: 'Multi-Account MT5 Hub',
      description: 'Manage multiple live, demo, and prop-firm MT5 accounts (HFM, IC Markets, FTMO, etc.) in one unified workspace.',
      badge: 'Multi-Terminal'
    }
  ];

  return (
    <div className="min-h-screen bg-page text-content-primary flex flex-col antialiased">
      <MetaHead
        title="Arcade Fx — Automated MT5 Trading Journal & Performance OS"
        description="Automated MetaTrader 5 trading journal, mathematical trade reconstruction, disciplined risk parameters, and grounded AI coaching."
        canonicalPath="/"
        structuredData={[SOFTWARE_APPLICATION_SCHEMA, getFAQSchema()]}
      />
      <PublicNavbar />

      <main className="flex-1 space-y-16 sm:space-y-24 pb-20">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (REFERENCE A VISUAL SYSTEM)                               */}
        {/* ========================================================================= */}
        <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center justify-start overflow-hidden bg-[#003859]">
          {/* Aerial Turquoise Water Canvas (Reference A) */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out scale-105"
            style={{
              backgroundImage: "url('/brand/water-aerial.svg'), radial-gradient(circle at 65% 45%, #149fa8 0%, #08818c 35%, #005368 70%, #023b4f 100%)",
              backgroundBlendMode: 'screen'
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto">
            {/* Left Inset White Card with Torn-Paper Right Edge (Reference A) */}
            <div className="w-full max-w-[500px] lg:w-[45%] lg:max-w-[480px]">
              <div className="torn-paper-card torn-edge-right torn-edge-bottom bg-white dark:bg-[#151922] p-8 sm:p-10 lg:pr-14 shadow-2xl rounded-2xl lg:rounded-r-none transition-all duration-300">
                {/* Logo in Sleek Dark Navy Container */}
                <div className="mb-5 flex items-center">
                  <div className="bg-[#0A0F1D] px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm">
                    <ArcadeFxLogo size="sm" showWordmark={true} />
                  </div>
                </div>

                {/* Hero Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#00030C] dark:text-white tracking-[0.05em] uppercase mb-3 font-sans leading-tight">
                  NEXT-GEN FOREX INTELLIGENCE
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Zero broker passwords. Link MetaTrader 5 via companion bridge for automatic deal reconstruction, risk calculations, and psychological journaling.
                </p>

                {/* CTA Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="btn-auth-primary text-center text-xs"
                  >
                    {user ? 'GO TO DASHBOARD' : 'GET STARTED'}
                  </Link>

                  {!user && (
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#052728] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      Sign In
                    </Link>
                  )}
                </div>

                {/* Quick Feature Badges */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B3EFEF]/40 text-[#052728] dark:text-[#72E4E9]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#18837E]" /> MT5 Auto-Sync
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B3EFEF]/40 text-[#052728] dark:text-[#72E4E9]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#18837E]" /> Zero Broker Passwords
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B3EFEF]/40 text-[#052728] dark:text-[#72E4E9]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#18837E]" /> PWA Offline Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Right Headline Anchored Bottom-Right over Aerial Water (Reference A) */}
            <div className="hidden lg:flex flex-col items-end justify-end text-right p-8 lg:p-12 self-end mt-auto pointer-events-none select-none">
              <h2
                className="text-4xl xl:text-5xl font-black text-white uppercase tracking-[0.12em] font-sans drop-shadow-[0_4px_16px_rgba(0,30,45,0.7)]"
                style={{ textShadow: '0 4px 18px rgba(0, 30, 45, 0.85)' }}
              >
                ARCADE FX
              </h2>
              <p
                className="text-sm xl:text-base font-bold text-teal-100 uppercase tracking-[0.2em] mt-1.5 drop-shadow-[0_2px_8px_rgba(0,30,45,0.7)]"
                style={{ textShadow: '0 2px 10px rgba(0, 30, 45, 0.85)' }}
              >
                FOREX INTELLIGENCE & MT5 JOURNAL
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CORE FEATURES (REFERENCE B CARD STYLE: CLEAN WHITE ROUNDED TILES)     */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#18837E] dark:text-[#3FAE96]">
              Engineered For Modern Traders
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121212] dark:text-white tracking-tight">
              A Complete Operating System for Discretionary & Systematic Edge
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Replace fragmented spreadsheets and manual trade logs with a unified, real-time trading ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#19191C] rounded-2xl p-6 border border-[#EBECEF] dark:border-[#2C2C32] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#F6F7FB] dark:bg-[#232328] flex items-center justify-center text-[#3FAE96] dark:text-[#48B89F] group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#121212] dark:text-white group-hover:text-[#3FAE96] dark:group-hover:text-[#48B89F] transition-colors">
                        {feat.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
        {/* 3. CALL TO ACTION BANNER                                                  */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121212] dark:bg-[#19191C] rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden border border-white/10">
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Ready to Upgrade Your Trading Discipline?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect your MetaTrader 5 account in seconds via the local Python companion bridge. Zero credentials shared.
              </p>
              <div className="pt-3">
                <Link
                  to="/register"
                  className="btn-auth-primary text-xs"
                >
                  CREATE FREE ACCOUNT
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FREQUENTLY ASKED QUESTIONS                                             */}
        {/* ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#121212] dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers on MT5 companion security, data integrity, and privacy.
            </p>
          </div>

          <div className="divide-y divide-[#EBECEF] dark:divide-[#2C2C32] bg-white dark:bg-[#19191C] rounded-2xl border border-[#EBECEF] dark:border-[#2C2C32] p-4 sm:p-6 shadow-sm">
            {FAQ_ITEMS.slice(0, 6).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-[#121212] dark:text-white focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-6 animate-in fade-in duration-200">
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
