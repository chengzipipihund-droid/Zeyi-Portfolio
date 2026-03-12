import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#ECEAE4',
          hole: '#D8D6D0',
          card: '#FDFCFA',
          surface: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'Helvetica Neue', 'sans-serif'],
        body: ['"DM Sans"', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        board: '16px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        board: 'inset 0 1px 4px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
