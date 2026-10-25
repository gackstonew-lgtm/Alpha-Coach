# Arcade Fx UX/UI Evolution Plan
**Discipline, Clarity, and Modern Institutional Trading Interaction Model**

---

## Executive Summary & Design Principles

This document establishes the architecture for the UI/UX overhaul of **Arcade Fx** across all viewports (mobile, tablet, desktop, ultrawide) and themes (light and dark).

### Core Principles
1. **One Primary Action Per Screen**: Exactly one visually dominant call-to-action per screen/view styled in Sky Blue. All other actions are secondary (outlined or black-strong) or tertiary (ghost text/icon).
2. **Skeleton of the Final Layout**: Skeletons match the dimensions, layout grid, and aspect ratios of the final loaded UI to guarantee zero layout shift (CLS < 0.05). Generic circular spinners are eliminated for page loads.
3. **Bottom Sheet with a Grabber**: All task flows (create/edit, filters, symbol pickers, confirmations, settings) rise as bottom sheets with a grabber handle (`36x4px`), drag-to-resize, snap points (`peek`, `half`, `full`), velocity-aware dismiss, and responsive side/center modal behavior on desktop (`>=1024px`).
4. **Bento Grid Layout**: Dashboard and analytical screens adopt modular, responsive bento grids (1 col on mobile, 2 on tablet, 4 on desktop, 6 on wide) with proportional tile sizing.
5. **Strict Accent Color Hierarchy**:
   - **Sky Blue** (Primary Accent): Single primary action, active nav/tabs, links, focus rings.
   - **Red** (Supporting Accent): Destructive confirmations, risk alerts, error banners, notification pips.
   - **Black** (Supporting Accent): High-contrast structure, tooltips, solid secondary badges, canvas floor in dark mode.
   - **10-Step Neutral Grey Ink Scale**: Everything else (surfaces, borders, text, non-accent icons).
6. **Slide to Drill In, Rise for Tasks**: Navigating deeper into content slides horizontally from right (`250-300ms ease-out`); performing a task rises vertically as a bottom sheet.

---

## 1. Screen-by-Screen Interaction Specification

| Screen & Route | Purpose | Single Primary Action (Sky Blue) | Demoted Secondary/Tertiary Actions | Current Loading $\to$ Layout-Exact Skeleton | Tasks Converted to Bottom Sheets (Rise) | Drill-in Relationships (Slide In) | Bento Layout Configuration |
|---|---|---|---|---|---|---|---|
| **Dashboard** (`/dashboard`) | Executive performance cockpit, equity curve, risk monitor, recent activity | **Sync MT5 Data** (or **Connect Bridge** if unpaired) | View mode toggles (Cumulative/Equity), Date picker, "View All" journal link | Blank screen $\to$ 4-card metric skeleton + chart canvas skeleton + risk/trades bento skeleton | Quick Date Filter sheet, Account Switcher sheet | • Card $\to$ Performance Page<br>• Equity Chart $\to$ Full Charts<br>• Trade row $\to$ Trade Detail | **4-tier Bento Grid**:<br>• Hero: Equity/Balance (2x1)<br>• Chart: Curve (4x2)<br>• Risk: Limits (1x2)<br>• Activity: Trades (3x2) |
| **Journal** (`/journal`) | Reconstructed trade ledger, post-trade review, tagging, execution analysis | **Log Manual Trade** | Win/Loss filter pills, Search input, Date range, CSV Export | Spinner $\to$ Summary stat bar skeleton + 10-row tabular skeleton with column placeholders | • Log Trade sheet<br>• Filter & Date sheet<br>• Bulk Edit sheet<br>• Export sheet | • Trade row $\to$ Trade Detail View (Slide-in right master-detail) | Full-width ledger with top KPI bento strip (Total Trades, Net P&L, Win Rate, Profit Factor) |
| **Charts** (`/charts`) | Professional TradingView lightweight candlestick charting workspace | **Select Symbol** | Timeframe pills (1m, 5m, 15m, 1h, 4h, 1D), Chart type (Candles, Line, Area), Indicators toggle | Spinner $\to$ OHLC header skeleton + candlestick chart viewport placeholder | • Symbol Search sheet<br>• Indicators sheet<br>• Timeframe picker sheet | • Trade marker on chart $\to$ Trade Review slide-in | Top chart viewport (4x3), bottom execution order log tile (4x1) |
| **Market Scanner** (`/scanner`) | Multi-pair technical scanning (FVG, Order Blocks, Liquidity Sweeps) | **Scan Markets** | Timeframe filter, Session selector, Pair group tabs | Spinner $\to$ 8-tile scanner card grid skeleton | • Scanner Filters sheet (timeframe, setup type, min confluence) | • Scan result tile $\to$ `/charts?symbol=...` (Slide in) | 2x4 responsive bento grid of monitored Forex pairs |
| **Macro & Calendar** (`/macro-calendar`) | High-impact macroeconomic releases and central bank schedule | **Filter High-Impact** | Currency pills, Impact level filter, Previous/Next week navigation | Spinner $\to$ Calendar day grouped event rows skeleton | • Event Filter sheet (currencies, volatility, country) | • Event row $\to$ Historical Impact slide-in | Day-by-day card stack with impact indicator chips |
| **Currency Strength** (`/currency-strength`) | Real-time relative currency basket strength meter | **Refresh Matrix** | Timeframe toggle (15m, 1h, 4h, 1D), Raw vs Normalized view | Spinner $\to$ 8-currency gauge bars skeleton | • Base Currency selection sheet | • Currency card $\to$ Correlated Pairs list (Slide in) | 8-element symmetrical bento strength meter |
| **SEC & Politician Tracker** (`/sec-tracker`) | Form 4 insider transactions & congressional trading disclosures | **Search Filings** | Issuer filter, Politician party filter, Buy/Sell filter | Spinner $\to$ Insider filing row card skeletons | • Filing Filters sheet (date range, transaction volume) | • Filing row $\to$ Disclosure detail slide-in | Tabular feed with party/transaction badges |
| **Performance** (`/performance`) | Statistical trading metrics (Sharpe, Drawdown, Duration, Session analysis) | **Export Analytics** | Date filter, Metric tab selector, Account picker | Blank state $\to$ Multi-metric KPI skeleton + 3 distribution chart skeletons | • Analytics Date Range sheet<br>• Custom Metric sheet | • Metric tile $\to$ Distribution Breakdown (Slide in) | **Bento Analytics**:<br>• 4 Metric tiles (1x1)<br>• Hourly P&L (2x2)<br>• Win/Loss scatter (2x2) |
| **Risk Guardian** (`/risk-guardian`) | Drawdown monitoring, emergency lockouts, rule enforcement | **Configure Rules** | Notification toggle, Emergency pause toggle, History filter | Blank state $\to$ Gauge arc skeleton + rule card skeletons | • Edit Risk Limit sheet<br>• Emergency Lockout confirmation sheet (Red) | • Rule card $\to$ Breach incident history (Slide in) | 3-column bento: Daily loss gauge, Max Drawdown gauge, Session limits |
| **AI Coach** (`/ai-coach`) | Quantitative mentor and trading psychology companion | **Send Prompt** | Suggested prompt chips, Clear session, Voice input | Loading bubbles $\to$ Message history skeleton blocks | • Voice Transcription sheet<br>• Model parameters sheet | • Past session $\to$ Chat history slide-in | Two-pane split: Session navigation + Chat transcript canvas |
| **MT5 Bridge & Accounts** (`/bridge`) | Zero-lag desktop bridge pairing and broker deal ingestion | **Connect MT5 Bridge** | Refresh deals, Revoke device, Edit broker nickname | Spinner $\to$ Bridge status card + account credential skeletons | • New Pairing Code sheet<br>• Revoke Device confirmation sheet (Red) | • Account card $\to$ Deal sync history (Slide in) | 2-column bento: Live Bridge Status + Paired Terminals |
| **Settings** (`/settings`) | User profile, security, broker accounts, notifications, theme | **Save Changes** | Disconnect account, Reset data, Export journal | Large spinner $\to$ Tabbed form section skeletons | • Add Broker Account sheet<br>• Delete Account confirm sheet (Red)<br>• Data Export sheet | • Sub-setting section $\to$ Detail drill-in (Slide in) | Card-based form bento with sticky bottom action bar |
| **Rewards & Progression** (`/rewards`) | Trader leveling, XP achievements, streaks, badges | **Claim Daily XP** | Badge filter tabs, Leaderboard toggle | Spinner $\to$ Level ring skeleton + achievement grid skeleton | • Achievement detail sheet | • Level tier $\to$ Rewards roadmap slide-in | 3x2 achievement bento grid with hero Level progress ring |
| **Landing Page** (`/`) | Public marketing, feature overview, MT5 companion showcase | **Launch Platform** (Header & Hero) | Secondary "Watch Demo", FAQ accordion toggles | Static content $\to$ Instant hydration (zero layout shift) | • Mobile Navigation sheet<br>• Video demo preview sheet | • Blog / Documentation links | Hero section $\to$ 6-tile Feature Bento Grid $\to$ Testimonials $\to$ Pricing |
| **Login** (`/login`) | User authentication | **Sign In** | "Forgot password", "Sign in with Google", "Create account" | Spinner button $\to$ Clean card skeleton | • Password Reset sheet | • Return to previous page | Centered single-column auth card |
| **Register** (`/register`) | Account registration | **Create Account** | "Already have an account? Sign In" | Spinner button $\to$ Clean card skeleton | • Terms of Service sheet | • Transition to onboarding | Centered single-column auth card |
| **Pair Device** (`/pair`) | MT5 Companion Bridge session authorization | **Authorize Device** | "Deny Request" (secondary outlined), "Back to Dashboard" | Full-page spinner $\to$ Device verification card skeleton | • Network retry sheet (if offline) | • Transition to success | Centered terminal authorization card |

---

## 2. Color System: Tokens, Strict Roles, and Palette Mapping

### 2.1 The 10-Step Neutral Grey Ink Scale
Surfaces, borders, typography, and structure use a neutral slate/zinc ink scale calibrated for clean contrast:

| Token Name | Light Theme Value | Dark Theme Value | Primary Role |
|---|---|---|---|
| `--ink-50` | `#F8FAFC` (Canvas floor) | `#060709` (Obsidian canvas floor) | Main page background |
| `--ink-100` | `#F1F5F9` (Subtle surface) | `#0E1015` (Card base surface) | Card backgrounds, bento tile base |
| `--ink-200` | `#E2E8F0` (Border subtle) | `#171922` (Card elevated surface) | Hovered cards, modal backgrounds |
| `--ink-300` | `#CBD5E1` (Border strong) | `#232634` (Border subtle) | Default card & tile borders |
| `--ink-400` | `#94A3B8` (Icon neutral) | `#34384B` (Border strong) | Emphasized dividers, table headers |
| `--ink-500` | `#64748B` (Muted caption) | `#5D637D` (Subtle text) | Disabled text, micro labels |
| `--ink-600` | `#475569` (Secondary text) | `#8E95AF` (Muted text) | Captions, metadata, secondary icons |
| `--ink-700` | `#334155` (Body text) | `#BAC0D4` (Secondary text) | Body paragraphs, input labels |
| `--ink-800` | `#1E293B` (Strong text) | `#E2E5F0` (Primary text) | Section titles, subheadings |
| `--ink-900` | `#0F172A` (Heading text) | `#FFFFFF` (Pure white text) | Main headers, key figures, values |

### 2.2 Accent Palette Definition

#### **Sky Blue (Primary Accent)**
*Replaces Hostinger purple (`#673de6`) everywhere across the platform.*
- **Light Theme**:
  - Base: `#0284C7` (Sky-600) — WCAG AA contrast ratio 4.7:1 with white text
  - Hover: `#0369A1` (Sky-700)
  - Active: `#075985` (Sky-800)
  - Subtle Surface: `#E0F2FE` (Sky-100)
  - Focus Ring: `rgba(2, 132, 199, 0.4)`
- **Dark Theme**:
  - Base: `#38BDF8` (Sky-400) — WCAG AA contrast ratio 11.2:1 with near-black `#060709` text
  - Hover: `#7DD3FC` (Sky-300)
  - Active: `#BAE6FD` (Sky-200)
  - Subtle Surface: `rgba(56, 189, 248, 0.12)`
  - Focus Ring: `rgba(56, 189, 248, 0.45)`

#### **Red (Supporting Accent)**
*Restricted strictly to destructive confirmations, risk breaches, and error states.*
- **Light Theme**: Base `#DC2626` (Red-600), Hover `#B91C1C`, Subtle `rgba(220, 38, 38, 0.08)`
- **Dark Theme**: Base `#F87171` (Red-400), Hover `#EF4444`, Subtle `rgba(248, 113, 113, 0.14)`

#### **Black (Supporting Accent)**
*Structure, high-contrast badges, dark-theme canvas floor, and solid secondary emphasis.*
- **Light Theme**: Solid `#0A0A0B` (Ink black) for tooltips, solid secondary CTA, and high-contrast chips
- **Dark Theme**: `#060709` canvas floor; inverted to pure white/light grey ink on black elevated cards

### 2.3 Strict Accent Roles & Removal of Decorative Colors
- **Prohibited**: Rainbow colored cards, per-feature arbitrary badges (e.g. pink, green, orange, teal accents used purely for visual fluff), multi-color icon gradients, remaining Hostinger purple (`#673de6`, `#5530c4`).
- **PWA Manifest & Meta Tags**: Update `theme-color` to `#060709` (dark) and `#F8FAFC` (light), and align manifest background colors.

---

## 3. Documented Exceptions for User Confirmation [CONFIRM]

1. **Logo Artwork**:
   - The Arcade Fx brand logo contains metallic gold lettering with cyan/blue and red/coral candlestick wick wicks. This is a protected brand asset and will NOT be recolored.
   - In light theme, the wordmark is encased in a dark rounded container (`bg-[#06080E]`) to ensure the gold metallic gradient maintains WCAG contrast against light surfaces.
2. **Trading Data Semantics (Gain / Loss)**:
   - Green (`#00B090` / `#10B981`) and Red (`#FC5A5A` / `#EF4444`) are strictly preserved for trading data marks only (candlesticks, P&L values, winning/losing trade badges).
   - In accordance with accessibility guidelines, color is **never the sole cue**: all P&L numbers include an explicit `+` or `-` sign, and cards include directional trend arrows (`TrendingUp` / `TrendingDown`).
   - The trading loss color is matched to the Red token family (`#EF4444` / `#DC2626`). Red is never used as an accent on neutral cards so traders never mistake a neutral UI element for an account loss.
3. **Destructive Actions**:
   - Red buttons are only rendered inside Bottom Sheet confirmation flows (e.g. "Disconnect Account", "Delete Trade", "Emergency Lockout").

---

## 4. Brand Asset Inspection & Alpha Channel Findings

### Asset Inspection Report
- **Uploaded File**: `media_1792927749888_479dc27c.png`
- **Dimensions**: `1024 x 1024` pixels, RGBA mode.
- **Alpha Channel Test**: Min Alpha = 255, Max Alpha = 255. Exactly 1,048,576 pixels (100%) are fully opaque.
- **Finding**: **The uploaded image has a solid black background, not a true alpha transparent channel.**
- **Derivative Strategy**:
  1. The original uploaded file is safely backed up in `design/brand/source/arcade_fx_logo_raw_1024.png`.
  2. For the transparent wordmark and standalone candlestick mark, we will use our existing high-precision transparent PNG/WebP assets (`/brand/arcade-fx-wordmark.png`, `/brand/arcade-fx-mark.png`, `/brand/arcade-fx-badge.png`), which already have true alpha transparency (`Alpha min: 0`), clean wicks, and glow preserved with no black halo artifacts.
  3. The logo will be rendered prominently across all screens:
     - **Landing & Public**: Hero navbar and footer
     - **Auth & Pairing**: Prominent centered badge on `/login`, `/register`, `/pair`
     - **Dashboard & App**: Wordmark when sidebar is expanded, circular badge when collapsed; mobile top header
     - **Loading & Error**: Animated splash logo with zero layout shift

---

## 5. Component Architecture & Implementation Roadmap

### 5.1 `PrimaryAction` Component
```tsx
interface PrimaryActionProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  slot?: 'header' | 'bottom-dock' | 'inline';
}
```
- **Desktop**: Rendered in the top right of the page header or bento hero.
- **Mobile**: Docked to the bottom safe area with backdrop blur, thumb-reachable.
- **Rule**: Exactly one rendered per view. Secondary actions rendered as outlined borders.

### 5.2 Layout-Exact Skeleton Primitives
- `SkeletonLine`, `SkeletonBlock`, `SkeletonCircle`, `SkeletonTile`, `SkeletonTable`
- Animated with a subtle neutral shimmer (`rgba(255,255,255,0.06)` on dark, `rgba(0,0,0,0.04)` on light)
- Respects `prefers-reduced-motion: reduce` (static opacity).
- Debounce gate (150ms delay) to avoid flashing on instant cached loads.

### 5.3 `BottomSheet` Component
- Built with standard React, Pointer Events, and CSS hardware acceleration (zero heavy third-party gesture dependencies).
- Features: Centered grabber pill (`36x4px`), 3 snap points (`peek`, `half`, `full`), drag down to dismiss, backdrop tap, Escape key dismissal, scrollable content isolation, `aria-modal="true"`.
- Responsive: Bottom sheet on mobile/tablet; cleanly transforms to centered modal or slide-over drawer on desktop (`>=1024px`).

### 5.4 `BentoGrid` & `BentoTile`
- CSS Grid with responsive columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6`.
- Tile variants: `1x1` (quick stat), `2x1` (metrics), `2x2` (charts/gauges), `4x2` (hero curve), `full` (tables).
- Interactive hover effects with subtle border illumination.

### 5.5 Slide-to-Drill-In Transition
- Router integration with View Transitions API and CSS slide fallback.
- `translateX(0)` with `opacity` fade. List shifts slightly left (-4%) and dims on push.
- Browser back button, swipe gesture, and breadcrumb affordance fully supported.

---

## 6. Execution Phases
1. **Phase 1**: Audit & Plan Approval (`docs/ux-plan.md`) `[CONFIRM]`
2. **Phase 2**: Color System & Token Migration (Sky Blue primary + Red/Black supporting + 10-step grey ink)
3. **Phase 3**: One Primary Action Per Screen implementation & demotion of secondary buttons
4. **Phase 4**: Layout-Exact Skeletons replacing generic spinners
5. **Phase 5**: Responsive Bento Grid Dashboard & Analytics
6. **Phase 6**: Reusable BottomSheet with Grabber replacing old dialogs
7. **Phase 7**: Slide-to-Drill-In Navigation transitions
8. **Phase 8**: Logo visibility across all screens
9. **Phase 9**: Responsive, Accessibility (WCAG AA), and Performance (CLS < 0.05) tuning
10. **Phase 10**: Full verification, automated test suites, and final delivery report
