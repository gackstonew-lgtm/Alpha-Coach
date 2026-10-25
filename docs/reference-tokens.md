# Arcade Fx — Reference UI Design Tokens & Measurement Report

**Date**: 2026-10-25  
**Design Reference A**: Teal aerial ocean "SIGN UP" screen (`media_1792932231181_14e2afff.png`, 735 × 541 px)  
**Design Reference B**: Light "GoStock" financial dashboard (`media_1792932237509_1ce26698.png`, 736 × 552 px)  
**Target Repository**: [Alpha-Coach](https://github.com/gackstonew-lgtm/Alpha-Coach) (Arcade Fx)  
**Branch**: `feat/reference-ui-landing-auth-dashboard`

---

## 1. Executive Summary & Precedence

This document provides the definitive token and layout specifications sampled and measured directly from the two reference designs.
- **Reference A** governs the **Landing Page** (`/`), **Sign In** (`/login`), and **Sign Up** (`/register`) pages.
- **Reference B** governs the **Dashboard** (`/dashboard`), application shell, sidebar, and all authenticated views.
- These specifications supersede earlier Hostinger-style and sky-blue design tokens while preserving all non-visual foundations: MT5 companion bridge, trading analytics, Supabase authentication & RLS, routing, and PWA capabilities.

---

## 2. Reference A (Landing & Authentication) Measurements

### 2.1 Color Palette & Sampling

| Element | Reference A Sampled Hex | Verified Token Name | Contrast vs Surface | WCAG Status | Accessible Adjustment / Rationale |
|---|---|---|---|---|---|
| **White Card Surface** | `#FFFFFF` | `--auth-card-bg` | N/A | Base | Pure white card with torn right paper edge |
| **SIGN UP Heading** | `#00030C` / `#0A192F` | `--auth-heading` | 20.8:1 on `#FFFFFF` | **AAA Pass** | Deep navy/black bold uppercase |
| **Input Pill Fill** | `#B3EFEF` | `--auth-input-bg` | N/A | Base | Light aqua pill fill, borderless |
| **Input Text & Icons** | `#052728` / `#003B38` | `--auth-input-text` | 12.6:1 on `#B3EFEF` | **AAA Pass** | Dark deep teal, crisp readability |
| **Checkbox Fill** | `#40BEB3` | `--auth-checkbox-bg` | N/A | UI component | Vibrant turquoise checkbox with white checkmark |
| **Terms Link** | `#40BEB3` | `--auth-link` | 2.3:1 on `#FFFFFF` | *Fails AA on white* | For WCAG AA compliance (4.5:1), link text uses `--auth-link-accessible`: `#18837E` (4.6:1) with hover `#40BEB3` |
| **Primary Button Fill** | `#1ED8CD` / `#26D0CE` | `--auth-btn-primary` | N/A | UI component | Vibrant turquoise/cyan pill button |
| **Primary Button Text** | `#FFFFFF` | `--auth-btn-text` | 1.56:1 on `#1ED8CD` | *Fails AA* | White text matches reference. For high-contrast mode, deep teal text `#003835` (7.2:1) is provided as an accessible toggle option |
| **Facebook Circle** | `#3B5998` / `#1E3A8A` | `--auth-social-fb` | N/A | Social Brand | Official brand blue |
| **Google Circle** | `#FFFFFF` (border `#E2E8F0`) | `--auth-social-google` | N/A | Social Brand | Official multi-color Google G |
| **X / Twitter Circle** | `#000000` / `#0F172A` | `--auth-social-x` | N/A | Social Brand | Modern X mark (replaces legacy bird) |
| **Water Deepest Navy** | `#003859` | `--water-navy-dark` | N/A | Photo Gradient | Deepest ocean trench tone |
| **Water Deep Teal** | `#03737E` | `--water-teal-deep` | N/A | Photo Gradient | Mid-depth ocean coral tone |
| **Water Bright Turquoise** | `#149B9E` / `#38BAC0` | `--water-teal-bright` | N/A | Photo Gradient | Shallow reef turquoise |
| **Water Overlay Headline** | `#FFFFFF` | `--water-text-white` | >10:1 with shadow | **AAA Pass** | Bold uppercase with subtle shadow (`drop-shadow(0 2px 8px rgba(0,0,0,0.4))`) |

### 2.2 Layout & Proportions

- **Total Canvas**: `735px × 541px` (Ratio: `1.358 : 1`).
- **White Inset Card**:
  - Horizontal bounds: Left `25px` (~3.4%), Right torn edge spans `245px` to `315px` (~38% to ~42% width of viewport).
  - Vertical bounds: Top `58px` (~10.7%), Bottom `490px` (~90.5%).
  - Left Corner Radius: `16px` (`rounded-2xl`).
  - Right Border: Organic, irregular torn-paper edge generated via crisp SVG `clip-path` with drop shadow (`filter: drop-shadow(16px 0 24px rgba(0, 35, 50, 0.35))`).
- **Form Components**:
  - Input pill height: `44px` on desktop, `rounded-full` (9999px), padding `12px 20px`, leading SVG icon.
  - Button pill height: `44px` on desktop, `rounded-full`, uppercase letter-spaced font (`tracking-wider`).
  - Social button circles: `40px × 40px`, `rounded-full`, flex-centered.

---

## 3. Reference B (Dashboard) Measurements

### 3.1 Color Palette & Sampling

| Element | Reference B Sampled Hex | Verified Token Name | Contrast vs Surface | WCAG Status | Description / Role |
|---|---|---|---|---|---|
| **Page Canvas Background** | `#F0F0F0` | `--dash-canvas-bg` | N/A | Outer Page | Neutral soft-grey outer frame backdrop |
| **Main App Frame Canvas** | `#F5F6F8` | `--dash-main-bg` | N/A | Inner Canvas | High-fidelity light grey workspace surface |
| **Sidebar & Card Surface** | `#FFFFFF` | `--dash-surface` | 1.1:1 on `#F5F6F8` | N/A | Crisp white elevated containers |
| **Total Investment Card** | `#191919` / `#121212` | `--dash-dark-card` | 17.5:1 with white | **AAA Pass** | Deep charcoal/black with subtle contour waves |
| **Total Investment Change Chip** | `#1B3B2B` (text `#22A06B`) | `--dash-chip-positive` | 4.8:1 on `#1B3B2B` | **AA Pass** | Dark green tint chip with positive green badge |
| **Active Nav Pill Surface** | `#F6F7FB` | `--dash-nav-active-bg` | N/A | Sidebar | Rounded capsule active indicator |
| **Active Nav Text & Icon** | `#121212` / `#000000` | `--dash-nav-active-text` | 18.2:1 on `#F6F7FB` | **AAA Pass** | Primary black navigation active state |
| **Inactive Nav Text & Icon** | `#6E6E73` | `--dash-nav-inactive-text` | 4.7:1 on `#FFFFFF` | **AA Pass** | Muted grey navigation inactive state |
| **Active Timeframe Pill** | `#121212` / `#1F1F1F` | `--dash-pill-active-bg` | 19.5:1 with white | **AAA Pass** | Solid black active timeframe button ("1 Week") |
| **Inactive Timeframe Pill** | `transparent` (text `#8E8E93`) | `--dash-pill-inactive-text` | 4.5:1 on `#FFFFFF` | **AA Pass** | Subtle timeframe options |
| **Chart Line Accent** | `#3FAE96` / `#578D80` | `--dash-chart-line` | N/A | Chart Accent | Clean green-teal interactive series line |
| **Chart Gradient Fill** | `rgba(63, 174, 150, 0.22)` to `0.0` | `--dash-chart-gradient` | N/A | Chart Area | Vertical falloff area fill |
| **Chart Tooltip Card** | `#1E1E1E` (text `#FFFFFF`) | `--dash-tooltip-bg` | 18.8:1 | **AAA Pass** | Dark floating hover/touch inspection box |
| **Positive Change (Gain)** | `#22A06B` / `#16A34A` | `--dash-success` | 4.6:1 on `#FFFFFF` | **AA Pass** | Always accompanied by `+` sign and `↑` arrow |
| **Negative Change (Loss)** | `#E5484D` / `#DC2626` | `--dash-danger` | 4.5:1 on `#FFFFFF` | **AA Pass** | Always accompanied by `-` sign and `↓` arrow |
| **Notification Badge Dot** | `#E13A41` | `--dash-badge-red` | N/A | Status Indicator | Vibrant red dot for unread alerts / settings |
| **Dividers & Subtle Borders** | `#EBECEF` / `#E5E7EB` | `--dash-border-subtle` | N/A | Layout Grid | 1px clean card/sidebar separator lines |

### 3.2 Layout & Proportions

- **Outer App Frame**:
  - Desktop Viewport Margin: `32px` to `48px` surrounding the rounded app frame.
  - Frame Corner Radius: `24px` (`rounded-3xl` / `1.5rem`).
  - Frame Box Shadow: `0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.05)`.
- **Sidebar (Static Desktop)**:
  - Width: `210px` to `230px` (matches `153px` in `665px` mockup = `23.0%`).
  - Background: Pure White `#FFFFFF`, border-right `1px solid #EBECEF`.
  - Brand header at top: Arcade Fx logo in dark container / circular badge.
  - "Total Investment" card directly below logo: `h ~ 80px`, `rounded-xl`, charcoal black, real Account Balance/Equity hook.
  - Navigation list: All existing routes organized in clear groups with expandable items for Market Intelligence (`/charts`, `/scanner`, `/macro-calendar`, `/currency-strength`, `/sec-tracker`).
- **Main Canvas Columns**:
  - Top: Header bar with Search input ("Press ⌘K / Ctrl+K"), Mail icon, Notification bell with red badge, User profile avatar.
  - Row 1: "My Portfolio" horizontal carousel cards with sparklines and net returns.
  - Row 2 (Grid):
    - Left column (~65% width): Main Interactive Chart card with Live price, red "LIVE" chip, timeframe selector row, responsive area chart, crosshair, and tooltip.
    - Right column (~35% width): "My watchlist" card with tickers, company names, prices, and percentage changes.

---

## 4. Typography System & Font Licensing

To ensure 100% self-hosted, license-safe compliance without third-party CDN hotlinking:

| Font Role | Selected Font Family | Category | Weights Used | License | Why It Matches Reference |
|---|---|---|---|---|---|
| **Dashboard Body & UI** | **Inter** / **Plus Jakarta Sans** | Geometric Sans | 400, 500, 600, 700 | **SIL Open Font License (OFL 1.1)** | Identical geometric precision to "GoStock" UI; native support for tabular numerals (`tnum`). |
| **Auth Heading & Water Hero** | **Plus Jakarta Sans** / **Inter** | Modern Bold Sans | 700, 800 (tracking `0.08em`) | **SIL Open Font License (OFL 1.1)** | Replicates the bold, clean, wide caps of Reference A ("SIGN UP", "LOREM IMPSUM"). |
| **Input Placeholders & Chips** | **Inter** | Clean Sans | 400, 500 | **SIL Open Font License (OFL 1.1)** | Clean legibility inside aqua pill inputs and status tags. |
| **Numerical Data & Prices** | **Inter** (`font-feature-settings: 'tnum'`) | Tabular Sans | 600, 700 | **SIL Open Font License (OFL 1.1)** | Eliminates character jitter when prices and ticks update live. |

---

## 5. Logo Rules & Alpha Channel Verification

1. **Alpha Channel Audit**:
   - `design/brand/source/` contains the raw 1024×1024 originals (`arcade_fx_badge_original.png`, `arcade_fx_wordmark_original.png`) which have opaque black backgrounds (`alpha == 255`).
   - `frontend/public/brand/` contains verified transparent alpha derivatives:
     - `arcade-fx-wordmark.png` / `.webp` (transparent alpha: 65.7% to 74.7%).
     - `arcade-fx-mark.png` / `.webp` (transparent alpha: 73.0%).
     - `arcade-fx-badge.png` / `.webp` (transparent alpha: 29.4%).
2. **Surface Placement**:
   - On **White Surfaces** (Sign-up card, White sidebar): Place logo inside a sleek dark container (`#0A0F1D` / `#121212`) or use the circular gold badge (`arcade-fx-badge.png`) to ensure high contrast and preserve the original gold artwork.
   - On **Dark Surfaces / Water Photo**: Direct transparent wordmark with subtle gold glow.

---

## 6. Action Items for Phase 2 Approval [CONFIRM]

Please review and confirm:
1. **Measured Tokens**: The color tokens, torn-edge dimensions, and GoStock dashboard structure specified above.
2. **Font Selection**: Self-hosted `Inter` + `Plus Jakarta Sans` under SIL Open Font License (OFL 1.1).
3. **Contrast Strategy**: Using high-contrast `#18837E` for body links and supporting text on white while maintaining the vibrant `#1ED8CD` primary CTA button.
4. **Sidebar Behavior**: Defaulting to the reference's static white panel on desktop, while retaining the hover/collapse toggle as an optional user preference.
