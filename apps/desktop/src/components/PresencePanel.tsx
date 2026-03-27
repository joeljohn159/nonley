/**
 * Main presence view.
 * Shows the current detected app, Ring 1/2/3 presence,
 * reactions, and the reaction bar.
 */

import type { ReactionType } from "@nonley/types";
import { useEffect, useRef, useCallback } from "react";

import { useAppDetectionStore } from "../stores/app-detection";
import { usePresenceStore } from "../stores/presence";

import ActiveApp from "./ActiveApp";
import ReactionBar from "./ReactionBar";
import UserRow from "./UserRow";

interface PresencePanelProps {
  joinRoom: (roomHash: string, urlHash: string) => void;
  leaveRoom: () => void;
  sendReaction: (type: ReactionType, toUserId: string) => void;
}

function PresencePanel({
  joinRoom,
  leaveRoom,
  sendReaction,
}: PresencePanelProps) {
  const roomHash = useAppDetectionStore((s) => s.roomHash);
  const activeApp = useAppDetectionStore((s) => s.activeApp);
  const room = usePresenceStore((s) => s.room);
  const reactions = usePresenceStore((s) => s.reactions);
  const connected = usePresenceStore((s) => s.connected);
  const prevRoomHashRef = useRef<string | null>(null);

  // Join/leave rooms when the detected app changes
  useEffect(() => {
    if (!connected) return;

    const prevHash = prevRoomHashRef.current;

    if (prevHash && prevHash !== roomHash) {
      leaveRoom();
    }

    if (roomHash && roomHash !== prevHash) {
      joinRoom(roomHash, roomHash);
    }

    prevRoomHashRef.current = roomHash;
  }, [roomHash, connected, joinRoom, leaveRoom]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const handleReaction = useCallback(
    (type: ReactionType) => {
      // Send reaction to first visible user if any
      const ring1Users = room?.ring1 ?? [];
      const target = ring1Users.find((u) => u.privacyLevel !== "ghost");
      if (target) {
        sendReaction(type, target.userId);
      }
    },
    [room, sendReaction],
  );

  const handleReactToUser = useCallback(
    (userId: string) => (type: ReactionType) => {
      sendReaction(type, userId);
    },
    [sendReaction],
  );

  const ring1 = room?.ring1 ?? [];
  const ring2 = room?.ring2 ?? [];
  const ring3Count = room?.ring3Count ?? 0;
  const hasPresence = ring1.length > 0 || ring2.length > 0 || ring3Count > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Active app display */}
      <div className="p-3">
        <ActiveApp />
      </div>

      {/* Presence list */}
      <div className="flex-1 overflow-y-auto px-3">
        {!activeApp && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-nonley-muted text-sm">
              Open an application to see who else is using it.
            </p>
          </div>
        )}

        {activeApp && !hasPresence && connected && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-nonley-muted mb-1 text-sm">
              No one else is here right now.
            </p>
            <p className="text-nonley-muted text-xs">
              You&apos;re the first one using {activeApp}!
            </p>
          </div>
        )}

        {activeApp && !connected && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="border-nonley-primary mb-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-nonley-muted text-sm">Connecting...</p>
          </div>
        )}

        {/* Ring 1: Close presence */}
        {ring1.length > 0 && (
          <div className="mb-3">
            <h3 className="text-nonley-muted mb-1 px-2 text-[10px] font-medium uppercase tracking-wider">
              Nearby ({ring1.length})
            </h3>
            <div className="space-y-0.5">
              {ring1.map((user) => (
                <UserRow
                  key={user.userId}
                  user={user}
                  onReact={handleReactToUser(user.userId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ring 2: Extended presence */}
        {ring2.length > 0 && (
          <div className="mb-3">
            <h3 className="text-nonley-muted mb-1 px-2 text-[10px] font-medium uppercase tracking-wider">
              In the room ({ring2.length})
            </h3>
            <div className="space-y-0.5">
              {ring2.map((user) => (
                <UserRow
                  key={user.userId}
                  user={user}
                  onReact={handleReactToUser(user.userId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ring 3: Anonymous count */}
        {ring3Count > 0 && (
          <div className="mb-3 px-2">
            <p className="text-nonley-muted text-xs">
              +{ring3Count} {ring3Count === 1 ? "other" : "others"} nearby
            </p>
          </div>
        )}

        {/* Floating reactions */}
        {reactions.length > 0 && (
          <div className="pointer-events-none fixed right-4 top-20">
            {reactions.map((reaction, index) => (
              <div
                key={`${reaction.fromUserId}-${reaction.timestamp}-${index}`}
                className="animate-bounce text-lg"
              >
                {reaction.type === "wave" && "👋"}
                {reaction.type === "nod" && "🤝"}
                {reaction.type === "lightbulb" && "💡"}
                {reaction.type === "question" && "❓"}
                {reaction.type === "fire" && "🔥"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reaction bar */}
      <div className="border-nonley-border border-t p-3">
        <ReactionBar onReact={handleReaction} disabled={!hasPresence} />
      </div>
    </div>
  );
}

export default PresencePanel;
