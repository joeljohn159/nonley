import type { RoomPresence, Reaction, FocusSummary } from "@nonley/types";
import { create } from "zustand";

interface PresenceState {
  activeRooms: RoomPresence[];
  focusMode: boolean;
  focusSummary: FocusSummary | null;
  pendingReactions: Reaction[];
  updateRoom: (room: RoomPresence) => void;
  addReaction: (reaction: Reaction) => void;
  clearReaction: (index: number) => void;
  setFocusMode: (enabled: boolean) => void;
  setFocusSummary: (summary: FocusSummary) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  activeRooms: [],
  focusMode: false,
  focusSummary: null,
  pendingReactions: [],
  updateRoom: (room) =>
    set((state) => {
      const idx = state.activeRooms.findIndex(
        (r) => r.roomHash === room.roomHash,
      );
      const rooms = [...state.activeRooms];
      if (idx >= 0) {
        rooms[idx] = room;
      } else {
        rooms.push(room);
      }
      return { activeRooms: rooms };
    }),
  addReaction: (reaction) =>
    set((state) => ({
      // Cap at 50 to prevent unbounded growth on busy pages
      pendingReactions: [...state.pendingReactions, reaction].slice(-50),
    })),
  clearReaction: (index) =>
    set((state) => ({
      pendingReactions: state.pendingReactions.filter((_, i) => i !== index),
    })),
  setFocusMode: (enabled) => set({ focusMode: enabled }),
  setFocusSummary: (summary) => set({ focusSummary: summary }),
}));
