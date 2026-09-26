import React, { useState, useEffect, useMemo } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import { RiskRule } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Bell,
  CheckCircle,
  Save,
  Zap,
  Calculator,
  Target,
  Scale,
  Gauge,
  Info,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface InstrumentConfig {
  symbol: string;
  name: string;
  pipSize: number;
  contractSize: number;
  digits: number;
  category: 'Forex' | 'Metals' | 'Indices' | 'Crypto';
}

const POPULAR_INSTRUMENTS: InstrumentConfig[] = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', pipSize: 0.01, contractSize: 100000, digits: 3, category: 'Forex' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', pipSize: 0.0001, contractSize: 100000, digits: 5, category: 'Forex' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', pipSize: 0.01, contractSize: 100000, digits: 3, category: 'Forex' },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', pipSize: 0.1, contractSize: 100, digits: 2, category: 'Metals' },
  { symbol: 'US30', name: 'Wall Street 30 Index', pipSize: 1.0, contractSize: 1, digits: 2, category: 'Indices' },
  { symbol: 'NAS100', name: 'US Tech 100 Index', pipSize: 1.0, contractSize: 1, digits: 2, category: 'Indices' },
  { symbol: 'SPX500', name: 'US SPX 500 Index', pipSize: 0.1, contractSize: 10, digits: 2, category: 'Indices' },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', pipSize: 1.0, contractSize: 1, digits: 2, category: 'Crypto' }
];

export const RiskGuardianPage: React.FC = () => {
  const { selectedAccountId, selectedAccount, accounts } = useAccounts();
  const [rules, setRules] = useState<RiskRule | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [monitor, setMonitor] = useState<any>(null);
  const [openPositionsCount, setOpenPositionsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({});

  // Manual Override State for Simulation Mode
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualBalance, setManualBalance] = useState<number>(10000);
  const [manualEquity, setManualEquity] = useState<number>(10000);
  const [manualFreeMargin, setManualFreeMargin] = useState<number>(9500);

  // Position Calculator Inputs
  const [calcSymbol, setCalcSymbol] = useState<string>('EURUSD');
  const [calcDirection, setCalcDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [calcEntryPrice, setCalcEntryPrice] = useState<string>('1.08500');
  const [calcStopLoss, setCalcStopLoss] = useState<string>('1.08200');
  const [calcTakeProfit, setCalcTakeProfit] = useState<string>('1.09200');
  const [calcRiskMode, setCalcRiskMode] = useState<'PCT' | 'AMT'>('PCT');
  const [calcRiskPct, setCalcRiskPct] = useState<number>(1.0);
  const [calcRiskAmt, setCalcRiskAmt] = useState<number>(100);

  // Standalone Pip Measurement Inputs
  const [pipToolSymbol, setPipToolSymbol] = useState<string>('EURUSD');
  const [pipStartPrice, setPipStartPrice] = useState<string>('1.08000');
  const [pipEndPrice, setPipEndPrice] = useState<string>('1.08650');

  useEffect(() => {
    loadRiskData();
  }, [selectedAccountId, accounts]);

  const loadRiskData = async () => {
    try {
      setIsLoading(true);
      const accId = selectedAccountId === 'ALL' && accounts.length > 0 ? accounts[0].id : selectedAccountId;
      const [rulesRes, alertsRes, tradesRes] = await Promise.all([
        api.getRiskRules(accId),
        api.getRiskAlerts(accId),
        api.getTrades({ accountId: selectedAccountId, status: 'OPEN', limit: 100 })
      ]);
      setRules(rulesRes.rules);
      setFormData(rulesRes.rules || {});
      setAlerts(alertsRes.alerts || []);
      setOpenPositionsCount((tradesRes.trades || []).length);

      if (accId && accId !== 'ALL') {
        const monRes = await api.getRiskMonitor(accId);
        setMonitor(monRes.monitor);
      }
    } catch (err) {
      console.error('Failed to load risk guardian:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const accId = selectedAccountId === 'ALL' && accounts.length > 0 ? accounts[0].id : selectedAccountId;
      await api.updateRiskRules(formData, accId);
      alert('Risk Guardian parameters saved successfully.');
      await loadRiskData();
    } catch (err: any) {
      alert(err.message || 'Failed to save rules');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAckAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: 1 } : a));
    } catch {
      // ignore
    }
  };

  // Active Effective Account Values
  const effectiveBalance = useMemo(() => {
    if (isManualMode) return manualBalance;
    if (selectedAccount) return Number(selectedAccount.balance || 0);
    if (accounts.length > 0) return accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    return 10000;
  }, [isManualMode, manualBalance, selectedAccount, accounts]);

  const effectiveEquity = useMemo(() => {
    if (isManualMode) return manualEquity;
    if (selectedAccount) return Number(selectedAccount.equity || selectedAccount.balance || 0);
    if (accounts.length > 0) return accounts.reduce((s, a) => s + Number(a.equity || a.balance || 0), 0);
    return effectiveBalance;
  }, [isManualMode, manualEquity, selectedAccount, accounts, effectiveBalance]);

  const effectiveFreeMargin = useMemo(() => {
    if (isManualMode) return manualFreeMargin;
    if (selectedAccount) return Number(selectedAccount.free_margin || selectedAccount.equity || selectedAccount.balance || 0);
    if (accounts.length > 0) return accounts.reduce((s, a) => s + Number(a.free_margin || a.equity || a.balance || 0), 0);
    return effectiveEquity * 0.95;
  }, [isManualMode, manualFreeMargin, selectedAccount, accounts, effectiveEquity]);

  // Selected Instrument Config
  const selectedInstrument = useMemo(() => {
    return POPULAR_INSTRUMENTS.find(i => i.symbol === calcSymbol) || {
      symbol: calcSymbol,
      name: 'Custom Symbol',
      pipSize: calcSymbol.includes('JPY') ? 0.01 : 0.0001,
      contractSize: 100000,
      digits: calcSymbol.includes('JPY') ? 3 : 5,
      category: 'Forex' as const
    };
  }, [calcSymbol]);

  // Calculations: Position Sizing & Risk Assessment
  const calculationResults = useMemo(() => {
    const entry = parseFloat(calcEntryPrice) || 0;
    const sl = parseFloat(calcStopLoss) || 0;
    const tp = parseFloat(calcTakeProfit) || 0;
    const pipSize = selectedInstrument.pipSize;
    const contractSize = selectedInstrument.contractSize;

    // Price Distances
    const isBuy = calcDirection === 'BUY';
    const slPriceDistance = isBuy ? (entry - sl) : (sl - entry);
    const tpPriceDistance = isBuy ? (tp - entry) : (entry - tp);

    const slPips = slPriceDistance > 0 && pipSize > 0 ? Number((slPriceDistance / pipSize).toFixed(1)) : 0;
    const tpPips = tpPriceDistance > 0 && pipSize > 0 ? Number((tpPriceDistance / pipSize).toFixed(1)) : 0;

    // Monetary Risk
    let targetRiskDollars = 0;
    if (calcRiskMode === 'PCT') {
      targetRiskDollars = effectiveEquity * (calcRiskPct / 100);
    } else {
      targetRiskDollars = calcRiskAmt;
    }

    // Lot Sizing Formula:
    // Risk ($) = LotSize * ContractSize * SL_Price_Distance
    // LotSize = Risk ($) / (ContractSize * SL_Price_Distance)
    let calculatedLots = 0;
    if (slPriceDistance > 0 && contractSize > 0) {
      const rawLots = targetRiskDollars / (contractSize * slPriceDistance);
      calculatedLots = Math.max(0.01, Number(rawLots.toFixed(2)));
    }

    // Potential Monetary Outcomes
    const potentialLoss = calculatedLots * contractSize * Math.max(0, slPriceDistance);
    const potentialProfit = calculatedLots * contractSize * Math.max(0, tpPriceDistance);

    // Risk-to-Reward Ratio
    const rrRatio = slPriceDistance > 0 && tpPriceDistance > 0
      ? Number((tpPriceDistance / slPriceDistance).toFixed(2))
      : 0;

    // Estimated Required Margin (assuming standard 1:100 leverage)
    const positionExposure = calculatedLots * contractSize * entry;
    const estimatedMargin = positionExposure > 0 ? positionExposure / 100 : 0;

    return {
      entry,
      sl,
      tp,
      slPips,
      tpPips,
      targetRiskDollars,
      calculatedLots,
      potentialLoss,
      potentialProfit,
      rrRatio,
      positionExposure,
      estimatedMargin,
      isValidDirection: slPriceDistance > 0 && tpPriceDistance > 0
    };
  }, [
    calcEntryPrice,
    calcStopLoss,
    calcTakeProfit,
    calcDirection,
    calcRiskMode,
    calcRiskPct,
    calcRiskAmt,
    effectiveEquity,
    selectedInstrument
  ]);

  // Daily Loss & Capacity Metrics
  const dailyMetrics = useMemo(() => {
    const dailyLimitDollars = Number(formData.max_daily_loss_amount || rules?.max_daily_loss_amount || 500);
    const todayLoss = Number(monitor?.todayLoss || 0);
    const remainingDailyBudget = Math.max(0, dailyLimitDollars - todayLoss);
    const maxTradesPerDay = Number(formData.max_trades_per_day || rules?.max_trades_per_day || 5);
    const todayTrades = Number(monitor?.todayTrades || 0);
    const remainingTradesCount = Math.max(0, maxTradesPerDay - todayTrades);
    const maxPositionSize = Number(formData.max_position_size || rules?.max_position_size || 5.0);

    return {
      dailyLimitDollars,
      todayLoss,
      remainingDailyBudget,
      maxTradesPerDay,
      todayTrades,
      remainingTradesCount,
      maxPositionSize
    };
  }, [formData, rules, monitor]);

  // Smart Trade Execution Validation
  const smartEvaluation = useMemo(() => {
    const checks: { id: string; label: string; passed: boolean; severity: 'CRITICAL' | 'WARNING' | 'PASS'; detail: string }[] = [];

    // Check 1: Valid Price Structure
    if (!calculationResults.isValidDirection) {
      checks.push({
        id: 'price_structure',
        label: 'Price Order & Distance',
        passed: false,
        severity: 'CRITICAL',
        detail: calcDirection === 'BUY'
          ? 'Stop Loss must be below Entry price, and Take Profit above Entry.'
          : 'Stop Loss must be above Entry price, and Take Profit below Entry.'
      });
    } else {
      checks.push({
        id: 'price_structure',
        label: 'Price Structure',
        passed: true,
        severity: 'PASS',
        detail: `Valid ${calcDirection} structure with ${calculationResults.slPips} pips SL and ${calculationResults.tpPips} pips TP.`
      });
    }

    // Check 2: Single Trade Risk %
    const maxTradeRiskPct = Number(formData.max_risk_per_trade_pct || 2.0);
    const actualRiskPct = (calculationResults.potentialLoss / effectiveEquity) * 100;
    if (actualRiskPct > maxTradeRiskPct) {
      checks.push({
        id: 'single_trade_risk',
        label: 'Single Trade Risk Limit',
        passed: false,
        severity: 'CRITICAL',
        detail: `Proposed risk is ${actualRiskPct.toFixed(2)}% ($${calculationResults.potentialLoss.toFixed(2)}), exceeding your ${maxTradeRiskPct}% ($${((effectiveEquity * maxTradeRiskPct) / 100).toFixed(2)}) parameter.`
      });
    } else {
      checks.push({
        id: 'single_trade_risk',
        label: 'Single Trade Risk Limit',
        passed: true,
        severity: 'PASS',
        detail: `Risking ${actualRiskPct.toFixed(2)}% ($${calculationResults.potentialLoss.toFixed(2)}) — within safe 1-2% parameters.`
      });
    }

    // Check 3: Daily Risk Budget
    if (calculationResults.potentialLoss > dailyMetrics.remainingDailyBudget) {
      checks.push({
        id: 'daily_budget',
        label: 'Daily Loss Budget',
        passed: false,
        severity: 'CRITICAL',
        detail: `Trade loss potential ($${calculationResults.potentialLoss.toFixed(2)}) exceeds remaining daily budget of $${dailyMetrics.remainingDailyBudget.toFixed(2)}.`
      });
    } else {
      checks.push({
        id: 'daily_budget',
        label: 'Daily Loss Budget',
        passed: true,
        severity: 'PASS',
        detail: `$${(dailyMetrics.remainingDailyBudget - calculationResults.potentialLoss).toFixed(2)} daily budget will remain after this trade.`
      });
    }

    // Check 4: Max Lot Size
    if (calculationResults.calculatedLots > dailyMetrics.maxPositionSize) {
      checks.push({
        id: 'max_lot_size',
        label: 'Position Sizing Limit',
        passed: false,
        severity: 'CRITICAL',
        detail: `Calculated lot size (${calculationResults.calculatedLots}) exceeds maximum position size of ${dailyMetrics.maxPositionSize} lots.`
      });
    } else {
      checks.push({
        id: 'max_lot_size',
        label: 'Position Sizing Limit',
        passed: true,
        severity: 'PASS',
        detail: `${calculationResults.calculatedLots} Lots conforms to account sizing rules (Max: ${dailyMetrics.maxPositionSize}).`
      });
    }

    // Check 5: Risk to Reward Ratio
    const minRR = 1.5;
    if (calculationResults.rrRatio < minRR && calculationResults.isValidDirection) {
      checks.push({
        id: 'rr_ratio',
        label: 'Risk-to-Reward Ratio',
        passed: false,
        severity: 'WARNING',
        detail: `R:R of 1:${calculationResults.rrRatio} is below the professional benchmark of 1:1.5.`
      });
    } else if (calculationResults.isValidDirection) {
      checks.push({
        id: 'rr_ratio',
        label: 'Risk-to-Reward Ratio',
        passed: true,
        severity: 'PASS',
        detail: `Positive expectancy 1:${calculationResults.rrRatio} R:R setup.`
      });
    }

    // Check 6: Free Margin
    if (calculationResults.estimatedMargin > effectiveFreeMargin) {
      checks.push({
        id: 'margin_check',
        label: 'Free Margin Availability',
        passed: false,
        severity: 'CRITICAL',
        detail: `Required margin ($${calculationResults.estimatedMargin.toFixed(2)}) exceeds available free margin ($${effectiveFreeMargin.toFixed(2)}).`
      });
    } else {
      checks.push({
        id: 'margin_check',
        label: 'Free Margin Availability',
        passed: true,
        severity: 'PASS',
        detail: `Margin requirement is ~${((calculationResults.estimatedMargin / Math.max(1, effectiveFreeMargin)) * 100).toFixed(1)}% of free margin.`
      });
    }

    // Overall Status Decision
    const hasCritical = checks.some(c => c.severity === 'CRITICAL');
    const hasWarning = checks.some(c => c.severity === 'WARNING');

    let overallStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
    let statusHeading = 'Trade Setup Compliant';
    let statusMessage = 'This trade strictly adheres to all risk parameters, position sizing rules, and daily budget constraints.';

    if (hasCritical) {
      overallStatus = 'DANGER';
      statusHeading = 'Risk Limit Exceeded — Execution Blocked';
      statusMessage = 'Executing this trade in its current configuration breaches your core account safety thresholds. Adjust your stop-loss or lot size.';
    } else if (hasWarning) {
      overallStatus = 'WARNING';
      statusHeading = 'Trade Caution — Sub-Optimal Parameters';
      statusMessage = 'Trade is within risk limits but has warnings (such as a sub-1.5 R:R ratio). Review before executing.';
    }

    return {
      checks,
      overallStatus,
      statusHeading,
      statusMessage
    };
  }, [calculationResults, effectiveEquity, effectiveFreeMargin, dailyMetrics, formData, calcDirection]);

  // Standalone Pip Distance Tool Results
  const pipToolResults = useMemo(() => {
    const inst = POPULAR_INSTRUMENTS.find(i => i.symbol === pipToolSymbol) || POPULAR_INSTRUMENTS[0];
    const start = parseFloat(pipStartPrice) || 0;
    const end = parseFloat(pipEndPrice) || 0;
    const priceDiff = Math.abs(end - start);
    const pips = inst.pipSize > 0 ? Number((priceDiff / inst.pipSize).toFixed(1)) : 0;
    const points = Number((priceDiff / (inst.pipSize / 10)).toFixed(0));
    const pctMove = start > 0 ? ((priceDiff / start) * 100).toFixed(2) : '0.00';

    // Dollar value for 1.0, 0.1, 0.01 lot
    const standardLotVal = (pips * (inst.contractSize * inst.pipSize)).toFixed(2);
    const miniLotVal = (pips * (inst.contractSize * inst.pipSize * 0.1)).toFixed(2);
    const microLotVal = (pips * (inst.contractSize * inst.pipSize * 0.01)).toFixed(2);

    return {
      pips,
      points,
      pctMove,
      priceDiff: priceDiff.toFixed(inst.digits),
      standardLotVal,
      miniLotVal,
      microLotVal
    };
  }, [pipToolSymbol, pipStartPrice, pipEndPrice]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Risk Guardian & Smart Position Calculator
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Capital protection engine, mathematical position sizing, stop-loss distance evaluator & pre-execution risk checks
          </p>
        </div>

        {/* Live vs Manual Mode Switch */}
        <div className="flex items-center space-x-2 bg-surface-secondary border border-border-subtle p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setIsManualMode(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !isManualMode
                ? 'bg-surface text-brand-primary shadow-sm border border-border-subtle'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Live MT5 Account
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isManualMode
                ? 'bg-surface text-brand-primary shadow-sm border border-border-subtle'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Manual Simulation
          </button>
        </div>
      </div>

      {/* 1. Account Snapshot Bar */}
      <div className="framer-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-content-primary">
              Account Capital & Exposure Snapshot
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isManualMode
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {isManualMode ? 'Manual Simulation Data' : 'Live MT5 Terminal Data'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Balance</div>
            {isManualMode ? (
              <input
                type="number"
                value={manualBalance}
                onChange={e => setManualBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface border border-border-subtle rounded-lg px-2 py-0.5 text-sm font-bold font-mono text-content-primary mt-1 focus:outline-none"
              />
            ) : (
              <div className="text-base font-extrabold font-mono text-content-primary mt-0.5">
                ${effectiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Equity</div>
            {isManualMode ? (
              <input
                type="number"
                value={manualEquity}
                onChange={e => setManualEquity(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface border border-border-subtle rounded-lg px-2 py-0.5 text-sm font-bold font-mono text-emerald-400 mt-1 focus:outline-none"
              />
            ) : (
              <div className="text-base font-extrabold font-mono text-emerald-400 mt-0.5">
                ${effectiveEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Free Margin</div>
            {isManualMode ? (
              <input
                type="number"
                value={manualFreeMargin}
                onChange={e => setManualFreeMargin(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface border border-border-subtle rounded-lg px-2 py-0.5 text-sm font-bold font-mono text-content-primary mt-1 focus:outline-none"
              />
            ) : (
              <div className="text-base font-extrabold font-mono text-content-primary mt-0.5">
                ${effectiveFreeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Daily Loss Used</div>
            <div className={`text-base font-extrabold font-mono mt-0.5 ${dailyMetrics.todayLoss > 0 ? 'text-trade-loss' : 'text-trade-profit'}`}>
              ${dailyMetrics.todayLoss.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Remaining Daily Risk</div>
            <div className="text-base font-extrabold font-mono text-brand-primary mt-0.5">
              ${dailyMetrics.remainingDailyBudget.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle">
            <div className="text-[10px] text-content-muted uppercase font-bold">Open Trades</div>
            <div className="text-base font-extrabold font-mono text-content-primary mt-0.5">
              {openPositionsCount} / {dailyMetrics.maxTradesPerDay} Max
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Smart Trade Risk & Position Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trade Inputs (5 Cols) */}
        <div className="lg:col-span-5 framer-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-bold text-content-primary">Proposed Trade Parameters</h2>
            </div>
            <span className="text-[11px] text-content-muted font-mono">{selectedInstrument.category}</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Symbol & Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-content-secondary font-medium mb-1">Instrument / Symbol</label>
                <select
                  value={calcSymbol}
                  onChange={e => setCalcSymbol(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-bold focus:outline-none"
                >
                  {POPULAR_INSTRUMENTS.map(inst => (
                    <option key={inst.symbol} value={inst.symbol}>
                      {inst.symbol} ({inst.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-content-secondary font-medium mb-1">Position Direction</label>
                <div className="grid grid-cols-2 gap-1.5 bg-surface-secondary p-1 rounded-xl border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setCalcDirection('BUY')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      calcDirection === 'BUY'
                        ? 'bg-trade-profit text-white shadow-sm'
                        : 'text-content-muted hover:text-content-primary'
                    }`}
                  >
                    BUY (Long)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcDirection('SELL')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      calcDirection === 'SELL'
                        ? 'bg-trade-loss text-white shadow-sm'
                        : 'text-content-muted hover:text-content-primary'
                    }`}
                  >
                    SELL (Short)
                  </button>
                </div>
              </div>
            </div>

            {/* Price Inputs: Entry, SL, TP */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-content-secondary font-medium mb-1">Entry Price</label>
                <input
                  type="text"
                  value={calcEntryPrice}
                  onChange={e => setCalcEntryPrice(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-2.5 py-2 text-content-primary font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-rose-400 font-medium mb-1">Stop Loss (SL)</label>
                <input
                  type="text"
                  value={calcStopLoss}
                  onChange={e => setCalcStopLoss(e.target.value)}
                  className="w-full bg-surface-secondary border border-rose-500/30 rounded-xl px-2.5 py-2 text-rose-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-emerald-400 font-medium mb-1">Take Profit (TP)</label>
                <input
                  type="text"
                  value={calcTakeProfit}
                  onChange={e => setCalcTakeProfit(e.target.value)}
                  className="w-full bg-surface-secondary border border-emerald-500/30 rounded-xl px-2.5 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
              </div>
            </div>

            {/* Risk Sizing Controls */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-content-secondary font-bold">Risk Allocation Mode</span>
                <div className="flex items-center space-x-1 bg-surface p-0.5 rounded-lg border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setCalcRiskMode('PCT')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      calcRiskMode === 'PCT' ? 'bg-brand-primary text-white' : 'text-content-muted'
                    }`}
                  >
                    % Equity
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcRiskMode('AMT')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      calcRiskMode === 'AMT' ? 'bg-brand-primary text-white' : 'text-content-muted'
                    }`}
                  >
                    Fixed $
                  </button>
                </div>
              </div>

              {calcRiskMode === 'PCT' ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-content-muted">Target Risk (%):</span>
                    <span className="text-brand-primary font-bold">{calcRiskPct}% = ${((effectiveEquity * calcRiskPct) / 100).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="5.0"
                    step="0.25"
                    value={calcRiskPct}
                    onChange={e => setCalcRiskPct(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-content-muted font-mono">
                    <span>0.5% (Conservative)</span>
                    <span>1.0% (Standard)</span>
                    <span>2.0% (Aggressive)</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-content-muted mb-1 text-[11px]">Dollar Risk Amount ($)</label>
                  <input
                    type="number"
                    value={calcRiskAmt}
                    onChange={e => setCalcRiskAmt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono font-bold focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Smart Evaluation (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Smart Decision Banner */}
          <div className={`framer-card p-5 rounded-3xl border ${
            smartEvaluation.overallStatus === 'SAFE'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : smartEvaluation.overallStatus === 'WARNING'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          } space-y-2`}>
            <div className="flex items-center space-x-2">
              {smartEvaluation.overallStatus === 'SAFE' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
              {smartEvaluation.overallStatus === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {smartEvaluation.overallStatus === 'DANGER' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
              <h3 className={`font-bold text-sm ${
                smartEvaluation.overallStatus === 'SAFE' ? 'text-emerald-400' : smartEvaluation.overallStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {smartEvaluation.statusHeading}
              </h3>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {smartEvaluation.statusMessage}
            </p>
          </div>

          {/* Sizing & Mathematical Outcomes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-1 framer-card">
              <div className="text-[10px] uppercase font-bold text-content-muted">Recommended Lots</div>
              <div className="text-xl font-extrabold text-brand-primary">
                {calculationResults.calculatedLots} <span className="text-xs font-normal text-content-muted">Lots</span>
              </div>
              <div className="text-[10px] text-content-muted">Based on {calculationResults.slPips} pips SL</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-1 framer-card">
              <div className="text-[10px] uppercase font-bold text-content-muted">Risk / Reward (R:R)</div>
              <div className={`text-xl font-extrabold ${calculationResults.rrRatio >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                1 : {calculationResults.rrRatio}
              </div>
              <div className="text-[10px] text-content-muted">{calculationResults.tpPips} pips Target</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-1 framer-card">
              <div className="text-[10px] uppercase font-bold text-rose-400">Potential Loss</div>
              <div className="text-xl font-extrabold text-rose-400">
                -${calculationResults.potentialLoss.toFixed(2)}
              </div>
              <div className="text-[10px] text-content-muted">
                {((calculationResults.potentialLoss / effectiveEquity) * 100).toFixed(2)}% of equity
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-1 framer-card">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Potential Profit</div>
              <div className="text-xl font-extrabold text-emerald-400">
                +${calculationResults.potentialProfit.toFixed(2)}
              </div>
              <div className="text-[10px] text-content-muted">
                {((calculationResults.potentialProfit / effectiveEquity) * 100).toFixed(2)}% gain
              </div>
            </div>
          </div>

          {/* Validation Checks Breakdown */}
          <div className="framer-card p-5 rounded-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Pre-Execution Risk Compliance Checklist</span>
            </div>

            <div className="space-y-2">
              {smartEvaluation.checks.map(check => (
                <div
                  key={check.id}
                  className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                    check.passed
                      ? 'bg-surface-secondary/60 border-border-subtle'
                      : check.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-content-primary">{check.label}</div>
                    <div className="text-[11px] text-content-secondary leading-normal">{check.detail}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    check.passed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : check.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {check.passed ? 'PASSED' : check.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Standalone Pip Measurement Calculator */}
      <div className="framer-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-brand-primary" />
            <h3 className="font-bold text-sm text-content-primary">Instrument Pip & Move Measurement Tool</h3>
          </div>
          <span className="text-xs text-content-muted font-mono">Distance Calculator</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-content-secondary font-medium mb-1">Symbol</label>
              <select
                value={pipToolSymbol}
                onChange={e => setPipToolSymbol(e.target.value)}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-bold focus:outline-none"
              >
                {POPULAR_INSTRUMENTS.map(i => (
                  <option key={i.symbol} value={i.symbol}>{i.symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-content-secondary font-medium mb-1">Price Point A</label>
              <input
                type="text"
                value={pipStartPrice}
                onChange={e => setPipStartPrice(e.target.value)}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-content-secondary font-medium mb-1">Price Point B</label>
              <input
                type="text"
                value={pipEndPrice}
                onChange={e => setPipEndPrice(e.target.value)}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-3 gap-3 text-xs font-mono text-center">
            <div className="p-3 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans font-semibold">Pip Distance</div>
              <div className="text-base font-extrabold text-brand-primary mt-0.5">{pipToolResults.pips} pips</div>
              <div className="text-[10px] text-content-muted">{pipToolResults.points} points</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans font-semibold">Price Delta</div>
              <div className="text-base font-extrabold text-content-primary mt-0.5">{pipToolResults.priceDiff}</div>
              <div className="text-[10px] text-content-muted">{pipToolResults.pctMove}% move</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-secondary border border-border-subtle">
              <div className="text-[10px] text-content-muted font-sans font-semibold">Std Lot Value (1.0)</div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">${pipToolResults.standardLotVal}</div>
              <div className="text-[10px] text-content-muted">0.10: ${pipToolResults.miniLotVal}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Risk Parameters Configuration & Alert Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules Form */}
        <form onSubmit={handleSaveRules} className="framer-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
            <Settings className="w-4 h-4" />
            <span>Account Risk Guardian Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Daily Loss ($ Limit)</label>
              <input
                type="number"
                value={formData.max_daily_loss_amount ?? 500}
                onChange={e => setFormData({ ...formData, max_daily_loss_amount: parseFloat(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Trades Per Day</label>
              <input
                type="number"
                value={formData.max_trades_per_day ?? 5}
                onChange={e => setFormData({ ...formData, max_trades_per_day: parseInt(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.max_risk_per_trade_pct ?? 1.5}
                onChange={e => setFormData({ ...formData, max_risk_per_trade_pct: parseFloat(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1 font-medium">Max Position Size (Lots)</label>
              <input
                type="number"
                step="0.01"
                value={formData.max_position_size ?? 5.0}
                onChange={e => setFormData({ ...formData, max_position_size: parseFloat(e.target.value) })}
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="framer-btn-primary w-full py-2.5 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Rules...' : 'Save Risk Guardian Parameters'}</span>
          </button>
        </form>

        {/* Alerts Log */}
        <div className="framer-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-500">
            <Bell className="w-4 h-4" />
            <span>Triggered Risk Alerts Log</span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-content-muted">No active or historical risk alerts triggered.</div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`p-3.5 rounded-2xl border ${
                  a.severity === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                } flex items-start justify-between gap-2`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-[11px] text-content-muted font-mono">
                        {new Date(a.triggered_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-content-primary text-xs">{a.message}</p>
                  </div>
                  {!a.is_acknowledged && (
                    <button
                      onClick={() => handleAckAlert(a.id)}
                      className="px-2.5 py-1 bg-surface-secondary hover:bg-surface text-content-primary rounded-lg text-[10px] font-semibold shrink-0 border border-border-subtle transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
