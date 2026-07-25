/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070a0f',
          900: '#0b0f17',
          850: '#101622',
          800: '#141c2d',
          700: '#1e293b',
          600: '#334155',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        status: {
          attended: '#10b981',
          attendedGlow: 'rgba(16, 185, 129, 0.15)',
          missed: '#f43f5e',
          missedGlow: 'rgba(244, 63, 94, 0.15)',
          holiday: '#f59e0b',
          holidayGlow: 'rgba(245, 158, 11, 0.15)',
          scheduled: '#6366f1',
          scheduledGlow: 'rgba(99, 102, 241, 0.15)',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.3)',
      }
    },
  },
  plugins: [],
};
