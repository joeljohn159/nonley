import type { PresenceUser } from "@nonley/types";
import React from "react";

export interface PresenceBubbleProps {
  totalCount: number;
  ring1Users: PresenceUser[];
  focusMode: boolean;
  onClick: () => void;
}

export function PresenceBubble({
  totalCount,
  ring1Users,
  focusMode,
  onClick,
}: PresenceBubbleProps) {
  if (focusMode) return null;

  const hasUsers = totalCount > 0;
  const hasFriends = ring1Users.length > 0;

  return (
    <button
      onClick={onClick}
      aria-label={`${totalCount} ${totalCount === 1 ? "person" : "people"} here. Click to expand.`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "40px",
        padding: "0 12px",
        borderRadius: "20px",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        transition: "all 200ms ease",
        backgroundColor: hasUsers
          ? "var(--nonley-bg-active, #1a1a2e)"
          : "var(--nonley-bg-idle, #2a2a3e)",
        color: hasUsers
          ? "var(--nonley-text-active, #e0e0e0)"
          : "var(--nonley-text-idle, #666)",
        opacity: hasUsers ? 1 : 0.6,
        boxShadow: hasUsers
          ? "0 2px 12px rgba(0,0,0,0.3)"
          : "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: hasUsers
            ? "var(--nonley-dot-active, #4ade80)"
            : "var(--nonley-dot-idle, #666)",
          transition: "background-color 300ms ease",
        }}
      />
      {hasFriends && (
        <span style={{ display: "flex" }}>
          {ring1Users.slice(0, 3).map((user, i) => (
            <AvatarTiny key={user.userId} user={user} index={i} />
          ))}
        </span>
      )}
      <span>{totalCount}</span>
    </button>
  );
}

function AvatarTiny({ user, index }: { user: PresenceUser; index: number }) {
  return (
    <span
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "var(--nonley-avatar-bg, #3a3a5e)",
        backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
        backgroundSize: "cover",
        border: "1.5px solid var(--nonley-bg-active, #1a1a2e)",
        display: "inline-block",
        marginLeft: index > 0 ? "-4px" : "0",
      }}
      title={user.name ?? "Anonymous"}
      role="img"
      aria-label={user.name ?? "Anonymous"}
    />
  );
}
