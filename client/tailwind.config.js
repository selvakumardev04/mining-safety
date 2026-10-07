/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mine: {
          background: '#0b1321',
          panel: '#111c2e',
          panelAlt: '#17263d',
          border: '#23405c',
          accent: '#34d399',
          warning: '#fbbf24',
          danger: '#f97316',
          critical: '#ef4444',
          info: '#60a5fa',
        },
      },
      boxShadow: {
        soft: '0 10px 25px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
}

