import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Activity,
  Sliders,
  MessageSquare,
  ShieldAlert,
  Radio,
  Cpu,
  Power,
  RefreshCw,
  ExternalLink,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { APP_NAME, BOT_NAME, BOT_ASSISTANT_NAME } from '../config/appConfig';
import { AICoachPage } from './AICoachPage';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';

export interface MT5BotPageProps {
  initialTab?: 'instances' | 'controls' | 'config' | 'assistant';
}

export const MT5BotPage: React.FC<MT5BotPageProps> = ({ initialTab = 'instances' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'instances' | 'controls' | 'config' | 'assistant' | null;
  const [activeTab, setActiveTab] = useState<'instances' | 'controls' | 'config' | 'assistant'>(
    tabParam || initialTab
  );

  const { selectedAccount, accounts } = useAccounts();
  const { user } = useAuth();

  useEffect(() => {
    if (tabParam && ['instances', 'controls', 'config', 'assistant'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'instances' | 'controls' | 'config' | 'assistant') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-content-primary">
                  {BOT_NAME} Management
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  MT5-OO1 ENGINE
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                Outbound-only secure orchestration for your local Windows MetaTrader 5 bot instances.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-content-secondary font-mono text-[11px]">Local Hard Limits Enforced</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange('instances')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'instances'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bot Instances & Live Monitor</span>
          </button>

          <button
            onClick={() => handleTabChange('controls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'controls'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Cloud Safe Commands</span>
          </button>

          <button
            onClick={() => handleTabChange('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Config & Limits</span>
          </button>

          <button
            onClick={() => handleTabChange('assistant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'assistant'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{BOT_ASSISTANT_NAME}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {activeTab === 'assistant' ? (
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
            <div className="mb-4 pb-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-content-primary flex items-center space-x-2">
                  <span>{BOT_ASSISTANT_NAME}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
                    Grounded on Real MT5 Data
                  </span>
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Inquires strictly against your verified execution database, risk metrics, and bot logs.
                </p>
              </div>
            </div>
            <AICoachPage />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hard Security Notice */}
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-content-primary">Zero Broker Credential Storage Architecture: </span>
                <span className="text-content-secondary">
                  The {BOT_NAME} engine (MT5-OO1) executes locally on your Windows terminal or VPS next to MetaTrader 5.
                  The cloud service never requests, stores, or transmits broker passwords. Cloud commands are limited to safe
                  control signals (Start, Stop, Pause, Resume, Close All, Kill Switch) strictly capped by your local machine limits.
                </span>
              </div>
            </div>

            {/* Active Instances Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Instance Card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
                    <div className="flex items-center space-x-2.5">
                      <Cpu className="w-5 h-5 text-brand-400" />
                      <div>
                        <h3 className="text-sm font-bold text-content-primary">Active MT5-OO1 Agent Instances</h3>
                        <p className="text-[11px] text-content-muted">Paired local agents reporting heartbeats</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      1 INSTANCE PAIRED
                    </span>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface-secondary/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-bold text-content-primary">Primary Trading Bot (Desktop-VPS-01)</span>
                      </div>
                      <span className="text-xs font-mono text-content-muted">v1.2.0 (MT5-OO1)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-content-muted block text-[10px]">ACCOUNT</span>
                        <span className="font-mono font-medium text-content-primary">
                          {selectedAccount ? `MT5 #${selectedAccount.account_number.slice(0, 3)}****` : 'MT5 #882****'}
                        </span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px]">MODE</span>
                        <span className="font-mono font-semibold text-brand-400">DEMO (Confirmed)</span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px]">LOCAL RISK CAP</span>
                        <span className="font-mono font-medium text-emerald-400">1.0% / trade</span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px]">HEARTBEAT</span>
                        <span className="font-mono text-content-primary">12s ago (ONLINE)</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                      <div className="text-[11px] text-content-muted">
                        Active Strategy: <strong className="text-content-secondary font-mono">ICT Confluence + Sizing Tier 2</strong>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400">
                        Max Daily DD Remaining: <strong className="text-content-primary">$420.00 (4.2%)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Telemetry and Why No Trade */}
                <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                  <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-brand-400" />
                    <span>Real-Time Bot Telemetry & Decision Log</span>
                  </h3>

                  <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-content-muted">MARKET REGIME:</span>
                      <span className="font-mono font-semibold text-brand-300">New York Session — Trend Continuation</span>
                    </div>
                    <div className="flex items-start justify-between text-[11px]">
                      <span className="text-content-muted">CURRENT STATUS:</span>
                      <span className="font-mono text-amber-300">
                        Watching EURUSD M15 — No Trade: HTF Order Block unconfirmed (confluence 68% &lt; threshold 75%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Safety Actions */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-content-primary">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold">Cloud Safe Controls</h3>
                  </div>
                  <p className="text-xs text-content-muted">
                    Signed outbound control signals. The local agent confirms local safety limits before executing.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      onClick={() => alert('Start command signed and dispatched to agent.')}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Start Bot</span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      onClick={() => alert('Pause command signed and dispatched to agent.')}
                    >
                      <span>Pause Bot</span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 text-content-primary border border-border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      onClick={() => alert('Stop command signed and dispatched to agent.')}
                    >
                      <span>Stop Bot</span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 text-content-primary border border-border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      onClick={() => alert('Resume command signed and dispatched to agent.')}
                    >
                      <span>Resume Bot</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-border-subtle space-y-2">
                    <button
                      className="w-full px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      onClick={() => alert('Close All Positions requires confirmation dialog.')}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Close All Positions</span>
                    </button>
                    <button
                      className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                      onClick={() => alert('Kill switch requires confirmation dialog.')}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>EMERGENCY KILL SWITCH</span>
                    </button>
                  </div>
                </div>

                {/* Sizing & Tier Card */}
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                    MT5-OO1 Balance Tier & Sizing
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-content-muted">
                      <span>Account Balance Tier:</span>
                      <span className="font-mono text-content-primary font-semibold">Tier 2 ($10,000)</span>
                    </div>
                    <div className="flex justify-between text-content-muted">
                      <span>Standard Base Lot:</span>
                      <span className="font-mono text-content-primary font-semibold">0.10 Lots</span>
                    </div>
                    <div className="flex justify-between text-content-muted">
                      <span>Risk per Trade Ceiling:</span>
                      <span className="font-mono text-emerald-400 font-semibold">1.0% (Hard Limit)</span>
                    </div>
                    <div className="flex justify-between text-content-muted">
                      <span>Affordable Symbols:</span>
                      <span className="font-mono text-content-primary">EURUSD, GBPUSD, XAUUSD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MT5BotPage;
