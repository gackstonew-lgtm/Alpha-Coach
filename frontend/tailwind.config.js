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
        // TradingView-Inspired Semantic Design System Tokens
        background: 'var(--app-background)',
        foreground: 'var(--text-primary)',
        'chart-bg': 'var(--chart-background)',
        'chart-grid': 'var(--chart-grid)',
        candle: {
          bullish: 'var(--candle-bullish)',
          bearish: 'var(--candle-bearish)'
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          inner: 'var(--card-inner)'
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)'
        },
        surface: {
          DEFAULT: 'var(--surface)',
          primary: 'var(--surface-primary)',
          subtle: 'var(--surface-subtle)',
          elevated: 'var(--surface-elevated)',
          secondary: 'var(--surface-secondary)',
          hover: 'var(--surface-hover)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          soft: 'var(--success-soft)'
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)'
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)'
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          primary: 'var(--primary)',
          hover: 'var(--primary-hover)',
          subtle: 'var(--accent-tint)',
          tint: 'var(--accent-tint)',
          border: 'var(--accent-border)',
          glow: 'var(--ring)'
        },
        profit: 'var(--candle-bullish)',
        loss: 'var(--candle-bearish)',
        live: {
          bg: 'var(--live-badge-bg)',
          text: 'var(--live-badge-text)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)'
        },
        input: 'var(--input)',
        ring: 'var(--ring)',

        // Backwards-compatible aliases for existing Arcade FX components
        page: 'var(--app-background)',
        canvas: 'var(--app-background)',
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)'
        },
        brand: {
          DEFAULT: 'var(--primary)',
          primary: 'var(--primary)',
          hover: 'var(--primary-hover)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: 'var(--primary)',
          600: 'var(--primary-hover)',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        dash: {
          canvas: 'var(--app-background)',
          main: 'var(--app-background)',
          surface: 'var(--surface)',
          darkCard: 'var(--surface-elevated)',
          pillActive: 'var(--primary)',
          chipGreen: 'var(--success-soft)',
          chipGreenText: 'var(--candle-bullish)',
          badgeRed: 'var(--candle-bearish)',
          line: 'var(--primary)'
        },
        trade: {
          profit: 'var(--candle-bullish)',
          loss: 'var(--candle-bearish)',
          win: 'var(--candle-bullish)',
          breakeven: 'var(--muted-foreground)',
          gold: '#eab308'
        },

        // Sidebar Tokens (Light & Dark Theme Matched)
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          bg: 'var(--sidebar-bg)',
          border: 'var(--sidebar-border)',
          divider: 'var(--sidebar-divider)',
          icon: 'var(--sidebar-icon)',
          'icon-hover': 'var(--sidebar-icon-hover)',
          'item-hover-bg': 'var(--sidebar-item-hover-bg)',
          text: 'var(--sidebar-text)',
          'active-bg': 'var(--sidebar-active-bg)',
          'active-icon': 'var(--sidebar-active-icon)',
          'logo-ring': 'var(--sidebar-logo-ring)',
          'danger-bg': 'var(--sidebar-danger-bg)',
          'danger-icon': 'var(--sidebar-danger-icon)',
          hover: 'var(--sidebar-item-hover-bg)',
          active: 'var(--sidebar-active-bg)',
          indicator: 'var(--sidebar-active-bg)',
          muted: 'var(--sidebar-text-muted)',
          'icon-active': 'var(--sidebar-active-icon)',
          badge: 'var(--sidebar-danger-icon)'
        },

        // Auth Artwork Specific Tokens
        auth: {
          heading: 'var(--auth-heading)',
          input: 'var(--auth-input-bg)',
          inputText: 'var(--auth-input-text)',
          btn: 'var(--auth-btn-primary)',
          btnHover: 'var(--auth-btn-hover)',
          checkbox: 'var(--auth-checkbox)',
          link: 'var(--auth-link)',
          linkHover: 'var(--auth-link-hover)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"Cascadia Mono"', 'Menlo', 'Consolas', 'monospace']
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'pill': '9999px'
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'pop': 'var(--shadow-pop)',
        'framer': 'var(--card-shadow)',
        'framer-hover': 'var(--card-shadow-hover)',
        'xs': '0 1px 2px rgba(19, 23, 34, 0.04)',
        'blue-glow': '0 0 24px -4px rgba(41, 98, 255, 0.35)'
      }
    },
  },
  plugins: [],
}
