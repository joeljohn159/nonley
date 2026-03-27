/**
 * Friends store: manages friend list, messages, and friend requests.
 */

import type { Friend, FriendMessageData, FriendRequest } from "@nonley/types";
import { create } from "zustand";

import { getFriends } from "../lib/api";

interface FriendMessages {
  [friendshipId: string]: FriendMessageData[];
}

interface FriendsState {
  /** List of friends. */
  friends: Friend[];
  /** Messages indexed by friendship ID. */
  messages: FriendMessages;
  /** Pending friend requests received. */
  friendRequests: FriendRequest[];
  /** Whether friends are currently being loaded. */
  loading: boolean;
  /** Currently selected friend for messaging. */
  selectedFriendId: string | null;

  setFriends: (friends: Friend[]) => void;
  addMessage: (message: FriendMessageData) => void;
  addFriendRequest: (request: FriendRequest) => void;
  removeFriendRequest: (requestId: string) => void;
  setFriendOnline: (userId: string) => void;
  setFriendOffline: (userId: string) => void;
  setSelectedFriend: (friendshipId: string | null) => void;
  fetchFriends: (authToken: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  messages: {},
  friendRequests: [],
  loading: false,
  selectedFriendId: null,

  setFriends: (friends) => set({ friends }),

  addMessage: (message) => {
    const current = get().messages;
    const friendMessages = current[message.friendshipId] ?? [];
    set({
      messages: {
        ...current,
        [message.friendshipId]: [...friendMessages, message].slice(-100),
      },
    });
  },

  addFriendRequest: (request) => {
    const existing = get().friendRequests;
    if (existing.some((r) => r.id === request.id)) return;
    set({ friendRequests: [...existing, request] });
  },

  removeFriendRequest: (requestId) => {
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    }));
  },

  setFriendOnline: (userId) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.userId === userId ? { ...f, online: true } : f,
      ),
    }));
  },

  setFriendOffline: (userId) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.userId === userId ? { ...f, online: false } : f,
      ),
    }));
  },

  setSelectedFriend: (friendshipId) => {
    set({ selectedFriendId: friendshipId });
  },

  fetchFriends: async (authToken: string) => {
    set({ loading: true });
    try {
      const response = await getFriends(authToken);
      if (response.success && response.data) {
        set({ friends: response.data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
