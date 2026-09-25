import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import {
  Cpu,
  RefreshCw,
  Layers,
  LineChart,
  BookOpen,
  Dna,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const stages = [
    {
      step: '01',
      title: 'CONNECT',
      subtitle: 'Official MetaTrader 5 Python API Integration',
      icon: Cpu,
      color: 'text-blue-500',
      description:
        'The Alpha Coach Local Bridge establishes an official IPC link directly to your locally installed MetaTrader 5 desktop client using `mt5.initialize()`. It verifies terminal communication without requiring or handling broker passwords.',
      details: [
        'Deterministic local socket communication',
        'Direct connection to MT5 terminal deal database',
        'Zero intermediate cloud proxies for credentials',
        'Read-only querying of closed orders and executed deals'
      ]
    },
    {
      step: '02',
      title: 'SYNCHRONIZE',
      subtitle: 'Incremental 3-Month Deal Synchronization',
      icon: RefreshCw,
      color: 'text-indigo-500',
      description:
        'The bridge pulls up to 90 days of executed historical deals via `mt5.history_deals_get()`. Each synchronization transmits only newly executed deals via encrypted HTTPS TLS, eliminating duplicate ingestion with idempotent unique deal IDs.',
      details: [
        'Idempotent ingestion using MT5 Ticket and Position IDs',
        'Encrypted transmission with rotating device pairing tokens',
        'Automatic incremental batching for high-frequency traders',
        'Full historical depth covering multiple market regimes'
      ]
    },
    {
      step: '03',
      title: 'RECONSTRUCT',
      subtitle: 'Position Lifecycle & Complex Order Math',
      icon: Layers,
      color: 'text-purple-500',
      description:
        'Raw MT5 deals do not reflect true trading intent. The Alpha Coach Reconstruction Engine groups multiple tickets into complete position lifecycles: tracking entry deals, scale-in additions, partial closes, final exits, commissions, and overnight swaps.',
      details: [
        'Weighted average entry and exit price calculations',
        'Accurate gross P/L, commissions, and swap fee accounting',
        'Exit reason classification (SL_HIT, TP_HIT, MANUAL, SO_HIT)',
        'Initial risk and R-Multiple realization math'
      ]
    },
    {
      step: '04',
      title: 'ANALYZE',
      subtitle: 'Quantitative Risk & Expectancy Calculations',
      icon: LineChart,
      color: 'text-emerald-500',
      description:
        'Reconstructed positions feed into mathematical performance algorithms. The engine computes mathematical expectancy, profit factor, win/loss rate distributions, peak-to-trough drawdowns, and holding time efficiency.',
      details: [
        'Mathematical Expectancy: E = (Win% × AvgWin) - (Loss% × AvgLoss)',
        'Profit Factor & Recovery Factor tracking',
        'Peak-to-trough high-water mark drawdown curves',
        'Long vs Short execution asymmetry analysis'
      ]
    },
    {
      step: '05',
      title: 'JOURNAL',
      subtitle: 'Objective Facts vs Subjective Emotional State',
      icon: BookOpen,
      color: 'text-amber-500',
      description:
        'Every reconstructed trade becomes an immutable journal entry. Traders record setup confluence tags, market bias, and psychological states (FOMO, Revenge, Impatience, Disciplined) with clear separation between objective data and human reflections.',
      details: [
        'Strict separation between MT5 immutable facts and subjective notes',
        'Voice Journal with NLP extraction requiring trader confirmation',
        'Mistake taxonomy tracking (Moved SL, Chased, Oversized, Early Exit)',
        'Interactive Trading Calendar with daily net P/L distributions'
      ]
    },
    {
      step: '06',
      title: 'IDENTIFY',
      subtitle: 'Trader DNA & Session Intelligence Heatmaps',
      icon: Dna,
      color: 'text-cyan-500',
      description:
        'Aggregates empirical trade data into a descriptive Trader DNA profile and 24x7 hourly session heatmaps, highlighting which sessions (London, New York, Overlap, Asia) and setups yield genuine statistical edge.',
      details: [
        '24x7 hourly trading density and profitability heatmaps',
        'Session classification: London, NY, Overlap, Asia, Off-Hours',
        'Confluence Matrix: Win rate per setup combination',
        'Behavioral friction points and risk leak identification'
      ]
    },
    {
      step: '07',
      title: 'REVIEW',
      subtitle: 'Grounded AI Trading Coach Inquiries',
      icon: Bot,
      color: 'text-rose-500',
      description:
        'The Grounded AI Trading Coach acts as a mirror to your own historical records. It answers analytical questions grounded strictly in your verified MT5 database without offering speculative market forecasts or financial advice.',
      details: [
        'Grounded exclusively in empirical user journal records',
        'Highlights recurring psychological pitfalls during drawdown',
        'Identifies statistical differences between winning & losing setups',
        'Objective, unclouded post-session performance reviews'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>The Quantitative Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content-primary tracking-tight">
            How Alpha Coach Works
          </h1>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            A deterministic 7-stage pipeline that transforms raw MetaTrader 5 deal tickets into structured trade lifecycles, rigorous mathematical analytics, and data-grounded performance insights.
          </p>
        </div>

        {/* 7-Stage Timeline */}
        <div className="space-y-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="framer-card p-6 sm:p-8 rounded-3xl space-y-4 border border-border-subtle hover:border-border-strong transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono font-extrabold text-content-subtle">
                      {stage.step}
                    </span>
                    <div className={`p-3 rounded-2xl bg-surface-secondary border border-border-subtle ${stage.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-content-muted">
                        Stage {stage.step} — {stage.title}
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-content-primary">
                        {stage.subtitle}
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed pl-0 sm:pl-16">
                  {stage.description}
                </p>

                <div className="pl-0 sm:pl-16 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {stage.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-content-muted">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Summary */}
        <div className="framer-card p-8 rounded-3xl border border-border-subtle space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-content-primary">Integrity & Data Segregation</h3>
              <p className="text-xs text-content-muted">Strict architectural boundaries guarantee empirical truth</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <h4 className="font-bold text-content-primary">1. Objective MT5 Facts</h4>
              <p className="text-content-muted leading-relaxed">
                Tickets, execution timestamps, volume lots, prices, commissions, and gross/net profit are immutable and ingested directly from MT5 deals.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <h4 className="font-bold text-content-primary">2. Subjective Trader Input</h4>
              <p className="text-content-muted leading-relaxed">
                Confluences, psychological tags, and mistake classifications are explicitly marked as trader-entered and never overwrite verifiable MT5 facts.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
              <h4 className="font-bold text-content-primary">3. AI Inferences</h4>
              <p className="text-content-muted leading-relaxed">
                Coaching reflections and patterns are clearly separated as AI hypotheses, requiring trader review and validation before incorporation.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center p-8 rounded-3xl bg-surface-secondary border border-border-subtle space-y-4">
          <h3 className="text-xl font-extrabold text-content-primary">Ready to Experience Empirical Journaling?</h3>
          <p className="text-xs sm:text-sm text-content-muted max-w-xl mx-auto">
            Connect your local MT5 terminal in minutes. Reconstruct your trading history with complete mathematical fidelity.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 rounded-xl text-xs font-bold text-content-primary hover:bg-surface border border-border-subtle transition"
            >
              Sign In to Terminal
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
