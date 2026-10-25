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
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#673de6', // Hostinger Primary Purple
          600: '#5530c4', // Hover
          700: '#4827af', // Active
          800: '#3c1e95',
          900: '#2e1477',
          950: '#170845'
        },
        hostinger: {
          purple: '#673de6',
          purpleHover: '#5530c4',
          purpleActive: '#4827af',
          darkBg: '#09090b',
          darkCard: '#121217',
          darkCardHover: '#181820',
          darkElevated: '#1f1f2a',
          coral: '#fc5a5a',
          green: '#00b090',
        },
        trade: {
          win: '#00b090',      // Hostinger vibrant green (Profit / Bullish)
          loss: '#fc5a5a',     // Hostinger vibrant coral-red (Loss / Bearish)
          breakeven: '#71717a',
          gold: '#eab308',
          blue: '#673de6',
          purple: '#8b5cf6',
          cyan: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        '2xl': '1.25rem', // 20px
        '3xl': '1.5rem',  // 24px (Hostinger feature card radius)
        '4xl': '2rem'
      },
      boxShadow: {
        'framer': 'var(--card-shadow)',
        'framer-hover': 'var(--card-shadow-hover)',
        'hostinger': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'hostinger-glow': '0 12px 40px -8px rgba(103, 61, 230, 0.28)',
        'glow-purple': '0 0 24px -4px rgba(103, 61, 230, 0.35)',
        'glow-green': '0 0 24px -4px rgba(0, 176, 144, 0.35)'
      }
    },
  },
  plugins: [],
}
