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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        medflix: {
          dark: '#1a1a2e',
          darker: '#16162a',
          accent: '#00d4aa',
          accentLight: '#00e6b8',
          card: '#ffffff',
          bg: '#f5f5f5',
          muted: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
