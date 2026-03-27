export const colors = {
  background: "#0a0a14",
  surface: "#1a1a2e",
  surfaceElevated: "#2a2a3e",
  border: "#3a3a5e",
  primary: "#818cf8",
  primaryMuted: "#6366f1",
  accent: "#4ade80",
  text: "#e0e0e0",
  textMuted: "#888888",
  textInverse: "#0a0a14",
  danger: "#ef4444",
  warning: "#f59e0b",
  white: "#ffffff",
  transparent: "transparent",
} as const;

export type ColorName = keyof typeof colors;
