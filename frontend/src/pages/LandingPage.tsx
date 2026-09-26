import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { useAuth } from '../context/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import {
  DemoExecutiveOverview,
  DemoStrategyLab,
  DemoRiskGuardian,
  DemoAICoach
} from '../components/landing/LandingDemoComponents';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  LineChart,
  BookOpen,
  FlaskConical,
  ShieldAlert,
  Bot,
  Trophy,
  Cpu,
  Layers,
  Lock,
  Mic,
  TrendingUp,
  Activity
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'risk' | 'coach'>('overview');

  // Viewport Intersection Observers for Smooth Scroll Triggers
  const [statsRef, isStatsVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.2 });
  const [previewRef, isPreviewVisible] = useIntersectionObserver<HTMLElement>({ threshold: 0.15 });
  const [pipelineRef, isPipelineVisible] = useIntersectionObserver<HTMLElement>({ threshold: 0.15 });
  const [methodRef, isMethodVisible] = useIntersectionObserver<HTMLElement>({ threshold: 0.15 });
  const [featuresRef, isFeaturesVisible] = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });

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
      description: 'Reconstructs complex MT5 deal tickets into complete lifecycles: tracking scale-ins, partial closes, commissions, and swaps.',
      badge: 'Automated'
    },
    {
      icon: BookOpen,
      title: 'Subjective Journal & Review',
      description: 'Immutable MT5 execution facts paired with trader-entered setup confluences, market bias, and psychological tags.',
      badge: 'Psychology'
    },
    {
      icon: Mic,
      title: 'Voice Trade Journaling',
      description: 'Dictate trade reflections naturally. Speech NLP extracts confluences and emotions with mandatory trader confirmation.',
      badge: 'Voice AI'
    },
    {
      icon: ShieldAlert,
      title: 'Smart Risk & Position Calculator',
      description: 'Dynamic lot sizing, multi-asset pip valuation (Forex, Gold, JPY, Indices), and pre-execution compliance checks against daily limits.',
      badge: 'Risk Control'
    },
    {
      icon: FlaskConical,
      title: 'Strategy Lab & Confluences',
      description: 'Isolate win rates and expectancy across setups like Liquidity Sweeps, FVGs, Order Blocks, and Breakers.',
      badge: 'Edge Analysis'
    },
    {
      icon: Trophy,
      title: 'Discipline Master / Gamification',
      description: 'XP and progression rewards for journaling consistency, risk limit adherence, and reviewing losing trades (+50 XP).',
      badge: 'Discipline'
    },
    {
      icon: Bot,
      title: 'Grounded AI Trading Coach',
      description: 'Ask deep analytical questions grounded exclusively in your verified historical trade records — never market speculation.',
      badge: 'Empirical AI'
    },
    {
      icon: Cpu,
      title: 'Multi-Account MT5 Hub',
      description: 'Manage multiple live, demo, and prop-firm MT5 accounts (HFM, IC Markets, etc.) with consolidated or filtered analytics.',
      badge: 'Multi-Terminal'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <PublicNavbar />

      <main className="flex-1 space-y-20 sm:space-y-28 pb-20">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <section className="pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-secondary border border-border-strong text-xs font-semibold text-content-secondary shadow-sm animate-in fade-in duration-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Password Architecture</span>
            <span className="text-content-subtle">•</span>
            <span>Local MT5 Python Bridge</span>
            <span className="text-content-subtle">•</span>
            <span>Read-Only Sync</span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-primary leading-[1.1] animate-in fade-in slide-in-from-bottom-2 duration-400">
              Trade Less Blindly. <br />
              <span className="text-brand-600 dark:text-brand-400">
                Understand Your True Performance.
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500">
              Alpha Coach transforms raw MetaTrader 5 trading activity into structured journals, mathematical performance metrics, disciplined risk awareness, and data-grounded AI coaching.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all duration-150 active:scale-95"
              >
                <span>Enter Trading Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all duration-150 active:scale-95"
                >
                  <span>Start Your Trading Journal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/methodology"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-secondary hover:bg-surface-hover text-content-primary font-bold text-sm border border-border-subtle transition-all duration-150 active:scale-95"
                >
                  <span>Explore Methodology</span>
                </Link>
              </>
            )}
          </div>

          {/* Micro Trust Stats with Count-Up Animations */}
          <div
            ref={statsRef}
            className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left"
          >
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle framer-card">
              <div className="text-lg font-mono font-extrabold text-content-primary">0 Passwords</div>
              <div className="text-[11px] text-content-muted">Zero broker credentials stored</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle framer-card">
              <div className="text-lg font-mono font-extrabold text-content-primary">
                <AnimatedNumber value={90} suffix="-Day Depth" duration={1200} isVisible={isStatsVisible} />
              </div>
              <div className="text-[11px] text-content-muted">Deep historical deal sync</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle framer-card">
              <div className="text-lg font-mono font-extrabold text-content-primary">
                <AnimatedNumber value={100} suffix="% Lifecycles" duration={1400} isVisible={isStatsVisible} />
              </div>
              <div className="text-[11px] text-content-muted">Scale-ins & partials calculated</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle framer-card">
              <div className="text-lg font-mono font-extrabold text-content-primary">
                <AnimatedNumber value={100} prefix="< " suffix="ms" duration={1300} isVisible={isStatsVisible} />
              </div>
              <div className="text-[11px] text-content-muted">Sub-second math engine</div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE PRODUCT TERMINAL PREVIEW                                    */}
        {/* ========================================================================= */}
        <section
          ref={previewRef}
          className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-content-muted">Interactive Preview</h2>
              <p className="text-lg font-bold text-content-primary">Alpha Coach Performance Hub</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border-subtle rounded-xl self-start">
              {(['overview', 'strategy', 'risk', 'coach'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                    activeTab === tab
                      ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm border border-border-subtle'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {tab === 'overview' ? 'Executive Overview' : tab === 'strategy' ? 'Strategy Lab' : tab === 'risk' ? 'Risk Guardian' : 'AI Coach'}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Mock Window */}
          <div className="framer-card rounded-3xl border border-border-strong overflow-hidden shadow-2xl bg-surface">
            {/* Terminal Titlebar */}
            <div className="px-5 py-3.5 border-b border-border-subtle bg-surface-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs font-semibold text-content-muted">
                  ALPHA_COACH_TERMINAL // MT5 BRIDGE: CONNECTED
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-content-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Demonstration Dataset</span>
              </div>
            </div>

            {/* Dynamic Tab Content Display */}
            <div className="p-6 sm:p-8">
              {activeTab === 'overview' && (
                <DemoExecutiveOverview isVisible={isPreviewVisible} />
              )}
              {activeTab === 'strategy' && (
                <DemoStrategyLab isActive={activeTab === 'strategy'} isVisible={isPreviewVisible} />
              )}
              {activeTab === 'risk' && (
                <DemoRiskGuardian isActive={activeTab === 'risk'} isVisible={isPreviewVisible} />
              )}
              {activeTab === 'coach' && (
                <DemoAICoach isActive={activeTab === 'coach'} isVisible={isPreviewVisible} />
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. WHY ALPHA COACH / PROGRESSION PIPELINE                                  */}
        {/* ========================================================================= */}
        <section
          ref={pipelineRef}
          className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">The Problem & Solution</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-content-primary">Why Traders Need Alpha Coach</h3>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              MetaTrader 5 stores raw financial deal tickets — not trading context. Alpha Coach bridges the gap between raw execution and disciplined performance mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              style={{ transitionDelay: '0ms' }}
              className={`framer-card p-6 rounded-3xl space-y-3 border border-border-subtle transition-all duration-500 ${
                isPipelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="text-base font-bold text-content-primary">The Raw Deal Problem</h4>
              <p className="text-xs text-content-muted leading-relaxed">
                MT5 breaks a single trading idea into isolated entry tickets, partial take profits, and commission fees. Without reconstruction, calculating true position expectancy is nearly impossible.
              </p>
            </div>

            <div
              style={{ transitionDelay: '100ms' }}
              className={`framer-card p-6 rounded-3xl space-y-3 border border-border-subtle transition-all duration-500 ${
                isPipelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="text-base font-bold text-content-primary">Automated Lifecycle Math</h4>
              <p className="text-xs text-content-muted leading-relaxed">
                Alpha Coach automatically groups tickets into unified lifecycles, accurately computing volume-weighted prices, total commissions, swaps, net P/L, and holding durations.
              </p>
            </div>

            <div
              style={{ transitionDelay: '200ms' }}
              className={`framer-card p-6 rounded-3xl space-y-3 border border-border-subtle transition-all duration-500 ${
                isPipelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="text-base font-bold text-content-primary">Psychological & Edge Clarity</h4>
              <p className="text-xs text-content-muted leading-relaxed">
                Combine objective MT5 execution data with subjective emotional reviews, voice notes, mistake taxonomies, and AI inquiries to build unwavering discipline.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. METHODOLOGY OVERVIEW                                                    */}
        {/* ========================================================================= */}
        <section
          ref={methodRef}
          className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8"
        >
          <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border-subtle framer-card space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase">
                  <Layers className="w-3.5 h-3.5" />
                  <span>The Quantitative Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-content-primary">
                  7-Stage Lifecycle Methodology
                </h3>
                <p className="text-xs sm:text-sm text-content-muted max-w-xl">
                  Every trade passes through our deterministic mathematical framework before entering your journal.
                </p>
              </div>

              <Link
                to="/methodology"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-content-primary font-bold text-xs border border-border-subtle transition shrink-0 active:scale-95"
              >
                <span>Read Full Methodology</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {[
                { step: '01', name: 'Connect', desc: 'Official MT5 API' },
                { step: '02', name: 'Sync', desc: '3-Mo Deal Depth' },
                { step: '03', name: 'Reconstruct', desc: 'Position Lifecycle' },
                { step: '04', name: 'Analyze', desc: 'Expectancy & R-Math' },
                { step: '05', name: 'Journal', desc: 'Facts + Psychology' },
                { step: '06', name: 'Protect', desc: 'Smart Risk Guardian' },
                { step: '07', name: 'Review', desc: 'Grounded AI Coach' }
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{ transitionDelay: `${idx * 40}ms` }}
                  className={`p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1 transition-all duration-400 ${
                    isMethodVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-brand-500">{s.step}</div>
                  <div className="text-xs font-bold text-content-primary">{s.name}</div>
                  <div className="text-[10px] text-content-muted">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. CORE 12-MODULE FEATURE GRID                                            */}
        {/* ========================================================================= */}
        <section
          id="features"
          ref={featuresRef}
          className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Institutional Toolset</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-content-primary">Everything Modern MT5 Traders Need</h3>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              Designed specifically for discretionary price action, systematic algorithms, and prop firm challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              const staggerDelay = (idx % 6) * 60;
              return (
                <div
                  key={idx}
                  style={{ transitionDelay: `${staggerDelay}ms` }}
                  className={`framer-card p-6 rounded-3xl space-y-3 border border-border-subtle hover:border-border-strong transition-all duration-300 ${
                    isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-surface-secondary border border-border-subtle text-brand-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-secondary border border-border-subtle text-content-secondary">
                      {feat.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-content-primary">{feat.title}</h4>
                  <p className="text-xs text-content-muted leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. SECURITY SECTION                                                        */}
        {/* ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border-subtle framer-card space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Security Guarantees</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-content-primary">
                  Zero-Password Security Model
                </h3>
                <p className="text-xs sm:text-sm text-content-muted max-w-xl">
                  We engineered Alpha Coach so you never have to trust any remote server with your broker password.
                </p>
              </div>

              <Link
                to="/security"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-content-primary font-bold text-xs border border-border-subtle transition shrink-0 active:scale-95"
              >
                <span>View Security Specs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <h5 className="font-bold text-content-primary">0 Broker Passwords</h5>
                <p className="text-content-muted text-[11px] leading-relaxed">
                  Alpha Coach never requests or stores MT5 passwords. Connection runs locally on your desktop.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <h5 className="font-bold text-content-primary">Official Python API</h5>
                <p className="text-content-muted text-[11px] leading-relaxed">
                  Communicates directly via the official MetaTrader5 Python package installed on your PC.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <h5 className="font-bold text-content-primary">Device Tokens</h5>
                <p className="text-content-muted text-[11px] leading-relaxed">
                  Sync operations authorize through rotating device pairing keys revocable at any time.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <h5 className="font-bold text-content-primary">Encrypted TLS & RLS</h5>
                <p className="text-content-muted text-[11px] leading-relaxed">
                  All synchronization uses TLS HTTPS encryption with Row-Level Security tenant isolation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. WHO IT IS FOR                                                           */}
        {/* ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Target Audience</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-content-primary">Built For Serious Traders</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-surface border border-border-subtle framer-card space-y-2">
              <h5 className="font-bold text-content-primary text-sm">Discretionary Price Action Traders</h5>
              <p className="text-content-muted leading-relaxed">
                Traders looking to review setup execution, confluences, market bias, and psychological triggers like FOMO or impatience.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border-subtle framer-card space-y-2">
              <h5 className="font-bold text-content-primary text-sm">Prop Firm & Funded Traders</h5>
              <p className="text-content-muted leading-relaxed">
                Traders who must adhere to strict daily loss limits and maximum drawdown caps with Risk Guardian monitoring.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border-subtle framer-card space-y-2">
              <h5 className="font-bold text-content-primary text-sm">Systematic & Algorithmic Traders</h5>
              <p className="text-content-muted leading-relaxed">
                Quant analysts who need mathematical expectancy, holding duration distributions, and session profitability heatmaps.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border-subtle framer-card space-y-2">
              <h5 className="font-bold text-content-primary text-sm">Multi-Account Portfolio Operators</h5>
              <p className="text-content-muted leading-relaxed">
                Traders managing live, demo, and challenge accounts simultaneously across various brokers with consolidated views.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FINAL CONVERSION CALL TO ACTION                                        */}
        {/* ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-secondary border border-border-strong text-center space-y-6 framer-card">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Get Started Today</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              Turn Your Trading History Into Insight.
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary max-w-xl mx-auto leading-relaxed">
              Connect your local MT5 terminal in minutes. Reconstruct past trade lifecycles, eliminate recurring psychological friction, and journal with mathematical clarity.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition active:scale-95"
              >
                <span>Create Your Alpha Coach Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-2xl text-xs font-bold text-content-primary hover:bg-surface border border-border-subtle transition active:scale-95"
              >
                Sign In to Terminal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
