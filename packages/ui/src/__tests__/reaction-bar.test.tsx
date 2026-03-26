import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { ReactionBar } from "../components/reaction-bar";

describe("ReactionBar", () => {
  it("renders 5 reaction buttons", () => {
    render(<ReactionBar onReaction={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("renders buttons with correct labels", () => {
    render(<ReactionBar onReaction={vi.fn()} />);
    expect(screen.getByLabelText("Wave")).toBeInTheDocument();
    expect(screen.getByLabelText("Nod")).toBeInTheDocument();
    expect(screen.getByLabelText("Interesting")).toBeInTheDocument();
    expect(screen.getByLabelText("Confused")).toBeInTheDocument();
    expect(screen.getByLabelText("Great")).toBeInTheDocument();
  });

  it("calls onReaction with the correct type on click", () => {
    const handleReaction = vi.fn();
    render(<ReactionBar onReaction={handleReaction} />);

    fireEvent.click(screen.getByLabelText("Wave"));
    expect(handleReaction).toHaveBeenCalledWith("wave");

    fireEvent.click(screen.getByLabelText("Nod"));
    expect(handleReaction).toHaveBeenCalledWith("nod");

    fireEvent.click(screen.getByLabelText("Interesting"));
    expect(handleReaction).toHaveBeenCalledWith("lightbulb");

    fireEvent.click(screen.getByLabelText("Confused"));
    expect(handleReaction).toHaveBeenCalledWith("question");

    fireEvent.click(screen.getByLabelText("Great"));
    expect(handleReaction).toHaveBeenCalledWith("fire");
  });

  it("disables all buttons when disabled is true", () => {
    render(<ReactionBar onReaction={vi.fn()} disabled={true} />);
    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it("does not call onReaction when disabled buttons are clicked", () => {
    const handleReaction = vi.fn();
    render(<ReactionBar onReaction={handleReaction} disabled={true} />);
    fireEvent.click(screen.getByLabelText("Wave"));
    expect(handleReaction).not.toHaveBeenCalled();
  });
});
