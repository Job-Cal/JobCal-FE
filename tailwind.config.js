/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbe6',
          100: '#fff3bf',
          200: '#ffe899',
          300: '#ffdf66',
          400: '#ffd633',
          500: '#fee500',
          600: '#e6cf00',
          700: '#c9b400',
          800: '#9e8d00',
          900: '#6f6400',
        },
      },
    },
  },
  plugins: [],
}
