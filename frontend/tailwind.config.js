/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neural: {
          dark: "#050811",
          card: "#0b1120",
          cyan: "#00f0ff",
          purple: "#9d4edd",
          green: "#00ff88",
        },
      },
    },
  },
  plugins: [],
};

