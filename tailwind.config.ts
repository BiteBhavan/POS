import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sonar dark palette — warm, professional
        bg:       '#111009',
        surface:  '#181610',
        surface2: '#1f1d14',
        surface3: '#27241a',
        border:   '#302d22',
        border2:  '#3a3628',
        // Accent — warm amber, refined
        accent: {
          DEFAULT: '#b8832a',
          light:   '#c99440',
          bg:      'rgba(184,131,42,0.07)',
        },
        // Semantic
        success: { DEFAULT: '#3d8a5e', bg: 'rgba(61,138,94,0.09)' },
        danger:  { DEFAULT: '#a04845', bg: 'rgba(160,72,69,0.09)'  },
        info:    { DEFAULT: '#3d6e8f', bg: 'rgba(61,110,143,0.09)' },
        warn:    { DEFAULT: '#9e7e2e', bg: 'rgba(158,126,46,0.09)' },
        // Text
        ink:  '#e8e2d6',
        ink2: '#8a8070',
        ink3: '#565040',
        ink4: '#353028',
      },
      fontFamily: {
        sans:    ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm:  '6px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl': '24px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
