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
        ferma: {
          dark: '#0a0d14',
          panel: '#111726',
          border: '#1e293b',
          accent: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
        },
        brand: {
          kraft: '#FAF7F2',
          kraftDark: '#EFEBE1',
          roasted: '#5C4A42',
          terracotta: '#D9735A',
          green: '#748C59',
          border: '#E6DFD3',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
