/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter'],
      },
      colors: {
        primary: {
          DEFAULT: '#5488CE',
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9ff',
          300: '#a3c2ff',
          400: '#7aa3ff',
          500: '#5488CE',
          600: '#4a7bb8',
          700: '#3f6ea2',
          800: '#35618c',
          900: '#2b5476',
        },
        secondary: {
          DEFAULT: '#4746A5',
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c7c7ff',
          300: '#a3a3ff',
          400: '#7a7aff',
          500: '#4746A5',
          600: '#3f3f94',
          700: '#373783',
          800: '#2f2f72',
          900: '#272761',
        },
      },
    },
  },
  plugins: [],
}
