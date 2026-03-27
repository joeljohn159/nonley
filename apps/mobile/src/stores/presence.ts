import { UI } from "@nonley/config";
import type {
  RoomPresence,
  Reaction,
  CallSession,
  FocusSummary,
} from "@nonley/types";
import { create } from "zustand";

interface PresenceState {
  connected: boolean;
  currentRoom: RoomPresence | null;
  reactions: Reaction[];
  error: string | null;
  focusMode: boolean;
  focusSummary: FocusSummary | null;
  incomingCall: CallSession | null;
  activeCall: CallSession | null;

  setConnected: (connected: boolean) => void;
  setCurrentRoom: (room: RoomPresence) => void;
  clearRoom: () => void;
  addReaction: (reaction: Reaction) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFocusMode: (enabled: boolean) => void;
  setFocusSummary: (summary: FocusSummary) => void;
  setIncomingCall: (call: CallSession) => void;
  handleCallAccepted: (callId: string) => void;
  handleCallDeclined: (callId: string) => void;
  handleCallEnded: (callId: string) => void;
  clearIncomingCall: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  connected: false,
  currentRoom: null,
  reactions: [],
  error: null,
  focusMode: false,
  focusSummary: null,
  incomingCall: null,
  activeCall: null,

  setConnected: (connected: boolean) => set({ connected }),

  setCurrentRoom: (room: RoomPresence) => set({ currentRoom: room }),

  clearRoom: () => set({ currentRoom: null }),

  addReaction: (reaction: Reaction) => {
    const current = get().reactions;
    set({ reactions: [...current, reaction] });

    // Auto-remove reaction after display duration
    setTimeout(() => {
      set((state) => ({
        reactions: state.reactions.filter((r) => r !== reaction),
      }));
    }, UI.REACTION_DISPLAY_MS);
  },

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  setFocusMode: (enabled: boolean) => set({ focusMode: enabled }),

  setFocusSummary: (summary: FocusSummary) => set({ focusSummary: summary }),

  setIncomingCall: (call: CallSession) => set({ incomingCall: call }),

  handleCallAccepted: (callId: string) => {
    const incoming = get().incomingCall;
    if (incoming?.callId === callId) {
      set({
        activeCall: { ...incoming, status: "active" },
        incomingCall: null,
      });
    }
  },

  handleCallDeclined: (callId: string) => {
    const incoming = get().incomingCall;
    if (incoming?.callId === callId) {
      set({ incomingCall: null });
    }
    const active = get().activeCall;
    if (active?.callId === callId) {
      set({ activeCall: null });
    }
  },

  handleCallEnded: (callId: string) => {
    const active = get().activeCall;
    if (active?.callId === callId) {
      set({ activeCall: null });
    }
    const incoming = get().incomingCall;
    if (incoming?.callId === callId) {
      set({ incomingCall: null });
    }
  },

  clearIncomingCall: () => set({ incomingCall: null }),
}));
