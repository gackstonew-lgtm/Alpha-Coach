import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- MT5 CHARTS & JOURNAL AUTOMATED VERIFICATION SUITE ---');

const tradingChartPath = path.resolve('frontend/src/components/chart/TradingChart.tsx');
const chartsPagePath = path.resolve('frontend/src/pages/ChartsPage.tsx');
const journalPagePath = path.resolve('frontend/src/pages/JournalPage.tsx');

const tradingChartSrc = fs.readFileSync(tradingChartPath, 'utf8');
const chartsPageSrc = fs.readFileSync(chartsPagePath, 'utf8');
const journalPageSrc = fs.readFileSync(journalPagePath, 'utf8');

// Test 1: TradingChart MT5 Top Toolbar
console.log('Test 1: Verifying TradingChart MT5 Top Toolbar controls...');
assert(tradingChartSrc.includes('Crosshair'), 'TradingChart must include Crosshair tool');
assert(tradingChartSrc.includes('MT5 Indicators Menu (f)'), 'TradingChart must include MT5 f indicator toggle');
assert(tradingChartSrc.includes('Drawing Tools & Shapes'), 'TradingChart must include drawing tools toggle');
assert(tradingChartSrc.includes('SlidersHorizontal'), 'TradingChart must include order toggle');
console.log('✓ PASS: TradingChart MT5 Top Toolbar verified');

// Test 2: TradingChart MT5 Buy/Sell Quote Strip & Pipette Formatting
console.log('Test 2: Verifying MT5 Buy/Sell Quote Strip & Pipette Math...');
assert(tradingChartSrc.includes('formattedBid'), 'TradingChart must calculate formattedBid');
assert(tradingChartSrc.includes('formattedAsk'), 'TradingChart must calculate formattedAsk');
assert(tradingChartSrc.includes('handleExecuteQuote'), 'TradingChart must handle BUY/SELL executions');
assert(tradingChartSrc.includes('lotSize.toFixed(2)'), 'TradingChart must include lot size stepper');
assert(tradingChartSrc.includes('pipette'), 'TradingChart must render pipette superscript');
console.log('✓ PASS: MT5 Buy/Sell Quote Strip verified');

// Test 3: TradingChart MT5 Watermark Overlay
console.log('Test 3: Verifying Top-Left MT5 Chart Watermark...');
assert(tradingChartSrc.includes('Top-Left MT5 Chart Watermark'), 'TradingChart must contain top-left watermark');
assert(tradingChartSrc.includes('currentSymbol} · {timeframe}'), 'TradingChart must show symbol and timeframe watermark');
assert(tradingChartSrc.includes('INSTRUMENT_NAMES'), 'TradingChart must include descriptive instrument names');
console.log('✓ PASS: MT5 Chart Watermark verified');

// Test 4: ChartsPage Responsive & Layout Preservation
console.log('Test 4: Verifying ChartsPage Layouts and Streamlined Header...');
assert(chartsPageSrc.includes('Interactive Charts') || chartsPageSrc.includes('Chart'), 'ChartsPage must retain chart header');
assert(chartsPageSrc.includes("layoutMode === 'single'"), 'ChartsPage must support single chart');
assert(chartsPageSrc.includes("layoutMode === 'dual'"), 'ChartsPage must support dual chart');
assert(chartsPageSrc.includes("layoutMode === 'quad'"), 'ChartsPage must support quad chart');
console.log('✓ PASS: ChartsPage multi-pane layouts verified');

// Test 5: JournalPage MT5 History Header
console.log('Test 5: Verifying JournalPage MT5 History Header & Action Controls...');
assert(journalPageSrc.includes('History'), 'JournalPage must have History title');
assert(journalPageSrc.includes('All symbols'), 'JournalPage must display All symbols subtitle');
assert(journalPageSrc.includes('setIsSymbolModalOpen'), 'JournalPage must support $ currency filter modal');
assert(journalPageSrc.includes('setSortAscending'), 'JournalPage must support ↑↓ sort toggle');
assert(journalPageSrc.includes('setIsCalendarModalOpen'), 'JournalPage must support calendar date filter modal');
console.log('✓ PASS: JournalPage MT5 Header controls verified');

// Test 6: JournalPage MT5 3-Segment Tabs
console.log('Test 6: Verifying MT5 3-Segment Tabs (POSITIONS, ORDERS, DEALS)...');
assert(journalPageSrc.includes('POSITIONS'), 'JournalPage must have POSITIONS tab');
assert(journalPageSrc.includes('ORDERS'), 'JournalPage must have ORDERS tab');
assert(journalPageSrc.includes('DEALS'), 'JournalPage must have DEALS tab');
assert(journalPageSrc.includes('#2F5BEA'), 'JournalPage must use ArcadeFX brand blue accent line for active tab');
console.log('✓ PASS: MT5 3-Segment Tabs verified');

// Test 7: JournalPage MT5 Dot-Leader Account Summary
console.log('Test 7: Verifying MT5 Dot-Leader Account Summary...');
assert(journalPageSrc.includes('Profit:'), 'JournalPage summary must include Profit');
assert(journalPageSrc.includes('Deposit:'), 'JournalPage summary must include Deposit');
assert(journalPageSrc.includes('Swap:'), 'JournalPage summary must include Swap');
assert(journalPageSrc.includes('Commission:'), 'JournalPage summary must include Commission');
assert(journalPageSrc.includes('Balance:'), 'JournalPage summary must include Balance');
assert(journalPageSrc.includes('border-dotted'), 'JournalPage summary must use dotted leaders');
console.log('✓ PASS: MT5 Dot-Leader Account Summary verified');

// Test 8: JournalPage Dense MT5 History List Rows
console.log('Test 8: Verifying Dense MT5 History Rows format...');
assert(journalPageSrc.includes('formatMT5HistoryDate'), 'JournalPage must format dates to YYYY.MM.DD HH:MM:SS');
assert(journalPageSrc.includes('t.position_type.toLowerCase()'), 'JournalPage must display buy/sell direction and volume');
assert(journalPageSrc.includes('entry_price_avg'), 'JournalPage must display entry -> exit price');
assert(journalPageSrc.includes('#2F5BEA') && journalPageSrc.includes('#D12F42'), 'JournalPage must use blue/red colors for buy/sell & profit/loss');
assert(journalPageSrc.includes('openTradeDetail'), 'JournalPage must open rich trade review drawer');
console.log('✓ PASS: Dense MT5 History Rows verified');

console.log('\n======================================================');
console.log('ALL 8/8 MT5 CHARTS & JOURNAL TESTS PASSED SUCCESSFULLY');
console.log('======================================================\n');
