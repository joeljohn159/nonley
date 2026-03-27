/**
 * Typed REST API client for the Nonley backend.
 * Wraps fetch with auth headers and typed responses.
 */

import type { ApiResponse, Friend, User, PrivacyLevel } from "@nonley/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  token?: string;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as ApiResponse<T>;
  return data;
}

/** Fetch a WebSocket token for real-time connections. */
export async function getWsToken(
  authToken: string,
): Promise<ApiResponse<{ token: string }>> {
  return request<{ token: string }>("/api/ws-token", {
    method: "POST",
    token: authToken,
  });
}

/** Fetch the current user's profile. */
export async function getCurrentUser(
  authToken: string,
): Promise<ApiResponse<User>> {
  return request<User>("/api/me", {
    token: authToken,
  });
}

/** List all friends. */
export async function getFriends(
  authToken: string,
): Promise<ApiResponse<Friend[]>> {
  return request<Friend[]>("/api/friends", {
    token: authToken,
  });
}

/** Settings shape returned by the API. */
export interface UserSettings {
  privacyDefault: PrivacyLevel;
  focusMode: boolean;
}

/** Get user settings. */
export async function getSettings(
  authToken: string,
): Promise<ApiResponse<UserSettings>> {
  return request<UserSettings>("/api/settings", {
    token: authToken,
  });
}

/** Update user settings. */
export async function updateSettings(
  authToken: string,
  settings: Partial<UserSettings>,
): Promise<ApiResponse<UserSettings>> {
  return request<UserSettings>("/api/settings", {
    method: "PATCH",
    token: authToken,
    body: settings as Record<string, unknown>,
  });
}
