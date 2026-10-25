# Arcade Fx: Floating Glass Capsule Sidebar Design Specification

**Reference Asset**: `media_1792945043663_6db9583c.png`  
**Target Component**: `frontend/src/components/layout/Sidebar.tsx`  
**Layout Shell**: `frontend/src/components/layout/AppLayout.tsx`

---

## 1. Visual & Geometric Anatomy of Reference Design

The reference design features a floating vertical navigation "glass capsule" over a rich deep emerald-to-black canvas:

```
COLLAPSED CAPSULE (~72px)                 EXPANDED CAPSULE (~248px)
┌─────────────────────────┐               ┌───────────────────────────────────────┐
│        ╭───────╮        │               │  ╭───────╮                  ╭───╮     │
│        │ [🗲]  │ (Logo) │               │  │ [🗲]  │ Arcade Fx         │ < │     │
│        ╰───────╯        │               │  ╰───────╯                  ╰───╯     │
│                         │               │                                       │
│        ╭───────╮        │               │  ╭─────────────────────────────────╮  │
│        │  ⊞   │ (Home)  │               │  │  ⊞   Home                       │  │
│        ╰───────╯        │               │  ╰─────────────────────────────────╯  │
│        ╭───────╮        │               │  ╭─────────────────────────────────╮  │
│        │  📖   │ (Journ)│               │  │  📖   Trading Journal           │  │
│        ╰───────╯        │               │  ╰─────────────────────────────────╯  │
│        ╭───────╮        │               │  ╭─────────────────────────────────╮  │
│        │  📈   │ (Perf) │               │  │  📈   Performance               │  │
│        ╰───────╯        │               │  ╰─────────────────────────────────╯  │
│       ╔═════════╗       │               │ ╭═══════════════════════════════════╮ │
│       ║  🛡️   ║ (Active)│ ────────────► │ ║  🛡️   Risk Guardian     (Active)║ │
│       ║ [SOLID] ║       │               │ ║ [SOLID WHITE PILL / DARK INK]   ║ │
│       ╚═════════╝       │               │ ╰═══════════════════════════════════╯ │
│        ╭───────╮        │               │  ╭─────────────────────────────────╮  │
│        │  🤖   │ (Coach)│               │  │  🤖   AI Coach                  │  │
│        ╰───────╯        │               │  ╰─────────────────────────────────╯  │
│                         │               │                                       │
│   (Strong Gradient:     │               │   (Strong Gradient:                   │
│    Teal -> Near-Black)  │               │    Teal -> Near-Black)                │
└─────────────────────────┘               └───────────────────────────────────────┘
```

---

## 2. Key Design Attributes & Measurements

### 1. Capsule Container
- **Shape & Inset**: Floating capsule with large border-radius (`rounded-[28px]` to `rounded-[32px]`).
- **Edge Margin**: Inset `12px` from top, bottom, and left of the viewport (`top: 12px; bottom: 12px; left: 12px; height: calc(100dvh - 24px);`).
- **Widths**:
  - *Collapsed Rail*: `72px` wide.
  - *Expanded Rail*: `248px` wide (overlays content with zero layout shift).
- **Background Gradient**:
  - Strong vertical linear gradient starting from a deep, saturated teal/accent shade at the top (`#044D40` or `#065F46`), blending through a dark pine mid-tone (`#062A24`), to a near-black obsidian (`#030706`) across the bottom 80–90%.
  - Subtle radial glow near the top (`radial-gradient(circle at 50% 0%, rgba(63, 174, 150, 0.4), transparent 70%)`).
- **Glass Treatment**:
  - `backdrop-filter: blur(20px)` with a solid fallback.
  - 1px translucent border (`border border-white/15 dark:border-white/10`).
  - Elevated outer shadow (`shadow-[0_20px_50px_rgba(0,0,0,0.5)]`).
  - Subtle top inner highlight (`box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25)`).

### 2. Nav Items (Collapsed & Expanded)
- **Collapsed Buttons**:
  - Circular buttons (`44px` diameter, `min-h-[44px] min-w-[44px] rounded-full`).
  - Inactive: Translucent glass fill (`bg-white/[0.08]`), subtle 1px border (`border border-white/10`), luminous white icons.
  - **ACTIVE ITEM**: Solid white circle (`bg-white`), dark ink icon (`text-[#062A24]`), crisp outer glow (`shadow-[0_4px_16px_rgba(255,255,255,0.4)]`).
- **Expanded Rows**:
  - Pill rows (`min-h-[44px] px-3.5 rounded-full` or `rounded-xl`).
  - Inactive: Translucent glass fill with white icon and bold white text (`font-bold text-white/90`).
  - **ACTIVE ITEM**: Solid white pill (`bg-white`), dark ink text and dark icon (`text-[#062A24] font-black shadow-[0_4px_20px_rgba(0,0,0,0.3)]`).
- **Hover Treatment ("White Touch")**:
  - On pointer hover or keyboard focus, transitions smoothly from glass to bright white fill (`bg-white/95 text-[#062A24]`), subtle lift (`translate-y-[-2px]`), and soft white rim glow.
  - Strictly scoped to `(hover: hover) and (pointer: fine)`.
- **Notch Concave Curves (Analysis)**:
  - In the reference image, the active white pill extends to the right edge and merges into an adjacent white panel with concave corner fillets.
  - In an overlay architecture floating over varied page backgrounds (dark mode `#121214`, light mode `#F5F6F8`, charts, cards), a notch extending into non-white page backgrounds creates visual clipping. Therefore, self-contained luminous solid white pills and circles are used for robustness and responsive elegance.

### 3. Top Header Area
- *Collapsed*: Circular glass button (44px) housing the gold Arcade Fx candlestick badge mark (`/brand/arcade-fx-badge.png`).
- *Expanded*: Gold transparent Arcade Fx wordmark (`/brand/arcade-fx-wordmark.png`) on the left, with an optional circular collapse toggle on touch/tablet.

### 4. Badges
- Collapsed: Small high-visibility red dot (`w-2 h-2 rounded-full bg-[#E13A41]`) anchored at the top-right of the circular button.
- Expanded: Full pill badge (`px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E13A41] text-white`).

---

## 3. Viewport Full-Bleed & Frame Removal

1. **Popup Frame Wrappers Removed**:
   - Eliminates `.app-frame-container` with its outer padding (`lg:py-6 lg:px-8`) and grey page background (`bg-page`).
   - Eliminates `.app-frame` with its border, drop shadow, and fixed max-width (`1536px`).
2. **Edge-to-Edge Layout**:
   - `min-height: 100dvh` with `flex flex-row`.
   - The workspace canvas (`bg-canvas dark:bg-[#121214]`) extends edge-to-edge across all screens.
   - Fixed stationary placeholder (`96px`) prevents layout shift on desktop when the floating sidebar expands.
