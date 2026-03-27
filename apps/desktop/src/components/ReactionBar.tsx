/**
 * Reaction bar: a row of reaction buttons for sending reactions
 * to users in the current presence room.
 */

import type { ReactionType } from "@nonley/types";

interface ReactionBarProps {
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const reactions: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: "wave", emoji: "👋", label: "Wave" },
  { type: "nod", emoji: "🤝", label: "Nod" },
  { type: "lightbulb", emoji: "💡", label: "Lightbulb" },
  { type: "question", emoji: "❓", label: "Question" },
  { type: "fire", emoji: "🔥", label: "Fire" },
];

function ReactionBar({ onReact, disabled = false }: ReactionBarProps) {
  return (
    <div className="border-nonley-border bg-nonley-surface flex items-center justify-center gap-1 rounded-lg border p-1.5">
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => onReact(reaction.type)}
          disabled={disabled}
          className="hover:bg-nonley-surface-elevated flex h-8 w-8 items-center justify-center rounded-md text-base transition-all hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          title={reaction.label}
          aria-label={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactionBar;
