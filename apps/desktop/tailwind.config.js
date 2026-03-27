/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nonley: {
          bg: "#0a0a14",
          surface: "#1a1a2e",
          "surface-elevated": "#2a2a3e",
          border: "#3a3a5e",
          primary: "#818cf8",
          accent: "#4ade80",
          text: "#e0e0e0",
          muted: "#888888",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
