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
        bg:       '#f4f6f9',
        surface:  '#ffffff',
        surface2: '#f8fafc',
        surface3: '#f1f5f9',
        border:   '#e2e8f0',
        border2:  '#cbd5e1',
        sidebar:  '#1a3a5c',
        'sidebar-hover': 'rgba(255,255,255,0.07)',
        'sidebar-active': 'rgba(255,255,255,0.12)',
        accent: {
          DEFAULT: '#e8620a',
          light:   '#f07020',
          dark:    '#c5520a',
          bg:      'rgba(232,98,10,0.08)',
        },
        success: { DEFAULT: '#059669', bg: 'rgba(5,150,105,0.08)'  },
        danger:  { DEFAULT: '#dc2626', bg: 'rgba(220,38,38,0.08)'  },
        info:    { DEFAULT: '#1a3a5c', bg: 'rgba(26,58,92,0.08)'   },
        warn:    { DEFAULT: '#c2410c', bg: 'rgba(194,65,12,0.08)'  },
        ink:  '#1a3a5c',
        ink2: '#374151',
        ink3: '#94a3b8',
        ink4: '#cbd5e1',
      },
      fontFamily: {
        sans:    ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '5px', md: '8px', lg: '10px', xl: '14px', '2xl': '18px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        lg: '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
