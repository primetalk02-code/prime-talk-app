/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'sans-serif'],
        display: ['"Sora"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        soft: '0 16px 40px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms ease-out both',
      },
    },
  },
  plugins: [],
}
