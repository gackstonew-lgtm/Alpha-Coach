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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a'
        },
        trade: {
          win: '#10b981',
          loss: '#f43f5e',
          breakeven: '#64748b',
          gold: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem'
      },
      boxShadow: {
        'framer': 'var(--card-shadow)',
        'framer-hover': 'var(--card-shadow-hover)',
        'glow-blue': '0 0 24px -4px rgba(59, 130, 246, 0.25)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.25)'
      }
    },
  },
  plugins: [],
}
