import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse tradingViewSymbols.ts
const symbolsTsPath = path.join(__dirname, '../src/config/tradingViewSymbols.ts');
const fileContent = fs.readFileSync(symbolsTsPath, 'utf8');

console.log('Testing TradingView Advanced Chart Integration Configuration...');

// 1. Verify Default Instrument is Gold (XAUUSD)
assert.ok(fileContent.includes("DEFAULT_INSTRUMENT_SYMBOL = 'XAUUSD'"), 'Default symbol must be XAUUSD');
assert.ok(fileContent.includes("OANDA:XAUUSD"), 'XAUUSD must map to OANDA:XAUUSD');

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

// 8. Verify Supported Intervals
const intervals = ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'];
for (const inv of intervals) {
  assert.ok(fileContent.includes(`interval: '${inv}'`), `Interval ${inv} must be in TIMEFRAME_PRESETS`);
}

// 9. Verify ChartsPage.tsx imports and renders TradingViewAdvancedChart
const chartsPagePath = path.join(__dirname, '../src/pages/ChartsPage.tsx');
const chartsPageContent = fs.readFileSync(chartsPagePath, 'utf8');
assert.ok(chartsPageContent.includes('TradingViewAdvancedChart'), 'ChartsPage must import TradingViewAdvancedChart');
assert.ok(chartsPageContent.includes('<TradingViewAdvancedChart'), 'ChartsPage must render <TradingViewAdvancedChart');
assert.ok(chartsPageContent.includes('useTheme()'), 'ChartsPage must synchronize theme via useTheme()');

// 10. Verify TradingViewAdvancedChart.tsx uses official embed script and attribution
const tvChartPath = path.join(__dirname, '../src/components/chart/TradingViewAdvancedChart.tsx');
const tvChartContent = fs.readFileSync(tvChartPath, 'utf8');
assert.ok(tvChartContent.includes('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'), 'Must use official TradingView embed script');
assert.ok(tvChartContent.includes('tradingview-widget-copyright'), 'Must include required TradingView attribution');
assert.ok(tvChartContent.includes('resolveTradingViewSymbol'), 'Must resolve exchange-qualified symbols');

console.log('✓ All 10 TradingView Advanced Chart integration contract checks passed successfully!');
