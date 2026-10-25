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
        page: 'var(--bg-page)',
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
        accent: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          glow: 'var(--accent-glow)',
          contrast: 'var(--accent-contrast)'
        },
        // Reference Primary Accent Family (Teal-Green / Turquoise)
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#3FAE96', // Reference B Chart Line & Primary
          600: '#14B8A6',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        // Reference A Auth Tokens
        auth: {
          heading: 'var(--auth-heading)',
          input: 'var(--auth-input-bg)',
          inputText: 'var(--auth-input-text)',
          btn: 'var(--auth-btn-primary)',
          btnHover: 'var(--auth-btn-hover)',
          checkbox: 'var(--auth-checkbox)',
          link: 'var(--auth-link)',
          linkHover: 'var(--auth-link-hover)'
        },
        // Reference B Dashboard Specifics
        dash: {
          canvas: 'var(--bg-page)',
          main: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          darkCard: 'var(--dash-dark-card)',
          pillActive: 'var(--dash-dark-pill)',
          chipGreen: 'var(--chip-green-bg)',
          chipGreenText: 'var(--chip-green-text)',
          badgeRed: 'var(--badge-red)',
          line: 'var(--accent-primary)'
        },
        // Supporting Red Accent (Alerts, risk, destructive)
        danger: {
          DEFAULT: '#E5484D',
          light: '#E5484D',
          dark: '#f87171',
          hover: '#c53030',
          subtle: 'rgba(229, 72, 77, 0.12)'
        },
        // Financial Data Semantics (Reference B)
        trade: {
          win: '#22A06B',      // Reference B Positive Green
          loss: '#E5484D',     // Reference B Negative Red
          breakeven: '#8E8E93',
          gold: '#eab308'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        'xl': '0.875rem', // 14px
        '2xl': '1rem',    // 16px (Reference cards)
        '3xl': '1.5rem',  // 24px (Reference B app frame)
        '4xl': '2rem',
        'pill': '9999px'
      },
      boxShadow: {
        'framer': 'var(--card-shadow)',
        'framer-hover': 'var(--card-shadow-hover)',
        'app-frame': 'var(--frame-shadow)',
        'teal-glow': '0 0 24px -4px rgba(63, 174, 150, 0.35)',
        'auth-btn': '0 4px 14px 0 rgba(30, 216, 205, 0.35)'
      }
    },
  },
  plugins: [],
}
