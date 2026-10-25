import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

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

export const MarketScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerSetupFilter, setScannerSetupFilter] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MetaHead
        title="Market Scanner"
        description="Multi-asset Forex and metals scanner for breakouts, moving average reclaims, SMC sweeps, and CRT setups."
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Scan className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Market Scanner
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Real-time multi-asset technical scanner across M15, H1, and H4 timeframes
          </p>
        </div>

        <button
          onClick={handleRunScanner}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Markets...' : 'Run Market Scan'}</span>
        </button>
      </div>

      {/* Error Notification */}
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

      {/* Scan Summary Banner */}
      {scannerResult && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-content-muted bg-surface-secondary p-3 rounded-lg border border-border-subtle">
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
                ? 'bg-accent-primary text-white font-semibold shadow-sm'
                : 'bg-surface border border-border-subtle text-content-muted hover:text-content-primary hover:bg-surface-secondary'
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
              <div key={hit.id} className="p-4 bg-surface border border-border-subtle rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-border-hover transition">
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
                      navigate(`/charts?symbol=${hit.symbol}&timeframe=${hit.timeframe || 'H1'}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 rounded text-xs text-accent-primary transition font-semibold"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/charts?symbol=${hit.symbol}&timeframe=${hit.timeframe || 'H1'}`);
                    }}
                    className="px-3 py-1.5 bg-surface-secondary hover:bg-surface border border-border-subtle rounded text-xs text-content-primary transition font-medium"
                  >
                    Open Chart
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
  );
};
