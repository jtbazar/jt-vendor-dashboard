import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#243B2A',
          950: '#121D16',
          900: '#17241B',
          800: '#1D2C21',
          700: '#243B2A',
          600: '#2E4A35',
          500: '#3C5C44',
        },
        cream: {
          DEFAULT: '#F7F3E9',
          50: '#FCFBF7',
          100: '#F6F4EE',
          200: '#EFEBDF',
          300: '#E5DFCE',
        },
        sage: {
          DEFAULT: '#7D9463',
          100: '#EDF2E7',
          200: '#DDE7D1',
          300: '#C7D7B4',
          400: '#A9C08E',
          600: '#5F754B',
          700: '#4B5E3B',
        },
        clay: {
          DEFAULT: '#C0714F',
          100: '#F8E9E1',
          200: '#F0D3C5',
          600: '#A85A3B',
          700: '#8E4A30',
        },
        ink: '#1F2A22',
        muted: '#6F776D',
        line: '#E7E3D8',
        positive: '#4F7A55',
        warn: '#A9761C',
        danger: '#B4513E',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        urdu: ['Noto Sans Arabic', 'Noto Nastaliq Urdu', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 42, 34, 0.04), 0 10px 28px rgba(31, 42, 34, 0.035)',
        lift: '0 18px 44px rgba(31, 42, 34, 0.12)',
        drawer: '-24px 0 70px rgba(18, 29, 22, 0.22)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.45', transform: 'scale(.82)' },
        },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both',
        fade: 'fade .25s ease both',
        slideIn: 'slideIn .35s cubic-bezier(.2,.7,.2,1) both',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
