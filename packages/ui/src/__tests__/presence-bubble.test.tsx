import type { PresenceUser } from "@nonley/types";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { PresenceBubble } from "../components/presence-bubble";

function makeUser(
  overrides: Partial<PresenceUser> & { userId: string },
): PresenceUser {
  return {
    name: "User",
    avatarUrl: "https://example.com/avatar.png",
    privacyLevel: "open",
    ring: 1,
    ...overrides,
  };
}

const alice = makeUser({ userId: "alice", name: "Alice" });
const bob = makeUser({ userId: "bob", name: "Bob" });

describe("PresenceBubble", () => {
  it("returns null when focusMode is true", () => {
    const { container } = render(
      <PresenceBubble
        totalCount={5}
        ring1Users={[alice]}
        focusMode={true}
        onClick={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders a button displaying the total count", () => {
    render(
      <PresenceBubble
        totalCount={42}
        ring1Users={[]}
        focusMode={false}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("42");
  });

  it("shows singular aria-label for 1 person", () => {
    render(
      <PresenceBubble
        totalCount={1}
        ring1Users={[]}
        focusMode={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "1 person here. Click to expand.",
    );
  });

  it("shows plural aria-label for multiple people", () => {
    render(
      <PresenceBubble
        totalCount={2}
        ring1Users={[]}
        focusMode={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "2 people here. Click to expand.",
    );
  });

  it("shows friend avatars when ring1Users are provided", () => {
    render(
      <PresenceBubble
        totalCount={3}
        ring1Users={[alice, bob]}
        focusMode={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Alice")).toBeInTheDocument();
    expect(screen.getByLabelText("Bob")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <PresenceBubble
        totalCount={1}
        ring1Users={[]}
        focusMode={false}
        onClick={handleClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
