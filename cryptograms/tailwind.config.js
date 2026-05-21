/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: 'var(--cyber-bg)',
          surface: 'var(--cyber-surface)',
          cyan: 'var(--cyber-cyan)',
          magenta: 'var(--cyber-magenta)',
          yellow: 'var(--cyber-yellow)',
          text: 'var(--cyber-text)'
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
