import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import {
  Shield,
  Lock,
  Cpu,
  KeyRound,
  FileCheck,
  Server,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Zero-Password Security Model',
      description:
        'Alpha Coach strictly never requests, receives, transmits, or stores your broker login passwords or MT5 trading credentials.',
      points: [
        'No broker login or investor passwords stored on any server',
        'Direct local Inter-Process Communication (IPC) via desktop MT5 API',
        'Cannot place orders, execute trades, or modify account balance',
        'Eliminates credential leakage vectors entirely'
      ]
    },
    {
      icon: Cpu,
      title: 'Official MetaTrader 5 Python API',
      description:
        'The bridge connects to your locally running MT5 terminal instance on your desktop through official MetaQuotes software interfaces.',
      points: [
        'Uses standard MetaTrader5 Python package (`mt5.initialize()`)',
        'Queries only historical deals (`mt5.history_deals_get()`)',
        'Runs completely on your local operating system as a background process',
        'Full transparency: inspectable Python bridge script (`bridge/alpha_coach_bridge.py`)'
      ]
    },
    {
      icon: KeyRound,
      title: 'Device Authentication & Pairing Tokens',
      description:
        'Every bridge instance authenticates to the cloud performance engine using unique, rotatable device pairing tokens.',
      points: [
        'Bridge synchronization verified via `x-bridge-token` headers',
        'Tokens can be instantly revoked and re-generated from the Settings page',
        'No long-lived master keys stored in plaintext on disk',
        'Isolated synchronization per trading account'
      ]
    },
    {
      icon: Server,
      title: 'Encrypted TLS Transmission & Cloud RLS',
      description:
        'All analytical payloads and trade reconstructions travel over strict TLS HTTPS encryption with Row-Level Security isolation.',
      points: [
        'End-to-end TLS 1.3 encryption for all network requests',
        'Supabase Row-Level Security (RLS) guarantees complete tenant isolation',
        'Users can only query and mutate their own trading journal records',
        'Strict database foreign-key cascade integrity'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Institutional-Grade Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content-primary tracking-tight">
            Security & Trust Architecture
          </h1>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            Built from the ground up on zero-password principles. We engineer software to analyze your trade data without ever exposing your financial credentials.
          </p>
        </div>

        {/* Highlight Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-subtle framer-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-content-primary">
                Important Security Guarantee
              </h3>
              <p className="text-xs text-content-muted">
                How Alpha Coach differs fundamentally from other trading platforms
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            Traditional online trading software often asks for your broker login ID and master password to fetch trade data on their remote servers. <strong>Alpha Coach never does this.</strong> All connection to MetaTrader 5 happens locally on your own computer using the official MetaQuotes API. The Alpha Coach bridge only reads historical closed deal tickets and pushes the mathematical reconstruction to your private cloud journal.
          </p>
        </div>

        {/* Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="framer-card p-6 sm:p-8 rounded-3xl space-y-4 border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-surface-secondary border border-border-subtle text-brand-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-content-primary">
                    {pillar.title}
                  </h2>
                </div>

                <p className="text-xs text-content-secondary leading-relaxed">
                  {pillar.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  {pillar.points.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-content-muted">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Best Practices for Traders */}
        <div className="framer-card p-8 rounded-3xl border border-border-subtle space-y-4">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-content-primary">Recommended Best Practices for Users</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-content-secondary">
            <li className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>Use strong, unique passwords for your Alpha Coach account.</span>
            </li>
            <li className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>Rotate device pairing tokens periodically from the Settings menu.</span>
            </li>
            <li className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>Run the local MT5 bridge only on trusted private machines.</span>
            </li>
            <li className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>Never share your auth tokens or bridge device keys with third parties.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-3xl bg-surface-secondary border border-border-subtle space-y-4">
          <h3 className="text-xl font-extrabold text-content-primary">Experience Zero-Password Journaling</h3>
          <p className="text-xs text-content-muted max-w-xl mx-auto">
            Get started in seconds with complete peace of mind.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
