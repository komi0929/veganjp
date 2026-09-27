import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vegan: {
          50: '#f2f8ed',
          100: '#e1f0da',
          200: '#c5e2b8',
          300: '#9ecf8d',
          400: '#73b75f',
          500: '#549c40',
          600: '#407e30',
          700: '#346328',
          800: '#2c4f23',
          900: '#25421f',
        },
        cream: {
          50: '#FAF8F5',
          100: '#F5F0E8',
          200: '#EFE7DA',
          300: '#E5D9C4',
        },
        bark: {
          600: '#5E5245',
          700: '#463C32',
          800: '#2E2720',
          900: '#1C1713',
        },
        soil: {
          100: '#e8dcce',
          200: '#d7c5b1',
          300: '#beaa92',
          400: '#a38d74',
        },
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-jakarta)', 'Noto Sans JP', 'sans-serif'],
      },
      boxShadow: {
        'clay-sm': '0 3px 6px rgba(60, 45, 20, 0.08), inset 0 2px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(60, 45, 20, 0.1)',
        'clay-md': '0 8px 20px rgba(60, 45, 20, 0.12), inset 0 3px 3px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(60, 45, 20, 0.12)',
        'clay-lg': '0 16px 36px rgba(60, 45, 20, 0.16), inset 0 4px 4px rgba(255,255,255,0.9), inset 0 -4px 6px rgba(60, 45, 20, 0.15)',
        'polaroid': '0 10px 25px -5px rgba(40, 30, 20, 0.12), 0 8px 10px -6px rgba(40, 30, 20, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
