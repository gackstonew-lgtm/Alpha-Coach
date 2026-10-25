import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Activity,
  Calendar,
  Layers,
  Scale,
  Bot,
  History,
  Bell,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  Sliders,
  Play,
  Upload,
  Plus,
  Scan,
  Dice5,
  FileText,
  CheckCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type IntelligenceTab =
  | 'workspace'
  | 'scanner'
  | 'crt'
  | 'smc'
  | 'fundamentals'
  | 'currency_strength'
  | 'ai_confluence'
  | 'backtester'
  | 'monte_carlo'
  | 'trade_plans'
  | 'broker_approval'
  | 'disclosures';

const MAJOR_SYMBOLS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'USDCAD',
  'AUDUSD',
  'NZDUSD',
  'EURGBP',
  'EURJPY',
  'GBPJPY',
  'AUDJPY',
  'EURCHF',
  'CADJPY',
  'GBPAUD',
  'XAUUSD'
];

export const MarketIntelligencePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('workspace');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [htfTimeframe, setHtfTimeframe] = useState<string>('H4');
  const [ltfTimeframe, setLtfTimeframe] = useState<string>('M15');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [currencyStrengthData, setCurrencyStrengthData] = useState<any>(null);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [tradePlans, setTradePlans] = useState<any[]>([]);
  const [backtestRuns, setBacktestRuns] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backtest Config State
  const [backtestStrategy, setBacktestStrategy] = useState<string>('CRT_SWEEP_REENTRY');
  const [backtestInitialBalance, setBacktestInitialBalance] = useState<number>(10000);
  const [backtestRiskPct, setBacktestRiskPct] = useState<number>(1.0);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);

  // Position Sizing Calculator Modal / Drawer State
  const [calcRiskPct, setCalcRiskPct] = useState<number>(1.0);
  const [calcStopLoss, setCalcStopLoss] = useState<string>('');
  const [calcTakeProfit, setCalcTakeProfit] = useState<string>('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculatingRisk, setIsCalculatingRisk] = useState<boolean>(false);

  // Market Scanner State (trader-scanner adaptation)
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerSetupFilter, setScannerSetupFilter] = useState<string>('ALL');

  // Monte Carlo Engine State (trader-timemachine adaptation)
  const [mcReplays, setMcReplays] = useState<number>(10000);
  const [mcSeed, setMcSeed] = useState<number>(19);
  const [mcMaxBars, setMcMaxBars] = useState<number>(24);
  const [monteCarloResult, setMonteCarloResult] = useState<any>(null);
  const [isSimulatingMC, setIsSimulatingMC] = useState<boolean>(false);

  // Broker Order Preparation & Approval State (trader-broker adaptation)
  const [orderTickets, setOrderTickets] = useState<any[]>([]);
  const [isPreparingOrder, setIsPreparingOrder] = useState<boolean>(false);
  const [orderApprovalInputs, setOrderApprovalInputs] = useState<Record<string, string>>({});
  const [brokerOrderSuccessMsg, setBrokerOrderSuccessMsg] = useState<string | null>(null);

  // SEC Fundamentals & Congressional Disclosures State (trader-analyst & trader-pelosi adaptation)
  const [disclosureTicker, setDisclosureTicker] = useState<string>('TSLA');
  const [companyDisclosures, setCompanyDisclosures] = useState<any>(null);
  const [congressDisclosures, setCongressDisclosures] = useState<any[]>([]);
  const [isLoadingDisclosures, setIsLoadingDisclosures] = useState<boolean>(false);

  // Manual Candle Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Load Primary Workspace Data
  const loadWorkspace = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.getWorkspace({
        symbol: selectedSymbol,
        htfTimeframe,
        ltfTimeframe,
        persistReport: false
      });
      if (res && res.workspace) {
        setWorkspaceData(res.workspace);
        if (res.workspace.currentPrice && !calcStopLoss) {
          const p = Number(res.workspace.currentPrice);
          const spec = res.workspace.instrument;
          const stopDist = spec.pipSize * 25;
          setCalcStopLoss((p - stopDist).toFixed(spec.digits));
          setCalcTakeProfit((p + stopDist * 2).toFixed(spec.digits));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load intelligence workspace data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [selectedSymbol, htfTimeframe, ltfTimeframe]);

  // Load Secondary Data when Tab Changes
  useEffect(() => {
    if (activeTab === 'currency_strength' && !currencyStrengthData) {
      api.getCurrencyStrength('24H').then((res) => {
        if (res?.model) setCurrencyStrengthData(res.model);
      }).catch(() => {});
    } else if (activeTab === 'fundamentals' && economicEvents.length === 0) {
      api.getEconomicCalendar({}).then((res) => {
        if (res?.events) setEconomicEvents(res.events);
      }).catch(() => {});
    } else if (activeTab === 'trade_plans') {
      api.getTradePlans(selectedSymbol).then((res) => {
        if (res?.plans) setTradePlans(res.plans);
      }).catch(() => {});
    } else if (activeTab === 'backtester' && backtestRuns.length === 0) {
      api.getBacktestRuns().then((res) => {
        if (res?.runs) setBacktestRuns(res.runs);
      }).catch(() => {});
    } else if (activeTab === 'broker_approval') {
      api.getBrokerTickets().then((res) => {
        if (res?.tickets) setOrderTickets(res.tickets);
      }).catch(() => {});
    } else if (activeTab === 'disclosures' && congressDisclosures.length === 0) {
      loadDisclosures(disclosureTicker);
    }
  }, [activeTab, selectedSymbol]);

  // Run Market Scanner
  const handleRunScanner = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const res = await api.scanMarket({
        symbols: MAJOR_SYMBOLS,
        timeframes: ['H1', 'M15', 'H4']
      });
      if (res?.result) {
        setScannerResult(res.result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Market scanner execution failed.');
    } finally {
      setIsScanning(false);
    }
  };

  // Run Monte Carlo Simulation
  const handleRunMonteCarlo = async () => {
    if (!workspaceData?.currentPrice || !calcStopLoss) return;
    setIsSimulatingMC(true);
    setErrorMessage(null);
    try {
      const entryPrice = Number(workspaceData.currentPrice);
      const stopLossPrice = Number(calcStopLoss);
      const takeProfitPrice = Number(calcTakeProfit || (entryPrice + Math.abs(entryPrice - stopLossPrice) * 2));
      const res = await api.runMonteCarlo({
        symbol: selectedSymbol,
        direction: stopLossPrice < entryPrice ? 'BUY' : 'SELL',
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        replays: mcReplays,
        seed: mcSeed,
        maxBarsHold: mcMaxBars
      });
      if (res?.simulation) {
        setMonteCarloResult(res.simulation);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Monte Carlo simulation failed.');
    } finally {
      setIsSimulatingMC(false);
    }
  };

  // Prepare Broker Order Ticket
  const handlePrepareBrokerOrder = async () => {
    if (!workspaceData?.currentPrice || !calcStopLoss) return;
    setIsPreparingOrder(true);
    setBrokerOrderSuccessMsg(null);
    setErrorMessage(null);
    try {
      const entryPrice = Number(workspaceData.currentPrice);
      const stopLossPrice = Number(calcStopLoss);
      const takeProfitPrice = Number(calcTakeProfit || (entryPrice + Math.abs(entryPrice - stopLossPrice) * 2));
      const direction = stopLossPrice < entryPrice ? 'BUY' : 'SELL';
      const res = await api.prepareBrokerOrder({
        symbol: selectedSymbol,
        direction,
        orderType: 'MARKET',
        requestedPrice: entryPrice,
        stopLossPrice,
        takeProfitPrice,
        lotSize: calcResult?.calculation?.recommendedLotSize || 0.1,
        executionMode: 'PAPER'
      });
      if (res?.ticket) {
        setOrderTickets((prev) => [res.ticket, ...prev.filter((t) => t.ticketId !== res.ticket.ticketId)]);
        setBrokerOrderSuccessMsg(`Order ticket ${res.ticket.ticketId.slice(0, 8)} prepared. Centralized Risk Gate: ${res.riskCheck.decision}.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Broker order preparation failed.');
    } finally {
      setIsPreparingOrder(false);
    }
  };

  // Approve & Execute Broker Order
  const handleApproveBrokerOrder = async (ticketId: string, fingerprint: string) => {
    const reply = orderApprovalInputs[ticketId] || 'yes';
    setErrorMessage(null);
    setBrokerOrderSuccessMsg(null);
    try {
      const res = await api.approveBrokerOrder(ticketId, reply, fingerprint);
      if (res?.success) {
        setBrokerOrderSuccessMsg(res.executionMessage);
        // Refresh ticket state
        const refreshed = await api.getBrokerTickets();
        if (refreshed?.tickets) setOrderTickets(refreshed.tickets);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Order execution approval failed.');
    }
  };

  // Load SEC & Congressional Disclosures
  const loadDisclosures = async (ticker: string = 'TSLA') => {
    setIsLoadingDisclosures(true);
    try {
      const [compRes, congRes] = await Promise.all([
        api.getCompanyDisclosures(ticker),
        api.getCongressionalDisclosures()
      ]);
      if (compRes?.metrics) setCompanyDisclosures(compRes);
      if (congRes?.disclosures) setCongressDisclosures(congRes.disclosures);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch disclosures.');
    } finally {
      setIsLoadingDisclosures(false);
    }
  };

  // Run Position Size Calculation
  const handleCalculatePosition = async () => {
    if (!workspaceData?.currentPrice || !calcStopLoss) return;
    setIsCalculatingRisk(true);
    try {
      const res = await api.calculatePositionSize({
        accountBalance: 10000,
        accountCurrency: 'USD',
        riskPercentage: calcRiskPct,
        symbol: selectedSymbol,
        entryPrice: Number(workspaceData.currentPrice),
        stopLossPrice: Number(calcStopLoss),
        takeProfitPrices: calcTakeProfit ? [Number(calcTakeProfit)] : []
      });
      if (res?.calculation) {
        setCalcResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Position sizing calculation failed.');
    } finally {
      setIsCalculatingRisk(false);
    }
  };

  // Run Strategy Backtest
  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await api.runBacktest({
        strategyId: backtestStrategy,
        symbol: selectedSymbol,
        timeframe: ltfTimeframe,
        initialCapital: backtestInitialBalance,
        riskPerTradePct: backtestRiskPct,
        rewardToRiskTarget: 2.0
      });
      if (res?.result) {
        setBacktestResult(res.result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Backtest execution failed.');
    } finally {
      setIsBacktesting(false);
    }
  };

  // Import OHLCV CSV
  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    setIsImporting(true);
    setImportSuccessMsg(null);
    try {
      const lines = importCsvText.trim().split('\n');
      const candles: any[] = [];
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map((s) => s.trim());
        if (parts.length >= 5) {
          const timestamp = new Date(parts[0]).toISOString();
          const open = Number(parts[1]);
          const high = Number(parts[2]);
          const low = Number(parts[3]);
          const close = Number(parts[4]);
          const volume = parts[5] ? Number(parts[5]) : 0;
          if (Number.isFinite(open) && Number.isFinite(high) && Number.isFinite(low) && Number.isFinite(close)) {
            candles.push({ timestamp, open, high, low, close, volume, isClosed: true });
          }
        }
      }
      if (candles.length === 0) {
        throw new Error('No valid OHLC lines parsed. Expected format: timestamp,open,high,low,close[,volume]');
      }
      const res = await api.ingestCandles({
        symbol: selectedSymbol,
        timeframe: ltfTimeframe,
        candles,
        sourceProvider: 'USER_CSV'
      });
      setImportSuccessMsg(`Successfully ingested ${res.insertedOrUpdated} candle(s) for ${selectedSymbol} (${ltfTimeframe}).`);
      setImportCsvText('');
      setTimeout(() => setShowImportModal(false), 1500);
      loadWorkspace(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse and import CSV candles.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredSymbols = useMemo(() => {
    return MAJOR_SYMBOLS.filter((s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [searchQuery]);

  const chartCandles = useMemo(() => {
    if (!workspaceData?.ltfSeries?.candles) return [];
    return workspaceData.ltfSeries.candles.slice(-40).map((c: any) => ({
      time: c.timestamp ? c.timestamp.substring(11, 16) : '',
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      price: c.close,
      volume: c.volume || 100
    }));
  }, [workspaceData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 text-content-muted text-xs font-mono uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5 text-accent-primary" />
            <span>Institutional Market Intelligence OS</span>
            <span>•</span>
            <span className="text-content-primary font-semibold">{selectedSymbol}</span>
            <span>•</span>
            <span>HTF: {htfTimeframe} / LTF: {ltfTimeframe}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Market Intelligence Workspace
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Symbol Quick Selector */}
          <div className="relative">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-surface-secondary border border-border-subtle text-content-primary text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent-primary"
            >
              {MAJOR_SYMBOLS.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-lg p-0.5 text-xs font-mono">
            <span className="px-2 text-content-muted">HTF:</span>
            {['D1', 'H4', 'H1'].map((tf) => (
              <button
                key={tf}
                onClick={() => setHtfTimeframe(tf)}
                className={`px-2 py-1 rounded ${
                  htfTimeframe === tf
                    ? 'bg-accent-primary text-white font-semibold'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-surface-secondary border border-border-subtle rounded-lg p-0.5 text-xs font-mono">
            <span className="px-2 text-content-muted">LTF:</span>
            {['H1', 'M15', 'M5'].map((tf) => (
              <button
                key={tf}
                onClick={() => setLtfTimeframe(tf)}
                className={`px-2 py-1 rounded ${
                  ltfTimeframe === tf
                    ? 'bg-accent-primary text-white font-semibold'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Import CSV Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-lg text-xs font-medium text-content-primary transition"
            title="Import Historical OHLCV Candles"
          >
            <Upload className="w-3.5 h-3.5 text-accent-primary" />
            <span>Import Candles</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => loadWorkspace(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-lg text-xs font-medium text-content-primary transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-subtle pb-px">
        {[
          { id: 'workspace', label: 'Analysis Workspace', icon: Activity },
          { id: 'scanner', label: 'Market Scanner', icon: Scan },
          { id: 'crt', label: 'CRT Engine', icon: Layers },
          { id: 'smc', label: 'SMC & ICT Suite', icon: Compass },
          { id: 'fundamentals', label: 'Macro & Calendar', icon: Calendar },
          { id: 'currency_strength', label: 'Currency Strength', icon: Scale },
          { id: 'ai_confluence', label: 'AI Analyst & Confluence', icon: Bot },
          { id: 'backtester', label: 'Strategy Backtester', icon: History },
          { id: 'monte_carlo', label: 'Monte Carlo Replays', icon: Dice5 },
          { id: 'trade_plans', label: 'Trade Plans & Alerts', icon: Bell },
          { id: 'broker_approval', label: 'Order Execution & Approval', icon: CheckCheck },
          { id: 'disclosures', label: 'SEC & Politician Tracker', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IntelligenceTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-accent-primary text-accent-primary font-semibold'
                  : 'border-transparent text-content-muted hover:text-content-primary hover:border-border-subtle'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error / Provider Notification */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PRIMARY ANALYSIS WORKSPACE */}
      {/* ========================================================================= */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Market Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">Live Quote</span>
              <span className="text-lg font-bold text-content-primary">
                {workspaceData?.currentPrice ? workspaceData.currentPrice.toFixed(workspaceData.instrument?.digits || 5) : 'Loading...'}
              </span>
              <span className="text-[10px] text-content-muted block truncate">
                Updated: {workspaceData?.lastUpdateTimestamp ? new Date(workspaceData.lastUpdateTimestamp).toLocaleTimeString() : 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">Active Session</span>
              <span className="text-sm font-semibold text-content-primary flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {workspaceData?.ltfSmc?.ictContext?.activeSession || 'Calculating...'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block">
                KZ: {workspaceData?.ltfSmc?.ictContext?.activeKillzone?.replace('_KILLZONE', '') || 'NONE'}
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">HTF Trend & Regime</span>
              <span className="text-sm font-semibold text-content-primary flex items-center gap-1 mt-0.5">
                {workspaceData?.htfSmc?.trendStructure === 'BULLISH' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                {workspaceData?.htfSmc?.trendStructure || 'ANALYZING'}
              </span>
              <span className="text-[10px] text-content-muted block truncate">
                {workspaceData?.htfTechnical?.marketRegime?.classification?.replace('_', ' ') || 'Regime pending'}
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">CRT Status</span>
              <span className="text-sm font-semibold text-content-primary block mt-0.5 truncate">
                {workspaceData?.crt?.status?.replace(/_/g, ' ') || 'STANDBY'}
              </span>
              <span className="text-[10px] text-content-muted block truncate">
                {workspaceData?.crt?.setupClassification || 'Inside Range'}
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">Macro Differential</span>
              <span className="text-sm font-semibold text-content-primary block mt-0.5">
                {workspaceData?.fundamentals?.rateDifferentialBps !== null
                  ? `${workspaceData?.fundamentals?.rateDifferentialBps > 0 ? '+' : ''}${workspaceData?.fundamentals?.rateDifferentialBps} bps`
                  : 'N/A'}
              </span>
              <span className="text-[10px] text-content-muted block truncate">
                Bias: {workspaceData?.fundamentals?.directionalBias || 'NEUTRAL'}
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-subtle rounded-lg">
              <span className="text-[11px] text-content-muted font-mono uppercase block">Heuristic Confluence</span>
              <span className="text-sm font-bold text-accent-primary block mt-0.5">
                {workspaceData?.aiReport?.setupEvaluation?.confluenceScore ?? 0}/100
              </span>
              <span className="text-[10px] text-content-muted block truncate">
                Rec: {workspaceData?.aiReport?.setupEvaluation?.proposedDirection || 'NEUTRAL'}
              </span>
            </div>
          </div>

          {/* Chart & Execution Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-content-primary">{selectedSymbol}</span>
                  <span className="text-xs font-mono text-content-muted">({ltfTimeframe})</span>
                  <span className="text-xs px-2 py-0.5 bg-surface-secondary text-content-muted rounded font-mono">
                    {workspaceData?.ltfSeries?.candles?.length || 0} bars loaded
                  </span>
                </div>
                <div className="text-xs font-mono text-content-muted">
                  Ref Range: {workspaceData?.crt?.referenceRange?.low?.toFixed(4)} - {workspaceData?.crt?.referenceRange?.high?.toFixed(4)}
                </div>
              </div>

              {chartCandles.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartCandles} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        domain={['auto', 'auto']}
                        orientation="right"
                        tickFormatter={(v) => Number(v).toFixed(workspaceData?.instrument?.digits === 3 ? 3 : 4)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      />
                      {workspaceData?.crt?.referenceRange?.high && (
                        <ReferenceLine
                          y={workspaceData.crt.referenceRange.high}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          label={{ value: 'Ref High', fill: '#ef4444', fontSize: 10 }}
                        />
                      )}
                      {workspaceData?.crt?.referenceRange?.midpoint && (
                        <ReferenceLine
                          y={workspaceData.crt.referenceRange.midpoint}
                          stroke="#e2e8f0"
                          strokeDasharray="2 2"
                          label={{ value: 'Equilibrium (50%)', fill: '#94a3b8', fontSize: 10 }}
                        />
                      )}
                      {workspaceData?.crt?.referenceRange?.low && (
                        <ReferenceLine
                          y={workspaceData.crt.referenceRange.low}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          label={{ value: 'Ref Low', fill: '#10b981', fontSize: 10 }}
                        />
                      )}
                      <Bar dataKey="volume" yAxisId={1} fill="#3b82f6" opacity={0.15} />
                      <Line type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-sm font-semibold text-content-primary">No OHLCV Price Bars Loaded</span>
                  <p className="text-xs text-content-muted max-w-md mt-1">
                    Connect your MT5 Companion Bridge, sync broker data, or click "Import Candles" to upload historical CSV bars for {selectedSymbol}.
                  </p>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="mt-4 px-4 py-1.5 bg-accent-primary text-white text-xs font-semibold rounded-lg hover:opacity-90"
                  >
                    Import CSV Bars
                  </button>
                </div>
              )}

              {/* Technical Indicator Readout Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border-subtle text-xs font-mono">
                <div>
                  <span className="text-content-muted">RSI(14): </span>
                  <span className="font-semibold text-content-primary">
                    {workspaceData?.ltfTechnical?.oscillators?.rsi14 ?? 'N/A'} ({workspaceData?.ltfTechnical?.oscillators?.rsiState ?? 'STANDBY'})
                  </span>
                </div>
                <div>
                  <span className="text-content-muted">ATR(14): </span>
                  <span className="font-semibold text-content-primary">
                    {workspaceData?.ltfTechnical?.volatility?.atrPips ? `${workspaceData.ltfTechnical.volatility.atrPips} pips` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-content-muted">MA Stack: </span>
                  <span className="font-semibold text-content-primary">
                    {workspaceData?.ltfTechnical?.movingAverages?.maAlignment || 'MIXED'}
                  </span>
                </div>
                <div>
                  <span className="text-content-muted">Dealing Zone: </span>
                  <span className="font-semibold text-content-primary">
                    {workspaceData?.ltfSmc?.dealingRange?.currentPricePosition || 'EQUILIBRIUM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Risk & Execution Sizing Panel */}
            <div className="bg-surface border border-border-subtle rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="text-sm font-bold text-content-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Risk Guardian Sizing</span>
                </span>
                <span className="text-xs text-content-muted font-mono">Standard 100K Lots</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-content-muted block mb-1">Account Risk (%)</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.5, 1.0, 1.5, 2.0].map((r) => (
                      <button
                        key={r}
                        onClick={() => setCalcRiskPct(r)}
                        className={`py-1 rounded font-semibold border ${
                          calcRiskPct === r
                            ? 'bg-accent-primary text-white border-accent-primary'
                            : 'bg-surface-secondary text-content-muted border-border-subtle hover:text-content-primary'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-content-muted block mb-1">Stop Loss Price</label>
                  <input
                    type="number"
                    step="any"
                    value={calcStopLoss}
                    onChange={(e) => setCalcStopLoss(e.target.value)}
                    placeholder="e.g. 1.08200"
                    className="w-full bg-surface-secondary border border-border-subtle rounded px-2.5 py-1.5 text-content-primary font-mono focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="text-content-muted block mb-1">Take Profit Target</label>
                  <input
                    type="number"
                    step="any"
                    value={calcTakeProfit}
                    onChange={(e) => setCalcTakeProfit(e.target.value)}
                    placeholder="e.g. 1.09200"
                    className="w-full bg-surface-secondary border border-border-subtle rounded px-2.5 py-1.5 text-content-primary font-mono focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <button
                  onClick={handleCalculatePosition}
                  disabled={isCalculatingRisk || !calcStopLoss}
                  className="w-full py-2 bg-accent-primary text-white font-semibold rounded hover:opacity-90 transition disabled:opacity-50"
                >
                  {isCalculatingRisk ? 'Calculating...' : 'Calculate Safe Lot Size'}
                </button>
              </div>

              {calcResult && (
                <div className="p-3 bg-surface-secondary rounded border border-border-subtle space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Rec. Position:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {calcResult.calculation?.recommendedLotSize} Lots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Stop Distance:</span>
                    <span className="text-content-primary">
                      {calcResult.calculation?.stopDistancePips} pips
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Risk Capital:</span>
                    <span className="text-content-primary">
                      ${calcResult.calculation?.effectiveRiskAmountWithFriction}
                    </span>
                  </div>
                  {calcResult.calculation?.targets?.[0] && (
                    <div className="flex justify-between border-t border-border-subtle pt-1.5">
                      <span className="text-content-muted">Target R:R:</span>
                      <span className="text-accent-primary font-bold">
                        {calcResult.calculation.targets[0].rewardToRiskRatioNet}R (Net)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CRT ENGINE (CANDLE RANGE THEORY) */}
      {/* ========================================================================= */}
      {activeTab === 'crt' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-primary" />
              <span>Candle Range Theory (CRT) Rule Definition & Detection</span>
            </h2>
            <p className="text-xs text-content-muted max-w-3xl">
              Candle Range Theory establishes a reference candle range on a higher timeframe (e.g. {htfTimeframe}) and looks for liquidity sweeps beyond the reference High/Low, followed by candle close re-entry and lower-timeframe confirmation.
            </p>
            <div className="p-3 bg-surface-secondary rounded text-xs font-mono text-content-primary border border-border-subtle">
              {workspaceData?.crt?.ruleDefinitionSummary || 'Rule config loaded.'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <span className="text-xs font-bold text-content-muted uppercase font-mono block">Reference Range Metrics</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-surface-secondary rounded">
                  <span className="text-content-muted">Reference Candle:</span>
                  <span className="text-content-primary font-semibold">{workspaceData?.crt?.referenceRange?.candleTimestamp || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-secondary rounded">
                  <span className="text-content-muted">Reference High:</span>
                  <span className="text-red-400 font-semibold">{workspaceData?.crt?.referenceRange?.high?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-secondary rounded">
                  <span className="text-content-muted">Midpoint (50%):</span>
                  <span className="text-content-primary font-semibold">{workspaceData?.crt?.referenceRange?.midpoint?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-secondary rounded">
                  <span className="text-content-muted">Reference Low:</span>
                  <span className="text-emerald-400 font-semibold">{workspaceData?.crt?.referenceRange?.low?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-secondary rounded">
                  <span className="text-content-muted">Range Span:</span>
                  <span className="text-accent-primary font-semibold">{workspaceData?.crt?.referenceRange?.rangePips || 0} pips</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <span className="text-xs font-bold text-content-muted uppercase font-mono block">Sweep & Execution Detection</span>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-surface-secondary rounded border border-border-subtle">
                  <span className="text-content-muted block mb-1 font-mono">Setup Status:</span>
                  <span className="text-sm font-bold text-content-primary">
                    {workspaceData?.crt?.status?.replace(/_/g, ' ') || 'INSIDE RANGE'}
                  </span>
                </div>
                <div className="p-3 bg-surface-secondary rounded border border-border-subtle">
                  <span className="text-content-muted block mb-1 font-mono">Invalidation Condition:</span>
                  <span className="text-xs text-content-primary">
                    {workspaceData?.crt?.invalidationCondition || 'Sustained close beyond excursion extreme.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SMC & ICT SUITE */}
      {/* ========================================================================= */}
      {activeTab === 'smc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Structure (BOS / CHoCH) */}
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <span className="text-xs font-bold text-content-muted uppercase font-mono block">Market Structure</span>
              <div className="p-3 bg-surface-secondary rounded text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-content-muted">Structure Trend:</span>
                  <span className="font-bold text-content-primary">{workspaceData?.ltfSmc?.trendStructure || 'RANGING'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Confirmed Swings:</span>
                  <span className="font-bold text-content-primary">{workspaceData?.ltfSmc?.swingPoints?.length || 0}</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs font-mono">
                {workspaceData?.ltfSmc?.structureBreaks?.map((sb: any) => (
                  <div key={sb.id} className="p-2 bg-surface-secondary rounded border border-border-subtle">
                    <div className="flex justify-between font-bold">
                      <span className={sb.direction === 'BULLISH' ? 'text-emerald-400' : 'text-red-400'}>
                        {sb.type} ({sb.direction})
                      </span>
                      <span className="text-content-muted">@{sb.brokenSwingPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fair Value Gaps (FVG) */}
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <span className="text-xs font-bold text-content-muted uppercase font-mono block">Fair Value Gaps (FVG)</span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto text-xs font-mono">
                {workspaceData?.ltfSmc?.fairValueGaps?.map((g: any) => (
                  <div key={g.id} className="p-2 bg-surface-secondary rounded border border-border-subtle">
                    <div className="flex justify-between font-bold">
                      <span className={g.type.includes('BULLISH') ? 'text-emerald-400' : 'text-red-400'}>
                        {g.type.replace('_', ' ')}
                      </span>
                      <span className="text-accent-primary">{g.sizePips} pips</span>
                    </div>
                    <div className="text-[11px] text-content-muted mt-1">
                      Zone: [{g.lowerPrice} - {g.upperPrice}] | CE: {g.consequentEncroachment}
                    </div>
                    <div className="text-[10px] text-content-muted mt-0.5">
                      Status: {g.mitigationStatus}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Liquidity Pools & Order Blocks */}
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <span className="text-xs font-bold text-content-muted uppercase font-mono block">Liquidity Pools</span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto text-xs font-mono">
                {workspaceData?.ltfSmc?.liquidityPools?.map((pool: any) => (
                  <div key={pool.id} className="p-2 bg-surface-secondary rounded border border-border-subtle">
                    <div className="flex justify-between font-bold">
                      <span className={pool.type.includes('BUY') ? 'text-emerald-400' : 'text-red-400'}>
                        {pool.type.replace(/_/g, ' ')}
                      </span>
                      <span>@{pool.priceLevel}</span>
                    </div>
                    <div className="text-[11px] text-content-muted mt-0.5">
                      Source: {pool.sourceType} | Swept: {pool.swept ? 'YES' : 'NO'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FUNDAMENTAL INTELLIGENCE & ECONOMIC CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'fundamentals' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-primary" />
              <span>G8 Macroeconomic Profiles & Calendar Intelligence</span>
            </h2>
            <div className="p-3 bg-surface-secondary rounded text-xs text-content-primary font-mono border border-border-subtle">
              {workspaceData?.fundamentals?.policyDivergenceSummary || 'Fundamental data loaded.'}
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border-subtle bg-surface-secondary text-xs font-bold text-content-muted font-mono uppercase">
              Scheduled & Published Macro Releases
            </div>
            <div className="divide-y divide-border-subtle text-xs">
              {economicEvents.length > 0 ? (
                economicEvents.map((ev: any) => (
                  <div key={ev.id} className="p-3 flex items-center justify-between hover:bg-surface-secondary/40 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content-primary">{ev.currency}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ev.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {ev.impact}
                        </span>
                        <span className="text-content-primary font-medium">{ev.title}</span>
                      </div>
                      <span className="text-[10px] text-content-muted font-mono block">
                        {new Date(ev.eventTime).toLocaleString()} ({ev.status})
                      </span>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div>Act: <span className="font-bold text-content-primary">{ev.actualValue ?? 'Pending'}</span></div>
                      <div className="text-content-muted text-[10px]">Fcst: {ev.forecastValue ?? '-'} | Prev: {ev.previousValue ?? '-'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-content-muted">
                  Loading economic calendar releases...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CURRENCY STRENGTH & PAIR WATCHLIST */}
      {/* ========================================================================= */}
      {activeTab === 'currency_strength' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {currencyStrengthData?.rankings?.map((item: any) => (
              <div key={item.currency} className="p-3 bg-surface border border-border-subtle rounded-lg text-center space-y-1">
                <span className="text-[10px] font-mono text-content-muted block">RANK #{item.rank}</span>
                <span className="text-lg font-bold text-content-primary block">{item.currency}</span>
                <span className={`text-xs font-mono font-bold ${
                  item.compositeStrengthScore > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.compositeStrengthScore > 0 ? '+' : ''}{item.compositeStrengthScore}
                </span>
                <span className="text-[9px] text-content-muted block truncate">{item.alignmentStatus}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-content-muted font-mono uppercase">Strongest vs Weakest Pair Watchlist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {currencyStrengthData?.topRankedPairs?.slice(0, 6).map((pair: any) => (
                <div
                  key={pair.symbol}
                  onClick={() => { setSelectedSymbol(pair.symbol); setActiveTab('workspace'); }}
                  className="p-3 bg-surface-secondary border border-border-subtle rounded-lg hover:border-accent-primary cursor-pointer transition space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-content-primary">{pair.symbol}</span>
                    <span className={pair.directionBias === 'BULLISH' ? 'text-emerald-400' : 'text-red-400'}>
                      {pair.directionBias}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-content-muted font-mono">
                    <span>Spread Score: {pair.strengthSpread > 0 ? '+' : ''}{pair.strengthSpread}</span>
                    <span>{pair.correlationGroup}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AI ANALYST & CONFLUENCE */}
      {/* ========================================================================= */}
      {activeTab === 'ai_confluence' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-sm font-bold text-content-primary flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent-primary" />
                <span>Evidence-Grounded AI Market Briefing</span>
              </span>
              <span className="text-xs font-mono text-content-muted">
                Status: {workspaceData?.aiReport?.evidenceStatus}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-content-primary">
              {workspaceData?.aiReport?.executiveBriefing || 'Generating briefing from verified engine outputs...'}
            </p>
          </div>

          {/* Attributed Evidence Statements */}
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <span className="text-xs font-bold text-content-muted font-mono uppercase block">Attributed Engine Proof</span>
            <div className="space-y-2 text-xs">
              {workspaceData?.aiReport?.attributedStatements?.map((stmt: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-surface-secondary rounded border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-content-primary">{stmt.statement}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-primary/20 text-accent-primary">
                      {stmt.evidenceCategory}
                    </span>
                    <span className="text-[10px] text-content-muted font-mono">{stmt.sourceReference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: STRATEGY BACKTESTER */}
      {/* ========================================================================= */}
      {activeTab === 'backtester' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-4">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <History className="w-4 h-4 text-accent-primary" />
              <span>Historical Strategy Simulator (Zero Look-Ahead Bias)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-content-muted block mb-1">Strategy</label>
                <select
                  value={backtestStrategy}
                  onChange={(e) => setBacktestStrategy(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded p-2 text-content-primary font-semibold"
                >
                  <option value="CRT_SWEEP_REENTRY">CRT Sweep & Re-entry</option>
                  <option value="SMC_FVG_ORDER_BLOCK">SMC FVG & Order Block</option>
                  <option value="ICT_KILLZONE_OTE">ICT Killzone OTE</option>
                  <option value="MA_TREND_PULLBACK">MA Trend Pullback</option>
                </select>
              </div>

              <div>
                <label className="text-content-muted block mb-1">Initial Capital ($)</label>
                <input
                  type="number"
                  value={backtestInitialBalance}
                  onChange={(e) => setBacktestInitialBalance(Number(e.target.value))}
                  className="w-full bg-surface-secondary border border-border-subtle rounded p-2 text-content-primary font-mono"
                />
              </div>

              <div>
                <label className="text-content-muted block mb-1">Risk per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={backtestRiskPct}
                  onChange={(e) => setBacktestRiskPct(Number(e.target.value))}
                  className="w-full bg-surface-secondary border border-border-subtle rounded p-2 text-content-primary font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunBacktest}
                  disabled={isBacktesting}
                  className="w-full py-2 bg-accent-primary text-white font-semibold rounded hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isBacktesting ? 'Running Sim...' : 'Run Simulation'}</span>
                </button>
              </div>
            </div>
          </div>

          {backtestResult && (
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-surface-secondary rounded">
                  <span className="text-content-muted block">Win Rate</span>
                  <span className="text-base font-bold text-emerald-400">{backtestResult.winRatePct}%</span>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded">
                  <span className="text-content-muted block">Profit Factor</span>
                  <span className="text-base font-bold text-content-primary">{backtestResult.profitFactor}</span>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded">
                  <span className="text-content-muted block">Net Profit</span>
                  <span className={`text-base font-bold ${backtestResult.netProfitCurrency >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${backtestResult.netProfitCurrency}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded">
                  <span className="text-content-muted block">Expectancy</span>
                  <span className="text-base font-bold text-accent-primary">{backtestResult.expectancyR}R</span>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded">
                  <span className="text-content-muted block">Max Drawdown</span>
                  <span className="text-base font-bold text-red-400">{backtestResult.maxDrawdownPct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: TRADE PLANS & CONFIGURABLE ALERTS */}
      {/* ========================================================================= */}
      {activeTab === 'trade_plans' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-primary" />
              <span>Configurable Trade Plans & Non-Duplicating Alerts</span>
            </h2>
            <p className="text-xs text-content-muted">
              Define target entry zones and structural invalidation levels. The engine evaluates incoming quotes and triggers one-time alerts without alert spam.
            </p>
          </div>

          <div className="divide-y divide-border-subtle bg-surface border border-border-subtle rounded-lg text-xs">
            {tradePlans.length > 0 ? (
              tradePlans.map((tp: any) => (
                <div key={tp.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${tp.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tp.direction} {tp.symbol}
                      </span>
                      <span className="px-1.5 py-0.5 bg-surface-secondary rounded text-[10px] font-mono">
                        {tp.status}
                      </span>
                    </div>
                    <span className="text-content-muted text-[11px] block mt-0.5">
                      Entry Zone: [{tp.entryZoneMin} - {tp.entryZoneMax}] | Invalidation: {tp.invalidationPrice}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div>TP1: {tp.targetTp1}</div>
                    <div className="text-content-muted">Risk: {tp.plannedRiskPct}%</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-content-muted">
                No active trade plans configured for {selectedSymbol}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: MARKET SCANNER (Adapted from trader-scanner) */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Scan className="w-4 h-4 text-accent-primary" />
                <span>Multi-Asset Market Scanner</span>
              </h2>
              <p className="text-xs text-content-muted mt-1">
                Scans 15 major & minor forex pairs and metals across M15, H1, and H4 for 20-bar breakouts, MA20 reclaims, Bull/Bear flags, RSI bounces, SMC sweeps, and CRT setups.
              </p>
            </div>
            <button
              onClick={handleRunScanner}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Markets...' : 'Run Market Scan'}</span>
            </button>
          </div>

          {scannerResult && (
            <div className="flex items-center gap-4 text-xs font-mono text-content-muted bg-surface-secondary p-3 rounded-lg border border-border-subtle">
              <span>Scanned: {scannerResult.symbolsScanned} instruments</span>
              <span>•</span>
              <span>Timeframes: {scannerResult.timeframesScanned?.join(', ')}</span>
              <span>•</span>
              <span>Hits: <strong className="text-accent-primary font-bold">{scannerResult.hitsCount}</strong></span>
              <span>•</span>
              <span>Duration: {scannerResult.scanDurationMs}ms</span>
            </div>
          )}

          {/* Setup Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            {['ALL', 'BREAKOUT_20BAR', 'RECLAIM_MA20', 'RSI_OVERSOLD_BOUNCE', 'BULL_FLAG', 'LIQUIDITY_SWEEP_DISPLACEMENT', 'CRT_SWEEP_REENTRY'].map((st) => (
              <button
                key={st}
                onClick={() => setScannerSetupFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition ${
                  scannerSetupFilter === st
                    ? 'bg-accent-primary text-white font-semibold'
                    : 'bg-surface border border-border-subtle text-content-muted hover:text-content-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Scanner Hits Grid */}
          <div className="space-y-3">
            {scannerResult?.hits && scannerResult.hits.length > 0 ? (
              scannerResult.hits
                .filter((h: any) => scannerSetupFilter === 'ALL' || h.setupType === scannerSetupFilter)
                .map((hit: any) => (
                  <div key={hit.id} className="p-4 bg-surface border border-border-subtle rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          hit.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {hit.direction} {hit.symbol}
                        </span>
                        <span className="px-1.5 py-0.5 bg-surface-secondary border border-border-subtle rounded text-[10px] font-mono text-content-muted">
                          {hit.timeframe}
                        </span>
                        <span className="px-1.5 py-0.5 bg-surface-secondary border border-border-subtle rounded text-[10px] font-mono text-content-muted">
                          {hit.session}
                        </span>
                        <span className="text-[10px] text-accent-primary font-bold font-mono">
                          Score: {hit.confluenceScore}/100
                        </span>
                      </div>
                      <p className="text-content-primary font-medium text-xs">
                        {hit.setupDescription}
                      </p>
                      <div className="text-[11px] text-content-muted font-mono flex items-center gap-3">
                        <span>Trigger: <strong>{hit.triggerPrice}</strong></span>
                        <span>SL: <strong>{hit.keyLevels?.stopLoss}</strong></span>
                        <span>TP: <strong>{hit.keyLevels?.takeProfit}</strong></span>
                        <span>R:R: <strong>{hit.keyLevels?.rewardToRisk}R</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedSymbol(hit.symbol);
                          setCalcStopLoss(String(hit.keyLevels.stopLoss));
                          setCalcTakeProfit(String(hit.keyLevels.takeProfit));
                          setActiveTab('workspace');
                        }}
                        className="px-3 py-1.5 bg-surface-secondary hover:bg-surface border border-border-subtle rounded text-xs text-content-primary transition font-medium"
                      >
                        Inspect in Workspace
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center text-content-muted bg-surface border border-border-subtle rounded-lg text-xs">
                {isScanning ? 'Running real-time scan across pairs...' : 'Click "Run Market Scan" above to discover active breakout and reversal setups.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: MONTE CARLO ENGINE (Adapted from trader-timemachine) */}
      {/* ========================================================================= */}
      {activeTab === 'monte_carlo' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <Dice5 className="w-4 h-4 text-accent-primary" />
              <span>Historical Monte Carlo Replay Engine</span>
            </h2>
            <p className="text-xs text-content-muted">
              Simulates 10,000 replays of your trade plan using empirical return distributions from closed bars. Conservative ambiguous-bar handling checks Stop Loss first.
            </p>
          </div>

          {/* Monte Carlo Config Controls */}
          <div className="p-4 bg-surface border border-border-subtle rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-content-muted font-mono mb-1">Replays</label>
              <input
                type="number"
                value={mcReplays}
                onChange={(e) => setMcReplays(Number(e.target.value))}
                className="w-full bg-surface-secondary border border-border-subtle rounded px-2.5 py-1.5 text-content-primary font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-content-muted font-mono mb-1">Random Seed (Reproducible)</label>
              <input
                type="number"
                value={mcSeed}
                onChange={(e) => setMcSeed(Number(e.target.value))}
                className="w-full bg-surface-secondary border border-border-subtle rounded px-2.5 py-1.5 text-content-primary font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-content-muted font-mono mb-1">Max Bars Hold</label>
              <input
                type="number"
                value={mcMaxBars}
                onChange={(e) => setMcMaxBars(Number(e.target.value))}
                className="w-full bg-surface-secondary border border-border-subtle rounded px-2.5 py-1.5 text-content-primary font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunMonteCarlo}
                disabled={isSimulatingMC || !workspaceData?.currentPrice}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isSimulatingMC ? 'animate-spin' : ''}`} />
                <span>{isSimulatingMC ? 'Replaying 10,000 Runs...' : 'Simulate Trade Plan'}</span>
              </button>
            </div>
          </div>

          {/* Monte Carlo Results Display */}
          {monteCarloResult && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div className="p-4 bg-surface border border-border-subtle rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-content-muted uppercase">Institutional Simulation Verdict</div>
                  <div className="text-lg font-bold text-content-primary mt-0.5">
                    {monteCarloResult.verdict}
                  </div>
                  <div className="text-xs text-content-muted mt-1">{monteCarloResult.verdictReason}</div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-content-muted">Seed: {monteCarloResult.seed}</span>
                  <span className="mx-2">•</span>
                  <span className="text-accent-primary font-bold">{monteCarloResult.replays.toLocaleString()} runs</span>
                </div>
              </div>

              {/* Odds Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-center">
                  <div className="text-[11px] text-content-muted font-mono">Target First (Win)</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    {monteCarloResult.odds.targetFirstPct}%
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                    Break-even: {monteCarloResult.planDetails.breakEvenWinRateRequiredPct}%
                  </div>
                </div>
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-center">
                  <div className="text-[11px] text-content-muted font-mono">Stop First (Loss)</div>
                  <div className="text-lg font-bold text-red-400 font-mono mt-1">
                    {monteCarloResult.odds.stopFirstPct}%
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">Resolved 1st on touch</div>
                </div>
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-center">
                  <div className="text-[11px] text-content-muted font-mono">Neither (Time Exit)</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {monteCarloResult.odds.neitherPct}%
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">Held &gt; {mcMaxBars} bars</div>
                </div>
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-center">
                  <div className="text-[11px] text-content-muted font-mono">Green at Close</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
                    {monteCarloResult.odds.greenPct}%
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">Target or &gt; Entry</div>
                </div>
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-center">
                  <div className="text-[11px] text-content-muted font-mono">Average Expectancy</div>
                  <div className="text-lg font-bold text-content-primary font-mono mt-1">
                    {monteCarloResult.odds.averageRMultiple}R
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">Per simulated trade</div>
                </div>
              </div>

              {/* Fan-Chart Percentile Bands */}
              {monteCarloResult.fanChartBands && monteCarloResult.fanChartBands.length > 0 && (
                <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-2">
                  <h3 className="text-xs font-bold text-content-primary flex items-center justify-between">
                    <span>Monte Carlo Percentile Price Bands (P10 to P90)</span>
                    <span className="text-[11px] font-mono text-content-muted font-normal">Step-by-step price trajectory</span>
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monteCarloResult.fanChartBands}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="barIndex" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="p90" stroke="#10b981" strokeDasharray="4 4" dot={false} strokeWidth={1} name="90th Percentile" />
                        <Line type="monotone" dataKey="p50" stroke="#38bdf8" dot={false} strokeWidth={2} name="Median (P50)" />
                        <Line type="monotone" dataKey="p10" stroke="#ef4444" strokeDasharray="4 4" dot={false} strokeWidth={1} name="10th Percentile" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* R-Multiple Terminal Histogram */}
              {monteCarloResult.terminalRHistogram && monteCarloResult.terminalRHistogram.length > 0 && (
                <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-2">
                  <h3 className="text-xs font-bold text-content-primary flex items-center justify-between">
                    <span>Terminal R-Multiple Distribution Histogram</span>
                    <span className="text-[11px] font-mono text-content-muted font-normal">Empirical outcome frequencies</span>
                  </h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monteCarloResult.terminalRHistogram}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="binStart" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Bar dataKey="percentage" fill="#6366f1" name="% of Replays" radius={[3, 3, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="p-3 bg-surface-secondary border border-border-subtle rounded text-[11px] text-content-muted flex items-start gap-2">
                <Info className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
                <span>{monteCarloResult.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: BROKER ORDER EXECUTION & APPROVAL PROTOCOL (Adapted from trader-broker) */}
      {/* ========================================================================= */}
      {activeTab === 'broker_approval' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-accent-primary" />
                <span>Broker Order Preparation & Controlled Approval</span>
              </h2>
              <p className="text-xs text-content-muted mt-1">
                Paper trading default. Live orders strictly require explicit affirmative approval. Orders are signed with an immutable SHA-256 parameter fingerprint.
              </p>
            </div>
            <button
              onClick={handlePrepareBrokerOrder}
              disabled={isPreparingOrder || !workspaceData?.currentPrice}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPreparingOrder ? 'Preparing Order...' : 'Prepare Order Ticket'}</span>
            </button>
          </div>

          {brokerOrderSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{brokerOrderSuccessMsg}</span>
            </div>
          )}

          {/* Order Tickets List */}
          <div className="space-y-4">
            {orderTickets.length > 0 ? (
              orderTickets.map((ticket: any) => (
                <div key={ticket.ticketId} className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3 text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        ticket.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {ticket.direction} {ticket.symbol}
                      </span>
                      <span className="px-2 py-0.5 bg-surface-secondary border border-border-subtle rounded text-[10px] font-mono">
                        {ticket.executionMode} MODE
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ticket.approvalState === 'FILLED' ? 'bg-emerald-500/10 text-emerald-400' :
                        ticket.approvalState === 'AWAITING_APPROVAL' ? 'bg-amber-500/10 text-amber-400' :
                        ticket.approvalState === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-surface-secondary text-content-muted'
                      }`}>
                        {ticket.approvalState}
                      </span>
                    </div>
                    <div className="text-right font-mono text-[11px] text-content-muted">
                      ID: {ticket.ticketId.slice(0, 8)}... | Fingerprint: {ticket.orderFingerprint?.slice(0, 10)}...
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-content-muted">
                    <div>
                      <span className="block text-[10px] font-mono">Volume / Lot Size</span>
                      <span className="font-mono text-content-primary font-bold text-sm">{ticket.lotSize} lots</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono">Entry / Stop / Target</span>
                      <span className="font-mono text-content-primary">
                        {ticket.requestedPrice} / {ticket.stopLossPrice} / {ticket.takeProfitPrice}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono">Max Loss at Stop</span>
                      <span className="font-mono text-red-400 font-bold">
                        -${ticket.maxLossCurrency?.toFixed(2)} {ticket.accountCurrency}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono">Reward : Risk Ratio</span>
                      <span className="font-mono text-content-primary font-bold">
                        {ticket.rewardToRiskRatio}R
                      </span>
                    </div>
                  </div>

                  {/* Interactive Approval Protocol Card */}
                  {ticket.approvalState === 'AWAITING_APPROVAL' && (
                    <div className="p-3 bg-surface-secondary border border-border-subtle rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Explicit User Approval Required</span>
                        </div>
                        <p className="text-[11px] text-content-muted">
                          Type <span className="font-mono text-content-primary font-bold">yes</span> to confirm execution of {ticket.lotSize} lots {ticket.direction} {ticket.symbol} with maximum stop loss of -${ticket.maxLossCurrency?.toFixed(2)}.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type 'yes' to approve"
                          value={orderApprovalInputs[ticket.ticketId] || ''}
                          onChange={(e) => setOrderApprovalInputs({ ...orderApprovalInputs, [ticket.ticketId]: e.target.value })}
                          className="bg-surface border border-border-subtle rounded px-2.5 py-1 text-content-primary font-mono text-xs w-36 focus:outline-none focus:border-accent-primary"
                        />
                        <button
                          onClick={() => handleApproveBrokerOrder(ticket.ticketId, ticket.orderFingerprint)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500 transition"
                        >
                          Approve Execution
                        </button>
                      </div>
                    </div>
                  )}

                  {ticket.approvalState === 'FILLED' && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-[11px] font-mono flex items-center justify-between">
                      <span>Deal Ticket: {ticket.mt5DealTicket} | Fill: {ticket.fillPrice}</span>
                      <span>Executed: {ticket.filledAt?.substring(11, 19)} UTC</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-content-muted bg-surface border border-border-subtle rounded-lg text-xs">
                No orders prepared. Click "Prepare Order Ticket" above to generate a risk-checked proposal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 12: SEC FUNDAMENTALS & CONGRESSIONAL DISCLOSURES (Adapted from trader-analyst & trader-pelosi) */}
      {/* ========================================================================= */}
      {activeTab === 'disclosures' && (
        <div className="space-y-6">
          <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-2">
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-primary" />
              <span>SEC EDGAR Company Metrics & Congressional Disclosures Tracker</span>
            </h2>
            <p className="text-xs text-content-muted">
              Supplementary intelligence for multi-asset equity analysis. Congressional trades track public STOCK Act Periodic Transaction Reports from the US House Clerk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SEC Company Fundamentals */}
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-xs font-bold text-content-primary">
                  SEC EDGAR Filed Financials ({disclosureTicker})
                </h3>
                <div className="flex items-center gap-1.5">
                  {['TSLA', 'AAPL', 'NVDA'].map((tk) => (
                    <button
                      key={tk}
                      onClick={() => {
                        setDisclosureTicker(tk);
                        loadDisclosures(tk);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        disclosureTicker === tk
                          ? 'bg-accent-primary text-white font-semibold'
                          : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                      }`}
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </div>

              {companyDisclosures?.metrics && companyDisclosures.metrics.length > 0 ? (
                <div className="divide-y divide-border-subtle text-xs">
                  {companyDisclosures.metrics.map((m: any, idx: number) => (
                    <div key={idx} className="py-2.5 space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-content-primary">{m.fiscalPeriod} {m.fiscalYear} ({m.form})</span>
                        <span className="text-content-muted">Filed: {m.filingDate}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-content-muted">
                        <div>Rev: <strong className="text-content-primary">${(m.revenue / 1e9).toFixed(1)}B</strong></div>
                        <div>Gross: <strong className="text-content-primary">{m.grossMarginPct}%</strong></div>
                        <div>Diluted EPS: <strong className="text-content-primary">${m.dilutedEps}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-content-muted">
                  Loading SEC EDGAR metrics...
                </div>
              )}
            </div>

            {/* Congressional STOCK Act Disclosures */}
            <div className="p-4 bg-surface border border-border-subtle rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-xs font-bold text-content-primary">
                  US Congressional PTR Disclosures (STOCK Act)
                </h3>
                <span className="text-[10px] text-content-muted font-mono">House Clerk Official Records</span>
              </div>

              {congressDisclosures && congressDisclosures.length > 0 ? (
                <div className="divide-y divide-border-subtle text-xs">
                  {congressDisclosures.map((d: any) => (
                    <div key={d.id} className="py-2.5 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-content-primary">{d.memberName} ({d.office})</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          d.transactionType === 'BUY' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {d.transactionType} {d.ticker}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-content-muted font-mono">
                        <span>Owner: {d.owner} | Range: {d.amountRange}</span>
                        <span>Delay: {d.delayDays}d</span>
                      </div>
                      <div className="text-[10px] text-content-muted truncate">
                        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                          View House Clerk PDF (Doc #{d.docId})
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-content-muted">
                  Loading congressional trade disclosures...
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-surface-secondary border border-border-subtle rounded text-[11px] text-content-muted flex items-start gap-2">
            <Info className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
            <span>
              Legal Notice: Congressional disclosures and equity fundamentals are supplementary tools. They do not constitute insider trading intelligence and do not determine immediate Forex currency exchange rates.
            </span>
          </div>
        </div>
      )}

      {/* Manual CSV Ingestion Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent-primary" />
                <span>Import Historical Candles ({selectedSymbol} - {ltfTimeframe})</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-content-muted hover:text-content-primary font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-content-muted">
              Paste CSV rows in <span className="font-mono text-content-primary">timestamp,open,high,low,close[,volume]</span> format:
            </p>

            <textarea
              rows={6}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="2026-10-01T10:00:00Z,1.08500,1.08800,1.08450,1.08750,1200"
              className="w-full bg-surface-secondary border border-border-subtle rounded p-2 text-xs font-mono text-content-primary focus:outline-none focus:border-accent-primary"
            />

            {importSuccessMsg && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded font-medium">
                {importSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 bg-surface-secondary border border-border-subtle text-content-muted rounded text-xs hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCsv}
                disabled={isImporting || !importCsvText.trim()}
                className="px-4 py-1.5 bg-accent-primary text-white rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? 'Ingesting...' : 'Ingest Candles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketIntelligencePage;
