/**
 * A row displaying a user in a presence list.
 * Shows avatar, name, privacy level badge, and optional action.
 */

import type { PresenceUser, ReactionType } from "@nonley/types";

import Avatar from "./Avatar";

interface UserRowProps {
  user: PresenceUser;
  onReact?: (type: ReactionType) => void;
}

const privacyBadges: Record<string, string> = {
  open: "Open",
  circles_only: "Circles",
  anonymous: "Anon",
  ghost: "Ghost",
};

function UserRow({ user, onReact }: UserRowProps) {
  return (
    <div className="hover:bg-nonley-surface-elevated group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors">
      <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-nonley-text truncate text-sm">
            {user.privacyLevel === "anonymous" ? "Someone" : user.name}
          </span>
          <span className="bg-nonley-surface text-nonley-muted flex-shrink-0 rounded px-1 py-0.5 text-[10px]">
            {privacyBadges[user.privacyLevel] ?? user.privacyLevel}
          </span>
        </div>
      </div>
      {onReact && user.privacyLevel !== "ghost" && (
        <button
          onClick={() => onReact("wave")}
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          title="Wave"
        >
          <span className="text-sm">👋</span>
        </button>
      )}
    </div>
  );
}

export default UserRow;
