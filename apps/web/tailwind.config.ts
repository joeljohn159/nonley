import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nonley: {
          bg: "#0a0a14",
          surface: "#1a1a2e",
          border: "#2a2a3e",
          accent: "#818cf8",
          "accent-hover": "#6366f1",
          text: "#e0e0e0",
          "text-muted": "#888",
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
