import type { PresenceUser } from "@nonley/types";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { AvatarStack } from "../components/avatar-stack";

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
const charlie = makeUser({ userId: "charlie", name: "Charlie" });
const diana = makeUser({ userId: "diana", name: "Diana" });
const eve = makeUser({ userId: "eve", name: "Eve" });

describe("AvatarStack", () => {
  it("renders the correct number of visible avatars", () => {
    render(<AvatarStack users={[alice, bob, charlie]} maxVisible={3} />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
    expect(screen.getByTitle("Charlie")).toBeInTheDocument();
  });

  it("shows +N overflow when users exceed maxVisible", () => {
    render(
      <AvatarStack users={[alice, bob, charlie, diana, eve]} maxVisible={3} />,
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not show overflow indicator when users <= maxVisible", () => {
    render(<AvatarStack users={[alice, bob]} maxVisible={3} />);
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it("respects custom maxVisible", () => {
    render(<AvatarStack users={[alice, bob, charlie, diana]} maxVisible={2} />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
    expect(screen.queryByTitle("Charlie")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
