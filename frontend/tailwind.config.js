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
        dark: {
          bg: '#0a0d14',
          card: '#111726',
          border: '#1e293b',
          subtle: '#161f30',
          accent: '#2563eb',
          text: '#f8fafc',
          muted: '#94a3b8'
        },
        trade: {
          win: '#10b981',
          loss: '#ef4444',
          breakeven: '#64748b',
          gold: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4'
        }
      }
    },
  },
  plugins: [],
}
