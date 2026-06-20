/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#E6F2DD",
          100: "#B1D3B9",
          200: "#88BDA4",
          300: "#659287",
        },
        background: {
          DEFAULT: "#E6F2DD",
          card: "#B1D3B9",
          border: "#88BDA4",
        },
        text: {
          primary: "#659287",
          secondary: "#88BDA4",
          muted: "#B1D3B9",
        },
      },
    },
  },
  plugins: [],
};
