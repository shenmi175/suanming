import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#080705",
        paper: "#F2EBDD",
        bone: "#D8C9AD",
        cinnabar: "#D5442F",
        aurora: "#2EE6A6",
        brass: "#D8A842",
        void: "#15110D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        seal: "0 0 0 1px rgba(213,68,47,.55), 0 0 32px rgba(213,68,47,.2)",
      },
    },
  },
  plugins: [],
};

export default config;
