import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: "#fafafa",
          100: "#f5f5f7",
          200: "#e5e5ea",
          300: "#d1d1d6",
          400: "#8e8e93",
          500: "#6e6e73",
          600: "#545458",
          700: "#3a3a3c",
          800: "#1d1d1f",
          900: "#111113",
        },
        blue: { 700: "#0066cc", 800: "#005bb5" },
      },
    },
  },
  plugins: [],
};
export default config;
