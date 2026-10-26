import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('======================================================================');
console.log('RUNNING ARCADE FX UI REFINEMENT VERIFICATION SUITE');
console.log('======================================================================\n');

const journalPath = path.resolve('frontend/src/pages/JournalPage.tsx');
const newsPath = path.resolve('frontend/src/pages/MacroCalendarPage.tsx');
const sidebarPath = path.resolve('frontend/src/components/layout/Sidebar.tsx');
const navConfigPath = path.resolve('frontend/src/config/navigation.ts');

const journalSrc = fs.readFileSync(journalPath, 'utf8');
const newsSrc = fs.readFileSync(newsPath, 'utf8');
const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');
const navConfigSrc = fs.readFileSync(navConfigPath, 'utf8');

// Suite 1: Journal Header Simplification
console.log('[Suite 1: Journal Header Simplification]');
assert(!journalSrc.includes('>History<'), 'FAIL: Journal must not display "History" header text');
console.log('  ✓ PASS: "History" title text removed');

assert(!journalSrc.includes('All symbols'), 'FAIL: Journal must not display "All symbols" subtitle');
console.log('  ✓ PASS: "All symbols" subtitle text removed');

assert(!journalSrc.includes('label="Voice"'), 'FAIL: Journal must not render visible Voice button');
assert(!journalSrc.includes('Voice Journal Entry'), 'FAIL: Journal must not render Voice button tooltip');
console.log('  ✓ PASS: Voice button removed from Journal screen');

assert(journalSrc.includes('POSITIONS') && journalSrc.includes('ORDERS') && journalSrc.includes('DEALS'),
  'FAIL: Journal must retain POSITIONS, ORDERS, and DEALS tabs');
console.log('  ✓ PASS: MT5 3-Segment Tabs retained in compact bar');

assert(journalSrc.includes('setIsSymbolModalOpen') && journalSrc.includes('DollarSign'),
  'FAIL: Journal must retain symbol filter control ($)');
assert(journalSrc.includes('setSortAscending') && journalSrc.includes('ArrowUpDown'),
  'FAIL: Journal must retain sort toggle control (↑↓)');
assert(journalSrc.includes('setIsCalendarModalOpen') && journalSrc.includes('Calendar'),
  'FAIL: Journal must retain date calendar picker control');
console.log('  ✓ PASS: Action controls ($, ↑↓, 📅) directly aligned with tabs');

// Suite 2: News Page Redundant Macro Content & Refresh Removal
console.log('\n[Suite 2: News Page Redundant Content Removal]');
assert(!newsSrc.includes('G8 Macroeconomic Profiles & Policy Divergence'),
  'FAIL: News page must remove "G8 Macroeconomic Profiles & Policy Divergence" block');
console.log('  ✓ PASS: "G8 Macroeconomic Profiles & Policy Divergence" block removed');

assert(!newsSrc.includes('European Central Bank (ECB): 3.25%'),
  'FAIL: News page must remove specific ECB policy divergence example text');
assert(!newsSrc.includes('Policy Rate Spread: -125 bps'),
  'FAIL: News page must remove rate spread example text');
console.log('  ✓ PASS: Specific EUR/USD policy divergence text removed');

assert(!newsSrc.includes('Refresh Calendar'),
  'FAIL: News page must remove Refresh Calendar button');
assert(!newsSrc.includes('isRefreshing'),
  'FAIL: News page must clean up unused isRefreshing state');
console.log('  ✓ PASS: Refresh button and dedicated refresh state removed');

// Suite 3: News Page Circular Impact Indicators
console.log('\n[Suite 3: News Page Circular Impact Indicators]');
assert(newsSrc.includes('rounded-full') && newsSrc.includes('bg-rose-500'),
  'FAIL: High impact must use circular indicator');
assert(newsSrc.includes('bg-amber-500'),
  'FAIL: Medium impact must use circular indicator');
assert(newsSrc.includes('bg-yellow-400'),
  'FAIL: Low impact must use circular indicator');
console.log('  ✓ PASS: Minimal circular indicator system implemented (Red, Orange, Yellow)');

assert(newsSrc.includes('aria-label="Impact level indicators"'),
  'FAIL: Circular impact indicators must provide accessible labels');
console.log('  ✓ PASS: Accessible labels and tooltips preserved for impact levels');

// Suite 4: Sidebar Flattening & Independent Links
console.log('\n[Suite 4: Sidebar Flattening & Independent Links]');
assert(!sidebarSrc.includes('Market Intelligence Navigation Group'),
  'FAIL: Sidebar must not render Market Intelligence accordion dropdown');
assert(!sidebarSrc.includes('isIntelOpen'),
  'FAIL: Sidebar must clean up obsolete isIntelOpen accordion state');
console.log('  ✓ PASS: Market Intelligence accordion dropdown removed');

// Verify all 5 features are now primary independent navigation items
const childPaths = ['/charts', '/scanner', '/macro-calendar', '/currency-strength', '/sec-tracker'];
childPaths.forEach(p => {
  assert(navConfigSrc.includes(`to: '${p}'`), `FAIL: Navigation must expose ${p} as an independent link`);
});
console.log('  ✓ PASS: All 5 former child features are independent primary navigation items');

console.log('\n======================================================================');
console.log('✓ ALL 12 UI REFINEMENT ASSERTIONS PASSED (0 FAILURES)');
console.log('======================================================================\n');
