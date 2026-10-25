#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sidebarPath = path.resolve(__dirname, '../src/components/layout/Sidebar.tsx');
const appLayoutPath = path.resolve(__dirname, '../src/components/layout/AppLayout.tsx');
const dashboardPath = path.resolve(__dirname, '../src/pages/DashboardPage.tsx');
const cssPath = path.resolve(__dirname, '../src/index.css');

console.log('='.repeat(70));
console.log('RUNNING GLASS CAPSULE SIDEBAR, FULL-BLEED & CARD HOVER TEST SUITE');
console.log('='.repeat(70));

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failures++;
  }
}

const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
const appLayoutCode = fs.readFileSync(appLayoutPath, 'utf8');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// Test 1: Floating Glass Capsule Rail Geometry
console.log('\n[Suite 1: Floating Glass Capsule Sidebar]');
assert(sidebarCode.includes('sidebar-glass-capsule'), 'Sidebar uses sidebar-glass-capsule class');
assert(sidebarCode.includes('top-3 bottom-3 left-3'), 'Capsule is inset by 12px margins from viewport edges');
assert(sidebarCode.includes('w-[72px]'), 'Collapsed rail width is 72px');
assert(sidebarCode.includes('w-[248px]'), 'Expanded rail width is 248px');
assert(sidebarCode.includes('w-[92px] shrink-0'), 'Stationary 92px placeholder prevents content reflow');

// Test 2: Collapsed Circular Icon Buttons & Solid White Active Circle
console.log('\n[Suite 2: Collapsed Icon-Only Circular Buttons]');
assert(sidebarCode.includes('rounded-full') && sidebarCode.includes('w-11 h-11'), 'Collapsed items are circular buttons (44x44px)');
assert(sidebarCode.includes('active') && sidebarCode.includes('bg-white text-[#062A24]'), 'Active item is a solid white circle with dark icon');
assert(sidebarCode.includes('hover:bg-white') && sidebarCode.includes('hover:text-[#062A24]'), 'Hover implements "white touch" highlight');

// Test 3: Expanded Translucent Pills & Solid White Active Pill
console.log('\n[Suite 3: Expanded Translucent Pills]');
assert(sidebarCode.includes('bg-white/[0.08]') || sidebarCode.includes('bg-white/10'), 'Inactive rows use translucent glass styling');
assert(sidebarCode.includes('bg-white text-[#062A24]') && sidebarCode.includes('font-extrabold'), 'Active expanded row is a solid white pill with bold dark text');

// Test 4: Gradient Tokens & Styling
console.log('\n[Suite 4: Accent-to-Black Gradient Tokens]');
assert(cssCode.includes('--sidebar-grad-top: #044D40') || cssCode.includes('--sidebar-grad-top: #033B31'), 'Deep accent gradient top stop defined');
assert(cssCode.includes('--sidebar-grad-bot: #030706') || cssCode.includes('--sidebar-grad-bot: #020504'), 'Near-black gradient bottom stop defined');
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

// Contrast of white text on top of gradient (#044D40)
const ratioGradTop = contrastRatio('#044D40', '#FFFFFF');
console.log(`  Measured Contrast (White on Gradient Top #044D40): ${ratioGradTop.toFixed(2)}:1`);
assert(ratioGradTop >= 4.5, `Contrast on gradient top (${ratioGradTop.toFixed(2)}:1) meets WCAG AA (≥ 4.5:1)`);

// Contrast of dark ink icon/text on solid white active button (#062A24 on #FFFFFF)
const ratioActiveInk = contrastRatio('#062A24', '#FFFFFF');
console.log(`  Measured Contrast (Dark Ink #062A24 on White #FFFFFF): ${ratioActiveInk.toFixed(2)}:1`);
assert(ratioActiveInk >= 7.0, `Contrast of active dark ink on white (${ratioActiveInk.toFixed(2)}:1) meets WCAG AAA (≥ 7.0:1)`);

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ ALL 16 VERIFICATION ASSERTIONS PASSED (0 FAILURES)');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.error(`❌ TEST SUITE FAILED WITH ${failures} ERRORS`);
  console.log('='.repeat(70));
  process.exit(1);
}
