import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read tradingViewSymbols.ts, ChartsPage.tsx, TradingViewAdvancedChart.tsx, TradingChart.tsx, chartWorkspaceStorage.ts, index.css, ThemeContext.tsx, MobileBottomNav.tsx, Navbar.tsx
const symbolsTsPath = path.join(__dirname, '../src/config/tradingViewSymbols.ts');
const fileContent = fs.readFileSync(symbolsTsPath, 'utf8');

const chartsPagePath = path.join(__dirname, '../src/pages/ChartsPage.tsx');
const chartsPageContent = fs.readFileSync(chartsPagePath, 'utf8');

const tvChartPath = path.join(__dirname, '../src/components/chart/TradingViewAdvancedChart.tsx');
const tvChartContent = fs.readFileSync(tvChartPath, 'utf8');

const mt5ChartPath = path.join(__dirname, '../src/components/chart/TradingChart.tsx');
const mt5ChartContent = fs.readFileSync(mt5ChartPath, 'utf8');

const workspaceStoragePath = path.join(__dirname, '../src/utils/chartWorkspaceStorage.ts');
const workspaceStorageContent = fs.readFileSync(workspaceStoragePath, 'utf8');

const indexCssPath = path.join(__dirname, '../src/index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

const themeContextPath = path.join(__dirname, '../src/context/ThemeContext.tsx');
const themeContextContent = fs.readFileSync(themeContextPath, 'utf8');

const mobileNavPath = path.join(__dirname, '../src/components/layout/MobileBottomNav.tsx');
const mobileNavContent = fs.readFileSync(mobileNavPath, 'utf8');

const navbarPath = path.join(__dirname, '../src/components/layout/Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

console.log('Testing TradingView Charts, Workspace Persistence, Light/Dark Themes & Responsive Navigation/Header...');

// 1. Verify Default Instrument is Gold (XAUUSD)
assert.ok(fileContent.includes("DEFAULT_INSTRUMENT_SYMBOL = 'XAUUSD'"), 'Default symbol must be XAUUSD');
assert.ok(fileContent.includes('OANDA:XAUUSD'), 'XAUUSD must map to OANDA:XAUUSD');

// 2. Verify Metals
assert.ok(fileContent.includes("'XAUUSD'") && fileContent.includes("'OANDA:XAUUSD'"), 'Gold mapping verified');
assert.ok(fileContent.includes("'XAGUSD'") && fileContent.includes("'OANDA:XAGUSD'"), 'Silver mapping verified');

// 3. Verify Forex Majors
const majors = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF'];
for (const m of majors) {
  assert.ok(fileContent.includes(`'${m}'`), `Major ${m} must be in directory`);
  assert.ok(fileContent.includes(`'FX:${m}'`), `Major ${m} must have FX: prefix`);
}

// 4. Verify Forex Crosses
const crosses = ['EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'GBPCHF'];
for (const c of crosses) {
  assert.ok(fileContent.includes(`'${c}'`), `Cross ${c} must be in directory`);
  assert.ok(fileContent.includes(`'FX:${c}'`), `Cross ${c} must have FX: prefix`);
}

// 5. Verify Indices
const indices = ['SPX500', 'NAS100', 'US30', 'GER40', 'UK100', 'JPN225'];
for (const idx of indices) {
  assert.ok(fileContent.includes(`'${idx}'`), `Index ${idx} must be in directory`);
}

// 6. Verify Cryptocurrencies
const cryptos = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'];
for (const cr of cryptos) {
  assert.ok(fileContent.includes(`'${cr}'`), `Crypto ${cr} must be in directory`);
  assert.ok(fileContent.includes(`'BINANCE:${cr.replace('USD', 'USDT')}'`), `Crypto ${cr} must have Binance USDT ticker`);
}

// 7. Verify Equities / Stocks
const stocks = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];
for (const st of stocks) {
  assert.ok(fileContent.includes(`'${st}'`), `Stock ${st} must be in directory`);
  assert.ok(fileContent.includes(`'NASDAQ:${st}'`), `Stock ${st} must have NASDAQ: prefix`);
}

// 8. Verify Supported Intervals (1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, 1M)
const intervals = ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'];
for (const inv of intervals) {
  assert.ok(fileContent.includes(`interval: '${inv}'`), `Interval ${inv} must be in TIMEFRAME_PRESETS`);
}

// 9. Verify Market Catalog Card & Reserved Layout Column Are Completely Removed from ChartsPage.tsx
assert.ok(!chartsPageContent.includes('Market Catalog'), 'Market Catalog heading must be removed from ChartsPage');
assert.ok(!chartsPageContent.includes('Market Directory'), 'Market Directory drawer must be removed from ChartsPage');
assert.ok(!chartsPageContent.includes('lg:grid-cols-12'), 'Obsolete 12-column catalog grid split must be removed');
assert.ok(!chartsPageContent.includes('lg:col-span-3'), 'Obsolete 3-column Market Catalog rail must be removed');
assert.ok(!chartsPageContent.includes('lg:col-span-9'), 'Obsolete 9-column chart restriction must be removed');
assert.ok(!chartsPageContent.includes('item.spread'), 'Catalog spread cards must be removed from ChartsPage');

// 10. Verify Full-Workspace Chart Expansion & Preserved Controls in ChartsPage.tsx
assert.ok(chartsPageContent.includes('TradingViewAdvancedChart'), 'ChartsPage must import TradingViewAdvancedChart');
assert.ok(chartsPageContent.includes('<TradingViewAdvancedChart'), 'ChartsPage must render <TradingViewAdvancedChart');
assert.ok(chartsPageContent.includes('height="100%"'), 'ChartsPage must expand chart height to 100% of workspace');
assert.ok(chartsPageContent.includes('100dvh'), 'ChartsPage must size workspace container relative to dynamic viewport height');
assert.ok(chartsPageContent.includes('Select trading instrument'), 'ChartsPage must preserve compact symbol selector');
assert.ok(chartsPageContent.includes('useTheme()'), 'ChartsPage must synchronize theme via useTheme()');

// 11. Verify Session & Cookie Persistence for Workspace, Indicators, and Drawings
assert.ok(
  workspaceStorageContent.includes("WORKSPACE_COOKIE_NAME = 'arcadefx_chart_workspace'"),
  'Must persist workspace state in arcadefx_chart_workspace cookie'
);
assert.ok(
  workspaceStorageContent.includes("WORKSPACE_STORAGE_KEY = 'arcadefx_chart_workspace_v1'"),
  'Must persist workspace state in localStorage'
);
assert.ok(
  workspaceStorageContent.includes('loadSymbolDrawings') && workspaceStorageContent.includes('saveSymbolDrawings'),
  'Must persist per-symbol drawings in localStorage and cookies'
);
assert.ok(
  chartsPageContent.includes('loadChartWorkspace') && chartsPageContent.includes('saveChartWorkspace'),
  'ChartsPage must load and save workspace state across sessions'
);
assert.ok(
  mt5ChartContent.includes('loadSymbolDrawings') && mt5ChartContent.includes('saveSymbolDrawings'),
  'TradingChart must load and save per-symbol drawings across sessions'
);

// 12. Verify TradingViewAdvancedChart.tsx availability and indicator persistence
assert.ok(
  tvChartContent.includes('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'),
  'Must use official TradingView embed script'
);
assert.ok(
  tvChartContent.includes('https://www.tradingview-widget.com/embed-widget/advanced-chart/'),
  'Must include official TradingView widget iframe fallback URL'
);
assert.ok(
  !tvChartContent.includes("widgetInner.querySelector('iframe')"),
  'REGRESSION: Must never query iframe on detached widgetInner'
);
assert.ok(
  tvChartContent.includes("widgetContainer.querySelector('iframe')"),
  'Must query iframe on widgetContainer where TradingView mounts the iframe'
);
assert.ok(tvChartContent.includes('resolveTradingViewStudies'), 'Must pass persisted studies to TradingView widget');

// 13. Verify Centralized TradingView Light & Dark Theme Tokens in index.css, ThemeContext, and Chart Components
const requiredCssTokens = [
  '--app-background: #ffffff',
  '--chart-background: #ffffff',
  '--surface-secondary: #f0f3fa',
  '--text-primary: #131722',
  '--text-heading: #111827',
  '--text-body: #1f2937',
  '--text-secondary: #374151',
  '--text-muted: #374151',
  '--text-subtle: #4b5563',
  '--text-label: #374151',
  '--text-input: #111827',
  '--text-placeholder: #4b5563',
  '--text-nav: #1f2937',
  '--text-table: #1f2937',
  '--text-disabled: #6b7280',
  '--border-color: #e0e3eb',
  '--chart-grid: #e6e8ef',
  '--candle-bullish: #089981',
  '--candle-bearish: #f23645',
  '--app-background: #000000',
  '--chart-background: #000000',
  '--surface-secondary: #131722',
  '--text-primary: #d1d4dc',
  '--text-secondary: #9ca3af',
  '--text-muted: #8a919e',
  '--border-color: #2a2e39',
  '--chart-grid: #1c1f26'
];
for (const token of requiredCssTokens) {
  assert.ok(indexCssContent.toLowerCase().includes(token), `index.css must define TradingView token: ${token}`);
}

assert.ok(tvChartContent.includes('TV_THEME_PALETTE'), 'TradingViewAdvancedChart must define TV_THEME_PALETTE');
assert.ok(
  tvChartContent.includes('backgroundColor: activePalette.backgroundColor') &&
    tvChartContent.includes('gridColor: activePalette.gridColor'),
  'TradingViewAdvancedChart must pass explicit backgroundColor and gridColor to TradingView widget'
);
assert.ok(
  mt5ChartContent.includes('useTheme()') && mt5ChartContent.includes('#089981') && mt5ChartContent.includes('#f23645'),
  'TradingChart must synchronize with useTheme() and use TradingView candle colors (#089981 / #f23645)'
);
assert.ok(
  themeContextContent.includes("root.setAttribute('data-theme'"),
  'ThemeContext must synchronize both .dark class and data-theme attribute'
);

// 14. Verify Mobile/Tablet Bottom Navigation (Home, Charts, Coach, News, Journal in exact order, no More, no backdrop-blur)
const homeIdx = mobileNavContent.indexOf("label: 'Home'");
const chartsIdx = mobileNavContent.indexOf("label: 'Charts'");
const coachIdx = mobileNavContent.indexOf("label: 'Coach'");
const newsIdx = mobileNavContent.indexOf("label: 'News'");
const journalIdx = mobileNavContent.indexOf("label: 'Journal'");
assert.ok(
  homeIdx > -1 && chartsIdx > homeIdx && coachIdx > chartsIdx && newsIdx > coachIdx && journalIdx > newsIdx,
  'MobileBottomNav must render Home, Charts, Coach, News, and Journal in exact order'
);
assert.ok(mobileNavContent.includes("to: '/ai-coach'"), 'Coach tab must route to /ai-coach');
assert.ok(mobileNavContent.includes("to: '/journal'"), 'Journal tab must route to /journal');
assert.ok(!mobileNavContent.includes('<span>More</span>'), 'More tab must be replaced by Journal');
assert.ok(!mobileNavContent.includes('backdrop-blur'), 'MobileBottomNav must not use backdrop-blur glassmorphism');
assert.ok(mobileNavContent.includes("backdropFilter: 'none'"), 'MobileBottomNav must explicitly disable backdropFilter');

// 15. Verify Header Redesign (Menu, Search on left; Notifications, Theme Toggle, Settings on right; no backdrop-blur)
const menuBtnIdx = navbarContent.indexOf('aria-label="Toggle navigation menu"');
const searchBtnIdx = navbarContent.indexOf('aria-label="Open global search"');
const notifBtnIdx = navbarContent.indexOf('aria-label="Open notifications"');
const themeBtnIdx = navbarContent.indexOf('onClick={toggleTheme}');
const settingsBtnIdx = navbarContent.indexOf('aria-label="Open settings"');
assert.ok(
  menuBtnIdx > -1 &&
    searchBtnIdx > menuBtnIdx &&
    notifBtnIdx > searchBtnIdx &&
    themeBtnIdx > notifBtnIdx &&
    settingsBtnIdx > themeBtnIdx,
  'Navbar must render Menu, Search, Notifications, Theme Toggle, and Settings in exact order'
);
assert.ok(!navbarContent.includes('backdrop-blur'), 'Navbar must not use backdrop-blur glassmorphism');
assert.ok(navbarContent.includes('aria-label="Global Search"'), 'Navbar must include functional Global Search dialog');

// 16. Verify High-Contrast Light-Mode Typography Hierarchy & WCAG 2.2 AA Contrast Ratios (>= 4.5:1)
function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const lightModeTextTokens = [
  { name: '--text-primary', hex: '#131722', minRatio: 15.0 },
  { name: '--text-heading', hex: '#111827', minRatio: 15.0 },
  { name: '--text-body', hex: '#1f2937', minRatio: 12.0 },
  { name: '--text-secondary', hex: '#374151', minRatio: 7.0 },
  { name: '--text-muted', hex: '#374151', minRatio: 7.0 },
  { name: '--text-label', hex: '#374151', minRatio: 7.0 },
  { name: '--text-input', hex: '#111827', minRatio: 15.0 },
  { name: '--text-placeholder', hex: '#4b5563', minRatio: 4.5 },
  { name: '--text-subtle', hex: '#4b5563', minRatio: 4.5 },
  { name: '--text-nav', hex: '#1f2937', minRatio: 12.0 },
  { name: '--text-table', hex: '#1f2937', minRatio: 12.0 },
  { name: '--text-disabled', hex: '#6b7280', minRatio: 4.5 }
];

for (const token of lightModeTextTokens) {
  const ratioWhite = contrastRatio(token.hex, '#FFFFFF');
  const ratioSecondary = contrastRatio(token.hex, '#F0F3FA');
  assert.ok(
    ratioWhite >= token.minRatio,
    `Light-mode ${token.name} (${token.hex}) must have >= ${token.minRatio}:1 contrast on #FFFFFF (got ${ratioWhite.toFixed(2)}:1)`
  );
  if (token.name !== '--text-disabled') {
    assert.ok(
      ratioSecondary >= 4.5,
      `Light-mode ${token.name} (${token.hex}) must exceed WCAG AA 4.5:1 contrast on #F0F3FA (got ${ratioSecondary.toFixed(2)}:1)`
    );
  }
}

assert.ok(
  tvChartContent.includes("secondaryTextColor: '#374151'"),
  'TradingViewAdvancedChart light palette must use #374151 for high-contrast secondaryTextColor'
);

console.log('✓ All 16 TradingView Chart, Workspace Persistence, Theme, Navigation & Light-Mode Typography Contrast checks passed!');
