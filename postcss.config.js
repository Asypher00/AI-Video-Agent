// postcss.config.js (NEW WAY for Tailwind CSS v4)
// import tailwindcss from '@tailwindcss/postcss'; // <-- Import the new package

// export default {
//   plugins: {
//     [tailwindcss]: {}, // <-- Use it like this
//     autoprefixer: {},
//   },
// };
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}