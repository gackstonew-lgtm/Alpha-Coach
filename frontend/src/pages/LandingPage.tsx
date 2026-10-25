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
import { Logo } from '../components/common/Logo';
import { HeroVideo } from '../components/common/HeroVideo';

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
        {/* 1. HERO SECTION (SIDE-BY-SIDE: CONTENT ON WHITE + CROPPED WATER/KAYAK VIDEO) */}
        {/* ========================================================================= */}
        <section className="relative w-full min-h-[580px] lg:min-h-[660px] flex flex-col lg:flex-row items-stretch justify-start overflow-hidden bg-white">
          {/* Mobile & Tablet Portrait Hero Banner (< 1024px) */}
          <div className="relative w-full lg:hidden flex flex-col">
            <div className="relative w-full h-[32vh] min-h-[220px] max-h-[300px] overflow-hidden shrink-0 select-none bg-[#032630]">
              <HeroVideo objectPosition="object-[right_center]" />
              <div className="absolute -bottom-1 left-0 right-0 h-6 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-white">
                  <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,80 L1200,120 L0,120 Z" />
                </svg>
              </div>
            </div>

            {/* Mobile / Tablet Content under banner */}
            <div className="bg-white px-6 py-8 sm:px-10">
              <div className="max-w-[440px] mx-auto space-y-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B4D] tracking-[0.1em] uppercase font-sans leading-tight">
                  NEXT-GEN FOREX INTELLIGENCE
                </h1>
                <p className="text-xs sm:text-sm text-[#0F1B4D]/80 leading-relaxed">
                  Zero broker passwords. Link MetaTrader 5 via companion bridge for automatic deal reconstruction, risk calculations, and psychological journaling.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="h-11 px-8 rounded-full bg-gradient-to-r from-[#2CC5C0] to-[#1BA9B0] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(44,197,192,0.35)] hover:shadow-[0_8px_24px_rgba(44,197,192,0.5)] flex items-center justify-center transition-all"
                  >
                    {user ? 'GO TO DASHBOARD' : 'GET STARTED'}
                  </Link>
                  {!user && (
                    <Link
                      to="/login"
                      className="h-11 px-6 rounded-full border-2 border-[#1BA9B0]/40 text-[#0F1B4D] font-bold text-xs uppercase tracking-wider hover:bg-[#BFEFEC]/30 flex items-center justify-center transition-all"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-[#0F1B4D]/70">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> MT5 Auto-Sync
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> Zero Broker Passwords
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> PWA Offline Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Left Content Column (Solid White Container Beside Video) */}
          <div className="relative z-10 hidden lg:flex flex-col justify-center w-full lg:w-[48%] xl:w-[45%] bg-white pl-16 xl:pl-24 2xl:pl-32 pr-8 py-16 shrink-0">
            <div className="w-full max-w-[480px]">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-[#BFEFEC]/70 text-[#0F1B4D] text-[11px] font-bold uppercase tracking-wider">
                  Quantitative Forex Terminal
                </div>
                <h1 className="text-3xl xl:text-4xl font-extrabold text-[#0F1B4D] tracking-[0.12em] uppercase font-sans leading-tight">
                  NEXT-GEN FOREX INTELLIGENCE
                </h1>
                <p className="text-xs sm:text-sm text-[#0F1B4D]/80 leading-relaxed">
                  Zero broker passwords. Link MetaTrader 5 via companion bridge for automatic deal reconstruction, risk calculations, and psychological journaling.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="h-11 px-8 rounded-full bg-gradient-to-r from-[#2CC5C0] to-[#1BA9B0] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(44,197,192,0.35)] hover:shadow-[0_8px_24px_rgba(44,197,192,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center transition-all"
                  >
                    {user ? 'GO TO DASHBOARD' : 'GET STARTED'}
                  </Link>
                  {!user && (
                    <Link
                      to="/login"
                      className="h-11 px-6 rounded-full border-2 border-[#1BA9B0]/40 text-[#0F1B4D] font-bold text-xs uppercase tracking-wider hover:bg-[#BFEFEC]/30 flex items-center justify-center transition-all"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
                <div className="pt-5 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-[#0F1B4D]/70">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> MT5 Auto-Sync
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> Zero Broker Passwords
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFEFEC]/60 text-[#0F1B4D]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BA9B0]" /> PWA Offline Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Right Video Column (Cropped strictly to ocean/kayak, sitting beside content) */}
          <div className="hidden lg:block relative flex-1 min-h-[580px] lg:min-h-[660px] overflow-hidden select-none pointer-events-none bg-[#032630]">
            <HeroVideo objectPosition="object-[right_center]" />
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
