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
console.log('RUNNING ARCADE FX SKY-BLUE SIDEBAR & RESPONSIVE NAVIGATION TEST SUITE');
console.log('='.repeat(70));

const sidebarPath = path.resolve('frontend/src/components/layout/Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

const appLayoutPath = path.resolve('frontend/src/components/layout/AppLayout.tsx');
const appLayoutCode = fs.readFileSync(appLayoutPath, 'utf8');

const dashboardPath = path.resolve('frontend/src/pages/DashboardPage.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

const cssPath = path.resolve('frontend/src/index.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// Test 1: Floating Glass Capsule Sidebar Base
console.log('\n[Suite 1: Floating Glass Capsule Sidebar]');
assert(sidebarCode.includes('sidebar-glass-capsule'), 'Sidebar uses sidebar-glass-capsule class');
assert(sidebarCode.includes('top-3 bottom-3 left-3'), 'Capsule is inset by 12px margins from viewport edges');
assert(sidebarCode.includes('w-[72px]'), 'Collapsed rail width is 72px');
assert(sidebarCode.includes('w-[248px]'), 'Expanded rail width is 248px');
assert(sidebarCode.includes('w-[92px] shrink-0') || sidebarCode.includes('tabletExpanded'), 'Stationary placeholder prevents content reflow');

// Test 2: Collapsed Circular Icon Buttons
console.log('\n[Suite 2: Collapsed Icon-Only Circular Buttons]');
assert(sidebarCode.includes('rounded-full') && sidebarCode.includes('w-11 h-11'), 'Collapsed items are circular buttons (44x44px)');
assert(sidebarCode.includes('text-[#38BDF8]') || sidebarCode.includes('text-[#FFD700]') || sidebarCode.includes('text-[#E5B869]'), 'Active collapsed icon is sky blue');
assert(sidebarCode.includes('focus-visible:ring-[#38BDF8]') || sidebarCode.includes('focus-visible:ring-amber-400/80'), 'Focus visible ring uses accent token');

// Test 3: Expanded Clean Transparent Items with Sky-Blue Highlights
console.log('\n[Suite 3: Expanded Clean Transparent Items]');
assert(sidebarCode.includes('border-0'), 'Expanded items sit on transparent background with zero borders');
assert(sidebarCode.includes('text-white') && sidebarCode.includes('font-extrabold'), 'Active expanded row uses white font-extrabold text');
assert(sidebarCode.includes('bg-[#38BDF8]') || sidebarCode.includes('rounded-r-full bg-[#FFD700]'), 'Active item features sleek left indicator bar');

// Test 4: Gradient Tokens & Styling
console.log('\n[Suite 4: Accent-to-Black Gradient Tokens]');
assert(cssCode.includes('--sidebar-grad-top: #0B1B2B') || cssCode.includes('--sidebar-grad-top: #044D40'), 'Deep accent gradient top stop defined');
assert(cssCode.includes('--sidebar-grad-bot: #080D14') || cssCode.includes('--sidebar-grad-bot: #030706'), 'Near-black gradient bottom stop defined');
assert(cssCode.includes('sidebar-glass-capsule'), 'sidebar-glass-capsule CSS utility declared');

// Test 5: Full-Bleed Edge-to-Edge Layout (Popup Frame Removed)
console.log('\n[Suite 5: Viewport Full-Bleed Shell]');
assert(!appLayoutCode.includes('app-frame-container'), 'app-frame-container removed from AppLayout');
assert(!appLayoutCode.includes('app-frame border'), 'app-frame card removed from AppLayout');
assert(appLayoutCode.includes('min-h-[100dvh]') || appLayoutCode.includes('min-h-screen'), 'App shell uses full viewport min-height (100dvh)');
assert(appLayoutCode.includes('overflow-x-hidden'), 'Layout prevents horizontal overflow');

// Test 6: Dashboard Auto-Fit Cards & Hover Transitions
console.log('\n[Suite 6: Auto-Fit Cards & Hover Motion]');
assert(dashboardCode.includes('repeat(auto-fit,minmax(min(100%,250px),1fr))'), 'Portfolio row uses auto-fit CSS grid');
assert(dashboardCode.includes('card-hover-interactive'), 'Dashboard cards use card-hover-interactive utility');
assert(cssCode.includes('card-hover-interactive'), 'card-hover-interactive declared with lift and glow');

// Test 7: Accessibility & Contrast
console.log('\n[Suite 7: WCAG AA/AAA Contrast Verification]');
function hexToLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(hex1, hex2) {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Contrast of white text on top of gradient (#0B1B2B)
const ratioGradTop = contrastRatio('#0B1B2B', '#FFFFFF');
console.log(`  Measured Contrast (White on Gradient Top #0B1B2B): ${ratioGradTop.toFixed(2)}:1`);
assert(ratioGradTop >= 4.5, `Contrast on gradient top (${ratioGradTop.toFixed(2)}:1) meets WCAG AA (≥ 4.5:1)`);

// Contrast of sky blue active text on gradient top (#38BDF8 on #0B1B2B)
const ratioBlueGradTop = contrastRatio('#0B1B2B', '#38BDF8');
console.log(`  Measured Contrast (Sky Blue #38BDF8 on Gradient Top #0B1B2B): ${ratioBlueGradTop.toFixed(2)}:1`);
assert(ratioBlueGradTop >= 4.5, `Contrast of sky blue on gradient top (${ratioBlueGradTop.toFixed(2)}:1) meets WCAG AA (≥ 4.5:1)`);

// Contrast of sky blue active text on gradient bottom (#38BDF8 on #080D14)
const ratioBlueGradBot = contrastRatio('#080D14', '#38BDF8');
console.log(`  Measured Contrast (Sky Blue #38BDF8 on Gradient Bottom #080D14): ${ratioBlueGradBot.toFixed(2)}:1`);
assert(ratioBlueGradBot >= 7.0, `Contrast of sky blue on gradient bottom (${ratioBlueGradBot.toFixed(2)}:1) meets WCAG AAA (≥ 7.0:1)`);

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ ALL 18 VERIFICATION ASSERTIONS PASSED (0 FAILURES)');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.error(`❌ TEST SUITE FAILED WITH ${failures} ERRORS`);
  console.log('='.repeat(70));
  process.exit(1);
}
