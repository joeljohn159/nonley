/** Nonley design tokens. */
export const colors = {
  background: "#0a0a14",
  surface: "#1a1a2e",
  surfaceElevated: "#2a2a3e",
  border: "#3a3a5e",
  primary: "#818cf8",
  accent: "#4ade80",
  text: "#e0e0e0",
  textMuted: "#888888",
  danger: "#ef4444",
} as const;

export type NonleyColor = keyof typeof colors;
