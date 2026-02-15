/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        medflix: {
          dark: '#1a1a2e',
          darker: '#16162a',
          accent: '#9333ea',
          accentLight: '#a855f7',
          accentDark: '#7e22ce',
          card: '#ffffff',
          bg: '#f9fafb',
          muted: '#6b7280',
          // Primary colors for kids
          red: {
            light: '#fef2f2',
            DEFAULT: '#ef4444',
            dark: '#dc2626',
          },
          blue: {
            light: '#eff6ff',
            DEFAULT: '#3b82f6',
            dark: '#2563eb',
          },
          yellow: {
            light: '#fefce8',
            DEFAULT: '#eab308',
            dark: '#ca8a04',
          },
          purple: {
            light: '#faf5ff',
            DEFAULT: '#9333ea',
            dark: '#7e22ce',
          },
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // Ensure these utility classes are always available
    'animate-blob',
    'animate-shimmer',
    'animate-glow',
    'animate-scaleIn',
  ],
}
