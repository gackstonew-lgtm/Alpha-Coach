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
  LineChart,
  Info,
  Calendar,
  DollarSign,
  TrendingDown,
  Activity,
  PenTool,
  Trash2,
  Type,
  Square,
  Minus,
  Plus,
  Crosshair,
  SlidersHorizontal,
  ChevronDown,
  Check
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


export const INSTRUMENT_NAMES: Record<string, string> = {
  EURUSD: 'Euro vs US Dollar',
  GBPUSD: 'British Pound vs US Dollar',
  USDJPY: 'US Dollar vs Japanese Yen',
  USDCHF: 'US Dollar vs Swiss Franc',
  USDCAD: 'US Dollar vs Canadian Dollar',
  AUDUSD: 'Australian Dollar vs US Dollar',
  NZDUSD: 'New Zealand Dollar vs US Dollar',
  EURGBP: 'Euro vs British Pound',
  GBPJPY: 'British Pound vs Japanese Yen',
  XAUUSD: 'Spot Gold vs US Dollar',
  UKOILm: 'Crude Oil Brent',
  USOILm: 'Crude Oil WTI',
  BTCUSD: 'Bitcoin vs US Dollar'
};

export function formatMT5Price(price: number, symbol: string): { main: string; pipette: string } {
  if (typeof price !== 'number' || isNaN(price)) {
    return { main: '0.0000', pipette: '0' };
  }
  const isJpy = symbol.toUpperCase().includes('JPY');
  const isMetal = symbol.toUpperCase().includes('XAU') || symbol.toUpperCase().includes('XAG');
  const isCrypto = symbol.toUpperCase().includes('BTC') || symbol.toUpperCase().includes('ETH');
  const isOil = symbol.toUpperCase().includes('OIL');
  const decimals = (isMetal || isCrypto) ? 2 : isOil ? 3 : isJpy ? 3 : 5;
  const str = price.toFixed(decimals);
  return {
    main: str.slice(0, -1),
    pipette: str.slice(-1)
  };
}

export interface TradingChartProps {
  symbol?: string;
  initialTimeframe?: string;
  height?: number | string;
  trades?: TradeOverlayData[];
  macroEvents?: MacroEventOverlay[];
  onTradeClick?: (tradeId: string) => void;
  showToolbar?: boolean;
  showQuoteStrip?: boolean;
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
  showQuoteStrip = true,
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

  // Live Stream & Quote State
  const [liveQuote, setLiveQuote] = useState<{ bid: number; ask: number; spreadPips: number; lastUpdated?: string } | null>(null);
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "LIVE" | "POLLING" | "CLOSED">("CONNECTING");

  // Institutional Price Levels & Toggles
  const [priceLevels, setPriceLevels] = useState<any>(null);
  const [showLevelsMenu, setShowLevelsMenu] = useState<boolean>(false);
  const [showClassicPivots, setShowClassicPivots] = useState<boolean>(false);
  const [showPreviousHL, setShowPreviousHL] = useState<boolean>(false);
  const [showSwingSR, setShowSwingSR] = useState<boolean>(false);

  // Market Conditions State
  const [marketConditions, setMarketConditions] = useState<any>(null);

  // Indicators toggle state
  const [showSMA, setShowSMA] = useState<boolean>(false);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showTradesOverlay, setShowTradesOverlay] = useState<boolean>(true);

  // MT5 Interactive States
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState<boolean>(false);
  const [showDrawingMenu, setShowDrawingMenu] = useState<boolean>(false);
  const [isCrosshairActive, setIsCrosshairActive] = useState<boolean>(true);
  const [showOrderPanel, setShowOrderPanel] = useState<boolean>(true);
  const [tradeToast, setTradeToast] = useState<string | null>(null);

  const handleLotChange = (delta: number) => {
    setLotSize(prev => {
      const next = Math.max(0.01, Math.round((prev + delta) * 100) / 100);
      return next;
    });
  };

  const handleExecuteQuote = (action: 'BUY' | 'SELL') => {
    const isJpy = currentSymbol.toUpperCase().includes('JPY');
    const isMetal = currentSymbol.toUpperCase().includes('XAU') || currentSymbol.toUpperCase().includes('XAG');
    const isCrypto = currentSymbol.toUpperCase().includes('BTC') || currentSymbol.toUpperCase().includes('ETH');
    const isOil = currentSymbol.toUpperCase().includes('OIL');
    const spreadDelta = isMetal ? 0.30 : isOil ? 0.04 : isCrypto ? 12.0 : isJpy ? 0.015 : 0.00015;
    const basePrice = (rawBars[rawBars.length - 1]?.close) || 1.0850;
    const execPrice = action === 'BUY' ? basePrice + spreadDelta : basePrice;
    const decimals = (isMetal || isCrypto) ? 2 : isOil ? 3 : isJpy ? 3 : 5;
    setTradeToast(`${action} ${lotSize.toFixed(2)} ${currentSymbol} placed @ ${execPrice.toFixed(decimals)}`);
    setTimeout(() => setTradeToast(null), 3000);
  };

  const toggleCrosshair = () => {
    const next = !isCrosshairActive;
    setIsCrosshairActive(next);
    chartRef.current?.applyOptions({
      crosshair: {
        mode: next ? CrosshairMode.Normal : CrosshairMode.Hidden
      }
    });
  };

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
        limit: 500,
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

  // Fetch Institutional Price Levels & Market Conditions
  useEffect(() => {
    api.getForexLevels(currentSymbol)
      .then((res: any) => {
        if (res && res.today) setPriceLevels(res);
      })
      .catch(() => {});

    api.getForexConditions(currentSymbol)
      .then((res: any) => {
        if (res && res.daily) setMarketConditions(res);
      })
      .catch(() => {});
  }, [currentSymbol]);

  // Real-time SSE / Polling Stream for Bid/Ask ticks and active candle updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimer: any = null;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try {
          const res = await api.getForexQuote(currentSymbol);
          if (res && res.data) {
            const q = res.data;
            setLiveQuote({
              bid: q.bid,
              ask: q.ask,
              spreadPips: q.spreadPips,
              lastUpdated: q.lastUpdated
            });
            if (mainSeriesRef.current && q.bid) {
              setRawBars((prevBars) => {
                if (prevBars.length === 0) return prevBars;
                const last = { ...prevBars[prevBars.length - 1] };
                last.close = q.bid;
                if (q.bid > last.high) last.high = q.bid;
                if (q.bid < last.low) last.low = q.bid;
                mainSeriesRef.current?.update(last);
                return [...prevBars.slice(0, -1), last];
              });
            }
          }
        } catch {}
      }, 2500);
    };

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const streamUrl = `${baseUrl}/api/v1/forex/stream?symbol=${currentSymbol}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setConnectionState("LIVE");
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "tick" || payload.type === "quote") {
            const q = payload.data;
            setLiveQuote({
              bid: q.bid,
              ask: q.ask,
              spreadPips: q.spreadPips,
              lastUpdated: q.lastUpdated
            });
            if (mainSeriesRef.current && q.bid) {
              setRawBars((prevBars) => {
                if (prevBars.length === 0) return prevBars;
                const last = { ...prevBars[prevBars.length - 1] };
                last.close = q.bid;
                if (q.bid > last.high) last.high = q.bid;
                if (q.bid < last.low) last.low = q.bid;
                mainSeriesRef.current?.update(last);
                return [...prevBars.slice(0, -1), last];
              });
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource?.close();
        setConnectionState("POLLING");
        startPolling();
      };
    } catch {
      setConnectionState("POLLING");
      startPolling();
    }

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [currentSymbol]);

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
        color: '#38bdf8', // Sky Blue
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
            color: isBuy ? (darkTheme ? '#10b981' : '#0E9F6E') : (darkTheme ? '#f43f5e' : '#D12F42'),
            shape: isBuy ? 'arrowUp' : 'arrowDown',
            text: `${trade.direction} @ ${trade.openPrice}`
          });

          // Entry Price Line
          const entryLine = mainSeriesRef.current!.createPriceLine({
            price: trade.openPrice,
            color: darkTheme ? '#3b82f6' : '#2F5BEA',
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
              color: darkTheme ? '#ef4444' : '#D12F42',
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
              color: darkTheme ? '#10b981' : '#0E9F6E',
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
    showClassicPivots,
    showPreviousHL,
    showSwingSR,
    priceLevels,
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

  // MT5 Bid/Ask Calculations
  const currentPrice = lastBar ? lastBar.close : 1.0850;
  const isJpy = currentSymbol.toUpperCase().includes('JPY');
  const isMetal = currentSymbol.toUpperCase().includes('XAU') || currentSymbol.toUpperCase().includes('XAG');
  const isCrypto = currentSymbol.toUpperCase().includes('BTC') || currentSymbol.toUpperCase().includes('ETH');
  const isOil = currentSymbol.toUpperCase().includes('OIL');
  const spreadDelta = isMetal ? 0.30 : isOil ? 0.04 : isCrypto ? 12.0 : isJpy ? 0.015 : 0.00015;

  const bidPrice = liveQuote?.bid ?? currentPrice;
  const askPrice = liveQuote?.ask ?? (currentPrice + spreadDelta);

  const formattedBid = formatMT5Price(bidPrice, currentSymbol);
  const formattedAsk = formatMT5Price(askPrice, currentSymbol);

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

          {/* MT5 Top Controls & Action Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* MT5 Crosshair Toggle Button */}
            <button
              onClick={toggleCrosshair}
              className={`p-1.5 rounded-lg border text-xs transition ${
                isCrosshairActive
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold'
                  : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary'
              }`}
              title="Toggle Crosshair Mode (+)"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            {/* MT5 Indicator 'f' Button */}
            <div className="relative">
              <button
                onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition ${
                  showIndicatorMenu || showEMA || showSMA || showBollinger || showRSI || showVWAP
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-500'
                    : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary'
                }`}
                title="MT5 Indicators Menu (f)"
              >
                <span className="italic font-serif font-black text-sm leading-none">f</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Indicator Dropdown Popover */}
              {showIndicatorMenu && (
                <div className="absolute top-full right-0 mt-1 z-30 w-44 bg-surface border border-border-subtle rounded-xl shadow-xl p-2 space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-content-muted uppercase tracking-wider px-2 py-1">Indicators</div>
                  <button
                    onClick={() => setShowEMA(!showEMA)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${showEMA ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold' : 'text-content-secondary hover:bg-surface-secondary'}`}
                  >
                    <span>EMA (21)</span>
                    {showEMA && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowSMA(!showSMA)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${showSMA ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-content-secondary hover:bg-surface-secondary'}`}
                  >
                    <span>SMA (20)</span>
                    {showSMA && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowBollinger(!showBollinger)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${showBollinger ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'text-content-secondary hover:bg-surface-secondary'}`}
                  >
                    <span>Bollinger Bands</span>
                    {showBollinger && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowRSI(!showRSI)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${showRSI ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold' : 'text-content-secondary hover:bg-surface-secondary'}`}
                  >
                    <span>RSI (14)</span>
                    {showRSI && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowVWAP(!showVWAP)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${showVWAP ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-content-secondary hover:bg-surface-secondary'}`}
                  >
                    <span>VWAP</span>
                    {showVWAP && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Institutional Price Levels Menu */}
            <div className="relative">
              <button
                onClick={() => setShowLevelsMenu(!showLevelsMenu)}
                className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                  showLevelsMenu || showClassicPivots || showPreviousHL || showSwingSR
                    ? "bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold"
                    : "bg-surface border-border-subtle text-content-muted hover:text-content-primary"
                }`}
                title="Institutional Price Levels & Pivots"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Levels</span>
              </button>

              {showLevelsMenu && (
                <div className="absolute top-full right-0 mt-1 z-30 w-56 bg-surface border border-border-subtle rounded-xl shadow-xl p-2 space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-content-muted uppercase tracking-wider px-2 py-1">Price Levels</div>
                  <button
                    onClick={() => setShowClassicPivots(!showClassicPivots)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${showClassicPivots ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" : "text-content-secondary hover:bg-surface-secondary"}`}
                  >
                    <span>Classic Pivots (P, R1-3, S1-3)</span>
                    {showClassicPivots && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowPreviousHL(!showPreviousHL)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${showPreviousHL ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "text-content-secondary hover:bg-surface-secondary"}`}
                  >
                    <span>Prev Day/Week H/L (PDH/PDL)</span>
                    {showPreviousHL && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowSwingSR(!showSwingSR)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${showSwingSR ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "text-content-secondary hover:bg-surface-secondary"}`}
                  >
                    <span>Swing Support & Resistance</span>
                    {showSwingSR && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* MT5 Drawing Tools Button */}
            <button
              onClick={() => setShowDrawingMenu(!showDrawingMenu)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                showDrawingMenu
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-500'
                  : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary'
              }`}
              title="Drawing Tools & Shapes"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>

            {/* MT5 Quick Buy/Sell Quote Strip Toggle */}
            <button
              onClick={() => setShowOrderPanel(!showOrderPanel)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                showOrderPanel
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-500'
                  : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary'
              }`}
              title="Toggle Buy / Sell Quote Strip"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

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
        {/* Top-Left MT5 Chart Watermark */}
        <div className="absolute top-3 left-3 sm:left-4 z-10 pointer-events-none select-none text-left">
          <div className="text-sm sm:text-base font-bold font-mono text-content-primary/80 tracking-wide drop-shadow-xs">
            {currentSymbol} · {timeframe}
          </div>
          <div className="text-[10px] sm:text-[11px] text-content-muted font-sans font-medium">
            {INSTRUMENT_NAMES[currentSymbol] || 'Forex Spot / CFD'}
          </div>
        </div>

        {/* MT5 Buy/Sell Quote Strip */}
        {showQuoteStrip && showOrderPanel && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center bg-surface/95 dark:bg-[#0E1A33]/95 backdrop-blur-md border border-border-subtle rounded-xl p-1 shadow-lg font-mono">
            {/* SELL Box */}
            <button
              onClick={() => handleExecuteQuote('SELL')}
              className="flex flex-col items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-[#D12F42]/10 hover:bg-[#D12F42]/20 text-[#D12F42] border border-[#D12F42]/30 transition group select-none active:scale-95"
              title="Sell at Market (Bid)"
            >
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider font-sans">SELL</span>
              <div className="flex items-baseline font-bold text-xs sm:text-sm tracking-tight">
                <span>{formattedBid.main}</span>
                <sup className="text-[9px] sm:text-[10px] ml-0.5 font-extrabold">{formattedBid.pipette}</sup>
              </div>
            </button>

            {/* Lot size stepper */}
            <div className="flex items-center px-1.5 sm:px-2 text-xs font-bold gap-1 text-content-primary">
              <button
                onClick={() => handleLotChange(-0.01)}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-md hover:bg-surface-secondary text-content-muted hover:text-content-primary transition text-xs sm:text-sm"
                title="Decrease volume by 0.01"
              >
                -
              </button>
              <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle min-w-[42px] sm:min-w-[48px] text-center text-[11px] sm:text-xs">
                {lotSize.toFixed(2)}
              </span>
              <button
                onClick={() => handleLotChange(0.01)}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-md hover:bg-surface-secondary text-content-muted hover:text-content-primary transition text-xs sm:text-sm"
                title="Increase volume by 0.01"
              >
                +
              </button>
            </div>

            {/* BUY Box */}
            <button
              onClick={() => handleExecuteQuote('BUY')}
              className="flex flex-col items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-[#2F5BEA]/10 hover:bg-[#2F5BEA]/20 text-[#2F5BEA] border border-[#2F5BEA]/30 transition group select-none active:scale-95"
              title="Buy at Market (Ask)"
            >
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider font-sans">BUY</span>
              <div className="flex items-baseline font-bold text-xs sm:text-sm tracking-tight">
                <span>{formattedAsk.main}</span>
                <sup className="text-[9px] sm:text-[10px] ml-0.5 font-extrabold">{formattedAsk.pipette}</sup>
              </div>
            </button>
          </div>
        )}

        {/* Trade Execution Toast Notification */}
        {tradeToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-xl bg-surface/95 dark:bg-[#0E1A33]/95 border border-brand-500/40 text-brand-500 shadow-xl text-xs font-mono animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{tradeToast}</span>
          </div>
        )}
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
