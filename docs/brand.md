# Arcade Fx Brand Identity & Asset Guidelines

## 1. Brand Identity Overview

- **Brand Name**: Arcade Fx
- **Wordmark Typography**: ARCADE FX (Gold metallic 3D typography with integrated neon financial candlestick wicks)
- **Primary Mark**: Vertical neon candlestick cluster (Cyan/Electric Blue Bullish & Ruby/Crimson Bearish bars)
- **Tagline**: Professional Forex Intelligence & Quantitative Trading OS
- **Tone**: Analytical, disciplined, institutional, high-expectancy quantitative decision support.

---

## 2. Logo Derivatives & Asset Registry

All production assets are generated deterministically via [`scripts/generate_arcade_fx_assets.py`](../scripts/generate_arcade_fx_assets.py) from master originals stored in `design/brand/source/`.

| Derivative | File Path | Usage Context |
| :--- | :--- | :--- |
| **Primary Wordmark** | `frontend/public/brand/arcade-fx-wordmark.png` (+ `.webp`, `@2x`, `@3x`) | Landing page header, expanded sidebar, authentication screens |
| **Candlestick Mark** | `frontend/public/brand/arcade-fx-mark.png` (+ `.webp`, `-36`, `-64`, `-128`) | Collapsed sidebar, mobile headers, compact badges |
| **Circular Badge** | `frontend/public/brand/arcade-fx-badge.png` (+ `.webp`) | Social avatars, profile cards, favicon, PWA icons |
| **Favicon** | `frontend/public/favicon.ico`, `favicon.png`, `favicon-16x16.png` | Browser tabs, bookmarks |
| **Apple Touch Icon** | `frontend/public/apple-touch-icon.png` (180x180) | iOS home screen bookmark |
| **PWA Android Icons** | `frontend/public/pwa-192x192.png`, `pwa-512x512.png` | Android PWA install prompt |
| **PWA Maskable** | `frontend/public/pwa-maskable-512x512.png` | Adaptive Android icon with 10% safe zone |
| **Open Graph Card** | `frontend/public/arcade-fx-og.png` (1200x630) | Twitter / LinkedIn / Discord link previews |

---

## 3. Theme Contrast Architecture

- **Dark Theme (`#050608` canvas)**:
  The transparent wordmark is rendered directly. Gold highlights and blue/red candle wicks provide vibrant, luminous contrast against AMOLED and dark slate surfaces.
- **Light Theme (`#ffffff` canvas)**:
  To avoid low contrast on white surfaces, `ArcadeFxLogo` wraps the wordmark in a sleek dark capsule container (`bg-[#06080e]`) with a subtle slate border, or renders the self-contained circular navy badge (`arcade-fx-badge.png`).

---

## 4. Proposed Brand Accent Palette (Sampled from Logo — Not Applied to UI)

> [!NOTE]
> Per non-negotiable preservation requirements, the app's existing theme tokens (`--bg-canvas`, `--bg-surface`, `--border-subtle`, `--accent-primary`) are **strictly preserved**.
> Below is an optional accent palette sampled from the artwork for future feature consideration (e.g., special trophy badges, VIP cards, or gold confluence highlights).

| Color Role | Hex Code | Visual Sample | Semantic Meaning in Trading |
| :--- | :--- | :--- | :--- |
| **Arcade Gold** | `#D4AF37` / `#F59E0B` | 🟡 Metallic Gold | Confluence confluences, VIP tier, master achievements |
| **Electric Cyan** | `#38BDF8` / `#0284C7` | 🔵 Neon Blue | Bullish market bias, long position executions, London overlap |
| **Ruby Neon** | `#F43F5E` / `#EF4444` | 🔴 Neon Crimson | Bearish market bias, short position executions, risk threshold |
| **Midnight Navy** | `#0B1628` | 🌌 Deep Navy Disk | Badge background, institutional dark depth |
