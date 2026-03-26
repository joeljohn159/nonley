import type { ReactionType } from "@nonley/types";
import React from "react";

const REACTIONS: Array<{ type: ReactionType; icon: string; label: string }> = [
  { type: "wave", icon: "👋", label: "Wave" },
  { type: "nod", icon: "✓", label: "Nod" },
  { type: "lightbulb", icon: "💡", label: "Interesting" },
  { type: "question", icon: "❓", label: "Confused" },
  { type: "fire", icon: "🔥", label: "Great" },
];

export interface ReactionBarProps {
  onReaction: (type: ReactionType) => void;
  disabled?: boolean;
}

export function ReactionBar({
  onReaction,
  disabled = false,
}: ReactionBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        padding: "8px 16px",
        borderTop: "1px solid var(--nonley-border, #2a2a3e)",
      }}
    >
      {REACTIONS.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onReaction(type)}
          disabled={disabled}
          title={label}
          aria-label={label}
          style={{
            flex: 1,
            padding: "6px",
            background: "none",
            border: "none",
            borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: disabled ? 0.4 : 1,
            transition: "background 150ms ease",
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
