/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff5ff',
          100: '#dae8fe',
          200: '#b5d2fd',
          300: '#83b2fb',
          400: '#5090f7',
          500: '#2e72f4',
          600: '#1f7bf2',
          700: '#155ec8',
          800: '#1249a0',
          900: '#0d3880',
          950: '#082660',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.3s ease both',
        'fade-in':    'fadeIn 0.25s ease both',
        'pulse-ring': 'pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '70%':  { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}