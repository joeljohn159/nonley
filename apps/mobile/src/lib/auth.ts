import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "nonley_auth_token";
const WS_TOKEN_KEY = "nonley_ws_token";
const USER_KEY = "nonley_user";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getWsToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(WS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setWsToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(WS_TOKEN_KEY, token);
}

export async function removeWsToken(): Promise<void> {
  await SecureStore.deleteItemAsync(WS_TOKEN_KEY);
}

export interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export async function getStoredUser(): Promise<StoredUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function removeStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearAllAuth(): Promise<void> {
  await Promise.all([removeToken(), removeWsToken(), removeStoredUser()]);
}
