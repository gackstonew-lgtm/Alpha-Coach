# Alpha Coach / Trader's Edge — Open-Source Forex Tooling & Interactive Charting Plan

**Author**: Senior Full-Stack Quantitative Systems Engineer & Trading-Platform UX Specialist  
**Branch**: `feat/trader-tools-charting`  
**Date**: October 25, 2026  
**Status**: Proposal Pending Confirmation (`[CONFIRM]`)  

---

## 1. Executive Summary & Core Architecture

This design plan details the safe, additive integration of professional interactive charting, event-driven strategy backtesting, enhanced macroeconomic calendar intelligence, and historical data tooling into the Alpha Coach / Trader's Edge platform.

All features are designed to preserve the existing application architecture, route structure, visual design tokens (AMOLED dark / slate light themes), database schema semantics, MT5 companion daemon protocol, and strict non-financial-advice tone ("decision-support, not signals").

---

## 2. Capabilities, Libraries, Attachments & Data Sources

| Capability | Proposed Solution / Library | License & Bundle Footprint | Target Attachment in Existing App | Data Source & Precedence | Key Risks & Mitigations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Interactive Charting Engine** | **TradingView `lightweight-charts`** (v4.2.x) | **Apache-2.0**<br>~48 KB gzipped<br>(Attribution notice required) | • Primary full-screen workspace: `/charts` ("Interactive Charts" in sidebar under Market Intelligence)<br>• Modal & compact viewers: Market Scanner, Currency Strength, Macro Calendar, Strategy Lab, and Trading Journal | 1. User's MT5 bridge ticks/candles<br>2. Stored DB candles (`market_candles`)<br>3. Server-proxied free API (TwelveData / AlphaVantage / Frankfurter)<br>4. Historical CSV importer (HistData-compatible) | **Risk**: Uncontrolled re-renders or bundle bloat.<br>**Mitigation**: Code-split via `React.lazy()`, memoize series updates, batch via `requestAnimationFrame`, map colors directly to CSS variables. |
| **2. Technical Indicators** | In-house pure TS utility module (`indicatorMath.ts`) | **MIT** / Native TypeScript<br>< 6 KB gzipped | Inside `<TradingChart />` toolbar & indicator settings panel (SMA, EMA, Bollinger Bands, RSI, MACD, ATR, VWAP) | Computed client-side directly on closed OHLCV bars | **Risk**: Inconsistent formulas across platforms.<br>**Mitigation**: Standard Wilder & EMA mathematical formulations with full unit test coverage. |
| **3. Drawing Tools & Annotations** | Custom lightweight SVG/Canvas overlay synchronized via chart time/price converters | Native TypeScript<br>< 8 KB gzipped | Integrated into `<TradingChart />` toolbar (Trendline, Horizontal Line, Vertical Level, Rectangle, Fib Retracement, Text Note) | Persisted per-user and symbol in Supabase `chart_drawings` table with RLS | **Risk**: Coordinate drift on zoom/pan.<br>**Mitigation**: Subscribe to chart `subscribeVisibleTimeRangeChange` and re-project on price/time scale updates. |
| **4. Trade Overlays (Core Differentiator)** | Custom series markers & price line primitives in `lightweight-charts` | Native to engine | • Trading Journal trade detail<br>• Strategy Lab backtest review<br>• Chart workspace when "Show My Trades" is toggled | Existing `reconstructed_trades` and `raw_deals` from MT5 bridge | **Risk**: Cluttered chart with many fills.<br>**Mitigation**: Group entry/exit pairs, show R-multiple tags and holding period shaded boxes; clickable to open journal entry. |
| **5. Strategy Backtesting Engine** | In-house deterministic event-driven engine (`BacktestingService.ts`) in pure TypeScript | Native TypeScript<br>0 KB new dependencies | **Strategy Lab** (`/strategy-lab`) with visual equity curve and trade markers on chart | Stored historical candles (`market_candles`) with zero look-ahead bias | **Risk**: High CPU or server timeouts on Vercel.<br>**Mitigation**: Pure TS engine capped at 2,000 bars per run; non-blocking bar-by-bar loop; no external runtime needed. |
| **6. Macro & Calendar Enrichment** | Backend server proxy with cache (`/api/v1/intelligence/fundamentals/calendar`) | Native to existing stack | **Macro & Calendar** (`/macro-calendar`) + chart event markers | Official licensed or open public API (e.g. tradingeconomics/ECB/free calendar), strictly **NO web scraping** | **Risk**: Scraping bans or rate-limiting.<br>**Mitigation**: Strict server-side memory & DB cache with stale-while-revalidate; graceful offline degradation. |
| **7. Currency Strength Matrix** | Rate-of-change (ROC) cross-rate matrix with EMA smoothing | Native TypeScript pure function | **Currency Strength** (`/currency-strength`) | Computed from 14 major/minor pairs across selectable lookbacks (`4H`, `24H`, `7D`) | **Risk**: Missing pair data causing skewed rankings.<br>**Mitigation**: Missing-data imputation and composite confidence scoring. |
| **8. Historical Forex Data Tooling** | Offline CLI/script import utility (`scripts/import_forex_history.ts`) | Native TypeScript | Stored in `market_candles` with provider provenance tag `HISTDATA_IMPORT` | HistData.com-compatible 1-minute and tick CSV exports | **Risk**: Malformed CSV rows.<br>**Mitigation**: Strict validation: checks high >= low, timestamp ordering, and price positivity. |

---

## 3. Charting Engine Selection Justification

We evaluated the four candidate engines:
1. **TradingView `lightweight-charts` (Recommended)**:
   - **License**: Apache-2.0. Completely free for commercial and open-source use with standard attribution.
   - **Size**: ~48 KB gzipped, tree-shakable, 0 runtime dependencies.
   - **Performance**: High-speed Canvas rendering supporting 100,000+ candles with 60 FPS panning/pinching on mobile and desktop.
   - **React Integration**: Clean lifecycle handling with `createChart()`, `chart.remove()`, and ResizeObserver.
   - **Attribution Plan**: Render "Powered by TradingView Lightweight Charts™" text/link in chart bottom corner as required by Apache-2.0 license, and record in `docs/THIRD_PARTY.md`.
2. **`tradex-chart`**:
   - Less active maintenance, heavier bundle footprint (~180 KB), custom DOM structure that conflicts with Tailwind theme tokens.
3. **`dxcharts-lite` (Devexperts)**:
   - Over ~300 KB gzipped with modules; enterprise-tailored; exceeds our ~150 KB performance budget.
4. **`FCS Chart`**:
   - Tied to external FCS API and requires proprietary client keys. High risk of vendor lock-in.

**Decision**: Select **TradingView `lightweight-charts`** as the single primary charting engine.

---

## 4. Theme & Token Mapping (Zero Theme Changes)

The chart engine will dynamically map to existing CSS custom properties and Tailwind tokens:

| Element | Dark Mode Token (AMOLED Black) | Light Mode Token (Slate Clean) | CSS Variable / Token |
| :--- | :--- | :--- | :--- |
| **Chart Canvas Background** | `#0a0d12` | `#ffffff` | `var(--bg-surface)` |
| **Grid Lines (Horiz / Vert)** | `rgba(23, 29, 41, 0.6)` | `rgba(226, 232, 240, 0.6)` | `var(--border-subtle)` |
| **Scale Text (Time / Price)** | `#94a3b8` | `#64748b` | `var(--text-muted)` |
| **Crosshair Lines** | `rgba(96, 165, 250, 0.4)` | `rgba(37, 99, 235, 0.4)` | `var(--border-focus)` |
| **Bullish Candle / Bar (Up)** | `#10b981` (Emerald) | `#10b981` (Emerald) | `theme.colors.trade.win` |
| **Bearish Candle / Bar (Down)** | `#f43f5e` (Rose) | `#f43f5e` (Rose) | `theme.colors.trade.loss` |
| **Volume Up / Down** | `rgba(16, 185, 129, 0.35)` | `rgba(16, 185, 129, 0.35)` | Mapped with 35% opacity |
| **Stop Loss Overlay Line** | `#ef4444` (Dashed, width 1) | `#dc2626` (Dashed, width 1) | Red Alert Token |
| **Take Profit Overlay Line** | `#10b981` (Dashed, width 1) | `#059669` (Dashed, width 1) | Emerald Win Token |
| **Entry Price Overlay Line** | `#3b82f6` (Solid, width 1) | `#2563eb` (Solid, width 1) | Brand Blue Token |

On theme toggle (Light/Dark), the chart observer detects class changes on `<html class="dark">` and updates chart colors in-place without reloading candle data.

---

## 5. Database Schema & Supabase Migrations

To support user-created drawings and custom indicator templates with complete multi-tenant isolation, we propose the following additive migration:

```sql
-- Migration: 20261025000001_chart_drawings_and_indicators.sql

CREATE TABLE IF NOT EXISTS chart_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    drawing_type TEXT NOT NULL, -- 'trendline', 'horizontal_line', 'rectangle', 'fibonacci', 'text_note'
    coordinates JSONB NOT NULL,
    style JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drawings_user_symbol ON chart_drawings(user_id, symbol, timeframe);

-- Supabase Row Level Security (RLS)
ALTER TABLE chart_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own drawings"
    ON chart_drawings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own drawings"
    ON chart_drawings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own drawings"
    ON chart_drawings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own drawings"
    ON chart_drawings FOR DELETE
    USING (auth.uid() = user_id);
```

*(Note: Per non-negotiable rules, SQL will only be committed locally and reviewed; remote Supabase migrations will not be executed without your explicit approval).*

---

## 6. Information Architecture & Navigation Integration

1. **New Sidebar Item**:
   - Add **Interactive Charts** (`/charts`, icon: `CandlestickChart` / `LineChart` or `Activity`) directly under the **Market Intelligence** section in `Sidebar.tsx`.
   - Keeps all existing items and their exact order intact.
2. **Existing Feature Integrations**:
   - **Market Scanner** (`/scanner`): "Inspect in Chart" button opens the chart focused on the hit setup.
   - **Currency Strength** (`/currency-strength`): Clicking any pair opens the pair chart.
   - **Macro & Calendar** (`/macro-calendar`): Economic releases link to chart with vertical release markers.
   - **Strategy Lab** (`/strategy-lab`): Backtest results show simulated trades on the chart.
   - **Trading Journal** (`/journal`): Trade drawer embeds the chart with entry/exit and SL/TP overlays.
   - **Dashboard** (`/dashboard`): Compact chart widget in customizable widget grid.

---

## 7. Performance & Security Safeguards

1. **Bundle Budget**:
   - `lightweight-charts` adds ~48 KB gzipped.
   - Loaded strictly via `React.lazy()` so marketing, auth, and dashboard initial paints remain ultra-fast.
2. **PWA & Service Worker**:
   - Service worker precaching remains limited to static assets. Authenticated `/api/*` requests bypass service worker cache.
3. **No Financial Advice Disclaimer**:
   - Prominent standard risk notice displayed under charts: *"Market charts and backtest simulations are educational decision-support tools. Past performance does not guarantee future results."*
4. **Zero Web Scraping Guarantee**:
   - Strictly no scraping of ForexFactory or external web pages. All calendar and quote feeds use documented APIs or user imports.

---

## 8. Confirmation Request

Please review this design plan. Upon your confirmation (`[CONFIRM]`), we will proceed immediately with **Phase 2: Charting engine implementation**.
