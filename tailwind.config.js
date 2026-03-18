/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        revolute: '#0075EB',
        accent: '#00C853',
        accentGold: '#FFB74D'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        'revolute': '1.25rem',
        'revolute-lg': '1.5rem',
        'revolute-xl': '1.75rem'
      }
    }
  },
  plugins: []
};

