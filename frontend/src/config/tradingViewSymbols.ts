/**
 * TradingView Symbols & Market Directory Configuration
 * Maps user-friendly tickers to valid, exchange-qualified TradingView symbols
 */

export type MarketCategory =
  | 'ALL'
  | 'METALS'
  | 'FOREX_MAJORS'
  | 'FOREX_CROSSES'
  | 'INDICES'
  | 'CRYPTO'
  | 'STOCKS';

export interface TradingViewInstrument {
  id: string;
  symbol: string;
  tvSymbol: string;
  name: string;
  category: Exclude<MarketCategory, 'ALL'>;
  exchange: string;
  description: string;
  spread: string;
  isPopular?: boolean;
}

export const SUPPORTED_INSTRUMENTS: TradingViewInstrument[] = [
  // --- METALS (Primary Default) ---
  {
    id: 'XAUUSD',
    symbol: 'XAUUSD',
    tvSymbol: 'OANDA:XAUUSD',
    name: 'Spot Gold / US Dollar',
    category: 'METALS',
    exchange: 'OANDA',
    description: 'Gold spot price quoted in US Dollars per troy ounce',
    spread: '1.8p',
    isPopular: true
  },
  {
    id: 'XAGUSD',
    symbol: 'XAGUSD',
    tvSymbol: 'OANDA:XAGUSD',
    name: 'Spot Silver / US Dollar',
    category: 'METALS',
    exchange: 'OANDA',
    description: 'Silver spot price quoted in US Dollars per troy ounce',
    spread: '2.4p',
    isPopular: false
  },

  // --- FOREX MAJORS ---
  {
    id: 'EURUSD',
    symbol: 'EURUSD',
    tvSymbol: 'FX:EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'Euro currency quoted against the US Dollar',
    spread: '0.8p',
    isPopular: true
  },
  {
    id: 'GBPUSD',
    symbol: 'GBPUSD',
    tvSymbol: 'FX:GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'British Pound Sterling quoted against the US Dollar (Cable)',
    spread: '1.0p',
    isPopular: true
  },
  {
    id: 'USDJPY',
    symbol: 'USDJPY',
    tvSymbol: 'FX:USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'US Dollar quoted against the Japanese Yen (Ninja)',
    spread: '0.9p',
    isPopular: true
  },
  {
    id: 'AUDUSD',
    symbol: 'AUDUSD',
    tvSymbol: 'FX:AUDUSD',
    name: 'Australian Dollar / US Dollar',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'Australian Dollar quoted against the US Dollar (Aussie)',
    spread: '1.1p',
    isPopular: true
  },
  {
    id: 'NZDUSD',
    symbol: 'NZDUSD',
    tvSymbol: 'FX:NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'New Zealand Dollar quoted against the US Dollar (Kiwi)',
    spread: '1.4p',
    isPopular: false
  },
  {
    id: 'USDCAD',
    symbol: 'USDCAD',
    tvSymbol: 'FX:USDCAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'US Dollar quoted against the Canadian Dollar (Loonie)',
    spread: '1.2p',
    isPopular: true
  },
  {
    id: 'USDCHF',
    symbol: 'USDCHF',
    tvSymbol: 'FX:USDCHF',
    name: 'US Dollar / Swiss Franc',
    category: 'FOREX_MAJORS',
    exchange: 'FX',
    description: 'US Dollar quoted against the Swiss Franc (Swissy)',
    spread: '1.3p',
    isPopular: false
  },

  // --- FOREX CROSSES ---
  {
    id: 'EURGBP',
    symbol: 'EURGBP',
    tvSymbol: 'FX:EURGBP',
    name: 'Euro / British Pound',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'Euro quoted against the British Pound',
    spread: '1.2p',
    isPopular: true
  },
  {
    id: 'EURJPY',
    symbol: 'EURJPY',
    tvSymbol: 'FX:EURJPY',
    name: 'Euro / Japanese Yen',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'Euro quoted against the Japanese Yen (Eppy)',
    spread: '1.5p',
    isPopular: true
  },
  {
    id: 'GBPJPY',
    symbol: 'GBPJPY',
    tvSymbol: 'FX:GBPJPY',
    name: 'British Pound / Japanese Yen',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'British Pound quoted against the Japanese Yen (Dragon/Guppy)',
    spread: '1.8p',
    isPopular: true
  },
  {
    id: 'AUDJPY',
    symbol: 'AUDJPY',
    tvSymbol: 'FX:AUDJPY',
    name: 'Australian Dollar / Japanese Yen',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'Australian Dollar quoted against the Japanese Yen',
    spread: '1.7p',
    isPopular: false
  },
  {
    id: 'EURAUD',
    symbol: 'EURAUD',
    tvSymbol: 'FX:EURAUD',
    name: 'Euro / Australian Dollar',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'Euro quoted against the Australian Dollar',
    spread: '1.9p',
    isPopular: false
  },
  {
    id: 'GBPCHF',
    symbol: 'GBPCHF',
    tvSymbol: 'FX:GBPCHF',
    name: 'British Pound / Swiss Franc',
    category: 'FOREX_CROSSES',
    exchange: 'FX',
    description: 'British Pound quoted against the Swiss Franc',
    spread: '2.1p',
    isPopular: false
  },

  // --- INDICES ---
  {
    id: 'SPX500',
    symbol: 'SPX500',
    tvSymbol: 'FOREXCOM:SPXUSD',
    name: 'US 500 / S&P 500',
    category: 'INDICES',
    exchange: 'FOREX.COM',
    description: 'Benchmark Standard & Poor’s 500 Index CFD',
    spread: '0.4p',
    isPopular: true
  },
  {
    id: 'NAS100',
    symbol: 'NAS100',
    tvSymbol: 'FOREXCOM:NSXUSD',
    name: 'US Tech 100 / Nasdaq 100',
    category: 'INDICES',
    exchange: 'FOREX.COM',
    description: 'Nasdaq-100 Top Technology Index CFD',
    spread: '1.0p',
    isPopular: true
  },
  {
    id: 'US30',
    symbol: 'US30',
    tvSymbol: 'FOREXCOM:DJI',
    name: 'Dow Jones Industrial Average',
    category: 'INDICES',
    exchange: 'FOREX.COM',
    description: 'Wall Street 30 Blue Chip Industrial Average CFD',
    spread: '2.0p',
    isPopular: true
  },
  {
    id: 'GER40',
    symbol: 'GER40',
    tvSymbol: 'INDEX:DAX',
    name: 'Germany 40 / DAX',
    category: 'INDICES',
    exchange: 'DEUTSCHE BÖRSE',
    description: 'Germany DAX 40 Benchmark Index',
    spread: '1.2p',
    isPopular: false
  },
  {
    id: 'UK100',
    symbol: 'UK100',
    tvSymbol: 'INDEX:FTSE',
    name: 'UK 100 / FTSE 100',
    category: 'INDICES',
    exchange: 'FTSE RUSSELL',
    description: 'London Financial Times Stock Exchange 100 Index',
    spread: '1.5p',
    isPopular: false
  },
  {
    id: 'JPN225',
    symbol: 'JPN225',
    tvSymbol: 'INDEX:NKY',
    name: 'Japan 225 / Nikkei 225',
    category: 'INDICES',
    exchange: 'NIKKEI',
    description: 'Tokyo Nikkei 225 Stock Average',
    spread: '6.0p',
    isPopular: false
  },

  // --- CRYPTOCURRENCY ---
  {
    id: 'BTCUSD',
    symbol: 'BTCUSD',
    tvSymbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin / USDT',
    category: 'CRYPTO',
    exchange: 'BINANCE',
    description: 'Bitcoin spot price quoted against Tether USD',
    spread: '0.1p',
    isPopular: true
  },
  {
    id: 'ETHUSD',
    symbol: 'ETHUSD',
    tvSymbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum / USDT',
    category: 'CRYPTO',
    exchange: 'BINANCE',
    description: 'Ethereum spot price quoted against Tether USD',
    spread: '0.2p',
    isPopular: true
  },
  {
    id: 'SOLUSD',
    symbol: 'SOLUSD',
    tvSymbol: 'BINANCE:SOLUSDT',
    name: 'Solana / USDT',
    category: 'CRYPTO',
    exchange: 'BINANCE',
    description: 'Solana Layer-1 token quoted against Tether USD',
    spread: '0.3p',
    isPopular: true
  },
  {
    id: 'XRPUSD',
    symbol: 'XRPUSD',
    tvSymbol: 'BINANCE:XRPUSDT',
    name: 'Ripple / USDT',
    category: 'CRYPTO',
    exchange: 'BINANCE',
    description: 'XRP cryptocurrency token quoted against Tether USD',
    spread: '0.2p',
    isPopular: false
  },

  // --- STOCKS & US EQUITIES ---
  {
    id: 'AAPL',
    symbol: 'AAPL',
    tvSymbol: 'NASDAQ:AAPL',
    name: 'Apple Inc.',
    category: 'STOCKS',
    exchange: 'NASDAQ',
    description: 'Apple Inc. Common Stock',
    spread: '0.02',
    isPopular: true
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    tvSymbol: 'NASDAQ:NVDA',
    name: 'NVIDIA Corporation',
    category: 'STOCKS',
    exchange: 'NASDAQ',
    description: 'NVIDIA Corporation Common Stock',
    spread: '0.04',
    isPopular: true
  },
  {
    id: 'TSLA',
    symbol: 'TSLA',
    tvSymbol: 'NASDAQ:TSLA',
    name: 'Tesla, Inc.',
    category: 'STOCKS',
    exchange: 'NASDAQ',
    description: 'Tesla, Inc. Common Stock',
    spread: '0.05',
    isPopular: true
  },
  {
    id: 'MSFT',
    symbol: 'MSFT',
    tvSymbol: 'NASDAQ:MSFT',
    name: 'Microsoft Corporation',
    category: 'STOCKS',
    exchange: 'NASDAQ',
    description: 'Microsoft Corporation Common Stock',
    spread: '0.03',
    isPopular: false
  },
  {
    id: 'AMZN',
    symbol: 'AMZN',
    tvSymbol: 'NASDAQ:AMZN',
    name: 'Amazon.com, Inc.',
    category: 'STOCKS',
    exchange: 'NASDAQ',
    description: 'Amazon.com, Inc. Common Stock',
    spread: '0.03',
    isPopular: false
  }
];

export interface TimeframePreset {
  id: string;
  interval: string;
  label: string;
  longLabel: string;
}

export const TIMEFRAME_PRESETS: TimeframePreset[] = [
  { id: '1m', interval: '1', label: '1m', longLabel: '1 Minute' },
  { id: '5m', interval: '5', label: '5m', longLabel: '5 Minutes' },
  { id: '15m', interval: '15', label: '15m', longLabel: '15 Minutes' },
  { id: '30m', interval: '30', label: '30m', longLabel: '30 Minutes' },
  { id: '1h', interval: '60', label: '1h', longLabel: '1 Hour' },
  { id: '4h', interval: '240', label: '4h', longLabel: '4 Hours' },
  { id: '1d', interval: 'D', label: '1D', longLabel: '1 Day' },
  { id: '1w', interval: 'W', label: '1W', longLabel: '1 Week' },
  { id: '1M', interval: 'M', label: '1M', longLabel: '1 Month' }
];

export const DEFAULT_INSTRUMENT_SYMBOL = 'XAUUSD';
export const DEFAULT_TIMEFRAME_INTERVAL = '60';

/**
 * Resolves any raw symbol or ticker into an exchange-qualified TradingView symbol
 */
export function resolveTradingViewSymbol(rawInput: string): {
  tvSymbol: string;
  instrument: TradingViewInstrument | null;
  isValid: boolean;
} {
  if (!rawInput || !rawInput.trim()) {
    const def = SUPPORTED_INSTRUMENTS.find(i => i.symbol === DEFAULT_INSTRUMENT_SYMBOL)!;
    return { tvSymbol: def.tvSymbol, instrument: def, isValid: true };
  }

  const clean = rawInput.trim().toUpperCase().replace(/[^A-Z0-9:]/g, '');

  // 1. Direct match on symbol (e.g. 'XAUUSD', 'EURUSD', 'BTCUSD')
  const matched = SUPPORTED_INSTRUMENTS.find(
    i => i.symbol.toUpperCase() === clean || i.id.toUpperCase() === clean || i.tvSymbol.toUpperCase() === clean
  );
  if (matched) {
    return { tvSymbol: matched.tvSymbol, instrument: matched, isValid: true };
  }

  // 2. Slash or delimiter normalized (e.g. 'EUR/USD' -> 'EURUSD')
  const strippedSlash = rawInput.replace('/', '').toUpperCase().trim();
  const matchedSlash = SUPPORTED_INSTRUMENTS.find(i => i.symbol.toUpperCase() === strippedSlash);
  if (matchedSlash) {
    return { tvSymbol: matchedSlash.tvSymbol, instrument: matchedSlash, isValid: true };
  }

  // 3. User passed an explicit TradingView symbol with exchange prefix (e.g. 'BINANCE:BTCUSDT' or 'OANDA:XAUUSD')
  if (clean.includes(':')) {
    return {
      tvSymbol: clean,
      instrument: null,
      isValid: true
    };
  }

  // 4. Default to FX or OANDA prefix based on format
  if (clean.length === 6) {
    // 6-character forex / metal pair (e.g. 'EURUSD', 'XAUUSD')
    const tvSym = clean.startsWith('XAU') || clean.startsWith('XAG') ? `OANDA:${clean}` : `FX:${clean}`;
    return { tvSymbol: tvSym, instrument: null, isValid: true };
  }

  return {
    tvSymbol: clean,
    instrument: null,
    isValid: clean.length >= 2
  };
}
