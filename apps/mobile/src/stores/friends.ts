import type { Friend, FriendRequest } from "@nonley/types";
import { create } from "zustand";

import * as api from "../lib/api";

interface FriendsState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  addPendingRequest: (request: FriendRequest) => void;
  handleRequestAccepted: (payload: {
    requestId: string;
    friendship: {
      id: string;
      userId: string;
      name: string;
      avatarUrl: string;
    };
  }) => void;
  handleRequestDeclined: (requestId: string) => void;
  setFriendOnline: (userId: string, online: boolean) => void;
  removeFriend: (friendshipId: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useFriendsStore = create<FriendsState>((set, _get) => ({
  friends: [],
  pendingRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    try {
      set({ isLoading: true, error: null });
      const friends = await api.fetchFriends();
      set({ friends, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load friends",
      });
    }
  },

  fetchPendingRequests: async () => {
    try {
      const requests = await api.fetchFriendRequests();
      set({ pendingRequests: requests });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load friend requests",
      });
    }
  },

  addPendingRequest: (request: FriendRequest) => {
    set((state) => ({
      pendingRequests: [request, ...state.pendingRequests],
    }));
  },

  handleRequestAccepted: (payload) => {
    const { requestId, friendship } = payload;

    // Remove from pending
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    }));

    // Add to friends list
    const newFriend: Friend = {
      friendshipId: friendship.id,
      userId: friendship.userId,
      name: friendship.name,
      avatarUrl: friendship.avatarUrl,
      online: true,
      createdAt: new Date(),
    };

    set((state) => ({
      friends: [newFriend, ...state.friends],
    }));
  },

  handleRequestDeclined: (requestId: string) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    }));
  },

  setFriendOnline: (userId: string, online: boolean) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.userId === userId ? { ...f, online } : f,
      ),
    }));
  },

  removeFriend: (friendshipId: string) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.friendshipId !== friendshipId),
    }));
  },

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),
}));
