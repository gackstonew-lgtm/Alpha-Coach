import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Maximize2,
  Minimize2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { resolveTradingViewSymbol, TradingViewInstrument } from '../../config/tradingViewSymbols';

export interface TradingViewAdvancedChartProps {
  symbol: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  className?: string;
  allowSymbolChange?: boolean;
  onSymbolChange?: (newSymbol: string) => void;
}

export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  symbol,
  interval = '60',
  theme = 'dark',
  height = 580,
  className = '',
  allowSymbolChange = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Resolve TradingView qualified symbol
  const resolved = resolveTradingViewSymbol(symbol);
  const activeTvSymbol = resolved.tvSymbol;

  const initWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    // Completely clear existing contents to prevent duplicate scripts or orphaned iframes
    container.innerHTML = '';

    // Create wrapper container elements as documented by TradingView
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetInner.style.height = 'calc(100% - 32px)';
    widgetInner.style.width = '100%';

    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    copyright.style.height = '32px';
    copyright.style.lineHeight = '32px';
    copyright.style.textAlign = 'center';
    copyright.style.fontSize = '11px';
    copyright.style.color = '#787b86';

    const copyrightLink = document.createElement('a');
    copyrightLink.href = `https://www.tradingview.com/symbols/${encodeURIComponent(activeTvSymbol)}/`;
    copyrightLink.rel = 'noopener nofollow';
    copyrightLink.target = '_blank';
    copyrightLink.style.color = '#2962FF';
    copyrightLink.style.textDecoration = 'none';
    copyrightLink.innerText = `${activeTvSymbol} Chart by TradingView`;

    copyright.appendChild(copyrightLink);
    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(copyright);

    // TradingView Advanced Chart script configuration
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const widgetConfig = {
      autosize: true,
      symbol: activeTvSymbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme === 'dark' ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: true,
      details: true,
      hotlist: false
    };

    script.textContent = JSON.stringify(widgetConfig);

    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(
        'Failed to load TradingView script. Please check your network connection or disable ad-blockers blocking s3.tradingview.com.'
      );
    };

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    // Timeout check: Verify that an iframe successfully renders within 7 seconds
    const timeoutTimer = setTimeout(() => {
      const iframe = widgetInner.querySelector('iframe');
      if (!iframe) {
        // If no iframe has rendered and no content exists, show helpful fallback
        const isStillEmpty = widgetInner.childNodes.length === 0;
        if (isStillEmpty) {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(
            'Chart widget response timed out. Content from s3.tradingview.com may be blocked by client privacy extensions or network filters.'
          );
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }, 4500);

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [activeTvSymbol, interval, theme, allowSymbolChange]);

  useEffect(() => {
    const cleanup = initWidget();
    return () => {
      if (cleanup) cleanup();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [initWidget]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const elem = wrapperRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const containerHeight = isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-border-subtle bg-surface shadow-xs transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      } ${className}`}
      style={{ height: containerHeight, minHeight: '380px' }}
    >
      {/* Top Chart Header Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-border-subtle p-1 rounded-xl shadow-xs">
        <button
          onClick={initWidget}
          title="Reload TradingView Chart"
          className="p-1.5 text-content-muted hover:text-content-primary hover:bg-surface-secondary rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent-primary' : ''}`} />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
          className="p-1.5 text-content-muted hover:text-content-primary hover:bg-surface-secondary rounded-lg transition"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <a
          href={`https://www.tradingview.com/symbols/${encodeURIComponent(activeTvSymbol)}/`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in TradingView"
          className="p-1.5 text-content-muted hover:text-accent-primary hover:bg-surface-secondary rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/85 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <RefreshCw className="w-8 h-8 animate-spin text-accent-primary mb-3" />
          <div className="text-xs font-mono font-bold text-content-primary flex items-center gap-1.5">
            <span>Loading {activeTvSymbol} Candlesticks...</span>
          </div>
          <p className="text-[11px] text-content-muted mt-1 font-mono">
            Connecting to TradingView live market data feed
          </p>
        </div>
      )}

      {/* Error Fallback Banner */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-surface text-center space-y-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-sm font-bold text-content-primary">
              TradingView Chart Unavailable
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              {errorMessage || `Unable to load data for ${activeTvSymbol}. Please verify the symbol is supported or disable ad-blockers.`}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={initWidget}
              className="px-3 py-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Initialization</span>
            </button>
            <a
              href={`https://www.tradingview.com/symbols/${encodeURIComponent(activeTvSymbol)}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border-subtle text-content-secondary text-xs font-medium flex items-center gap-1.5 transition"
            >
              <span>View on TradingView</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Native TradingView Widget Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};
