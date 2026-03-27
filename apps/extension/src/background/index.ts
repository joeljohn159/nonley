import { PresenceClient } from "@nonley/presence-client";
import type { RoomPresence, Reaction } from "@nonley/types";

let presenceClient: PresenceClient | null = null;
let currentTab: { tabId: number; roomHash: string } | null = null;
const activeTabs = new Map<number, string>(); // tabId -> roomHash

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
    case "SEND_ROOM_CHAT":
      if (currentTab) {
        presenceClient?.sendRoomChat(currentTab.roomHash, message.content);
      }
      sendResponse({ ok: true });
      break;
    case "INITIATE_WHISPER":
      presenceClient?.initiateWhisper(message.targetUserId);
      sendResponse({ ok: true });
      break;
    case "ACCEPT_WHISPER":
      presenceClient?.acceptWhisper(message.chatId);
      sendResponse({ ok: true });
      break;
    case "DECLINE_WHISPER":
      presenceClient?.declineWhisper(message.chatId);
      sendResponse({ ok: true });
      break;
    case "CREATE_GROUP_CHAT":
      presenceClient?.createGroupChat(message.name, message.maxParticipants);
      sendResponse({ ok: true });
      break;
    case "JOIN_GROUP_CHAT":
      presenceClient?.joinGroupChat(message.chatId);
      sendResponse({ ok: true });
      break;
    case "LEAVE_GROUP_CHAT":
      presenceClient?.leaveGroupChat(message.chatId);
      sendResponse({ ok: true });
      break;
    case "SEND_GROUP_CHAT":
      presenceClient?.sendGroupChat(message.chatId, message.content);
      sendResponse({ ok: true });
      break;
    case "LIST_GROUP_CHATS":
      if (currentTab) {
        presenceClient?.listGroupChats(currentTab.roomHash);
      }
      sendResponse({ ok: true });
      break;
    case "NEXT_PERSON":
      if (currentTab) {
        presenceClient?.nextPerson(currentTab.roomHash);
      }
      sendResponse({ ok: true });
      break;
    case "END_NEXT_PERSON":
      presenceClient?.endNextPerson(message.chatId);
      sendResponse({ ok: true });
      break;
    case "GET_CHAT_LIMITS":
      presenceClient?.getChatLimits();
      sendResponse({ ok: true });
      break;

    // Friends
    case "SEND_FRIEND_REQUEST":
      presenceClient?.sendFriendRequest(message.targetUserId);
      sendResponse({ ok: true });
      break;
    case "ACCEPT_FRIEND_REQUEST":
      presenceClient?.acceptFriendRequest(message.requestId);
      sendResponse({ ok: true });
      break;
    case "DECLINE_FRIEND_REQUEST":
      presenceClient?.declineFriendRequest(message.requestId);
      sendResponse({ ok: true });
      break;
    case "REMOVE_FRIEND":
      presenceClient?.removeFriend(message.friendshipId);
      sendResponse({ ok: true });
      break;
    case "SEND_FRIEND_MESSAGE":
      presenceClient?.sendFriendMessage(message.friendshipId, message.content);
      sendResponse({ ok: true });
      break;

    // Calls
    case "CALL_USER":
      presenceClient?.callUser(message.targetUserId, message.callType);
      sendResponse({ ok: true });
      break;
    case "ACCEPT_CALL":
      presenceClient?.acceptCall(message.callId);
      sendResponse({ ok: true });
      break;
    case "DECLINE_CALL":
      presenceClient?.declineCall(message.callId);
      sendResponse({ ok: true });
      break;
    case "END_CALL":
      presenceClient?.endCall(message.callId);
      sendResponse({ ok: true });
      break;
    case "SEND_CALL_SIGNAL":
      presenceClient?.sendCallSignal(message.callId, message.signal);
      sendResponse({ ok: true });
      break;

    case "GET_STATE":
      sendResponse({
        connected: presenceClient?.connected ?? false,
        currentTab,
      });
      break;
    case "PAGE_UNLOAD":
      if (sender.tab?.id) {
        activeTabs.delete(sender.tab.id);
      }
      if (currentTab && currentTab.tabId === sender.tab?.id) {
        const roomHash = currentTab.roomHash;
        const otherTab = [...activeTabs.entries()].find(
          ([, hash]) => hash === roomHash,
        );
        if (!otherTab) {
          presenceClient?.leaveRoom();
        }
        currentTab = otherTab ? { tabId: otherTab[0], roomHash } : null;
        if (currentTab) {
          chrome.storage.session.set({ currentTab });
        } else {
          chrome.storage.session.remove("currentTab");
        }
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

// Tab closed - clean up
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
  if (currentTab && currentTab.tabId === tabId) {
    // Only leave the room if no other tabs are on the same roomHash
    const roomHash = currentTab.roomHash;
    const otherTabOnSameRoom = [...activeTabs.entries()].find(
      ([, hash]) => hash === roomHash,
    );
    if (!otherTabOnSameRoom) {
      presenceClient?.leaveRoom();
    }
    currentTab = otherTabOnSameRoom
      ? { tabId: otherTabOnSameRoom[0], roomHash }
      : null;
    if (currentTab) {
      chrome.storage.session.set({ currentTab });
    } else {
      chrome.storage.session.remove("currentTab");
    }
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

  // Track this tab
  activeTabs.set(tabId, roomHash);

  // Leave previous room if different
  if (currentTab && currentTab.roomHash !== roomHash) {
    presenceClient?.leaveRoom();
  }

  currentTab = { tabId, roomHash };
  chrome.storage.session.set({ currentTab });

  ensureConnected();
  presenceClient?.joinRoom({ roomHash, urlHash: roomHash });
  presenceClient?.getChatLimits();
  presenceClient?.listGroupChats(roomHash);
}

function forwardToTab(type: string, data: Record<string, unknown>) {
  if (!currentTab) return;
  const targetRoomHash = currentTab.roomHash;
  // Send to ALL tabs on the same roomHash, not just currentTab
  for (const [tabId, roomHash] of activeTabs) {
    if (roomHash === targetRoomHash) {
      chrome.tabs.sendMessage(tabId, { type, ...data }).catch(() => {
        // Tab may have been closed or lacks content script — clean up
        activeTabs.delete(tabId);
      });
    }
  }
}

function ensureConnected() {
  if (presenceClient?.connected) return;

  chrome.storage.local.get(["authToken", "wsUrl"], (result) => {
    const token = result.authToken as string | undefined;
    if (!token) return;

    const wsUrl = (result.wsUrl as string | undefined) ?? "ws://localhost:3001";

    presenceClient = new PresenceClient({
      url: wsUrl,
      token,
      onPresenceUpdate: (room: RoomPresence) => {
        forwardToTab("PRESENCE_UPDATE", { room });
        // Update badge
        const count = room.totalCount;
        chrome.action.setBadgeText({
          text: count > 0 ? String(count) : "",
        });
        chrome.action.setBadgeBackgroundColor({ color: "#818cf8" });
      },
      onReaction: (reaction: Reaction) => {
        forwardToTab("REACTION", { reaction });
      },
      onRoomChatMessage: (message) => {
        forwardToTab("ROOM_CHAT_MESSAGE", { message });
      },
      // 1-1 whisper lifecycle
      onWhisperRequest: (payload) => {
        forwardToTab("WHISPER_REQUEST", { payload });
      },
      onWhisperAccepted: (payload) => {
        forwardToTab("WHISPER_ACCEPTED", { payload });
      },
      onWhisperDeclined: (payload) => {
        forwardToTab("WHISPER_DECLINED", { payload });
      },

      // Group chat
      onGroupChatCreated: (chat) => {
        forwardToTab("GROUP_CHAT_CREATED", { chat });
      },
      onGroupChatJoined: (payload) => {
        forwardToTab("GROUP_CHAT_JOINED", { payload });
      },
      onGroupChatLeft: (payload) => {
        forwardToTab("GROUP_CHAT_LEFT", { payload });
      },
      onGroupChatMessage: (message) => {
        forwardToTab("GROUP_CHAT_MESSAGE", { message });
      },
      onGroupChatList: (chats) => {
        forwardToTab("GROUP_CHAT_LIST", { chats });
      },

      // Next person
      onNextPersonMatched: (match) => {
        forwardToTab("NEXT_PERSON_MATCHED", { match });
      },
      onNextPersonNoMatch: (payload) => {
        forwardToTab("NEXT_PERSON_NO_MATCH", { payload });
      },
      onNextPersonEnded: (payload) => {
        forwardToTab("NEXT_PERSON_ENDED", { payload });
      },

      // Limits
      onChatLimits: (limits) => {
        forwardToTab("CHAT_LIMITS", { limits });
      },
      onLimitExceeded: (payload) => {
        forwardToTab("LIMIT_EXCEEDED", { payload });
      },

      // Friends
      onFriendRequestReceived: (request) => {
        forwardToTab("FRIEND_REQUEST_RECEIVED", { request });
      },
      onFriendRequestAccepted: (request) => {
        forwardToTab("FRIEND_REQUEST_ACCEPTED", { request });
      },
      onFriendRequestDeclined: (request) => {
        forwardToTab("FRIEND_REQUEST_DECLINED", { request });
      },
      onFriendOnline: (payload) => {
        forwardToTab("FRIEND_ONLINE", { payload });
      },
      onFriendOffline: (payload) => {
        forwardToTab("FRIEND_OFFLINE", { payload });
      },
      onFriendMessage: (message) => {
        forwardToTab("FRIEND_MESSAGE", { message });
      },

      // Calls
      onCallIncoming: (call) => {
        forwardToTab("CALL_INCOMING", { call });
      },
      onCallAccepted: (call) => {
        forwardToTab("CALL_ACCEPTED", { call });
      },
      onCallDeclined: (call) => {
        forwardToTab("CALL_DECLINED", { call });
      },
      onCallEnded: (call) => {
        forwardToTab("CALL_ENDED", { call });
      },
      onCallSignal: (payload) => {
        forwardToTab("CALL_SIGNAL", { payload });
      },

      onConnect: () => {
        console.log("[nonley] Connected to presence engine");
        if (currentTab) {
          presenceClient?.joinRoom({
            roomHash: currentTab.roomHash,
            urlHash: currentTab.roomHash,
          });
          presenceClient?.getChatLimits();
          presenceClient?.listGroupChats(currentTab.roomHash);
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
