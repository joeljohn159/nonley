import type { PresenceUser } from "@nonley/types";
import React from "react";

export interface AvatarStackProps {
  users: PresenceUser[];
  maxVisible?: number;
  size?: number;
}

export function AvatarStack({
  users,
  maxVisible = 3,
  size = 24,
}: AvatarStackProps) {
  const visible = users.slice(0, maxVisible);
  const remaining = users.length - visible.length;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((user, i) => (
        <span
          key={user.userId}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            backgroundColor: "var(--nonley-avatar-bg, #3a3a5e)",
            backgroundImage: user.avatarUrl
              ? `url(${user.avatarUrl})`
              : undefined,
            backgroundSize: "cover",
            border: "2px solid var(--nonley-bg-active, #1a1a2e)",
            marginLeft: i > 0 ? `-${size / 4}px` : "0",
            position: "relative",
            zIndex: maxVisible - i,
          }}
          title={user.name}
        />
      ))}
      {remaining > 0 && (
        <span
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            backgroundColor: "var(--nonley-avatar-bg, #3a3a5e)",
            border: "2px solid var(--nonley-bg-active, #1a1a2e)",
            marginLeft: `-${size / 4}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.4}px`,
            fontWeight: 600,
            color: "var(--nonley-text-muted, #888)",
          }}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
