/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-1': '#070c15',
        'background-2': '#111621',
        'primary': '#9b7134',
        'primary-light': '#b8935c',
        'primary-dark': '#855f28',
      },
    },
  },
  plugins: [],
}
