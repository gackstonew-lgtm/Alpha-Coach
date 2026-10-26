import fs from 'fs';
import path from 'path';

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

let failures = 0;

console.log('='.repeat(70));
console.log('RUNNING ARCADE FX DASHBOARD ENHANCEMENT VERIFICATION SUITE');
console.log('='.repeat(70));

const dashboardPath = path.resolve('frontend/src/pages/DashboardPage.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

const sessionsPath = path.resolve('frontend/src/components/dashboard/MarketSessionsStrip.tsx');
const sessionsCode = fs.readFileSync(sessionsPath, 'utf8');

// Test 1: Chart Heading "My PNL Trend"
console.log('\n[Suite 1: Chart Heading & Decoupling from Single Currency Pair]');
assert(dashboardCode.includes('My PNL Trend'), 'Dashboard chart heading is "My PNL Trend"');
assert(!dashboardCode.includes('EUR/USD LIVE'), 'Specific title "EUR/USD LIVE" removed');
assert(!dashboardCode.includes('Euro vs US Dollar'), 'Specific subtitle "Euro vs US Dollar" removed');

// Test 2: Real MT5 Account Balance Display
console.log('\n[Suite 2: Real MT5 Account Balance & Sync Status]');
assert(dashboardCode.includes('MT5 Balance'), 'Balance field explicitly labeled "MT5 Balance"');
assert(dashboardCode.includes('balanceInfo.formattedBalance'), 'Displays formatted balance derived from MT5 accounts');
assert(dashboardCode.includes('balanceInfo.lastSyncLabel'), 'Displays real timestamp derived from MT5 sync');
assert(dashboardCode.includes('last_synced_at'), 'Uses MT5 last_synced_at property');
assert(dashboardCode.includes('Unavailable'), 'Handles unavailable MT5 data truthfully without fake numbers');
assert(dashboardCode.includes('No MT5 account connected'), 'Handles disconnected state truthfully');

// Test 3: Top-Level 4 Trading Analytics Cards
console.log('\n[Suite 3: Four Trading Analytics Cards at Top]');
const netPlIdx = dashboardCode.indexOf('Net Realized P/L');
const winRateIdx = dashboardCode.indexOf('Win Rate');
const pFactorIdx = dashboardCode.indexOf('Profit Factor');
const maxDdIdx = dashboardCode.indexOf('Max Drawdown');
const chartIdx = dashboardCode.indexOf('My PNL Trend');

assert(netPlIdx !== -1 && winRateIdx !== -1 && pFactorIdx !== -1 && maxDdIdx !== -1, 'All 4 analytics metrics are rendered');
assert(netPlIdx < chartIdx, 'Net Realized P/L is rendered above PnL chart');
assert(winRateIdx < chartIdx, 'Win Rate is rendered above PnL chart');
assert(pFactorIdx < chartIdx, 'Profit Factor is rendered above PnL chart');
assert(maxDdIdx < chartIdx, 'Max Drawdown is rendered above PnL chart');
assert(dashboardCode.includes('reconstructed deals'), 'Preserves reconstructed-deal counter');
assert(dashboardCode.includes('Expectancy:'), 'Preserves expectancy metric');

// Test 4: Completely Remove My Portfolio Section
console.log('\n[Suite 4: My Portfolio Section Removed]');
assert(!dashboardCode.includes('My Portfolio'), 'Section "My Portfolio" completely removed');
assert(!dashboardCode.includes('Euro Spot'), 'Hardcoded asset "Euro Spot" removed');
assert(!dashboardCode.includes('Pound Spot'), 'Hardcoded asset "Pound Spot" removed');
assert(!dashboardCode.includes('Gold Spot'), 'Hardcoded asset "Gold Spot" removed');
assert(!dashboardCode.includes('Yen Spot'), 'Hardcoded asset "Yen Spot" removed');

// Test 5: Circular Market-Pair Items in Watchlist
console.log('\n[Suite 5: Circular Market-Pair Watchlist]');
assert(dashboardCode.includes('EUR') && dashboardCode.includes('EURUSD'), 'Watchlist includes EUR / EURUSD');
assert(dashboardCode.includes('GBP') && dashboardCode.includes('GBPUSD'), 'Watchlist includes GBP / GBPUSD');
assert(dashboardCode.includes('XAU') && dashboardCode.includes('XAUUSD'), 'Watchlist includes XAU / XAUUSD');
assert(dashboardCode.includes('USD') && dashboardCode.includes('USDJPY'), 'Watchlist includes USD / USDJPY');
assert(dashboardCode.includes('BTC') && dashboardCode.includes('BTCUSD'), 'Watchlist includes BTC / BTCUSD');
assert(dashboardCode.includes('US3') && dashboardCode.includes('US30'), 'Watchlist includes US3 / US30');
assert(dashboardCode.includes('rounded-full') && dashboardCode.includes('w-11 h-11'), 'Watchlist uses distinct 44x44px circular badges');
assert(dashboardCode.includes('Unavailable') && dashboardCode.includes('No Live Feed'), 'Watchlist handles missing feed truthfully');

// Test 6: Simplified Forex Sessions
console.log('\n[Suite 6: Simplified Active Forex Sessions]');
assert(!sessionsCode.includes('Global Forex Sessions'), 'Decorative title "Global Forex Sessions" removed');
assert(!sessionsCode.includes('Current UTC:'), 'Static/decorative "Current UTC:" removed');
assert(!sessionsCode.includes('Launch Chart'), 'Unused "Launch Chart" button removed');
assert(!sessionsCode.includes('EURUSDGBPUSDUSDJPYUSDCADAUDUSDUSDCHFXAUUSDBTCUSD'), 'Static concatenated symbols removed');
assert(sessionsCode.includes('activeSessions'), 'Filters and displays active forex sessions');
assert(sessionsCode.includes('No major forex trading sessions currently active'), 'Includes empty state for closed market');

// Test 7: Remove Unwanted PnL Chart Text and Links
console.log('\n[Suite 7: Unwanted PnL Chart Text & Links Removed]');
assert(!dashboardCode.includes('Real-Time MT5 Tick Engine Sync'), 'Removed "Real-Time MT5 Tick Engine Sync"');
assert(!dashboardCode.includes('Open Advanced Multi-Timeframe Charts'), 'Removed "Open Advanced Multi-Timeframe Charts" link');
assert(!dashboardCode.includes('http://localhost:5173/charts'), 'No localhost URLs remain in DashboardPage');

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ ALL DASHBOARD ENHANCEMENT ASSERTIONS PASSED (0 FAILURES)');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.error(`❌ DASHBOARD VERIFICATION FAILED WITH ${failures} ERRORS`);
  console.log('='.repeat(70));
  process.exit(1);
}
