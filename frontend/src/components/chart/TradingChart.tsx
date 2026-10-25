import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  LineStyle,
  CrosshairMode,
  Time,
  SeriesMarker
} from 'lightweight-charts';
import {
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  TrendingUp,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  TrendingDown,
  Activity,
  PenTool,
  Trash2,
  Type,
  Square,
  Minus
} from 'lucide-react';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateVWAP,
  calculateHeikinAshi,
  OHLCVBar
} from '../../utils/indicatorMath';
import { api } from '../../services/api';

export type ChartType = 'candlestick' | 'heikin_ashi' | 'bar' | 'line' | 'area' | 'hollow';

export interface TradeOverlayData {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime: string;
  closeTime?: string;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  rMultiple?: number;
}

export interface MacroEventOverlay {
  id: string;
  currency: string;
  title: string;
  eventTime: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
}

export interface DrawingItem {
  id: string;
  type: 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'fibonacci' | 'text';
  p1: { time: number | string; price: number };
  p2?: { time: number | string; price: number };
  text?: string;
  color?: string;
}

export interface TradingChartProps {
  symbol?: string;
  initialTimeframe?: string;
  height?: number | string;
  trades?: TradeOverlayData[];
  macroEvents?: MacroEventOverlay[];
  onTradeClick?: (tradeId: string) => void;
  showToolbar?: boolean;
  compact?: boolean;
  className?: string;
}

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

const POPULAR_SYMBOLS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'USDCAD',
  'AUDUSD',
  'NZDUSD',
  'EURGBP',
  'GBPJPY',
  'XAUUSD'
];

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol: propSymbol = 'EURUSD',
  initialTimeframe = 'H1',
  height = 540,
  trades = [],
  macroEvents = [],
  onTradeClick,
  showToolbar = true,
  compact = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const priceLinesRef = useRef<any[]>([]);

  // State
  const [currentSymbol, setCurrentSymbol] = useState<string>(propSymbol);
  const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [rawBars, setRawBars] = useState<OHLCVBar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('MT5 Terminal / Synced History');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeLegend, setActiveLegend] = useState<any>(null);

  // Indicators toggle state
  const [showSMA, setShowSMA] = useState<boolean>(false);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showTradesOverlay, setShowTradesOverlay] = useState<boolean>(true);

  // Drawings state
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    try {
      const saved = localStorage.getItem(`chart_drawings_${propSymbol}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track theme changes (dark vs light mode tokens)
  const isDark = document.documentElement.classList.contains('dark');

  // Sync prop changes
  useEffect(() => {
    if (propSymbol && propSymbol !== currentSymbol) {
      setCurrentSymbol(propSymbol);
    }
  }, [propSymbol]);

  // Save drawings to localStorage as local fallback
  useEffect(() => {
    try {
      localStorage.setItem(`chart_drawings_${currentSymbol}`, JSON.stringify(drawings));
    } catch {
      // storage quota or unavailable
    }
  }, [drawings, currentSymbol]);

  // 1. Fetch Candle Data
  const loadCandles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandles({
        symbol: currentSymbol,
        timeframe: timeframe as any,
        limit: 300,
        allowExternalFetch: true
      });

      if (res && res.candles && res.candles.length > 0) {
        // Map to standard lightweight-charts bar format
        const formatted: OHLCVBar[] = res.candles.map((c: any) => {
          const dt = new Date(c.timestamp);
          const timeSec = Math.floor(dt.getTime() / 1000);
          return {
            time: timeSec as any,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume) || 0
          };
        });

        // Ensure strictly sorted by ascending time
        formatted.sort((a, b) => Number(a.time) - Number(b.time));
        setRawBars(formatted);
        if (res.provenance?.sourceProvider) {
          setDataSource(res.provenance.sourceProvider);
        }
      } else {
        setRawBars([]);
      }
    } catch (err) {
      console.error('Failed to load chart candles:', err);
      setRawBars([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSymbol, timeframe]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // 2. Initialize and Update Lightweight Chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Theme color palette mapping
    const darkTheme = document.documentElement.classList.contains('dark');
    const colors = {
      bg: darkTheme ? '#0a0d12' : '#ffffff',
      textColor: darkTheme ? '#94a3b8' : '#64748b',
      gridColor: darkTheme ? 'rgba(23, 29, 41, 0.6)' : 'rgba(226, 232, 240, 0.6)',
      crosshair: darkTheme ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.4)',
      up: '#10b981', // trade.win
      down: '#f43f5e', // trade.loss
      volumeUp: 'rgba(16, 185, 129, 0.35)',
      volumeDown: 'rgba(244, 63, 94, 0.35)'
    };

    // Dispose old chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.textColor,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace'
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed }
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: true,
        secondsVisible: false
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartRef.current = chart;

    // Responsive Auto-Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !containerRef.current) return;
      const { width, height: h } = entries[0].contentRect;
      chart.applyOptions({ width, height: h });
    });
    resizeObserver.observe(containerRef.current);

    // Crosshair Hover Handler for Legend
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > containerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > containerRef.current!.clientHeight
      ) {
        setActiveLegend(null);
      } else {
        const seriesPrices = param.seriesData;
        if (mainSeriesRef.current && seriesPrices.has(mainSeriesRef.current)) {
          const data: any = seriesPrices.get(mainSeriesRef.current);
          setActiveLegend({
            open: data.open ?? data.value,
            high: data.high ?? data.value,
            low: data.low ?? data.value,
            close: data.close ?? data.value,
            time: param.time
          });
        }
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // 3. Render / Update Main Price Series & Overlays
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || rawBars.length === 0) return;

    const darkTheme = document.documentElement.classList.contains('dark');
    const colors = {
      up: '#10b981',
      down: '#f43f5e',
      line: '#3b82f6',
      areaTop: 'rgba(59, 130, 246, 0.4)',
      areaBottom: 'rgba(59, 130, 246, 0.02)',
      volumeUp: 'rgba(16, 185, 129, 0.35)',
      volumeDown: 'rgba(244, 63, 94, 0.35)'
    };

    // Remove existing main and indicator series
    if (mainSeriesRef.current) {
      try { chart.removeSeries(mainSeriesRef.current); } catch {}
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try { chart.removeSeries(volumeSeriesRef.current); } catch {}
      volumeSeriesRef.current = null;
    }
    indicatorSeriesRefs.current.forEach((s) => {
      try { chart.removeSeries(s); } catch {}
    });
    indicatorSeriesRefs.current.clear();

    // Prepare active bars based on chart type (Heikin-Ashi transform or standard)
    const activeDataBars = chartType === 'heikin_ashi' ? calculateHeikinAshi(rawBars) : rawBars;

    // Create Main Series by Chart Type
    if (chartType === 'candlestick' || chartType === 'heikin_ashi' || chartType === 'hollow') {
      const isHollow = chartType === 'hollow';
      mainSeriesRef.current = chart.addCandlestickSeries({
        upColor: isHollow ? 'transparent' : colors.up,
        downColor: colors.down,
        borderUpColor: colors.up,
        borderDownColor: colors.down,
        wickUpColor: colors.up,
        wickDownColor: colors.down
      });
      mainSeriesRef.current.setData(activeDataBars as any);
    } else if (chartType === 'bar') {
      mainSeriesRef.current = chart.addBarSeries({
        upColor: colors.up,
        downColor: colors.down
      });
      mainSeriesRef.current.setData(activeDataBars as any);
    } else if (chartType === 'area') {
      mainSeriesRef.current = chart.addAreaSeries({
        lineColor: colors.line,
        topColor: colors.areaTop,
        bottomColor: colors.areaBottom,
        lineWidth: 2
      });
      const areaData = activeDataBars.map((b) => ({ time: b.time as any, value: b.close }));
      mainSeriesRef.current.setData(areaData);
    } else {
      // Line chart
      mainSeriesRef.current = chart.addLineSeries({
        color: colors.line,
        lineWidth: 2
      });
      const lineData = activeDataBars.map((b) => ({ time: b.time as any, value: b.close }));
      mainSeriesRef.current.setData(lineData);
    }

    // Add Volume Series at bottom
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
          });

    const volumeData = activeDataBars.map((b) => ({
      time: b.time as any,
      value: b.volume || 1,
      color: b.close >= b.open ? colors.volumeUp : colors.volumeDown
    }));
    volumeSeriesRef.current.setData(volumeData);

    // 4. Compute and Add Technical Indicator Overlays
    if (showSMA) {
      const smaData = calculateSMA(activeDataBars, 20);
      const smaSeries = chart.addLineSeries({
        color: '#f59e0b', // Amber
        lineWidth: 2,
        title: 'SMA (20)'
      });
      smaSeries.setData(smaData as any);
      indicatorSeriesRefs.current.set('SMA', smaSeries);
    }

    if (showEMA) {
      const emaData = calculateEMA(activeDataBars, 21);
      const emaSeries = chart.addLineSeries({
        color: '#8b5cf6', // Violet
        lineWidth: 2,
        title: 'EMA (21)'
      });
      emaSeries.setData(emaData as any);
      indicatorSeriesRefs.current.set('EMA', emaSeries);
    }

    if (showBollinger) {
      const bbData = calculateBollingerBands(activeDataBars, 20, 2);
      const upperSeries = chart.addLineSeries({
        color: 'rgba(59, 130, 246, 0.7)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Upper'
      });
      const middleSeries = chart.addLineSeries({
        color: 'rgba(59, 130, 246, 0.4)',
        lineWidth: 1,
        title: 'BB Mid'
      });
      const lowerSeries = chart.addLineSeries({
        color: 'rgba(59, 130, 246, 0.7)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Lower'
      });

      upperSeries.setData(bbData.map((d) => ({ time: d.time as any, value: d.upper })));
      middleSeries.setData(bbData.map((d) => ({ time: d.time as any, value: d.middle })));
      lowerSeries.setData(bbData.map((d) => ({ time: d.time as any, value: d.lower })));

      indicatorSeriesRefs.current.set('BBUpper', upperSeries);
      indicatorSeriesRefs.current.set('BBMid', middleSeries);
      indicatorSeriesRefs.current.set('BBLower', lowerSeries);
    }

    if (showVWAP) {
      const vwapData = calculateVWAP(activeDataBars);
      const vwapSeries = chart.addLineSeries({
        color: '#06b6d4', // Cyan
        lineWidth: 2,
        title: 'VWAP'
      });
      vwapSeries.setData(vwapData as any);
      indicatorSeriesRefs.current.set('VWAP', vwapSeries);
    }

    if (showRSI) {
      const rsiData = calculateRSI(activeDataBars, 14);
      const rsiSeries = chart.addLineSeries({
        color: '#ec4899', // Pink
        lineWidth: 2,
        priceScaleId: 'rsi_scale',
        title: 'RSI (14)'
      });
      rsiSeries.setData(rsiData as any);
      indicatorSeriesRefs.current.set('RSI', rsiSeries);
    }

    // 5. User Trade Overlays (Entry, SL, TP, Fills)
    const markers: SeriesMarker<Time>[] = [];

    // Clear old price lines
    priceLinesRef.current.forEach((pl) => {
      try { mainSeriesRef.current?.removePriceLine(pl); } catch {}
    });
    priceLinesRef.current = [];

    if (showTradesOverlay && trades.length > 0 && mainSeriesRef.current) {
      trades
        .filter((t) => t.symbol === currentSymbol)
        .forEach((trade) => {
          const openTimeSec = Math.floor(new Date(trade.openTime).getTime() / 1000) as any;
          const isBuy = trade.direction === 'BUY';

          // Entry Marker
          markers.push({
            time: openTimeSec,
            position: isBuy ? 'belowBar' : 'aboveBar',
            color: isBuy ? '#10b981' : '#f43f5e',
            shape: isBuy ? 'arrowUp' : 'arrowDown',
            text: `${trade.direction} @ ${trade.openPrice}`
          });

          // Entry Price Line
          const entryLine = mainSeriesRef.current!.createPriceLine({
            price: trade.openPrice,
            color: '#3b82f6',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `Entry (${trade.direction})`
          });
          priceLinesRef.current.push(entryLine);

          // Stop Loss Line
          if (trade.stopLoss && trade.stopLoss > 0) {
            const slLine = mainSeriesRef.current!.createPriceLine({
              price: trade.stopLoss,
              color: '#ef4444',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `SL: ${trade.stopLoss}`
            });
            priceLinesRef.current.push(slLine);
          }

          // Take Profit Line
          if (trade.takeProfit && trade.takeProfit > 0) {
            const tpLine = mainSeriesRef.current!.createPriceLine({
              price: trade.takeProfit,
              color: '#10b981',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `TP: ${trade.takeProfit}`
            });
            priceLinesRef.current.push(tpLine);
          }
        });
    }

    // 6. Macro Calendar Vertical Event Markers
    if (macroEvents.length > 0 && mainSeriesRef.current) {
      macroEvents.forEach((ev) => {
        const evTimeSec = Math.floor(new Date(ev.eventTime).getTime() / 1000) as any;
        markers.push({
          time: evTimeSec,
          position: 'aboveBar',
          color: ev.impact === 'HIGH' ? '#ef4444' : '#f59e0b',
          shape: 'circle',
          text: `[${ev.currency}] ${ev.title}`
        });
      });
    }

    if (markers.length > 0 && mainSeriesRef.current) {
      markers.sort((a, b) => Number(a.time) - Number(b.time));
      mainSeriesRef.current.setMarkers(markers);
    }

    // Fit Content to screen
    chart.timeScale().fitContent();
  }, [
    rawBars,
    chartType,
    showSMA,
    showEMA,
    showBollinger,
    showVWAP,
    showRSI,
    showTradesOverlay,
    trades,
    macroEvents,
    currentSymbol
  ]);

  // Snapshot / Export PNG
  const handleSnapshot = () => {
    if (!chartRef.current) return;
    try {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const img = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${currentSymbol}_${timeframe}_chart.png`;
        link.href = img;
        link.click();
      }
    } catch (err) {
      console.error('Failed to export chart screenshot:', err);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Last bar for current metrics
  const lastBar = rawBars[rawBars.length - 1];
  const prevBar = rawBars[rawBars.length - 2];
  const changePips = lastBar && prevBar ? (lastBar.close - prevBar.close).toFixed(5) : '0.00000';
  const changePct = lastBar && prevBar ? (((lastBar.close - prevBar.close) / prevBar.close) * 100).toFixed(2) : '0.00';
  const isUp = Number(changePips) >= 0;

  return (
    <div
      className={`flex flex-col bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-secondary/70 border-b border-border-subtle text-xs">
          {/* Symbol & Timeframe Selection */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Symbol Dropdown */}
            <select
              value={currentSymbol}
              onChange={(e) => setCurrentSymbol(e.target.value)}
              className="bg-surface border border-border-subtle rounded-lg px-2.5 py-1 font-bold text-content-primary focus:outline-none focus:border-brand-500 font-mono"
            >
              {POPULAR_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Timeframe Buttons */}
            <div className="flex items-center bg-surface border border-border-subtle rounded-lg p-0.5 font-mono text-[11px]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 rounded transition ${
                    timeframe === tf
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Price Quote Badge */}
            {lastBar && (
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs pl-2">
                <span className="font-bold text-content-primary">{lastBar.close.toFixed(5)}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isUp
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {isUp ? '+' : ''}{changePct}%
                </span>
              </div>
            )}
          </div>

          {/* Chart Controls & Indicator Toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="bg-surface border border-border-subtle rounded-lg px-2 py-1 text-[11px] font-medium text-content-primary focus:outline-none"
            >
              <option value="candlestick">Candles</option>
              <option value="heikin_ashi">Heikin-Ashi</option>
              <option value="bar">OHLC Bars</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
              <option value="hollow">Hollow</option>
            </select>

            {/* Quick Indicator Toggles */}
            <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-lg p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setShowEMA(!showEMA)}
                className={`px-1.5 py-0.5 rounded transition ${
                  showEMA ? 'bg-violet-600 text-white font-bold' : 'text-content-muted hover:text-content-primary'
                }`}
                title="Toggle Exponential Moving Average (21)"
              >
                EMA
              </button>
              <button
                onClick={() => setShowSMA(!showSMA)}
                className={`px-1.5 py-0.5 rounded transition ${
                  showSMA ? 'bg-amber-600 text-white font-bold' : 'text-content-muted hover:text-content-primary'
                }`}
                title="Toggle Simple Moving Average (20)"
              >
                SMA
              </button>
              <button
                onClick={() => setShowBollinger(!showBollinger)}
                className={`px-1.5 py-0.5 rounded transition ${
                  showBollinger ? 'bg-blue-600 text-white font-bold' : 'text-content-muted hover:text-content-primary'
                }`}
                title="Toggle Bollinger Bands"
              >
                BB
              </button>
              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`px-1.5 py-0.5 rounded transition ${
                  showRSI ? 'bg-pink-600 text-white font-bold' : 'text-content-muted hover:text-content-primary'
                }`}
                title="Toggle Relative Strength Index"
              >
                RSI
              </button>
              <button
                onClick={() => setShowVWAP(!showVWAP)}
                className={`px-1.5 py-0.5 rounded transition ${
                  showVWAP ? 'bg-cyan-600 text-white font-bold' : 'text-content-muted hover:text-content-primary'
                }`}
                title="Toggle Volume Weighted Average Price"
              >
                VWAP
              </button>
            </div>

            {/* Trade Overlay Toggle */}
            {trades.length > 0 && (
              <button
                onClick={() => setShowTradesOverlay(!showTradesOverlay)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition ${
                  showTradesOverlay
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-500 font-bold'
                    : 'bg-surface border-border-subtle text-content-muted'
                }`}
                title="Toggle My MT5 Trades Overlay"
              >
                <Activity className="w-3 h-3" />
                <span className="hidden md:inline">Trades ({trades.length})</span>
              </button>
            )}

            {/* Reset View */}
            <button
              onClick={() => chartRef.current?.timeScale().fitContent()}
              className="p-1.5 bg-surface hover:bg-surface-secondary border border-border-subtle rounded-lg text-content-muted hover:text-content-primary transition"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Export Screenshot */}
            <button
              onClick={handleSnapshot}
              className="p-1.5 bg-surface hover:bg-surface-secondary border border-border-subtle rounded-lg text-content-muted hover:text-content-primary transition"
              title="Snapshot / Export PNG"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-surface hover:bg-surface-secondary border border-border-subtle rounded-lg text-content-muted hover:text-content-primary transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. OHLC Legend Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface text-[11px] font-mono text-content-muted border-b border-border-subtle/50 select-none">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-content-primary">{currentSymbol}</span>
          <span>
            O: <strong className="text-content-primary">{(activeLegend?.open ?? lastBar?.open)?.toFixed(5) || '-'}</strong>
          </span>
          <span>
            H: <strong className="text-content-primary">{(activeLegend?.high ?? lastBar?.high)?.toFixed(5) || '-'}</strong>
          </span>
          <span>
            L: <strong className="text-content-primary">{(activeLegend?.low ?? lastBar?.low)?.toFixed(5) || '-'}</strong>
          </span>
          <span>
            C: <strong className="text-content-primary">{(activeLegend?.close ?? lastBar?.close)?.toFixed(5) || '-'}</strong>
          </span>
        </div>

        {/* Data Source Notice */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-content-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Source: {dataSource}</span>
        </div>
      </div>

      {/* 3. Canvas Container */}
      <div className="relative flex-1 min-h-[360px] w-full" style={{ height: isFullscreen ? 'calc(100vh - 80px)' : height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-content-muted">Loading {currentSymbol} ({timeframe}) candles...</span>
          </div>
        )}

        {!isLoading && rawBars.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-xs text-content-muted space-y-2">
            <Info className="w-8 h-8 text-content-muted/60" />
            <p className="font-medium text-content-primary">No OHLCV history stored for {currentSymbol} ({timeframe})</p>
            <p className="max-w-md text-[11px]">
              Sync trade history through the MT5 Desktop Bridge, connect a market data key, or upload CSV bars in Strategy Lab.
            </p>
          </div>
        )}

        {/* The Lightweight Chart Mount Point */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* 4. Chart Footer / Attribution & Legal Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-surface-secondary/40 border-t border-border-subtle text-[10px] text-content-muted">
        <div className="flex items-center gap-2">
          <span>Powered by <strong>TradingView Lightweight Charts™</strong> (Apache-2.0)</span>
          <span>•</span>
          <span>All times in UTC</span>
        </div>
        <div>
          <em>Decision-support tool. Past performance does not guarantee future results.</em>
        </div>
      </div>
    </div>
  );
};
