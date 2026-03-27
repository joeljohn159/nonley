/**
 * Presence store: manages current room presence, reactions, calls, and focus mode.
 */

import type {
  RoomPresence,
  Reaction,
  CallSession,
  CallStatus,
} from "@nonley/types";
import { create } from "zustand";

interface PresenceState {
  /** Whether the WebSocket is connected. */
  connected: boolean;
  /** Current room presence data. */
  room: RoomPresence | null;
  /** Recent reactions to display temporarily. */
  reactions: Reaction[];
  /** Whether focus mode is active. */
  focusMode: boolean;
  /** Active or incoming call session. */
  activeCall: CallSession | null;

  setConnected: (connected: boolean) => void;
  setRoom: (room: RoomPresence | null) => void;
  addReaction: (reaction: Reaction) => void;
  clearReactions: () => void;
  setFocusMode: (enabled: boolean) => void;
  setCall: (call: CallSession | null) => void;
  updateCallStatus: (status: CallStatus) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  connected: false,
  room: null,
  reactions: [],
  focusMode: false,
  activeCall: null,

  setConnected: (connected) => set({ connected }),

  setRoom: (room) => set({ room }),

  addReaction: (reaction) => {
    const current = get().reactions;
    // Keep only the last 10 reactions
    const updated = [...current, reaction].slice(-10);
    set({ reactions: updated });

    // Auto-clear the reaction after 3 seconds
    setTimeout(() => {
      set((state) => ({
        reactions: state.reactions.filter((r) => r !== reaction),
      }));
    }, 3000);
  },

  clearReactions: () => set({ reactions: [] }),

  setFocusMode: (enabled) => set({ focusMode: enabled }),

  setCall: (call) => set({ activeCall: call }),

  updateCallStatus: (status) => {
    const call = get().activeCall;
    if (call) {
      set({ activeCall: { ...call, status } });
    }
  },
}));
