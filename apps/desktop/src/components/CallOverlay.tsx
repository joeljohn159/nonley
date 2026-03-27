/**
 * Call overlay: shown during incoming or active calls.
 * Provides accept/decline/end call controls.
 */

import { useState, useEffect, useCallback } from "react";

import { usePresenceStore } from "../stores/presence";

import Avatar from "./Avatar";

interface CallOverlayProps {
  acceptCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: (callId: string) => void;
}

function CallOverlay({ acceptCall, declineCall, endCall }: CallOverlayProps) {
  const activeCall = usePresenceStore((s) => s.activeCall);
  const [elapsed, setElapsed] = useState(0);

  // Track call duration
  useEffect(() => {
    if (activeCall?.status !== "active") {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.status]);

  const handleAccept = useCallback(() => {
    if (activeCall) {
      acceptCall(activeCall.callId);
    }
  }, [activeCall, acceptCall]);

  const handleDecline = useCallback(() => {
    if (activeCall) {
      declineCall(activeCall.callId);
    }
  }, [activeCall, declineCall]);

  const handleEnd = useCallback(() => {
    if (activeCall) {
      endCall(activeCall.callId);
    }
  }, [activeCall, endCall]);

  if (!activeCall) return null;

  const isIncoming = activeCall.status === "ringing";
  const isActive = activeCall.status === "active";
  const isEnded =
    activeCall.status === "ended" ||
    activeCall.status === "declined" ||
    activeCall.status === "missed";

  const otherPerson = {
    name: isIncoming ? activeCall.callerName : activeCall.calleeName,
    avatar: isIncoming ? activeCall.callerAvatar : activeCall.calleeAvatar,
  };

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="bg-nonley-bg/90 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="border-nonley-border bg-nonley-surface w-64 rounded-2xl border p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <Avatar
            name={otherPerson.name}
            avatarUrl={otherPerson.avatar}
            size="lg"
          />
          <p className="text-nonley-text mt-3 text-sm font-medium">
            {otherPerson.name}
          </p>
          <p className="text-nonley-muted mt-0.5 text-xs">
            {activeCall.type === "video" ? "Video" : "Audio"} call
          </p>
        </div>

        {/* Status display */}
        <div className="mb-4 text-center">
          {isIncoming && (
            <p className="text-nonley-primary animate-pulse text-sm">
              Incoming call...
            </p>
          )}
          {isActive && (
            <p className="text-nonley-accent text-sm tabular-nums">
              {formatDuration(elapsed)}
            </p>
          )}
          {isEnded && (
            <p className="text-nonley-muted text-sm">
              {activeCall.status === "missed"
                ? "Missed call"
                : activeCall.status === "declined"
                  ? "Call declined"
                  : "Call ended"}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {isIncoming && (
            <>
              <button
                onClick={handleDecline}
                className="bg-nonley-danger flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Decline call"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
              </button>
              <button
                onClick={handleAccept}
                className="bg-nonley-accent text-nonley-bg flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                aria-label="Accept call"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2z" />
                </svg>
              </button>
            </>
          )}

          {isActive && (
            <button
              onClick={handleEnd}
              className="bg-nonley-danger flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              aria-label="End call"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="23" y1="1" x2="1" y2="23" />
              </svg>
            </button>
          )}

          {isEnded && (
            <button
              onClick={() => usePresenceStore.getState().setCall(null)}
              className="bg-nonley-surface-elevated text-nonley-text hover:bg-nonley-border rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallOverlay;
