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
          50: '#f4f9f0',
          100: '#e6f2dc',
          200: '#cde6bb',
          300: '#a8d48e',
          400: '#7bbe62',
          500: '#5a9e3f',
          600: '#467d30',
          700: '#386229',
          800: '#2f4f24',
          900: '#294321',
        },
        cream: {
          50: '#FFFDF8',
          100: '#FFF9EE',
          200: '#FFF3DC',
          300: '#FFE9C2',
        },
        bark: {
          700: '#3D3229',
          800: '#2C241D',
          900: '#1E1914',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
