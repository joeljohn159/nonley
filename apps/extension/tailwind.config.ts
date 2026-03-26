import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nonley: {
          bg: "#0a0a14",
          surface: "#1a1a2e",
          border: "#2a2a3e",
          accent: "#818cf8",
          text: "#e0e0e0",
          "text-muted": "#888",
          success: "#4ade80",
        },
      },
    },
  },
  plugins: [],
};

export default config;
