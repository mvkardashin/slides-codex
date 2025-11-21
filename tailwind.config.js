/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#0f172a',
        fog: '#f5f7fb',
        sand: '#f1ece4',
        neon: '#0ff2ff',
      },
      fontFamily: {
        grotesk: ['\"Space Grotesk\"', 'sans-serif'],
        display: ['\"Playfair Display\"', 'serif'],
        inter: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px rgba(15,23,42,0.12)',
      },
    },
  },
  plugins: [],
}
