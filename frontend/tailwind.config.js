/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-secondary)',
          elevated: 'var(--bg-surface-elevated)',
          hover: 'var(--bg-surface-hover)'
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)'
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)'
        },
        ink: {
          50: 'var(--ink-50)',
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)'
        },
        accent: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          glow: 'var(--accent-glow)',
          contrast: 'var(--accent-contrast)'
        },
        // Sky Blue Primary Accent Family
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8', // Dark Mode Sky Primary
          500: '#0ea5e9',
          600: '#0284c7', // Light Mode Sky Primary
          700: '#0369a1', // Light Mode Sky Hover
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        // Supporting Red Accent (Alerts, risk, destructive confirmations)
        danger: {
          light: '#dc2626',
          dark: '#f87171',
          hover: '#b91c1c',
          subtle: 'var(--accent-red-subtle)'
        },
        // Strict Data Semantics Only
        trade: {
          win: '#00b090',      // Vibrant Bullish / Profit
          loss: '#dc2626',     // Aligned to Red accent token (Loss / Bearish)
          breakeven: '#64748b',
          gold: '#eab308'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        '2xl': '1.25rem', // 20px
        '3xl': '1.5rem',  // 24px
        '4xl': '2rem'
      },
      boxShadow: {
        'framer': 'var(--card-shadow)',
        'framer-hover': 'var(--card-shadow-hover)',
        'sky-glow': '0 0 24px -4px rgba(56, 189, 248, 0.35)',
        'sky-btn': '0 4px 14px 0 rgba(2, 132, 199, 0.35)'
      }
    },
  },
  plugins: [],
}
