import React from 'react';
import { Link } from 'react-router-dom';
import { AlphaCoachLogo } from '../common/AlphaCoachLogo';
import { ShieldCheck, Lock, Activity, ArrowUpRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-subtle bg-surface transition-colors duration-200">
      {/* Top Banner / Security Highlight */}
      <div className="border-b border-border-subtle py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-content-secondary">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-content-primary mb-1">Zero-Password Architecture</h4>
              <p className="text-content-muted leading-relaxed">
                Alpha Coach never asks for, receives, or stores your MT5 or broker login credentials.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-content-primary mb-1">Official MetaTrader 5 API</h4>
              <p className="text-content-muted leading-relaxed">
                Uses the official local MetaTrader5 Python API for deterministic, read-only deal history synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-content-primary mb-1">Quantitative Math Engine</h4>
              <p className="text-content-muted leading-relaxed">
                Reconstructs complex scale-ins, partial exits, commissions, and SL/TP hits with complete mathematical fidelity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/">
              <AlphaCoachLogo size="lg" showWordmark={true} />
            </Link>
            <p className="text-xs text-content-muted max-w-sm leading-relaxed">
              Automated MT5 Trading Journal & Quantitative Performance Operating System for modern discretionary and systematic traders.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-[11px] font-mono text-content-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bridge Protocol v1.0 • TLS Encrypted</span>
            </div>
          </div>

          {/* Product Modules */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-content-primary uppercase tracking-wider">Product OS</h5>
            <ul className="space-y-2 text-xs text-content-muted">
              <li><Link to="/login" className="hover:text-content-primary transition">Performance Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Trade Reconstruction</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Strategy Lab & Confluences</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Trader DNA Profile</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Risk Guardian</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Grounded AI Coach</Link></li>
              <li><Link to="/login" className="hover:text-content-primary transition">Multi-Account Hub</Link></li>
            </ul>
          </div>

          {/* Methodology & Architecture */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-content-primary uppercase tracking-wider">Methodology</h5>
            <ul className="space-y-2 text-xs text-content-muted">
              <li><Link to="/methodology" className="hover:text-content-primary transition">7-Stage Quantitative Engine</Link></li>
              <li><Link to="/methodology#reconstruction" className="hover:text-content-primary transition">Lifecycle Reconstruction</Link></li>
              <li><Link to="/methodology#sessions" className="hover:text-content-primary transition">Session Heatmaps</Link></li>
              <li><Link to="/methodology#psychology" className="hover:text-content-primary transition">Mistake Taxonomy</Link></li>
              <li><Link to="/security" className="hover:text-content-primary transition">Security Architecture</Link></li>
              <li><Link to="/security#bridge" className="hover:text-content-primary transition">Local MT5 Bridge</Link></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-content-primary uppercase tracking-wider">Legal & Compliance</h5>
            <ul className="space-y-2 text-xs text-content-muted">
              <li><Link to="/terms" className="hover:text-content-primary transition">Terms & Conditions</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-content-primary transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-content-primary transition">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-content-primary transition">Cookie Policy</Link></li>
              <li><a href="#disclaimer" className="hover:text-content-primary transition">Financial Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Financial Disclaimer Banner */}
        <div id="disclaimer" className="mt-12 pt-8 border-t border-border-subtle space-y-4">
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle text-[11px] text-content-subtle leading-relaxed space-y-2">
            <p className="font-bold text-content-muted uppercase tracking-wider">
              Important Financial & Analytical Disclaimer
            </p>
            <p>
              Alpha Coach is a software tool developed solely for trade recording, historical analysis, mathematical performance metrics, risk awareness, and personal journaling. Alpha Coach does not provide personalized investment advice, trading recommendations, or financial brokerage services. Trading foreign exchange, commodities, indices, cryptocurrencies, and equities on margin carries high risk and may not be suitable for all investors. Past performance recorded in historical journals does not guarantee future results.
            </p>
          </div>

          {/* Copyright & Entity Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted pt-4">
            <div>
              &copy; {new Date().getFullYear()} [COMPANY LEGAL NAME] (Alpha Coach). All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Jurisdiction: [GOVERNING JURISDICTION]</span>
              <span>•</span>
              <Link to="/privacy" className="hover:text-content-primary transition">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-content-primary transition">Terms</Link>
              <span>•</span>
              <Link to="/security" className="hover:text-content-primary transition">Security</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
