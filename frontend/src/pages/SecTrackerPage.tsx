import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { MetaHead } from '../components/common/MetaHead';

export const SecTrackerPage: React.FC = () => {
  const [disclosureTicker, setDisclosureTicker] = useState<string>('TSLA');
  const [companyDisclosures, setCompanyDisclosures] = useState<any>(null);
  const [congressDisclosures, setCongressDisclosures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDisclosures(disclosureTicker);
  }, []);

  const loadDisclosures = async (ticker: string = 'TSLA', refresh: boolean = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleTickerChange = (ticker: string) => {
    setDisclosureTicker(ticker);
    loadDisclosures(ticker, true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MetaHead
        title="SEC & Politician Tracker"
        description="US Congressional STOCK Act Periodic Transaction Reports and SEC EDGAR XBRL corporate financial disclosures."
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              SEC & Politician Tracker
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Official US Congressional STOCK Act PTR disclosures & SEC EDGAR financial metrics
          </p>
        </div>

        <button
          onClick={() => loadDisclosures(disclosureTicker, true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-secondary hover:bg-surface border border-border-subtle rounded-xl text-xs font-semibold text-content-primary transition disabled:opacity-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing Data...' : 'Refresh Records'}</span>
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

      {/* Overview Card */}
      <div className="p-4 bg-surface border border-border-subtle rounded-xl space-y-2 shadow-sm">
        <h2 className="text-sm font-bold text-content-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent-primary" />
          <span>Cross-Market Equity Intelligence & Official Disclosures</span>
        </h2>
        <p className="text-xs text-content-muted">
          Tracks public STOCK Act Periodic Transaction Reports from the US House Clerk alongside official 10-Q and 10-K filings retrieved from the SEC EDGAR XBRL system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SEC Company Fundamentals */}
        <div className="p-4 bg-surface border border-border-subtle rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-xs font-bold text-content-primary">
              SEC EDGAR Filed Financials ({disclosureTicker})
            </h3>
            <div className="flex items-center gap-1.5">
              {['TSLA', 'AAPL', 'NVDA'].map((tk) => (
                <button
                  key={tk}
                  onClick={() => handleTickerChange(tk)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                    disclosureTicker === tk
                      ? 'bg-accent-primary text-white font-semibold shadow-xs'
                      : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                  }`}
                >
                  {tk}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-content-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
              <span>Fetching SEC EDGAR filings...</span>
            </div>
          ) : companyDisclosures?.metrics && companyDisclosures.metrics.length > 0 ? (
            <div className="divide-y divide-border-subtle text-xs">
              {companyDisclosures.metrics.map((m: any, idx: number) => (
                <div key={idx} className="py-2.5 space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-content-primary">
                      {m.fiscalPeriod} {m.fiscalYear} ({m.form})
                    </span>
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
              No SEC EDGAR metrics found for {disclosureTicker}.
            </div>
          )}
        </div>

        {/* Congressional STOCK Act Disclosures */}
        <div className="p-4 bg-surface border border-border-subtle rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-xs font-bold text-content-primary">
              US Congressional PTR Disclosures (STOCK Act)
            </h3>
            <span className="text-[10px] text-content-muted font-mono">House Clerk Official Records</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-content-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
              <span>Fetching congressional transactions...</span>
            </div>
          ) : congressDisclosures && congressDisclosures.length > 0 ? (
            <div className="divide-y divide-border-subtle text-xs">
              {congressDisclosures.map((d: any) => (
                <div key={d.id} className="py-2.5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-content-primary">{d.memberName} ({d.office})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.transactionType === 'BUY'
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-red-400 bg-red-500/10 border border-red-500/20'
                    }`}>
                      {d.transactionType} {d.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-content-muted font-mono">
                    <span>Owner: {d.owner} | Range: {d.amountRange}</span>
                    <span>Delay: {d.delayDays}d</span>
                  </div>
                  <div className="text-[10px] text-content-muted flex items-center gap-1">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:underline flex items-center gap-1"
                    >
                      <span>View House Clerk PDF (Doc #{d.docId})</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-content-muted">
              No recent congressional trade disclosures available.
            </div>
          )}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="p-3.5 bg-surface-secondary border border-border-subtle rounded-xl text-[11px] text-content-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
        <span>
          <strong>Legal & Regulatory Notice:</strong> Congressional disclosures and corporate financial metrics are supplementary market intelligence. They do not constitute insider information, investment advice, or guaranteed price targets, and do not govern immediate foreign exchange quotes.
        </span>
      </div>
    </div>
  );
};
