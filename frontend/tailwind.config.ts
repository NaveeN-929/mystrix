import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kawaii Pastel Color Palette
        sakura: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#ffc9d5',
          300: '#ffa3b8',
          400: '#ff7a9a',
          500: '#ff5c85',
          600: '#ff2d6a',
          DEFAULT: '#ffb6c1',
        },
        lavender: {
          50: '#f8f5ff',
          100: '#f0e8ff',
          200: '#e4d5ff',
          300: '#d1b8ff',
          400: '#b994ff',
          500: '#a370ff',
          600: '#8b4cff',
          DEFAULT: '#e6e6fa',
        },
        mint: {
          50: '#f0fff9',
          100: '#ccfff0',
          200: '#99ffe1',
          300: '#66ffd2',
          400: '#33ffc3',
          500: '#00ffb4',
          600: '#00cc90',
          DEFAULT: '#b2f5ea',
        },
        peach: {
          50: '#fff8f5',
          100: '#ffede5',
          200: '#ffdacc',
          300: '#ffc7b3',
          400: '#ffb499',
          500: '#ffa180',
          600: '#ff8e66',
          DEFAULT: '#ffdab9',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7dd4fc',
          400: '#38bff8',
          500: '#0ea5e9',
          600: '#0284c7',
          DEFAULT: '#87ceeb',
        },
        cream: {
          50: '#fffefa',
          100: '#fffcf0',
          200: '#fff9e0',
          300: '#fff5cc',
          400: '#fff1b8',
          500: '#ffeda3',
          DEFAULT: '#fffdd0',
        },
        bubblegum: '#ff69b4',
        cotton: '#f8f0fc',
      },
      borderRadius: {
        'kawaii': '24px',
        'super': '32px',
      },
      boxShadow: {
        'kawaii': '0 8px 32px rgba(255, 182, 193, 0.3)',
        'kawaii-hover': '0 12px 40px rgba(255, 182, 193, 0.45)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'glow-pink': '0 0 40px rgba(255, 105, 180, 0.4)',
        'glow-lavender': '0 0 40px rgba(230, 230, 250, 0.5)',
      },
      fontFamily: {
        kawaii: ['Quicksand', 'Nunito', 'Comic Sans MS', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gradient-kawaii': 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 50%, #e0f7fa 100%)',
        'gradient-candy': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        'gradient-dream': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      },
    },
  },
  plugins: [],
}

export default config

