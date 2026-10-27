import { DEFAULT_INSTRUMENT_SYMBOL, DEFAULT_TIMEFRAME_INTERVAL } from '../config/tradingViewSymbols';

export type ChartEngineMode = 'tradingview' | 'mt5_overlay';
export type ChartLayoutMode = 'single' | 'dual' | 'quad';
export type TradingViewChartStyle = '1' | '8' | '9' | '0' | '2' | '3';

export interface TradingViewStudyPreset {
  id: string;
  label: string;
  shortLabel: string;
  tvStudyId: string;
}

export const TRADINGVIEW_STUDY_PRESETS: TradingViewStudyPreset[] = [
  { id: 'EMA', label: 'Moving Average Exponential (EMA)', shortLabel: 'EMA', tvStudyId: 'STD;EMA' },
  { id: 'SMA', label: 'Moving Average Simple (SMA)', shortLabel: 'SMA', tvStudyId: 'STD;SMA' },
  { id: 'BB', label: 'Bollinger Bands (BB)', shortLabel: 'BB', tvStudyId: 'STD;Bollinger_Bands' },
  { id: 'RSI', label: 'Relative Strength Index (RSI)', shortLabel: 'RSI', tvStudyId: 'STD;RSI' },
  { id: 'MACD', label: 'MACD Oscillator', shortLabel: 'MACD', tvStudyId: 'STD;MACD' },
  { id: 'VWAP', label: 'Volume Weighted Average Price (VWAP)', shortLabel: 'VWAP', tvStudyId: 'STD;VWAP' },
  { id: 'STOCH', label: 'Stochastic Oscillator', shortLabel: 'Stoch', tvStudyId: 'STD;Stochastic' },
  { id: 'ATR', label: 'Average True Range (ATR)', shortLabel: 'ATR', tvStudyId: 'STD;Average_True_Range' }
];

export const TRADINGVIEW_CHART_STYLES: Array<{ style: TradingViewChartStyle; label: string }> = [
  { style: '1', label: 'Candles' },
  { style: '8', label: 'Heikin Ashi' },
  { style: '9', label: 'Hollow Candles' },
  { style: '0', label: 'OHLC Bars' },
  { style: '2', label: 'Line' },
  { style: '3', label: 'Area' }
];

export interface MT5IndicatorWorkspaceState {
  showEMA: boolean;
  showSMA: boolean;
  showBollinger: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showVWAP: boolean;
  showTradesOverlay: boolean;
  showClassicPivots: boolean;
  showPreviousHL: boolean;
  showSwingSR: boolean;
  chartType: 'candlestick' | 'heikin_ashi' | 'bar' | 'line' | 'area' | 'hollow';
  timeframe: string;
  lotSize: number;
}

export interface PersistedDrawingItem {
  id: string;
  type: 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'fibonacci' | 'text';
  p1: { time: number | string; price: number };
  p2?: { time: number | string; price: number };
  text?: string;
  color?: string;
  createdAt?: string;
}

export interface ChartWorkspaceState {
  activeSymbol: string;
  activeInterval: string;
  engineMode: ChartEngineMode;
  layoutMode: ChartLayoutMode;
  dualSymbol: string;
  chartStyle: TradingViewChartStyle;
  activeStudies: string[];
  hideSideToolbar: boolean;
  mt5Indicators: MT5IndicatorWorkspaceState;
  updatedAt: string;
}

const WORKSPACE_STORAGE_KEY = 'arcadefx_chart_workspace_v1';
const WORKSPACE_COOKIE_NAME = 'arcadefx_chart_workspace';
const DRAWINGS_STORAGE_PREFIX = 'arcadefx_chart_drawings_';
const LEGACY_DRAWINGS_PREFIX = 'chart_drawings_';
const DRAWINGS_COOKIE_PREFIX = 'afx_drw_';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 365 days

export const DEFAULT_MT5_INDICATORS: MT5IndicatorWorkspaceState = {
  showEMA: true,
  showSMA: false,
  showBollinger: false,
  showRSI: false,
  showMACD: false,
  showVWAP: false,
  showTradesOverlay: true,
  showClassicPivots: false,
  showPreviousHL: false,
  showSwingSR: false,
  chartType: 'candlestick',
  timeframe: 'H1',
  lotSize: 0.01
};

export const DEFAULT_WORKSPACE_STATE: ChartWorkspaceState = {
  activeSymbol: DEFAULT_INSTRUMENT_SYMBOL,
  activeInterval: DEFAULT_TIMEFRAME_INTERVAL,
  engineMode: 'tradingview',
  layoutMode: 'single',
  dualSymbol: 'EURUSD',
  chartStyle: '1',
  activeStudies: [],
  hideSideToolbar: false,
  mt5Indicators: DEFAULT_MT5_INDICATORS,
  updatedAt: new Date().toISOString()
};

function setBrowserCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS): void {
  if (typeof document === 'undefined') return;
  try {
    const encoded = encodeURIComponent(value);
    const secureFlag = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encoded}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secureFlag}`;
  } catch {
    // Ignore cookie quota errors
  }
}

function getBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  try {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (part.startsWith(prefix)) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
  } catch {
    // Ignore malformed cookies
  }
  return null;
}

function sanitizeWorkspaceState(raw: Partial<ChartWorkspaceState> | null | undefined): ChartWorkspaceState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_WORKSPACE_STATE };
  }

  const validEngines: ChartEngineMode[] = ['tradingview', 'mt5_overlay'];
  const validLayouts: ChartLayoutMode[] = ['single', 'dual', 'quad'];
  const validStyles: TradingViewChartStyle[] = ['1', '8', '9', '0', '2', '3'];

  const activeSymbol =
    typeof raw.activeSymbol === 'string' && raw.activeSymbol.trim().length > 0
      ? raw.activeSymbol.trim().toUpperCase()
      : DEFAULT_WORKSPACE_STATE.activeSymbol;

  const activeInterval =
    typeof raw.activeInterval === 'string' && raw.activeInterval.trim().length > 0
      ? raw.activeInterval.trim()
      : DEFAULT_WORKSPACE_STATE.activeInterval;

  const engineMode = validEngines.includes(raw.engineMode as ChartEngineMode)
    ? (raw.engineMode as ChartEngineMode)
    : DEFAULT_WORKSPACE_STATE.engineMode;

  const layoutMode = validLayouts.includes(raw.layoutMode as ChartLayoutMode)
    ? (raw.layoutMode as ChartLayoutMode)
    : DEFAULT_WORKSPACE_STATE.layoutMode;

  const dualSymbol =
    typeof raw.dualSymbol === 'string' && raw.dualSymbol.trim().length > 0
      ? raw.dualSymbol.trim().toUpperCase()
      : DEFAULT_WORKSPACE_STATE.dualSymbol;

  const chartStyle = validStyles.includes(raw.chartStyle as TradingViewChartStyle)
    ? (raw.chartStyle as TradingViewChartStyle)
    : DEFAULT_WORKSPACE_STATE.chartStyle;

  const activeStudies = Array.isArray(raw.activeStudies)
    ? raw.activeStudies.filter((s): s is string => typeof s === 'string')
    : DEFAULT_WORKSPACE_STATE.activeStudies;

  const hideSideToolbar =
    typeof raw.hideSideToolbar === 'boolean' ? raw.hideSideToolbar : DEFAULT_WORKSPACE_STATE.hideSideToolbar;

  const rawMt5: Partial<MT5IndicatorWorkspaceState> = raw.mt5Indicators || {};
  const mt5Indicators: MT5IndicatorWorkspaceState = {
    showEMA: typeof rawMt5.showEMA === 'boolean' ? rawMt5.showEMA : DEFAULT_MT5_INDICATORS.showEMA,
    showSMA: typeof rawMt5.showSMA === 'boolean' ? rawMt5.showSMA : DEFAULT_MT5_INDICATORS.showSMA,
    showBollinger: typeof rawMt5.showBollinger === 'boolean' ? rawMt5.showBollinger : DEFAULT_MT5_INDICATORS.showBollinger,
    showRSI: typeof rawMt5.showRSI === 'boolean' ? rawMt5.showRSI : DEFAULT_MT5_INDICATORS.showRSI,
    showMACD: typeof rawMt5.showMACD === 'boolean' ? rawMt5.showMACD : DEFAULT_MT5_INDICATORS.showMACD,
    showVWAP: typeof rawMt5.showVWAP === 'boolean' ? rawMt5.showVWAP : DEFAULT_MT5_INDICATORS.showVWAP,
    showTradesOverlay:
      typeof rawMt5.showTradesOverlay === 'boolean' ? rawMt5.showTradesOverlay : DEFAULT_MT5_INDICATORS.showTradesOverlay,
    showClassicPivots:
      typeof rawMt5.showClassicPivots === 'boolean' ? rawMt5.showClassicPivots : DEFAULT_MT5_INDICATORS.showClassicPivots,
    showPreviousHL:
      typeof rawMt5.showPreviousHL === 'boolean' ? rawMt5.showPreviousHL : DEFAULT_MT5_INDICATORS.showPreviousHL,
    showSwingSR: typeof rawMt5.showSwingSR === 'boolean' ? rawMt5.showSwingSR : DEFAULT_MT5_INDICATORS.showSwingSR,
    chartType: rawMt5.chartType || DEFAULT_MT5_INDICATORS.chartType,
    timeframe: typeof rawMt5.timeframe === 'string' ? rawMt5.timeframe : DEFAULT_MT5_INDICATORS.timeframe,
    lotSize: typeof rawMt5.lotSize === 'number' && rawMt5.lotSize >= 0.01 ? rawMt5.lotSize : DEFAULT_MT5_INDICATORS.lotSize
  };

  return {
    activeSymbol,
    activeInterval,
    engineMode,
    layoutMode,
    dualSymbol,
    chartStyle,
    activeStudies,
    hideSideToolbar,
    mt5Indicators,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
  };
}

/**
 * Loads the user's persisted charting workspace state from localStorage with cookie fallback.
 */
export function loadChartWorkspace(): ChartWorkspaceState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_WORKSPACE_STATE };
  }

  // 1. Try localStorage first
  try {
    const rawLocal = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      return sanitizeWorkspaceState(parsed);
    }
  } catch {
    // Fall through to cookie
  }

  // 2. Fallback to browser cookie
  try {
    const rawCookie = getBrowserCookie(WORKSPACE_COOKIE_NAME);
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie);
      const state = sanitizeWorkspaceState(parsed);
      // Re-hydrate localStorage
      try {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore
      }
      return state;
    }
  } catch {
    // Ignore
  }

  return { ...DEFAULT_WORKSPACE_STATE };
}

/**
 * Saves the charting workspace state to both localStorage and a 365-day browser cookie.
 */
export function saveChartWorkspace(partial: Partial<ChartWorkspaceState>): ChartWorkspaceState {
  const current = loadChartWorkspace();
  const merged = sanitizeWorkspaceState({
    ...current,
    ...partial,
    mt5Indicators: {
      ...current.mt5Indicators,
      ...(partial.mt5Indicators || {})
    },
    updatedAt: new Date().toISOString()
  });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage errors
    }
  }

  setBrowserCookie(WORKSPACE_COOKIE_NAME, JSON.stringify(merged));
  return merged;
}

/**
 * Resets the charting workspace back to clean defaults.
 */
export function resetChartWorkspace(): ChartWorkspaceState {
  const clean = {
    ...DEFAULT_WORKSPACE_STATE,
    updatedAt: new Date().toISOString()
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore
    }
  }
  setBrowserCookie(WORKSPACE_COOKIE_NAME, JSON.stringify(clean));
  return clean;
}

/**
 * Loads saved drawings / horizontal price levels / annotations for a specific symbol
 * from localStorage and browser cookies so drawings resume across sessions.
 */
export function loadSymbolDrawings(symbol: string): PersistedDrawingItem[] {
  if (typeof window === 'undefined' || !symbol) return [];
  const normalized = symbol.trim().toUpperCase();

  try {
    const raw =
      window.localStorage.getItem(`${DRAWINGS_STORAGE_PREFIX}${normalized}`) ||
      window.localStorage.getItem(`${LEGACY_DRAWINGS_PREFIX}${normalized}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fall through to cookie
  }

  try {
    const cookieRaw = getBrowserCookie(`${DRAWINGS_COOKIE_PREFIX}${normalized}`);
    if (cookieRaw) {
      const parsed = JSON.parse(cookieRaw);
      if (Array.isArray(parsed)) {
        try {
          window.localStorage.setItem(`${DRAWINGS_STORAGE_PREFIX}${normalized}`, JSON.stringify(parsed));
        } catch {
          // Ignore
        }
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  return [];
}

/**
 * Saves drawings / horizontal levels / annotations for a symbol to both localStorage and cookies.
 */
export function saveSymbolDrawings(symbol: string, drawings: PersistedDrawingItem[]): void {
  if (typeof window === 'undefined' || !symbol) return;
  const normalized = symbol.trim().toUpperCase();
  const serialized = JSON.stringify(drawings);

  try {
    window.localStorage.setItem(`${DRAWINGS_STORAGE_PREFIX}${normalized}`, serialized);
    window.localStorage.setItem(`${LEGACY_DRAWINGS_PREFIX}${normalized}`, serialized);
  } catch {
    // Ignore quota errors
  }

  // Keep cookie payload under 3.5KB (store up to 25 most recent drawings in cookie)
  const compactForCookie = drawings.slice(-25);
  setBrowserCookie(`${DRAWINGS_COOKIE_PREFIX}${normalized}`, JSON.stringify(compactForCookie));
}

/**
 * Resolves user-selected study preset IDs (e.g. ['EMA', 'RSI']) into official TradingView study strings.
 */
export function resolveTradingViewStudies(studyIds: string[]): string[] {
  if (!Array.isArray(studyIds) || studyIds.length === 0) return [];
  return studyIds
    .map((id) => {
      const found = TRADINGVIEW_STUDY_PRESETS.find((p) => p.id === id || p.tvStudyId === id);
      return found ? found.tvStudyId : id.startsWith('STD;') ? id : null;
    })
    .filter((v): v is string => Boolean(v));
}
