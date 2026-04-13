/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        sidebar: '#111111',
        page: '#f9fafb',
      },
    },
  },
  plugins: [],
}
