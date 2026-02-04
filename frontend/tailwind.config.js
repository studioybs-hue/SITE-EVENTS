/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1C1917',
          foreground: '#FAFAF9',
        },
        secondary: {
          DEFAULT: '#F5E6D3',
          foreground: '#1C1917',
        },
        accent: {
          DEFAULT: '#D4AF37',
          foreground: '#FFFFFF',
        },
        background: '#FAFAF9',
        foreground: '#1C1917',
        muted: {
          DEFAULT: '#F5F5F4',
          foreground: '#78716C',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1C1917',
        },
        border: '#E7E5E4',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}