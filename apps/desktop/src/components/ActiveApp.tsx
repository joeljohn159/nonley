/**
 * Active application display.
 * Shows the currently detected foreground application
 * and the corresponding presence room status.
 */

import { useAppDetectionStore } from "../stores/app-detection";
import { usePresenceStore } from "../stores/presence";

function ActiveApp() {
  const activeApp = useAppDetectionStore((s) => s.activeApp);
  const connected = usePresenceStore((s) => s.connected);
  const room = usePresenceStore((s) => s.room);

  if (!activeApp) {
    return (
      <div className="border-nonley-border bg-nonley-surface rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <div className="bg-nonley-muted h-2 w-2 rounded-full" />
          <span className="text-nonley-muted text-sm">
            No application detected
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-nonley-border bg-nonley-surface rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`h-2 w-2 flex-shrink-0 rounded-full ${
              connected ? "bg-nonley-accent" : "bg-nonley-danger"
            }`}
          />
          <div className="min-w-0">
            <p className="text-nonley-text truncate text-sm font-medium">
              {activeApp}
            </p>
            <p className="text-nonley-muted text-xs">
              {connected ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>
        {room && (
          <div className="flex-shrink-0 text-right">
            <p className="text-nonley-primary text-lg font-semibold">
              {room.totalCount}
            </p>
            <p className="text-nonley-muted text-[10px]">
              {room.totalCount === 1 ? "person" : "people"} here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveApp;
