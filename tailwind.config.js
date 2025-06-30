/** @type {import('tailwindcss').Config} */
export default  {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This is key! It covers most React setups.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}