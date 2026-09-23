/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDFBF7',
          100: '#FAF4E8',
          200: '#F4E7C5',
          300: '#EBD59B',
          400: '#E0C068',
          500: '#D4AF37', // Primary metallic gold
          600: '#B89628',
          700: '#94761C',
          800: '#735A18',
          900: '#523E11',
        },
        obsidian: {
          950: '#07090E', // Deepest background
          900: '#0D111A', // Card background
          850: '#131824', // Surface
          800: '#1C2333', // Borders & chips
          700: '#2A344B',
        },
        ivory: {
          50: '#FAFAF9',  // Light background
          100: '#FFFFFF', // Light card background
          200: '#F5F5F4', // Light surface
          300: '#E7E5E4', // Light border
        }
      },
      boxShadow: {
        'gold-sm': '0 0 15px -3px rgba(212, 175, 55, 0.15)',
        'gold-md': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 0 35px -5px rgba(212, 175, 55, 0.40)',
      }
    },
  },
  plugins: [],
}
