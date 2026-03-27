import { create } from "zustand";

import { fetchWsToken, fetchSettings } from "../lib/api";
import {
  getToken,
  setToken,
  getWsToken,
  setWsToken,
  getStoredUser,
  setStoredUser,
  clearAllAuth,
} from "../lib/auth";
import type { StoredUser } from "../lib/auth";

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  wsToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (token: string, user: StoredUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshWsToken: () => Promise<void>;
  updateUser: (updates: Partial<StoredUser>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  wsToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });

      const [storedToken, storedWsToken, storedUser] = await Promise.all([
        getToken(),
        getWsToken(),
        getStoredUser(),
      ]);

      if (storedToken && storedUser) {
        set({
          token: storedToken,
          wsToken: storedWsToken,
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        });

        // Refresh WS token in background
        if (!storedWsToken) {
          get()
            .refreshWsToken()
            .catch(() => {
              // Silently fail; will retry on next connection attempt
            });
        }

        // Sync settings from server
        try {
          const settings = await fetchSettings();
          if (settings.name !== storedUser.name) {
            const updatedUser = { ...storedUser, name: settings.name };
            await setStoredUser(updatedUser);
            set({ user: updatedUser });
          }
        } catch {
          // Non-critical; continue with cached user
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false, error: "Failed to initialize auth" });
    }
  },

  login: async (token: string, user: StoredUser) => {
    try {
      set({ isLoading: true, error: null });

      await Promise.all([setToken(token), setStoredUser(user)]);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch WS token after login
      await get().refreshWsToken();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  },

  logout: async () => {
    try {
      await clearAllAuth();
      set({
        user: null,
        token: null,
        wsToken: null,
        isAuthenticated: false,
        error: null,
      });
    } catch {
      // Force clear state even if secure store fails
      set({
        user: null,
        token: null,
        wsToken: null,
        isAuthenticated: false,
      });
    }
  },

  refreshWsToken: async () => {
    try {
      const wsTokenValue = await fetchWsToken();
      await setWsToken(wsTokenValue);
      set({ wsToken: wsTokenValue });
    } catch (error) {
      const currentState = get();
      // If we can't get a WS token, auth might be expired
      if (!currentState.token) {
        set({ error: "Session expired. Please log in again." });
      }
    }
  },

  updateUser: (updates: Partial<StoredUser>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    set({ user: updatedUser });
    setStoredUser(updatedUser).catch(() => {
      // Silently fail on storage update
    });
  },

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),
}));
