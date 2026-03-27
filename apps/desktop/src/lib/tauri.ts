/**
 * Typed IPC bindings for Tauri commands.
 * All interactions with the Rust backend go through these functions.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Get the currently active (frontmost) application name. */
export async function getActiveApp(): Promise<string> {
  return invoke<string>("get_active_app");
}

/** Store auth token in the Rust backend (in-memory). */
export async function setAuthToken(token: string): Promise<void> {
  return invoke("set_auth_token", { token });
}

/** Retrieve stored auth token from the Rust backend. */
export async function getAuthToken(): Promise<string | null> {
  return invoke<string | null>("get_auth_token");
}

/** Open a URL in the default system browser. */
export async function openLoginUrl(url: string): Promise<void> {
  return invoke("open_login_url", { url });
}

/** Enable or disable auto-start at login. */
export async function setAutostart(enabled: boolean): Promise<void> {
  return invoke("set_autostart", { enabled });
}

/** Listen for active app changes from the Rust detector. */
export async function onActiveAppChanged(
  callback: (appName: string) => void,
): Promise<UnlistenFn> {
  return listen<string>("active-app-changed", (event) => {
    callback(event.payload);
  });
}

/** Listen for tray focus toggle events. */
export async function onTrayFocusToggle(
  callback: () => void,
): Promise<UnlistenFn> {
  return listen("tray-focus-toggle", () => {
    callback();
  });
}
