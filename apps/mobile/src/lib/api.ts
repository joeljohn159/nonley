import type {
  ApiResponse,
  Friend,
  FriendRequest,
  FriendMessageData,
  Circle,
  User,
  UserProfile,
} from "@nonley/types";

import { getToken } from "./auth";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  retries?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, retries = MAX_RETRIES } = options;
  const token = await getToken();
  const url = `${getApiUrl()}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({
          error: { code: "UNKNOWN", message: response.statusText },
        }))) as ApiResponse<never>;

        throw new ApiError(
          errorBody.error?.code ?? "UNKNOWN",
          errorBody.error?.message ?? response.statusText,
          response.status,
        );
      }

      const data = (await response.json()) as ApiResponse<T>;

      if (!data.success) {
        throw new ApiError(
          data.error?.code ?? "UNKNOWN",
          data.error?.message ?? "Request failed",
          response.status,
        );
      }

      return data.data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }

      if (attempt < retries - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

// ---- Auth ----

export async function fetchWsToken(): Promise<string> {
  const result = await request<{ token: string }>("/api/ws-token", {
    method: "POST",
  });
  return result.token;
}

// ---- Friends ----

export async function fetchFriends(): Promise<Friend[]> {
  return request<Friend[]>("/api/friends");
}

export async function sendFriendRequest(targetUserId: string): Promise<void> {
  await request<void>("/api/friends", {
    method: "POST",
    body: { targetUserId },
  });
}

export async function respondToFriendRequest(
  requestId: string,
  action: "accept" | "decline",
): Promise<void> {
  await request<void>(`/api/friends/${requestId}`, {
    method: "PATCH",
    body: { action },
  });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await request<void>(`/api/friends/${friendshipId}`, {
    method: "DELETE",
  });
}

export async function fetchFriendRequests(): Promise<FriendRequest[]> {
  return request<FriendRequest[]>("/api/friends/requests");
}

export async function lookupUserByEmail(
  email: string,
): Promise<{
  id: string;
  name: string | null;
  avatarUrl: string | null;
} | null> {
  try {
    return await request<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }>(`/api/friends/lookup?email=${encodeURIComponent(email)}`);
  } catch {
    return null;
  }
}

export async function fetchFriendMessages(
  friendshipId: string,
  cursor?: string,
): Promise<FriendMessageData[]> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request<FriendMessageData[]>(
    `/api/friends/${friendshipId}/messages${query}`,
  );
}

export async function sendFriendMessage(
  friendshipId: string,
  content: string,
): Promise<void> {
  await request<void>(`/api/friends/${friendshipId}/messages`, {
    method: "POST",
    body: { content },
  });
}

// ---- Circles ----

export async function fetchCircles(): Promise<Circle[]> {
  return request<Circle[]>("/api/circles");
}

export async function createCircle(data: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<Circle> {
  return request<Circle>("/api/circles", {
    method: "POST",
    body: data,
  });
}

export async function fetchCircle(circleId: string): Promise<Circle> {
  return request<Circle>(`/api/circles/${circleId}`);
}

export async function updateCircle(
  circleId: string,
  data: { name?: string; description?: string },
): Promise<Circle> {
  return request<Circle>(`/api/circles/${circleId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteCircle(circleId: string): Promise<void> {
  await request<void>(`/api/circles/${circleId}`, { method: "DELETE" });
}

export async function joinCircle(circleId: string): Promise<void> {
  await request<void>(`/api/circles/${circleId}/members`, { method: "POST" });
}

export async function leaveCircle(circleId: string): Promise<void> {
  await request<void>(`/api/circles/${circleId}/members`, { method: "DELETE" });
}

// ---- Profile ----

export async function fetchProfile(userId: string): Promise<UserProfile> {
  return request<UserProfile>(`/api/profiles/${userId}`);
}

export async function updateProfile(
  userId: string,
  data: {
    bio?: string;
    interests?: string[];
    locationCity?: string;
    locationCountry?: string;
  },
): Promise<UserProfile> {
  return request<UserProfile>(`/api/profiles/${userId}`, {
    method: "PATCH",
    body: data,
  });
}

// ---- Settings ----

export async function fetchSettings(): Promise<
  Pick<User, "name" | "privacyDefault" | "focusMode">
> {
  return request<Pick<User, "name" | "privacyDefault" | "focusMode">>(
    "/api/settings",
  );
}

export async function updateSettings(data: {
  name?: string;
  privacyDefault?: string;
  focusMode?: boolean;
}): Promise<void> {
  await request<void>("/api/settings", {
    method: "PATCH",
    body: data,
  });
}

export async function deleteAccount(): Promise<void> {
  await request<void>("/api/settings/delete-account", {
    method: "DELETE",
    body: { confirmation: "DELETE MY ACCOUNT" },
  });
}

export async function exportData(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/api/settings/export");
}

// ---- Connections ----

export async function fetchConnections(): Promise<
  Array<{ userId: string; connectedTo: string; createdAt: Date }>
> {
  return request<
    Array<{ userId: string; connectedTo: string; createdAt: Date }>
  >("/api/connections");
}

export async function sendWave(
  toUserId: string,
  urlContext?: string,
): Promise<void> {
  await request<void>("/api/connections", {
    method: "POST",
    body: { toUserId, urlContext },
  });
}
