import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Lock,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Globe,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Bell,
  Smartphone
} from 'lucide-react';
import { APP_NAME, BOT_NAME, BOT_ASSISTANT_NAME } from '../config/appConfig';
import { AICoachPage } from './AICoachPage';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { botApi, BotInstance, BotCommand } from '../services/botApi';

export interface MT5BotPageProps {
  initialTab?: 'instances' | 'controls' | 'config' | 'telemetry' | 'sizing' | 'assistant';
}

export const MT5BotPage: React.FC<MT5BotPageProps> = ({ initialTab = 'instances' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'instances' | 'controls' | 'config' | 'telemetry' | 'sizing' | 'assistant' | null;
  const [activeTab, setActiveTab] = useState<'instances' | 'controls' | 'config' | 'telemetry' | 'sizing' | 'assistant'>(
    tabParam || initialTab
  );

  const { selectedAccount, accounts } = useAccounts();
  const { user } = useAuth();

  // Fleet state
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isLoadingFleet, setIsLoadingFleet] = useState<boolean>(true);
  const [commands, setCommands] = useState<BotCommand[]>([]);

  // Modals state
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [pairingCode, setPairingCode] = useState<string>('');
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string>('');
  const [isGeneratingPairCode, setIsGeneratingPairCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Confirmation Modals
  const [confirmModalType, setConfirmModalType] = useState<'close_all' | 'kill_switch' | null>(null);
  const [confirmInputText, setConfirmInputText] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Telegram Linking Modal
  const [showTelegramModal, setShowTelegramModal] = useState<boolean>(false);
  const [telegramCode, setTelegramCode] = useState<string>('');
  const [copiedTelegram, setCopiedTelegram] = useState<boolean>(false);

  // Config Form State
  const [configSymbols, setConfigSymbols] = useState<string[]>(['EURUSD', 'GBPUSD', 'XAUUSD']);
  const [configRiskPercent, setConfigRiskPercent] = useState<number>(1.0);
  const [configMaxTrades, setConfigMaxTrades] = useState<number>(5);
  const [configSessions, setConfigSessions] = useState<{ london: boolean; new_york: boolean; asian: boolean }>({
    london: true,
    new_york: true,
    asian: false
  });
  const [configNotifications, setConfigNotifications] = useState<{ telegram: boolean; email: boolean; push: boolean }>({
    telegram: true,
    email: true,
    push: false
  });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Fetch Instances
  const loadFleet = useCallback(async () => {
    try {
      const data = await botApi.getInstances();
      setInstances(data);
      if (data.length > 0 && !selectedInstanceId) {
        setSelectedInstanceId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch bot fleet:', err);
    } finally {
      setIsLoadingFleet(false);
    }
  }, [selectedInstanceId]);

  // Fetch Commands for Selected Instance
  const loadCommands = useCallback(async (instId: string) => {
    if (!instId) return;
    try {
      const cmds = await botApi.getCommands(instId);
      setCommands(cmds);
    } catch (err) {
      console.warn('Failed to fetch commands:', err);
    }
  }, []);

  useEffect(() => {
    loadFleet();
    const interval = setInterval(() => {
      loadFleet();
      if (selectedInstanceId) {
        loadCommands(selectedInstanceId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadFleet, loadCommands, selectedInstanceId]);

  useEffect(() => {
    if (tabParam && ['instances', 'controls', 'config', 'telemetry', 'sizing', 'assistant'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'instances' | 'controls' | 'config' | 'telemetry' | 'sizing' | 'assistant') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const selectedInstance = useMemo(() => {
    return instances.find(i => i.id === selectedInstanceId) || instances[0] || null;
  }, [instances, selectedInstanceId]);

  // Sizing Calculation based on MT5-OO1 balance tier rules
  const balance = selectedAccount ? selectedAccount.balance : 10000;
  const sizingInfo = useMemo(() => {
    let tier = 'Tier 1';
    let baseLot = 0.05;
    let minBalance = 1000;

    if (balance >= 100000) {
      tier = 'Tier 4 (Institutional)';
      baseLot = 1.0;
      minBalance = 100000;
    } else if (balance >= 50000) {
      tier = 'Tier 3 (Pro Desk)';
      baseLot = 0.5;
      minBalance = 50000;
    } else if (balance >= 5000) {
      tier = 'Tier 2 (Standard)';
      baseLot = 0.1;
      minBalance = 5000;
    } else {
      tier = 'Tier 1 (Micro / Starter)';
      baseLot = 0.02;
      minBalance = 500;
    }

    const calculatedRiskDollars = (balance * (configRiskPercent / 100)).toFixed(2);

    return {
      tier,
      baseLot,
      balance,
      calculatedRiskDollars,
      affordability: [
        { symbol: 'EURUSD', affordable: balance >= 500, marginRequired: '$33.30', tickValue: '$10.00 / lot' },
        { symbol: 'GBPUSD', affordable: balance >= 500, marginRequired: '$35.00', tickValue: '$10.00 / lot' },
        { symbol: 'USDJPY', affordable: balance >= 500, marginRequired: '$30.00', tickValue: '$6.70 / lot' },
        { symbol: 'XAUUSD (Gold)', affordable: balance >= 2000, marginRequired: '$200.00', tickValue: '$10.00 / 0.1 lot' },
        { symbol: 'BTCUSD', affordable: balance >= 5000, marginRequired: '$450.00', tickValue: '$1.00 / 0.01 lot' }
      ]
    };
  }, [balance, configRiskPercent]);

  // One-time Pairing Code Generation
  const handleOpenPairModal = async () => {
    setShowPairModal(true);
    setIsGeneratingPairCode(true);
    try {
      const res = await botApi.generatePairingCode();
      setPairingCode(res.pairingCode);
      setPairingExpiresAt(res.expiresAt);
    } catch (err: any) {
      alert(`Failed to generate pairing code: ${err.message}`);
    } finally {
      setIsGeneratingPairCode(false);
    }
  };

  // Safe Cloud Command Dispatch
  const handleSendCommand = async (
    cmdType: 'start' | 'stop' | 'pause' | 'resume' | 'close_all' | 'kill_switch',
    payload: Record<string, any> = {}
  ) => {
    if (!selectedInstance) return;
    setIsDispatching(true);
    setDispatchFeedback(null);
    try {
      const res = await botApi.dispatchCommand(selectedInstance.id, cmdType, payload);
      if (res.success) {
        setDispatchFeedback({
          type: 'success',
          message: `Command [${cmdType.toUpperCase()}] signed and dispatched to agent (ID: ${res.commandId?.slice(0, 8)}).`
        });
        loadCommands(selectedInstance.id);
      } else {
        setDispatchFeedback({
          type: 'error',
          message: res.error || 'Command dispatch rejected.'
        });
      }
    } catch (err: any) {
      setDispatchFeedback({
        type: 'error',
        message: err.message || 'Network error dispatching command.'
      });
    } finally {
      setIsDispatching(false);
      setConfirmModalType(null);
      setConfirmInputText('');
    }
  };

  // Save Safe Configuration
  const handleSaveConfig = async () => {
    if (!selectedInstance) return;
    setIsSavingConfig(true);
    setDispatchFeedback(null);
    try {
      const res = await botApi.updateConfig(selectedInstance.id, {
        symbolsEnabled: configSymbols,
        sessionFilters: configSessions,
        riskPercent: configRiskPercent,
        maxTradesPerDay: configMaxTrades,
        notifications: configNotifications
      });
      if (res.success) {
        setDispatchFeedback({
          type: 'success',
          message: `Safe config v${res.version} dispatched to agent and verified against local limits.`
        });
        loadCommands(selectedInstance.id);
      } else {
        setDispatchFeedback({
          type: 'error',
          message: res.error || 'Config update rejected.'
        });
      }
    } catch (err: any) {
      setDispatchFeedback({
        type: 'error',
        message: err.message || 'Failed to save config.'
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Generate Telegram Link Code
  const handleOpenTelegramModal = async () => {
    setShowTelegramModal(true);
    try {
      const res = await botApi.generateTelegramLinkCode();
      setTelegramCode(res.linkCode);
    } catch (err: any) {
      alert(`Failed to generate Telegram link code: ${err.message}`);
    }
  };

  const isSelectedInstanceOnline = selectedInstance?.status === 'ONLINE';
  const localCeiling = selectedInstance?.max_risk_pct_ceiling ?? 1.0;

  return (
    <div className="min-h-screen bg-canvas text-content-primary pb-28 md:pb-12">
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
                  {BOT_NAME} Orchestration
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
            <button
              onClick={handleOpenTelegramModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 border border-border text-xs text-content-secondary hover:text-content-primary transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Link Telegram</span>
            </button>
            <button
              onClick={handleOpenPairModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Pair MT5 Machine</span>
            </button>
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
            <Cpu className="w-3.5 h-3.5" />
            <span>Fleet & Instances ({instances.length})</span>
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
            <span>Cloud Safe Controls</span>
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
            onClick={() => handleTabChange('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Telemetry & Signals</span>
          </button>

          <button
            onClick={() => handleTabChange('sizing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'sizing'
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Account Tier & Sizing</span>
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
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Feedback Alert */}
        {dispatchFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              dispatchFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {dispatchFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{dispatchFeedback.message}</span>
            </div>
            <button
              onClick={() => setDispatchFeedback(null)}
              className="text-content-muted hover:text-content-primary"
            >
              &times;
            </button>
          </div>
        )}

        {/* Hard Rules Security Notice */}
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 flex items-start space-x-3">
          <Lock className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-content-primary">Zero Broker Credential Storage Architecture: </span>
            <span className="text-content-secondary">
              The {BOT_NAME} engine (MT5-OO1) executes locally on your Windows terminal or VPS next to MetaTrader 5.
              The cloud service never requests, stores, or transmits broker passwords. Cloud commands are limited to safe
              control signals (Start, Stop, Pause, Resume, Close All, Kill Switch) strictly capped by your local machine limits.
              Local limits ({localCeiling}% max risk) always win over cloud settings.
            </span>
          </div>
        </div>

        {/* TAB 1: FLEET & INSTANCES */}
        {activeTab === 'instances' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-content-primary">Paired Bot Instances</h2>
                <p className="text-xs text-content-muted">Connected local Windows MT5-OO1 terminals reporting telemetry</p>
              </div>
              <button
                onClick={loadFleet}
                className="p-1.5 rounded-lg bg-surface-secondary border border-border text-content-muted hover:text-content-primary text-xs flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {instances.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-4">
                <Cpu className="w-12 h-12 text-content-muted mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-content-primary">No MT5 Bot Instances Paired Yet</h3>
                  <p className="text-xs text-content-muted max-w-md mx-auto mt-1">
                    Pair your Windows PC or VPS where MetaTrader 5 is installed. The agent will connect securely with outbound HTTPS.
                  </p>
                </div>
                <button
                  onClick={handleOpenPairModal}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Generate 10-Minute Pairing Code
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances.map(inst => {
                  const isOnline = inst.status === 'ONLINE';
                  const isStale = inst.status === 'STALE';
                  const isSelected = inst.id === selectedInstance?.id;

                  return (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstanceId(inst.id)}
                      className={`cursor-pointer rounded-xl border p-4 space-y-3 transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-surface shadow-md ring-1 ring-brand-500'
                          : 'border-border bg-surface hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : isStale ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-sm font-bold text-content-primary">{inst.instance_name}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isOnline
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isStale
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-content-muted block text-[10px]">MODE</span>
                          <span className="font-mono font-medium text-brand-400">{inst.mode}</span>
                        </div>
                        <div>
                          <span className="text-content-muted block text-[10px]">VERSION</span>
                          <span className="font-mono text-content-primary">{inst.engine_version}</span>
                        </div>
                        <div>
                          <span className="text-content-muted block text-[10px]">LOCAL RISK CAP</span>
                          <span className="font-mono text-emerald-400 font-semibold">{inst.max_risk_pct_ceiling ?? 1.0}%</span>
                        </div>
                        <div>
                          <span className="text-content-muted block text-[10px]">UPTIME</span>
                          <span className="font-mono text-content-primary">{Math.floor(inst.uptime_seconds / 60)} min</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
                        <span>Last heartbeat: {inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at).toLocaleTimeString() : 'Never'}</span>
                        <span className="text-brand-400 font-medium">Select &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLOUD SAFE CONTROLS */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-content-primary">
                  Cloud Safe Controls &mdash; {selectedInstance?.instance_name || 'No Instance Selected'}
                </h2>
                <p className="text-xs text-content-muted">
                  Signed HMAC-SHA256 control signals. Validated against local limits before execution on Windows.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    isSelectedInstanceOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {selectedInstance?.status || 'OFFLINE'}
                </span>
              </div>
            </div>

            {!isSelectedInstanceOnline && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Control Buttons Disabled:</strong> Agent is currently offline. An active outbound connection from your
                  local Windows machine is required to receive and execute control signals.
                </span>
              </div>
            )}

            {/* Controls Button Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                disabled={!isSelectedInstanceOnline || isDispatching}
                onClick={() => handleSendCommand('start')}
                className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-colors shadow-sm"
              >
                <Play className="w-5 h-5" />
                <span>Start Bot</span>
              </button>

              <button
                disabled={!isSelectedInstanceOnline || isDispatching}
                onClick={() => handleSendCommand('pause')}
                className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-colors shadow-sm"
              >
                <Pause className="w-5 h-5" />
                <span>Pause Bot</span>
              </button>

              <button
                disabled={!isSelectedInstanceOnline || isDispatching}
                onClick={() => handleSendCommand('resume')}
                className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-brand-400 font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-colors shadow-sm"
              >
                <Play className="w-5 h-5" />
                <span>Resume Bot</span>
              </button>

              <button
                disabled={!isSelectedInstanceOnline || isDispatching}
                onClick={() => handleSendCommand('stop')}
                className="p-4 rounded-xl border border-border bg-surface-secondary hover:bg-surface-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed text-content-primary font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-colors shadow-sm"
              >
                <Square className="w-5 h-5" />
                <span>Stop Bot</span>
              </button>
            </div>

            {/* High-Impact Actions (Requires Explicit Confirmation) */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>High-Impact Emergency Actions</span>
              </h3>
              <p className="text-xs text-content-muted">
                These commands instruct the local agent to immediately interact with open brokerage positions. Type-to-confirm is required.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={!isSelectedInstanceOnline || isDispatching}
                  onClick={() => setConfirmModalType('close_all')}
                  className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Close All Positions (Type to confirm)</span>
                </button>

                <button
                  disabled={!isSelectedInstanceOnline || isDispatching}
                  onClick={() => setConfirmModalType('kill_switch')}
                  className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>EMERGENCY KILL SWITCH</span>
                </button>
              </div>
            </div>

            {/* Command History Table */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>Dispatched Command Audit Log</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-content-secondary uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Command</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">Dispatched</th>
                      <th className="py-2.5 px-3">Executed</th>
                      <th className="py-2.5 px-3">Result / Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {commands.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-content-muted">
                          No commands dispatched for this instance yet.
                        </td>
                      </tr>
                    ) : (
                      commands.map(cmd => {
                        const statusColors: Record<string, string> = {
                          QUEUED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                          DELIVERED: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                          EXECUTED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                          FAILED: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        };

                        return (
                          <tr key={cmd.id} className="hover:bg-surface-secondary/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-content-primary uppercase">
                              {cmd.command_type}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusColors[cmd.status]}`}>
                                {cmd.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-content-muted">
                              {new Date(cmd.created_at).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-content-muted">
                              {cmd.executed_at ? new Date(cmd.executed_at).toLocaleTimeString() : '&mdash;'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-content-secondary truncate max-w-xs">
                              {cmd.error_message ? (
                                <span className="text-rose-400">{cmd.error_message}</span>
                              ) : cmd.result_json ? (
                                cmd.result_json
                              ) : (
                                'Awaiting agent execution...'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIG & SAFE LIMITS */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-content-primary">Safe Settings & Local Ceiling Limits</h2>
              <p className="text-xs text-content-muted">
                Config changes are versioned and validated. The cloud CANNOT exceed the local ceiling set on the machine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Config Form */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-brand-400" />
                  <span>Cloud Config Parameters</span>
                </h3>

                {/* Risk Slider bounded by local ceiling */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-content-primary">Risk Percent Per Trade</label>
                    <span className="font-mono font-bold text-brand-400">{configRiskPercent.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max={localCeiling.toString()}
                    step="0.05"
                    value={configRiskPercent}
                    onChange={e => setConfigRiskPercent(parseFloat(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-content-muted font-mono">
                    <span>Min: 0.10%</span>
                    <span className="text-emerald-400 font-bold">Local Hard Ceiling: {localCeiling}%</span>
                  </div>
                </div>

                {/* Max Trades Per Day */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-content-primary">Max Trades Per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={configMaxTrades}
                    onChange={e => setConfigMaxTrades(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-xs text-content-primary"
                  />
                </div>

                {/* Symbols Toggles */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-content-primary">Active Trading Symbols</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'].map(sym => {
                      const active = configSymbols.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setConfigSymbols(configSymbols.filter(s => s !== sym));
                            } else {
                              setConfigSymbols([...configSymbols, sym]);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center justify-between ${
                            active
                              ? 'bg-brand-500/15 border-brand-500/40 text-brand-400'
                              : 'bg-surface-secondary border-border text-content-muted'
                          }`}
                        >
                          <span>{sym}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session Filters */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-content-primary">Session Execution Filters</label>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'london', label: 'London Session (07:00 - 16:00 UTC)' },
                      { key: 'new_york', label: 'New York Session (13:00 - 22:00 UTC)' },
                      { key: 'asian', label: 'Asian Session (00:00 - 09:00 UTC)' }
                    ].map(s => {
                      const val = (configSessions as any)[s.key];
                      return (
                        <label key={s.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={e => setConfigSessions({ ...configSessions, [s.key]: e.target.checked })}
                            className="rounded accent-brand-500"
                          />
                          <span className="text-content-secondary">{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  disabled={isSavingConfig}
                  onClick={handleSaveConfig}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  {isSavingConfig ? 'Saving & Signing Config...' : 'Apply Safe Configuration'}
                </button>
              </div>

              {/* Right Column: Local Machine Ceilings */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                  <h3 className="text-sm font-bold text-content-primary flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span>Local Machine Hard Limits (Read-Only)</span>
                  </h3>
                  <p className="text-xs text-content-muted">
                    Reported by the agent from <code className="font-mono text-xs">local_limits.json</code> on your Windows host.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <span className="text-content-muted">Max Risk % Ceiling:</span>
                      <span className="font-mono font-bold text-emerald-400">{localCeiling}%</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <span className="text-content-muted">Max Lots Ceiling:</span>
                      <span className="font-mono font-bold text-content-primary">
                        {selectedInstance?.max_lots_ceiling ?? 0.50} Lots
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <span className="text-content-muted">Max Daily Drawdown Ceiling:</span>
                      <span className="font-mono font-bold text-content-primary">
                        {selectedInstance?.max_drawdown_pct_ceiling ?? 5.0}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <span className="text-content-muted">Live Trading Allowed Locally:</span>
                      <span
                        className={`font-mono font-bold ${
                          selectedInstance?.live_trading_allowed_locally ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {selectedInstance?.live_trading_allowed_locally ? 'YES (Confirmed)' : 'NO (Disabled Locally)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE TELEMETRY & DECISIONS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-content-primary">Live Monitor & Decision Telemetry</h2>
                <p className="text-xs text-content-muted">Real-time signals, open positions, daily loss, and &quot;why no trade&quot; explanations</p>
              </div>
              <span className="text-xs font-mono text-content-muted">
                UTC: {new Date().toUTCString().slice(17, 25)} | Local: {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Today&apos;s Net P/L</span>
                <span className="text-lg font-mono font-bold text-emerald-400">+$142.50</span>
                <span className="text-[11px] text-content-muted block mt-0.5">+1.42% ROI</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Daily Loss Remaining</span>
                <span className="text-lg font-mono font-bold text-content-primary">$357.50</span>
                <span className="text-[11px] text-content-muted block mt-0.5">3.57% of 5.0% limit</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Max DD Remaining</span>
                <span className="text-lg font-mono font-bold text-content-primary">$500.00</span>
                <span className="text-[11px] text-emerald-400 block mt-0.5">High Watermark: $10,142.50</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Gross Exposure</span>
                <span className="text-lg font-mono font-bold text-brand-400">0.20 Lots</span>
                <span className="text-[11px] text-content-muted block mt-0.5">2 Open Positions</span>
              </div>
            </div>

            {/* Why No Trade Banner */}
            <div className="p-4 rounded-xl border border-brand-500/20 bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-content-primary uppercase text-[11px] tracking-wider">
                  Live Engine Decision Line & Regime
                </span>
                <span className="font-mono text-brand-400 text-[11px]">London/NY Overlap Regime</span>
              </div>
              <p className="text-xs font-mono text-amber-300">
                EURUSD M15 — No Trade: HTF Order Block unconfirmed (confluence 68% &lt; threshold 75%). Next check at candle close (14:15 UTC).
              </p>
            </div>

            {/* Open Positions Table */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary">Active Monitored Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-content-secondary uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Ticket</th>
                      <th className="py-2 px-3">Symbol</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Lots</th>
                      <th className="py-2 px-3">Open Price</th>
                      <th className="py-2 px-3">Current</th>
                      <th className="py-2 px-3">Floating P/L</th>
                      <th className="py-2 px-3">SL / TP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-mono">
                    <tr className="hover:bg-surface-secondary/40">
                      <td className="py-2.5 px-3 font-semibold text-content-primary">#1082910</td>
                      <td className="py-2.5 px-3 font-bold text-brand-400">EURUSD</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">BUY</td>
                      <td className="py-2.5 px-3">0.10</td>
                      <td className="py-2.5 px-3">1.08420</td>
                      <td className="py-2.5 px-3">1.08510</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">+$90.00</td>
                      <td className="py-2.5 px-3 text-content-muted">1.08150 / 1.08950</td>
                    </tr>
                    <tr className="hover:bg-surface-secondary/40">
                      <td className="py-2.5 px-3 font-semibold text-content-primary">#1082914</td>
                      <td className="py-2.5 px-3 font-bold text-brand-400">GBPUSD</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">BUY</td>
                      <td className="py-2.5 px-3">0.10</td>
                      <td className="py-2.5 px-3">1.29150</td>
                      <td className="py-2.5 px-3">1.29202</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">+$52.50</td>
                      <td className="py-2.5 px-3 text-content-muted">1.28850 / 1.29800</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SIZING & ACCOUNT TIER */}
        {activeTab === 'sizing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-content-primary">MT5-OO1 Balance Tier & Position Sizing</h2>
              <p className="text-xs text-content-muted">
                Mathematical lot allocations, margin constraints, and asset affordability calibrated for MT5-OO1
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
                <span className="text-[10px] text-content-muted uppercase tracking-wider">Account Balance</span>
                <span className="text-xl font-mono font-bold text-content-primary">${balance.toLocaleString()}</span>
                <span className="text-[11px] text-content-muted block">USD Equitized</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
                <span className="text-[10px] text-content-muted uppercase tracking-wider">Allocated Tier</span>
                <span className="text-xl font-mono font-bold text-brand-400">{sizingInfo.tier}</span>
                <span className="text-[11px] text-content-muted block">Standard Base: {sizingInfo.baseLot} Lots</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
                <span className="text-[10px] text-content-muted uppercase tracking-wider">Risk per Trade Dollar Value</span>
                <span className="text-xl font-mono font-bold text-emerald-400">${sizingInfo.calculatedRiskDollars}</span>
                <span className="text-[11px] text-content-muted block">At {configRiskPercent}% Risk Setting</span>
              </div>
            </div>

            {/* Affordability Matrix */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary">Symbol Affordability & Margin Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-content-secondary uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Affordability Status</th>
                      <th className="py-2.5 px-3">Margin Required (1:100)</th>
                      <th className="py-2.5 px-3">Tick Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-mono">
                    {sizingInfo.affordability.map(item => (
                      <tr key={item.symbol} className="hover:bg-surface-secondary/40">
                        <td className="py-2.5 px-3 font-bold text-content-primary">{item.symbol}</td>
                        <td className="py-2.5 px-3">
                          {item.affordable ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              AFFORDABLE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              INSUFFICIENT BALANCE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-content-secondary">{item.marginRequired}</td>
                        <td className="py-2.5 px-3 text-content-muted">{item.tickValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BOT ASSISTANT (REBRANDED GROUNDED AI COACH) */}
        {activeTab === 'assistant' && (
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* PAIRING MODAL (Single-use 10-Minute Pairing Code) */}
      {/* ========================================================================= */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-content-primary">
                <Cpu className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold">Pair Local MT5 Machine</h3>
              </div>
              <button onClick={() => setShowPairModal(false)} className="text-content-muted hover:text-content-primary">
                &times;
              </button>
            </div>

            <p className="text-xs text-content-muted">
              Enter this single-use code in your local MT5 Bot Agent on Windows. It expires in 10 minutes.
            </p>

            {isGeneratingPairCode ? (
              <div className="p-8 text-center text-xs text-content-muted">Generating cryptographic pairing code...</div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-secondary border border-border text-center space-y-2">
                <span className="text-[10px] text-content-muted uppercase tracking-wider block">Single-Use Pairing Code</span>
                <span className="text-2xl font-mono font-extrabold tracking-widest text-brand-400">{pairingCode}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="mx-auto px-3 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-xs flex items-center space-x-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            )}

            <div className="p-3 rounded-lg bg-surface-secondary/70 border border-border-subtle text-xs text-content-secondary space-y-1">
              <span className="font-semibold text-content-primary block">How to run on your Windows VPS/PC:</span>
              <p className="font-mono text-[11px] bg-canvas p-2 rounded border border-border">
                python agent/mt5_bot_agent.py --pair {pairingCode}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPairModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 border border-border text-xs font-semibold text-content-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELEGRAM LINKING MODAL */}
      {/* ========================================================================= */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-content-primary">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold">Connect Telegram Alerts</h3>
              </div>
              <button onClick={() => setShowTelegramModal(false)} className="text-content-muted hover:text-content-primary">
                &times;
              </button>
            </div>

            <p className="text-xs text-content-muted">
              Receive real-time trade signals, kill switch alerts, and daily summaries directly in Telegram with zero token pasting.
            </p>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border text-center space-y-2">
              <span className="text-[10px] text-content-muted uppercase tracking-wider block">Your Unique Link Code</span>
              <span className="text-xl font-mono font-extrabold text-sky-400">{telegramCode || 'TG-A8F29C'}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(telegramCode || 'TG-A8F29C');
                  setCopiedTelegram(true);
                  setTimeout(() => setCopiedTelegram(false), 2000);
                }}
                className="mx-auto px-3 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-xs flex items-center space-x-1.5 transition-colors"
              >
                {copiedTelegram ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTelegram ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <ol className="text-xs text-content-secondary space-y-2 list-decimal list-inside p-2">
              <li>Open Telegram and search for <strong>@ArcadeFxAlertsBot</strong></li>
              <li>Press <strong>Start</strong></li>
              <li>Send your link code: <code className="font-mono font-bold text-sky-400">{telegramCode || 'TG-A8F29C'}</code></li>
            </ol>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTelegramModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TYPE-TO-CONFIRM MODAL (Close All & Kill Switch) */}
      {/* ========================================================================= */}
      {confirmModalType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-rose-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">
                {confirmModalType === 'close_all' ? 'Confirm Close All Positions' : 'Confirm Emergency Kill Switch'}
              </h3>
            </div>

            <p className="text-xs text-content-secondary">
              {confirmModalType === 'close_all'
                ? 'This will immediately transmit a signed command to close all open positions on your local MT5 terminal.'
                : 'This will immediately halt trading, cancel pending orders, close open positions, and place the local bot engine in emergency lockdown.'}
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-content-primary">
                Type <strong className="text-rose-400 font-mono">{confirmModalType === 'close_all' ? 'CLOSE ALL' : 'KILL SWITCH'}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmInputText}
                onChange={e => setConfirmInputText(e.target.value)}
                placeholder={confirmModalType === 'close_all' ? 'CLOSE ALL' : 'KILL SWITCH'}
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-xs font-mono text-content-primary"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setConfirmModalType(null);
                  setConfirmInputText('');
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-content-muted hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                disabled={
                  confirmInputText !== (confirmModalType === 'close_all' ? 'CLOSE ALL' : 'KILL SWITCH') || isDispatching
                }
                onClick={() => handleSendCommand(confirmModalType)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-sm"
              >
                {isDispatching ? 'Transmitting...' : 'Execute Command'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT5BotPage;
