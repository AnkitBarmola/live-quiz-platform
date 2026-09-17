/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17191c',
        gray: {
          1: '#f7f7f6',
          2: '#ededeb',
          3: '#d7d8d5',
          4: '#a9aba7',
          5: '#686b67',
          6: '#343735',
        },
        accent: '#d8ff3e',
        correct: '#197a4d',
        incorrect: '#c43d3d',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Inter', 'sans-serif'],
      },
      spacing: {
        18: '72px',
      },
      minWidth: {
        45: '180px',
      },
      borderRadius: {
        design: '10px',
      },
      boxShadow: {
        panel: '0 1px 2px rgb(23 25 28 / 8%)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'page-enter': 'page-enter 300ms standard both',
      },
    },
  },
  plugins: [],
}
