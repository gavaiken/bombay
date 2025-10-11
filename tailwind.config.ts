import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}', 
    './components/**/*.{ts,tsx}',
    './docs/ui/wireframes/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'var(--font-mono)', 
          'IBM Plex Mono',
          'ui-monospace', 
          'SFMono-Regular', 
          'Menlo', 
          'Monaco', 
          'Consolas', 
          'Liberation Mono', 
          'Courier New', 
          'monospace'
        ]
      },
      colors: {
        bg: 'var(--color-bg)',
        panel: 'var(--color-panel)',
        text: 'var(--color-text)',
        border: 'var(--color-border)',
        brand: {
          100: 'var(--color-brand-100)',
          300: 'var(--color-brand-300)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)'
        }
      },
      borderRadius: {
        md: 'var(--radius-md)',
        xl: 'var(--radius-xl)'
      },
      boxShadow: {
        panel: 'var(--elevation-panel)'
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)'
      }
    }
  },
  plugins: []
}

export default config