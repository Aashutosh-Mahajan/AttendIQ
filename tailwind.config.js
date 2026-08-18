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
        paper: {
          50: '#fdfcfb',
          100: '#faf8f5',
          150: '#f4f1ea',
          200: '#ede8dc',
          300: '#ded7c6',
          400: '#c2b8a3',
          700: '#2c2e35',
          800: '#1e2025',
          850: '#181a1e',
          900: '#121316',
          950: '#0b0c0e',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        stamp: {
          vermilion: '#c2410c',
          pine: '#15803d',
          amber: '#b45309',
          cobalt: '#1d4ed8',
          charcoal: '#18181b',
        },
        status: {
          attended: '#15803d',
          missed: '#c2410c',
          holiday: '#b45309',
          scheduled: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'paper-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'paper-md': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'paper-lg': '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'paper-inset': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'ink-glow': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
