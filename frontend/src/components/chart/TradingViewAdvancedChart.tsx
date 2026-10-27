import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { resolveTradingViewSymbol } from '../../config/tradingViewSymbols';

export interface TradingViewAdvancedChartProps {
  symbol: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  className?: string;
  allowSymbolChange?: boolean;
  onSymbolChange?: (newSymbol: string) => void;
}

const TV_EMBED_SCRIPT_SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
const TV_IFRAME_BASE_URL = 'https://www.tradingview-widget.com/embed-widget/advanced-chart/';
const WIDGET_TIMEOUT_MS = 15000;
const DIRECT_IFRAME_FALLBACK_MS = 5000;

export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = React.memo(({
  symbol,
  interval = '60',
  theme = 'dark',
  height = 580,
  className = '',
  allowSymbolChange = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Resolve TradingView exchange-qualified symbol (e.g., XAUUSD -> OANDA:XAUUSD)
  const resolved = resolveTradingViewSymbol(symbol);
  const activeTvSymbol = resolved.tvSymbol;
  const resolvedTheme = theme === 'light' ? 'light' : 'dark';

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let mutationObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let hasMountedWidget = false;
    let cspViolationReason: string | null = null;

    isReadyRef.current = false;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    const markWidgetReady = () => {
      if (isCancelled || isReadyRef.current) return;
      isReadyRef.current = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      setIsLoading(false);
      setHasError(false);
      setErrorMessage(null);
    };

    const handleCspViolation = (event: SecurityPolicyViolationEvent) => {
      const blocked = event.blockedURI || '';
      if (blocked.includes('tradingview')) {
        cspViolationReason = `Content Security Policy blocked resource (${blocked} via ${event.violatedDirective}).`;
      }
    };

    window.addEventListener('securitypolicyviolation', handleCspViolation);

    const buildWidgetConfig = () => ({
      autosize: true,
      symbol: activeTvSymbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: resolvedTheme,
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
    });

    const attachIframeLoadHandler = (iframe: HTMLIFrameElement) => {
      if (iframe.dataset.arcadefxAttached === 'true') return;
      iframe.dataset.arcadefxAttached = 'true';

      iframe.addEventListener('load', () => {
        markWidgetReady();
      });

      // Fallback in case the iframe load event already fired before listener attachment
      try {
        if (iframe.getAttribute('src')?.includes('tradingview')) {
          setTimeout(() => {
            if (!isCancelled && !isReadyRef.current && container.contains(iframe)) {
              markWidgetReady();
            }
          }, 1500);
        }
      } catch {
        // Ignore cross-origin frame inspection errors
      }
    };

    const mountDirectIframeFallback = (widgetContainer: HTMLDivElement) => {
      if (isCancelled || isReadyRef.current) return;
      // Only mount fallback if embed-widget-advanced-chart.js hasn't created an iframe yet
      const existingIframe = widgetContainer.querySelector('iframe');
      if (existingIframe) {
        attachIframeLoadHandler(existingIframe);
        return;
      }

      const config = {
        ...buildWidgetConfig(),
        width: '100%',
        height: '100%',
        utm_source: typeof window !== 'undefined' ? window.location.hostname : 'arcadefx.live',
        utm_medium: 'widget_new',
        utm_campaign: 'advanced-chart'
      };

      const iframe = document.createElement('iframe');
      iframe.title = 'advanced chart TradingView widget';
      iframe.lang = 'en';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.scrolling = 'no';
      iframe.style.cssText =
        'user-select: none; box-sizing: border-box; display: block; height: calc(100% - 32px); width: 100%;';
      iframe.src = `${TV_IFRAME_BASE_URL}?locale=en#${encodeURIComponent(JSON.stringify(config))}`;

      attachIframeLoadHandler(iframe);

      const placeholder = widgetContainer.querySelector('.tradingview-widget-container__widget');
      if (placeholder && placeholder.parentElement === widgetContainer) {
        widgetContainer.replaceChild(iframe, placeholder);
      } else {
        widgetContainer.insertBefore(iframe, widgetContainer.firstChild);
      }
    };

    const mountWidget = () => {
      if (isCancelled || hasMountedWidget) return;
      hasMountedWidget = true;

      // Clear any previous DOM nodes before mounting single widget instance
      container.innerHTML = '';

      // Create official TradingView container hierarchy
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
      copyrightLink.textContent = `${activeTvSymbol} Chart by TradingView`;

      copyright.appendChild(copyrightLink);
      widgetContainer.appendChild(widgetInner);
      widgetContainer.appendChild(copyright);
      container.appendChild(widgetContainer);

      // Observe widgetContainer (NOT widgetInner, because TradingView's script replaces widgetInner with iframe)
      mutationObserver = new MutationObserver(() => {
        if (isCancelled) return;
        const injectedIframe = widgetContainer.querySelector('iframe');
        if (injectedIframe) {
          attachIframeLoadHandler(injectedIframe);
        }
      });

      mutationObserver.observe(widgetContainer, {
        childList: true,
        subtree: true
      });

      // Inject official TradingView Advanced Chart embed script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = TV_EMBED_SCRIPT_SRC;
      script.async = true;
      script.textContent = JSON.stringify(buildWidgetConfig());

      script.onerror = () => {
        if (isCancelled || isReadyRef.current) return;
        // If s3.tradingview.com script is blocked by an extension, fall back to direct TradingView widget iframe
        mountDirectIframeFallback(widgetContainer);
      };

      widgetContainer.appendChild(script);

      // If the external loader script hasn't injected an iframe after 5s, trigger direct iframe fallback
      fallbackTimer = setTimeout(() => {
        if (isCancelled || isReadyRef.current) return;
        const iframe = widgetContainer.querySelector('iframe');
        if (!iframe) {
          mountDirectIframeFallback(widgetContainer);
        } else {
          attachIframeLoadHandler(iframe);
        }
      }, DIRECT_IFRAME_FALLBACK_MS);

      // Final timeout check: only show error if no iframe has rendered after full timeout
      timeoutTimer = setTimeout(() => {
        if (isCancelled || isReadyRef.current) return;
        const iframe = widgetContainer.querySelector('iframe');
        if (iframe && iframe.getAttribute('src')?.includes('tradingview')) {
          // Iframe is present in widgetContainer; dismiss loading overlay so chart is interactive
          markWidgetReady();
          return;
        }

        setIsLoading(false);
        setHasError(true);
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setErrorMessage(
            'Your browser appears to be offline. Please reconnect to the internet and retry.'
          );
        } else if (cspViolationReason) {
          setErrorMessage(cspViolationReason);
        } else {
          setErrorMessage(
            'Unable to reach TradingView chart servers (s3.tradingview.com / tradingview-widget.com). Please check your network connection or privacy extensions and retry.'
          );
        }
      }, WIDGET_TIMEOUT_MS);
    };

    // Ensure container has measurable dimensions before mounting the widget
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mountWidget();
    } else if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height: h } = entry.contentRect;
          if (width > 0 && h > 0 && !hasMountedWidget) {
            resizeObserver?.disconnect();
            resizeObserver = null;
            mountWidget();
            break;
          }
        }
      });
      resizeObserver.observe(container);
      // Safety fallback in case ResizeObserver doesn't fire (e.g. headless test environments)
      setTimeout(() => {
        if (!isCancelled && !hasMountedWidget) {
          resizeObserver?.disconnect();
          resizeObserver = null;
          mountWidget();
        }
      }, 150);
    } else {
      mountWidget();
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('securitypolicyviolation', handleCspViolation);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (mutationObserver) mutationObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      container.innerHTML = '';
    };
  }, [activeTvSymbol, interval, resolvedTheme, allowSymbolChange, retryCount]);

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
          type="button"
          onClick={handleRetry}
          title="Reload TradingView Chart"
          className="p-1.5 text-content-muted hover:text-content-primary hover:bg-surface-secondary rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent-primary' : ''}`} />
        </button>

        <button
          type="button"
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
              {errorMessage || `Unable to load data for ${activeTvSymbol}. Please verify your connection or disable ad-blockers.`}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleRetry}
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
});

TradingViewAdvancedChart.displayName = 'TradingViewAdvancedChart';
