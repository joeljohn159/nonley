import type { ReactionType } from "@nonley/types";
import React, { useEffect, useRef, useState } from "react";

const REACTION_ICONS: Record<ReactionType, string> = {
  wave: "👋",
  nod: "✓",
  lightbulb: "💡",
  question: "❓",
  fire: "🔥",
};

export interface ReactionFloatProps {
  type: ReactionType;
  onComplete: () => void;
}

export function ReactionFloat({ type, onComplete }: ReactionFloatProps) {
  const [opacity, setOpacity] = useState(1);
  const offsetRef = useRef(20 + Math.random() * 20);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setOpacity(0), 2500);
    const removeTimer = setTimeout(onComplete, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <span
      role="status"
      aria-label={`${type} reaction`}
      style={{
        position: "absolute",
        bottom: "100%",
        right: "8px",
        fontSize: "20px",
        opacity,
        transition: "opacity 500ms ease, transform 3000ms ease",
        transform: `translateY(-${offsetRef.current}px)`,
        pointerEvents: "none",
      }}
    >
      {REACTION_ICONS[type]}
    </span>
  );
}
