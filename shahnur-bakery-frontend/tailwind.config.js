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
          50: '#FFF0F5',
          100: '#FFD6E5',
          200: '#FFB3D1',
          300: '#FF8FB8',
          400: '#F06292',
          500: '#E91E63',
          600: '#C2185B',
          700: '#AD1457',
          800: '#880E4F',
          900: '#560027',
        },
        gold: {
          50: '#FFFDF0',
          100: '#FFF9C4',
          200: '#FFF176',
          300: '#FFEB3B',
          400: '#FFD700',
          500: '#FFC107',
          600: '#FFA000',
          700: '#FF8F00',
          800: '#FF6F00',
          900: '#E65100',
        },
        cream: {
          50: '#FFFDF8',
          100: '#FFF8F0',
          200: '#FFEEDD',
          300: '#FFE4CC',
          400: '#FFD4B8',
          500: '#FFC4A3',
          600: '#FFB48F',
          700: '#FFA47A',
          800: '#FF9466',
          900: '#FF8452',
        },
        dark: {
          50: '#F5F0F5',
          100: '#E8DCE8',
          200: '#D4B8D4',
          300: '#B08BB0',
          400: '#8B6B8E',
          500: '#5C3D5E',
          600: '#4A2F4C',
          700: '#3B253D',
          800: '#2D1B2E',
          900: '#1F0F1F',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}