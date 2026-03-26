import { PresenceClient } from "@nonley/presence-client";
import type { RoomPresence, Reaction } from "@nonley/types";

let presenceClient: PresenceClient | null = null;
let currentTab: { tabId: number; roomHash: string } | null = null;

// Restore state on service worker wake
chrome.storage.session.get(["currentTab"], (result) => {
  if (result.currentTab) {
    currentTab = result.currentTab as { tabId: number; roomHash: string };
  }
});

// Keep service worker alive with alarms for heartbeat
chrome.alarms.create("heartbeat-keepalive", { periodInMinutes: 0.4 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "heartbeat-keepalive") {
    if (currentTab && presenceClient?.connected) {
      // Heartbeat is handled by presence-client, alarm just keeps SW alive
    } else if (currentTab) {
      ensureConnected();
    }
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "TAB_URL_CHANGED":
      handleTabChange(message.url, sender.tab?.id);
      sendResponse({ ok: true });
      break;
    case "TOGGLE_FOCUS":
      presenceClient?.toggleFocus(message.enabled);
      chrome.storage.local.set({ focusMode: message.enabled });
      sendResponse({ ok: true });
      break;
    case "SEND_REACTION":
      presenceClient?.sendReaction(message.reactionType, message.toUserId);
      sendResponse({ ok: true });
      break;
    case "GET_STATE":
      sendResponse({
        connected: presenceClient?.connected ?? false,
        currentTab,
      });
      break;
    case "PAGE_UNLOAD":
      if (currentTab && currentTab.tabId === sender.tab?.id) {
        presenceClient?.leaveRoom();
        currentTab = null;
        chrome.storage.session.remove("currentTab");
      }
      sendResponse({ ok: true });
      break;
    default:
      sendResponse({ ok: false });
  }
  return true;
});

// Tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      handleTabChange(tab.url, activeInfo.tabId);
    }
  } catch {
    // Tab may have been closed
  }
});

// Tab URL update
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    handleTabChange(changeInfo.url, tabId);
  }
});

// Tab closed - leave room
chrome.tabs.onRemoved.addListener((tabId) => {
  if (currentTab && currentTab.tabId === tabId) {
    presenceClient?.leaveRoom();
    currentTab = null;
    chrome.storage.session.remove("currentTab");
  }
});

// Browser startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.session.get(["currentTab"], (result) => {
    if (result.currentTab) {
      currentTab = result.currentTab as { tabId: number; roomHash: string };
      ensureConnected();
    }
  });
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      focusMode: false,
      privacyDefault: "circles_only",
    });
  }
});

async function handleTabChange(url: string, tabId: number | undefined) {
  if (
    !tabId ||
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:")
  ) {
    return;
  }

  const roomHash = await hashUrlSha256(url);

  // Leave previous room if different
  if (currentTab && currentTab.roomHash !== roomHash) {
    presenceClient?.leaveRoom();
  }

  currentTab = { tabId, roomHash };
  chrome.storage.session.set({ currentTab });

  ensureConnected();
  presenceClient?.joinRoom({ roomHash, urlHash: roomHash });
}

function ensureConnected() {
  if (presenceClient?.connected) return;

  chrome.storage.local.get(["authToken", "wsUrl"], (result) => {
    const token = result.authToken as string | undefined;
    if (!token) return;

    const wsUrl =
      (result.wsUrl as string | undefined) ?? "wss://presence.nonley.com";

    presenceClient = new PresenceClient({
      url: wsUrl,
      token,
      onPresenceUpdate: (room: RoomPresence) => {
        if (currentTab) {
          chrome.tabs
            .sendMessage(currentTab.tabId, {
              type: "PRESENCE_UPDATE",
              room,
            })
            .catch(() => {
              /* tab may not have content script */
            });
        }
        // Update badge
        const count = room.totalCount;
        chrome.action.setBadgeText({
          text: count > 0 ? String(count) : "",
        });
        chrome.action.setBadgeBackgroundColor({ color: "#818cf8" });
      },
      onReaction: (reaction: Reaction) => {
        if (currentTab) {
          chrome.tabs
            .sendMessage(currentTab.tabId, {
              type: "REACTION",
              reaction,
            })
            .catch(() => {});
        }
      },
      onConnect: () => {
        console.log("[nonley] Connected to presence engine");
        // Rejoin room if we have one
        if (currentTab) {
          presenceClient?.joinRoom({
            roomHash: currentTab.roomHash,
            urlHash: currentTab.roomHash,
          });
        }
      },
      onDisconnect: () => {
        console.log("[nonley] Disconnected");
      },
    });

    presenceClient.connect();
  });
}

async function hashUrlSha256(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    // Strip tracking params
    for (const p of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
    ]) {
      parsed.searchParams.delete(p);
    }
    url = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    // Use as-is
  }
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
