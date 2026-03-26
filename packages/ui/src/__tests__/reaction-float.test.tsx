import type { ReactionType } from "@nonley/types";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { ReactionFloat } from "../components/reaction-float";

describe("ReactionFloat", () => {
  const reactionCases: Array<{ type: ReactionType; emoji: string }> = [
    { type: "wave", emoji: "\u{1F44B}" },
    { type: "nod", emoji: "\u2713" },
    { type: "lightbulb", emoji: "\u{1F4A1}" },
    { type: "question", emoji: "\u2753" },
    { type: "fire", emoji: "\u{1F525}" },
  ];

  for (const { type, emoji } of reactionCases) {
    it(`renders the correct emoji for "${type}" reaction`, () => {
      render(<ReactionFloat type={type} onComplete={vi.fn()} />);
      expect(screen.getByRole("status")).toHaveTextContent(emoji);
    });
  }

  it('has role="status"', () => {
    render(<ReactionFloat type="wave" onComplete={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("calls onComplete after timeout", () => {
    vi.useFakeTimers();
    const handleComplete = vi.fn();

    render(<ReactionFloat type="fire" onComplete={handleComplete} />);

    expect(handleComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(handleComplete).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
