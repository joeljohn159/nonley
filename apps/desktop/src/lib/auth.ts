/**
 * Auth token management.
 * Uses both Tauri IPC (in-memory on Rust side) and localStorage
 * for persistence across app restarts.
 */

import { getAuthToken, setAuthToken } from "./tauri";

const STORAGE_KEY = "nonley_auth_token";

/** Save auth token to both localStorage and Tauri state. */
export async function saveToken(token: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // localStorage may not be available in all contexts
  }
  await setAuthToken(token);
}

/** Load auth token, trying Tauri state first, then localStorage. */
export async function loadToken(): Promise<string | null> {
  // Try Tauri in-memory state first
  const tauriToken = await getAuthToken();
  if (tauriToken) {
    return tauriToken;
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Sync back to Tauri state
      await setAuthToken(stored);
      return stored;
    }
  } catch {
    // localStorage may not be available
  }

  return null;
}

/** Clear auth token from all storage locations. */
export async function clearToken(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may not be available
  }
  await setAuthToken("");
}
