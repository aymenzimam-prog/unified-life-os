import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0c10",
        surface: "#111318",
        surface2: "#181c23",
        surface3: "#1e2330",
        border: "#252b38",
        border2: "#2e3749",
        gold: "#f0a500",
        gold2: "#ffc93c",
        teal: "#00c9a7",
        blue: "#4f8ef7",
        red: "#ff5f6d",
        purple: "#a78bfa",
        text: "#e8eaf0",
        text2: "#9aa0b4",
        text3: "#5c6378",
      },
      borderRadius: {
        card: "16px",
        sm2: "10px",
      },
      fontFamily: {
        sans: ["Tajawal", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
