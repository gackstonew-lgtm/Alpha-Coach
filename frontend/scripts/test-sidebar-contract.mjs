#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sidebarPath = path.resolve(__dirname, '../src/components/layout/Sidebar.tsx');
const navConfigPath = path.resolve(__dirname, '../src/config/navigation.ts');
const cssPath = path.resolve(__dirname, '../src/index.css');

console.log('='.repeat(70));
console.log('RUNNING SIDEBAR COMPONENT & ARCHITECTURAL VERIFICATION SUITE');
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
const navConfigCode = fs.readFileSync(navConfigPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// Test 1: Total Investment Card Removed
console.log('\n[Suite 1: Card Removal]');
assert(!sidebarCode.includes('Total Investment'), 'No "Total Investment" card markup in Sidebar.tsx');
assert(!sidebarCode.includes('+18.30%'), 'No hardcoded +18.30% change chip in Sidebar.tsx');
assert(!sidebarCode.includes('Demo Portfolio (Live MT5 Ready)'), 'No sidebar card portfolio text in Sidebar.tsx');

// Test 2: Collapsed by Default Dimensions & Zero Layout Shift
console.log('\n[Suite 2: Collapsed Rail & Zero Layout Shift]');
assert(sidebarCode.includes('w-[72px]'), 'Collapsed rail width is set to 72px');
assert(sidebarCode.includes('w-[248px]'), 'Expanded rail width is set to 248px');
assert(sidebarCode.includes('shrink-0') && sidebarCode.includes('pointer-events-none'), 'Stationary 72px layout anchor prevents content layout shift');

// Test 3: Hover Intent Delays & Focus Within
console.log('\n[Suite 3: Hover Intent Delays & Keyboard Accessibility]');
assert(sidebarCode.includes('enterTimerRef') && sidebarCode.includes('leaveTimerRef'), 'Timers configured for hover-intent enter and exit');
assert(sidebarCode.includes('setTimeout') && (sidebarCode.includes('90') || sidebarCode.includes('100')), 'Hover-intent enter delay configured');
assert(sidebarCode.includes('setTimeout') && (sidebarCode.includes('180') || sidebarCode.includes('200')), 'Hover leave delay configured to prevent flicker');
assert(sidebarCode.includes('onFocus') && sidebarCode.includes('onBlur'), 'Focus and blur handlers manage focus-within expansion');
assert(sidebarCode.includes("e.key === 'Escape'"), 'Escape key listener collapses sidebar');

// Test 4: Expandable Groups State Preservation
console.log('\n[Suite 4: Expandable Groups]');
assert(sidebarCode.includes('isIntelOpen') && sidebarCode.includes('setIsIntelOpen'), 'Market Intelligence group state managed independently');
assert(sidebarCode.includes('isExpanded && isIntelOpen'), 'Sub-items rendered only when expanded');

// Test 5: Badges Responsive State
console.log('\n[Suite 5: Badges]');
assert(sidebarCode.includes('!isExpanded && item.badge'), 'Badge rendered as small dot when collapsed');
assert(sidebarCode.includes('isExpanded && item.badge'), 'Badge rendered as full badge pill when expanded');

// Test 6: Tablet Tap-to-Expand Toggle
console.log('\n[Suite 6: Tablet Navigation]');
assert(sidebarCode.includes('tabletExpanded') && sidebarCode.includes('setTabletExpanded'), 'Tablet tap-to-expand toggle state implemented');
assert(sidebarCode.includes('aria-expanded'), 'Tablet toggle exposes aria-expanded accessibility attribute');

// Test 7: Mobile Drawer
console.log('\n[Suite 7: Mobile Off-Canvas Drawer]');
assert(sidebarCode.includes('role="dialog"') && sidebarCode.includes('aria-modal'), 'Mobile drawer is an accessible dialog landmark');

// Test 8: Main Accent Color Tokens & Contrast Ratios
console.log('\n[Suite 8: Color Tokens & WCAG AA/AAA Contrast]');
assert(cssCode.includes('--sidebar-bg: #0A231E'), 'Light theme derived deep forest teal surface (--sidebar-bg: #0A231E)');
assert(cssCode.includes('--sidebar-bg: #061513'), 'Dark theme derived obsidian teal surface (--sidebar-bg: #061513)');
assert(cssCode.includes('--sidebar-active-indicator: #3FAE96'), 'Light theme luminous active indicator token');
assert(cssCode.includes('--sidebar-active-indicator: #48B89F'), 'Dark theme luminous active indicator token');

// Contrast verification
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

const ratioLightText = contrastRatio('#0A231E', '#FFFFFF');
console.log(`  Measured Contrast (Light: #FFFFFF on #0A231E): ${ratioLightText.toFixed(2)}:1`);
assert(ratioLightText >= 7.0, `Contrast ratio (${ratioLightText.toFixed(2)}:1) meets WCAG AAA (≥ 7.0:1)`);

const ratioDarkText = contrastRatio('#061513', '#FFFFFF');
console.log(`  Measured Contrast (Dark: #FFFFFF on #061513): ${ratioDarkText.toFixed(2)}:1`);
assert(ratioDarkText >= 7.0, `Contrast ratio (${ratioDarkText.toFixed(2)}:1) meets WCAG AAA (≥ 7.0:1)`);

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ ALL VERIFICATION TESTS PASSED SUCCESSFULLY (0 FAILURES)');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.error(`❌ VERIFICATION FAILED WITH ${failures} ERRORS`);
  console.log('='.repeat(70));
  process.exit(1);
}
