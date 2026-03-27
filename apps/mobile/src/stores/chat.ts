import type {
  RoomChatMessage,
  GroupChatInfo,
  NextPersonMatch,
  ChatLimitsInfo,
} from "@nonley/types";
import { create } from "zustand";

export type ChatKind = "whisper" | "group" | "friend" | "next_person";

export interface ActiveChat {
  id: string;
  kind: ChatKind;
  name: string;
  avatarUrl: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

interface WhisperRequest {
  chatId: string;
  from: { userId: string; name: string; avatarUrl: string };
}

interface ChatState {
  activeChats: ActiveChat[];
  messages: Record<string, RoomChatMessage[]>;
  groupChats: GroupChatInfo[];
  whisperRequests: WhisperRequest[];
  chatLimits: ChatLimitsInfo | null;
  nextPersonSearching: boolean;
  nextPersonMatch: NextPersonMatch | null;
  error: string | null;

  addMessage: (chatId: string, message: RoomChatMessage) => void;
  addWhisperRequest: (request: WhisperRequest) => void;
  removeWhisperRequest: (chatId: string) => void;
  handleWhisperAccepted: (chatId: string) => void;
  handleWhisperDeclined: (chatId: string) => void;
  addGroupChat: (chat: GroupChatInfo) => void;
  setGroupChats: (chats: GroupChatInfo[]) => void;
  handleGroupChatJoined: (payload: {
    chatId: string;
    user: { userId: string; name: string; avatarUrl: string };
  }) => void;
  handleGroupChatLeft: (payload: { chatId: string; userId: string }) => void;
  handleNextPersonMatch: (match: NextPersonMatch) => void;
  handleNextPersonEnded: (chatId: string) => void;
  setNextPersonSearching: (searching: boolean) => void;
  setChatLimits: (limits: ChatLimitsInfo) => void;
  addActiveChat: (chat: ActiveChat) => void;
  removeActiveChat: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeChats: [],
  messages: {},
  groupChats: [],
  whisperRequests: [],
  chatLimits: null,
  nextPersonSearching: false,
  nextPersonMatch: null,
  error: null,

  addMessage: (chatId: string, message: RoomChatMessage) => {
    set((state) => {
      const existing = state.messages[chatId] ?? [];
      // Prevent duplicate messages
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      const updatedMessages = {
        ...state.messages,
        [chatId]: [...existing, message],
      };

      // Update active chat last message
      const updatedChats = state.activeChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: chat.unreadCount + 1,
            }
          : chat,
      );

      return { messages: updatedMessages, activeChats: updatedChats };
    });
  },

  addWhisperRequest: (request: WhisperRequest) => {
    set((state) => ({
      whisperRequests: [...state.whisperRequests, request],
    }));
  },

  removeWhisperRequest: (chatId: string) => {
    set((state) => ({
      whisperRequests: state.whisperRequests.filter((r) => r.chatId !== chatId),
    }));
  },

  handleWhisperAccepted: (chatId: string) => {
    // Remove from requests and add to active chats
    const request = get().whisperRequests.find((r) => r.chatId === chatId);
    set((state) => ({
      whisperRequests: state.whisperRequests.filter((r) => r.chatId !== chatId),
    }));

    if (request) {
      get().addActiveChat({
        id: chatId,
        kind: "whisper",
        name: request.from.name,
        avatarUrl: request.from.avatarUrl,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      });
    }
  },

  handleWhisperDeclined: (chatId: string) => {
    set((state) => ({
      whisperRequests: state.whisperRequests.filter((r) => r.chatId !== chatId),
    }));
  },

  addGroupChat: (chat: GroupChatInfo) => {
    set((state) => ({
      groupChats: [...state.groupChats, chat],
    }));

    get().addActiveChat({
      id: chat.id,
      kind: "group",
      name: chat.name,
      avatarUrl: chat.createdBy.avatarUrl,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
    });
  },

  setGroupChats: (chats: GroupChatInfo[]) => {
    set({ groupChats: chats });
  },

  handleGroupChatJoined: (payload) => {
    set((state) => ({
      groupChats: state.groupChats.map((c) =>
        c.id === payload.chatId
          ? { ...c, participantCount: c.participantCount + 1 }
          : c,
      ),
    }));
  },

  handleGroupChatLeft: (payload) => {
    set((state) => ({
      groupChats: state.groupChats.map((c) =>
        c.id === payload.chatId
          ? {
              ...c,
              participantCount: Math.max(0, c.participantCount - 1),
            }
          : c,
      ),
    }));
  },

  handleNextPersonMatch: (match: NextPersonMatch) => {
    set({ nextPersonMatch: match, nextPersonSearching: false });

    get().addActiveChat({
      id: match.chatId,
      kind: "next_person",
      name: match.matchedUser.name,
      avatarUrl: match.matchedUser.avatarUrl,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
    });
  },

  handleNextPersonEnded: (chatId: string) => {
    set((state) => ({
      nextPersonMatch:
        state.nextPersonMatch?.chatId === chatId ? null : state.nextPersonMatch,
    }));
    get().removeActiveChat(chatId);
  },

  setNextPersonSearching: (searching: boolean) => {
    set({ nextPersonSearching: searching });
  },

  setChatLimits: (limits: ChatLimitsInfo) => {
    set({ chatLimits: limits });
  },

  addActiveChat: (chat: ActiveChat) => {
    set((state) => {
      // Don't add duplicates
      if (state.activeChats.some((c) => c.id === chat.id)) {
        return state;
      }
      return { activeChats: [chat, ...state.activeChats] };
    });
  },

  removeActiveChat: (chatId: string) => {
    set((state) => ({
      activeChats: state.activeChats.filter((c) => c.id !== chatId),
    }));
  },

  markChatRead: (chatId: string) => {
    set((state) => ({
      activeChats: state.activeChats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),
}));
