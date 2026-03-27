/**
 * App detection store: manages the currently detected active application.
 */

import { create } from "zustand";

interface AppDetectionState {
  /** Name of the currently active application. */
  activeApp: string;
  /** The room hash derived from the active app name. */
  roomHash: string | null;
  /** History of recently detected apps (last 10). */
  history: string[];

  setActiveApp: (appName: string) => void;
  setRoomHash: (hash: string | null) => void;
}

/** Create a simple hash from the app name for room identification. */
async function hashAppName(appName: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`desktop:${appName.toLowerCase()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAppDetectionStore = create<AppDetectionState>((set, get) => ({
  activeApp: "",
  roomHash: null,
  history: [],

  setActiveApp: (appName: string) => {
    const current = get().activeApp;
    if (appName === current) return;

    const history = get().history;
    const updated = appName
      ? [appName, ...history.filter((h) => h !== appName)].slice(0, 10)
      : history;

    set({ activeApp: appName, history: updated });

    // Compute room hash asynchronously
    if (appName) {
      hashAppName(appName).then((hash) => {
        // Only set if the app hasn't changed in the meantime
        if (get().activeApp === appName) {
          set({ roomHash: hash });
        }
      });
    } else {
      set({ roomHash: null });
    }
  },

  setRoomHash: (hash) => set({ roomHash: hash }),
}));
