# Hostinger Design Tokens Specification

This document details the extracted and verified design tokens representing Hostinger's design language (`hostinger.com`), adapted for the **Arcade Fx** Forex Intelligence & Trading OS platform.

---

## 1. Color Palette & Semantic Tokens

### 1.1 Brand & Accent Colors
| Token Name | Hex / Value | Semantic Role & States |
| :--- | :--- | :--- |
| `--h-primary` | `#673de6` | Primary brand purple for interactive elements, CTAs, and active navigation indicators |
| `--h-primary-hover` | `#5530c4` | Hover state for primary solid buttons and clickable interactive controls |
| `--h-primary-active` | `#4827af` | Pressed / active state for buttons and links |
| `--h-primary-subtle` | `rgba(103, 61, 230, 0.12)` | Subtle purple tint for chip backgrounds, active tab pills, and focus halo |
| `--h-primary-glow` | `rgba(103, 61, 230, 0.28)` | Ambient glow behind featured pricing cards, badges, and modals |
| `--h-focus-ring` | `rgba(103, 61, 230, 0.45)` | Keyboard accessibility focus ring (`outline: 2px solid`, offset 2px) |

### 1.2 Dark Mode Surfaces (Hero Black & Rich Obsidian)
| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-canvas` | `#09090b` | Deep dark hero canvas background (near-black with neutral warmth) |
| `--bg-surface` | `#121217` | Standard dark card and sidebar container surface |
| `--bg-surface-secondary` | `#181820` | Secondary nested card panels, table row stripes, header strips |
| `--bg-surface-elevated` | `#1f1f2a` | Modals, dropdown menus, flyout popovers, tooltips |
| `--bg-surface-hover` | `#252533` | Interactive list item and card hover background |
| `--border-subtle` | `#23232f` | Card borders, dividers, table grid lines (1px solid) |
| `--border-strong` | `#323242` | Input borders, elevated dividers, button outlines |
| `--border-focus` | `#673de6` | Focused inputs and highlighted card borders |
| `--text-primary` | `#ffffff` | Headings, primary labels, price figures |
| `--text-secondary` | `#b8b8c0` | Body copy, secondary descriptions, table values |
| `--text-muted` | `#737384` | Meta timestamps, captions, helper hints |
| `--text-subtle` | `#4d4d5c` | Disabled text, decorative glyphs |

### 1.3 Light Mode Surfaces (Clean White & Crisp Dividers)
| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-canvas` | `#f9fafb` | Neutral light background |
| `--bg-surface` | `#ffffff` | Pure white cards, mobile drawer sheet, tables |
| `--bg-surface-secondary` | `#f4f4f7` | Secondary containers, pill toggle backgrounds |
| `--bg-surface-elevated` | `#ffffff` | Modals, floating dropdowns, popovers |
| `--bg-surface-hover` | `#ededf2` | Interactive hover states |
| `--border-subtle` | `#e6e6ea` | Subtle dividers, card borders (thin 1px) |
| `--border-strong` | `#d2d2dc` | Input borders, outlined buttons |
| `--border-focus` | `#673de6` | Focused inputs |
| `--text-primary` | `#111116` | Main headings and high-contrast text |
| `--text-secondary` | `#484855` | Body copy and subheadings |
| `--text-muted` | `#767687` | Helper text, breadcrumbs, icons |
| `--text-subtle` | `#a2a2b0` | Placeholder text |

### 1.4 Data Visualization & Status Semantics
| Semantic Role | Dark Hex | Light Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Success / Win / Long** | `#00b090` | `#009e80` | Profit trades, bullish candles, checklist checkmarks, verified badges |
| **Danger / Loss / Short** | `#fc5a5a` | `#e93838` | Loss trades, bearish candles, stop-out alerts, discount badges |
| **Breakeven / Neutral** | `#71717a` | `#64748b` | Neutral sentiment, flat trades, inactive indicators |
| **Information / Macro** | `#38bdf8` | `#0284c7` | Economic calendar events, news tags, info badges |
| **Warning / Caution** | `#f59e0b` | `#d97706` | Risk threshold alerts, pending sync notices |

---

## 2. Typography & Font Specifications

- **Primary Font Family**: `'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Open source (OFL licensed) geometric sans-serif matching Hostinger's production typeface.
  - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
  - Character rendering: `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`.
- **Monospace & Financial Data Font**: `'JetBrains Mono', 'SF Mono', Consolas, monospace`
  - Used for MT5 tick quotes, PIPs, order lot sizes, p/l figures, and tabular financial grids (`font-variant-numeric: tabular-nums`).

### Type Scale
| Role | Font Size | Line Height | Letter Spacing | Font Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `48px` - `64px` | `1.1` | `-0.03em` | `700` (Bold) |
| **H1 Heading** | `36px` - `44px` | `1.15` | `-0.025em` | `700` (Bold) |
| **H2 Section** | `28px` - `32px` | `1.2` | `-0.02em` | `600` (SemiBold) |
| **H3 Card Title** | `20px` - `24px` | `1.3` | `-0.015em` | `600` (SemiBold) |
| **Body (Default)** | `15px` - `16px` | `1.55` | `-0.005em` | `400` / `500` |
| **Body Small** | `13px` - `14px` | `1.45` | `0` | `400` / `500` |
| **Micro / Badge** | `11px` - `12px` | `1.3` | `+0.04em` | `700` (Uppercase) |

---

## 3. Shape, Radii & Spacing

### 3.1 Border Radius Tokens
| Token | Pixel Value | Application |
| :--- | :--- | :--- |
| `rounded-sm` | `6px` | Small badge tags, compact dropdown items |
| `rounded-md` | `8px` | Standard buttons, input fields, select menus |
| `rounded-lg` | `12px` | Secondary cards, table containers, popovers |
| `rounded-xl` | `16px` | Standard feature cards, modal dialogs |
| `rounded-2xl` | `20px` | Large dashboard panels |
| `rounded-3xl` | `24px` | Hostinger-style pricing & hero feature cards |
| `rounded-full`| `9999px` | Segmented pill toggles, discount badges, avatar rings |

### 3.2 Shadows & Elevation
- **Card Shadow (Dark)**: `0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 1px 3px 0 rgba(0, 0, 0, 0.4)`
- **Featured Card Glow (Dark)**: `0 12px 40px -8px rgba(103, 61, 230, 0.22), 0 2px 8px 0 rgba(0, 0, 0, 0.4)`
- **Card Shadow (Light)**: `0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.02)`
- **Dropdown / Flyout**: `0 10px 30px -4px rgba(0, 0, 0, 0.4)`

---

## 4. Component Styles

### 4.1 Primary Solid Button (`.hostinger-btn-primary`)
- Background: `#673de6`
- Color: `#ffffff`
- Padding: `12px 24px` (or `10px 18px` for compact)
- Border radius: `8px` (standard) / `9999px` (pill CTA)
- Font: `DM Sans`, 15px, weight 600
- Hover: `#5530c4`, slight transform `-1px`
- Active: `#4827af`
- Focus ring: `2px solid #673de6`, offset `2px`
- Loading state: Circular spinner with border `2px solid rgba(255,255,255,0.3)`, spinner head `#ffffff`.

### 4.2 Outlined Button on Dark (`.hostinger-btn-secondary`)
- Background: `transparent` (or `rgba(255, 255, 255, 0.04)`)
- Border: `1px solid rgba(255, 255, 255, 0.16)` (Dark) / `1px solid #d2d2dc` (Light)
- Color: `#ffffff` (Dark) / `#111116` (Light)
- Hover: Border `rgba(255, 255, 255, 0.35)`, background `rgba(255, 255, 255, 0.08)`

### 4.3 Segmented Pill Toggle
- Outer container: `rounded-full p-1 bg-[#181820] border border-[#272733]`
- Active tab pill: `rounded-full px-4 py-1.5 bg-[#673de6] text-white font-medium shadow-sm`
- Inactive tab: `rounded-full px-4 py-1.5 text-[#b8b8c0] hover:text-white transition`

### 4.4 Hostinger Hero / Pricing Feature Card
- Container: `rounded-3xl p-8 bg-[#121217] border border-[#272733]`
- Floating promo badge: Absolute top `-13px`, centered (`left-1/2 -translate-x-1/2`), `bg-[#fc5a5a] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md`
- Checklist rows: Green checkmark icon (`#00b090`), clean typography, subtle horizontal separator dividers (`border-b border-[#23232f]`).

### 4.5 Mobile Slide-Out Menu Sheet
- Background: Pure `#ffffff` (light mode) / `#121217` (dark mode)
- Top bar: Brand logo left + Close button (`X`) right
- Section label: Uppercase tracking-wider small text: `"PRODUCTS"`, `"INTELLIGENCE"`, `"SYSTEM"`
- Rows: Icon in soft container + item name + right chevron (`ChevronRight`), separated by thin `1px` subtle divider lines (`#e6e6ea` or `#23232f`)
- Footer: Pinned to bottom with Language Selector & Account / Sign In button.

---

## 5. Motion & Transitions

- **Default Ease**: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
- **Standard Hover**: `duration: 200ms ease-out`
- **Sidebar Hover Intent Delay**: `120ms`
- **Sidebar Expand/Collapse Duration**: `200ms ease-out`
- **Sidebar Label Stagger**: `opacity 150ms ease-out, transform 150ms ease-out`
- **Reduced Motion Support**: All transitions set to `0.01ms` when `prefers-reduced-motion: reduce` is active.
