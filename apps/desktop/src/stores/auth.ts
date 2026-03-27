/**
 * Auth store: manages user session, auth token, and WS token.
 */

import type { User } from "@nonley/types";
import { create } from "zustand";

import { getWsToken, getCurrentUser } from "../lib/api";
import { loadToken, saveToken, clearToken } from "../lib/auth";

interface AuthState {
  /** The authenticated user, or null if not logged in. */
  user: User | null;
  /** Auth token for REST API calls. */
  authToken: string | null;
  /** WebSocket token for presence connections. */
  wsToken: string | null;
  /** Whether auth is currently being initialized. */
  loading: boolean;
  /** Error message from the last auth operation. */
  error: string | null;

  /** Initialize auth by loading stored token and fetching user. */
  initialize: () => Promise<void>;
  /** Log in with an auth token (from web login flow). */
  login: (token: string) => Promise<void>;
  /** Log out and clear all auth state. */
  logout: () => Promise<void>;
  /** Refresh the WebSocket token. */
  refreshWsToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authToken: null,
  wsToken: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });

    try {
      const token = await loadToken();
      if (!token) {
        set({ loading: false });
        return;
      }

      // Validate token by fetching user
      const userResponse = await getCurrentUser(token);
      if (!userResponse.success || !userResponse.data) {
        await clearToken();
        set({ loading: false });
        return;
      }

      // Get WS token
      const wsResponse = await getWsToken(token);
      const wsToken =
        wsResponse.success && wsResponse.data ? wsResponse.data.token : null;

      set({
        authToken: token,
        user: userResponse.data,
        wsToken,
        loading: false,
      });
    } catch {
      set({ loading: false, error: "Failed to initialize auth" });
    }
  },

  login: async (token: string) => {
    set({ loading: true, error: null });

    try {
      await saveToken(token);

      const userResponse = await getCurrentUser(token);
      if (!userResponse.success || !userResponse.data) {
        set({ loading: false, error: "Invalid token" });
        return;
      }

      const wsResponse = await getWsToken(token);
      const wsToken =
        wsResponse.success && wsResponse.data ? wsResponse.data.token : null;

      set({
        authToken: token,
        user: userResponse.data,
        wsToken,
        loading: false,
      });
    } catch {
      set({ loading: false, error: "Login failed" });
    }
  },

  logout: async () => {
    await clearToken();
    set({
      user: null,
      authToken: null,
      wsToken: null,
      error: null,
    });
  },

  refreshWsToken: async () => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      const response = await getWsToken(authToken);
      if (response.success && response.data) {
        set({ wsToken: response.data.token });
      }
    } catch {
      // Token refresh failed silently - will retry on next connection
    }
  },
}));
