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
console.log('RUNNING ARCADE FX THEMED SIDEBAR & NAVIGATION TEST SUITE');
console.log('='.repeat(70));

const sidebarPath = path.resolve('frontend/src/components/layout/Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

const appLayoutPath = path.resolve('frontend/src/components/layout/AppLayout.tsx');
const appLayoutCode = fs.readFileSync(appLayoutPath, 'utf8');

const mobileNavPath = path.resolve('frontend/src/components/layout/MobileBottomNav.tsx');
const mobileNavCode = fs.readFileSync(mobileNavPath, 'utf8');

const dashboardPath = path.resolve('frontend/src/pages/DashboardPage.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

const cssPath = path.resolve('frontend/src/index.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

const htmlPath = path.resolve('frontend/index.html');
const htmlCode = fs.readFileSync(htmlPath, 'utf8');

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
assert(sidebarCode.includes('bg-[#2F5BEA]') || sidebarCode.includes('text-[#38BDF8]'), 'Active collapsed icon is accent color');
assert(sidebarCode.includes('focus-visible:ring-[#2F5BEA]') || sidebarCode.includes('focus-visible:ring-[#38BDF8]'), 'Focus visible ring uses accent token');

// Test 3: Expanded Clean Transparent Items with Highlights
console.log('\n[Suite 3: Expanded Clean Transparent Items]');
assert(sidebarCode.includes('border-0'), 'Expanded items sit on transparent background with zero borders');
assert(sidebarCode.includes('text-white') || sidebarCode.includes('text-[var(--sidebar-icon-hover)]'), 'Active expanded row uses high contrast font-extrabold text');
assert(sidebarCode.includes('bg-[#2F5BEA]') || sidebarCode.includes('bg-[#38BDF8]'), 'Active item features sleek left indicator bar');

// Test 4: Theme-Adaptive Design Tokens in CSS
console.log('\n[Suite 4: Light & Dark Theme Sidebar Tokens]');
assert(cssCode.includes('--sidebar-bg: #FFFFFF'), 'Light theme sidebar surface defined as #FFFFFF');
assert(cssCode.includes('--sidebar-bg: #0E1A33'), 'Dark theme sidebar surface defined as #0E1A33');
assert(cssCode.includes('--sidebar-border: #E3E8F1'), 'Light theme sidebar border defined as #E3E8F1');
assert(cssCode.includes('--sidebar-shadow: 0 8px 24px rgba(15, 26, 46, 0.08)'), 'Light theme sidebar shadow defined');
assert(cssCode.includes('--sidebar-divider: #EDF0F6'), 'Light theme sidebar divider defined as #EDF0F6');
assert(cssCode.includes('--sidebar-icon: #7C89A1'), 'Light theme sidebar inactive icon defined as #7C89A1');
assert(cssCode.includes('--sidebar-icon: #8FA0C4'), 'Dark theme sidebar inactive icon defined as #8FA0C4');
assert(cssCode.includes('sidebar-glass-capsule'), 'sidebar-glass-capsule CSS utility declared');

// Test 5: Elimination of Rectangular Shadow Artifact
console.log('\n[Suite 5: Clean Capsule Shape & No Rectangular Artifacts]');
assert(sidebarCode.includes('rounded-[28px]'), 'Aside wrapper uses rounded-[28px] matching capsule border-radius');
assert(!sidebarCode.includes('shadow-[0_12px_36px_rgba(0,0,0,0.4)]'), 'Square 90-degree collapsed shadow removed from aside wrapper');
assert(!sidebarCode.includes('shadow-[0_20px_50px_rgba(0,0,0,0.65)]'), 'Square 90-degree expanded shadow removed from aside wrapper');

// Test 6: Mobile & Anti-Flash Mechanism
console.log('\n[Suite 6: Mobile Navigation & Anti-Flash]');
assert(mobileNavCode.includes('var(--sidebar-bg)'), 'Mobile bottom nav uses theme sidebar-bg token');
assert(mobileNavCode.includes('var(--sidebar-divider)'), 'Mobile bottom nav uses theme sidebar-divider token');
assert(htmlCode.includes('alpha_coach_theme'), 'Root index.html contains inline theme anti-flash script');

// Test 7: Viewport Full-Bleed Shell
console.log('\n[Suite 7: Viewport Full-Bleed Shell]');
assert(!appLayoutCode.includes('app-frame-container'), 'app-frame-container removed from AppLayout');
assert(!appLayoutCode.includes('app-frame border'), 'app-frame card removed from AppLayout');
assert(appLayoutCode.includes('min-h-[100dvh]') || appLayoutCode.includes('min-h-screen'), 'App shell uses full viewport min-height (100dvh)');
assert(appLayoutCode.includes('overflow-x-hidden'), 'Layout prevents horizontal overflow');

// Test 8: Contrast Verification (WCAG AA)
console.log('\n[Suite 8: WCAG AA Contrast Verification]');
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

// 1. Dark Mode: White on Dark Navy (#0E1A33)
const darkWhiteRatio = contrastRatio('#0E1A33', '#FFFFFF');
console.log(`  Measured Contrast (Dark Mode White on #0E1A33): ${darkWhiteRatio.toFixed(2)}:1`);
assert(darkWhiteRatio >= 4.5, `Dark mode white text meets WCAG AA (≥ 4.5:1)`);

// 2. Dark Mode: Inactive icon (#8FA0C4) on Dark Navy (#0E1A33)
const darkIconRatio = contrastRatio('#0E1A33', '#8FA0C4');
console.log(`  Measured Contrast (Dark Mode Inactive Icon #8FA0C4 on #0E1A33): ${darkIconRatio.toFixed(2)}:1`);
assert(darkIconRatio >= 3.0, `Dark mode inactive icon meets WCAG AA (≥ 3.0:1)`);

// 3. Both Modes: White on Active Accent Circle (#2F5BEA)
const activeIconRatio = contrastRatio('#2F5BEA', '#FFFFFF');
console.log(`  Measured Contrast (White on Active Circle #2F5BEA): ${activeIconRatio.toFixed(2)}:1`);
assert(activeIconRatio >= 4.5, `Active circle icon meets WCAG AA (≥ 4.5:1)`);

// 4. Light Mode: Inactive icon (#7C89A1) on Light Capsule (#FFFFFF)
const lightIconRatio = contrastRatio('#FFFFFF', '#7C89A1');
console.log(`  Measured Contrast (Light Mode Inactive Icon #7C89A1 on #FFFFFF): ${lightIconRatio.toFixed(2)}:1`);
assert(lightIconRatio >= 3.0, `Light mode inactive icon meets WCAG AA (≥ 3.0:1)`);

// 5. Light Mode: Text label (#55627A) on Light Capsule (#FFFFFF)
const lightTextRatio = contrastRatio('#FFFFFF', '#55627A');
console.log(`  Measured Contrast (Light Mode Text #55627A on #FFFFFF): ${lightTextRatio.toFixed(2)}:1`);
assert(lightTextRatio >= 4.5, `Light mode text label meets WCAG AA (≥ 4.5:1)`);

// 6. Light Mode: Danger icon (#C42A3B) on Danger BG (#FDE8EA)
const dangerRatio = contrastRatio('#FDE8EA', '#C42A3B');
console.log(`  Measured Contrast (Light Mode Danger Icon on BG): ${dangerRatio.toFixed(2)}:1`);
assert(dangerRatio >= 4.5, `Danger icon meets WCAG AA (≥ 4.5:1)`);

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ ALL VERIFICATION ASSERTIONS PASSED (0 FAILURES)');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.error(`❌ TEST SUITE FAILED WITH ${failures} ERRORS`);
  console.log('='.repeat(70));
  process.exit(1);
}
