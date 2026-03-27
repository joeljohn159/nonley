import { PresenceClient } from "@nonley/presence-client";
import type { PresenceClientOptions } from "@nonley/presence-client";
import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";

import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import { useFriendsStore } from "../stores/friends";
import { usePresenceStore } from "../stores/presence";

function getWsUrl(): string {
  return process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3001";
}

// Singleton client reference shared across hooks
let sharedClient: PresenceClient | null = null;

/**
 * Hook to manage the singleton PresenceClient lifecycle.
 * Call this ONCE in the root layout. It auto-connects/disconnects
 * based on wsToken and app state.
 */
export function usePresenceManager(): void {
  const wsToken = useAuthStore((s) => s.wsToken);
  const clientRef = useRef<PresenceClient | null>(null);

  const buildClient = useCallback((): PresenceClient | null => {
    if (!wsToken) return null;

    const options: PresenceClientOptions = {
      url: getWsUrl(),
      token: wsToken,

      onConnect: () => {
        usePresenceStore.getState().setConnected(true);
      },

      onDisconnect: () => {
        usePresenceStore.getState().setConnected(false);
      },

      onPresenceUpdate: (room) => {
        usePresenceStore.getState().setCurrentRoom(room);
      },

      onReaction: (reaction) => {
        usePresenceStore.getState().addReaction(reaction);
      },

      onError: (error) => {
        usePresenceStore.getState().setError(error.message);
      },

      // Whisper lifecycle
      onWhisperRequest: (payload) => {
        useChatStore.getState().addWhisperRequest(payload);
      },

      onWhisperAccepted: (payload) => {
        useChatStore.getState().handleWhisperAccepted(payload.chatId);
      },

      onWhisperDeclined: (payload) => {
        useChatStore.getState().handleWhisperDeclined(payload.chatId);
      },

      onWhisperMessage: (message) => {
        useChatStore.getState().addMessage(message.chatId, {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          senderName: "",
          senderAvatar: "",
          content: message.content,
          createdAt: message.createdAt,
        });
      },

      // Room chat
      onRoomChatMessage: (message) => {
        useChatStore.getState().addMessage(message.chatId, message);
      },

      // Group chat
      onGroupChatCreated: (chat) => {
        useChatStore.getState().addGroupChat(chat);
      },

      onGroupChatJoined: (payload) => {
        useChatStore.getState().handleGroupChatJoined(payload);
      },

      onGroupChatLeft: (payload) => {
        useChatStore.getState().handleGroupChatLeft(payload);
      },

      onGroupChatMessage: (message) => {
        useChatStore.getState().addMessage(message.chatId, message);
      },

      onGroupChatList: (chats) => {
        useChatStore.getState().setGroupChats(chats);
      },

      // Next person
      onNextPersonMatched: (match) => {
        useChatStore.getState().handleNextPersonMatch(match);
      },

      onNextPersonNoMatch: () => {
        useChatStore.getState().setNextPersonSearching(false);
      },

      onNextPersonEnded: (payload) => {
        useChatStore.getState().handleNextPersonEnded(payload.chatId);
      },

      // Limits
      onChatLimits: (limits) => {
        useChatStore.getState().setChatLimits(limits);
      },

      onLimitExceeded: (payload) => {
        usePresenceStore
          .getState()
          .setError(
            `Limit exceeded: ${payload.feature} (max ${payload.limit})`,
          );
      },

      // Friends
      onFriendRequestReceived: (req) => {
        useFriendsStore.getState().addPendingRequest(req);
      },

      onFriendRequestAccepted: (payload) => {
        useFriendsStore.getState().handleRequestAccepted(payload);
      },

      onFriendRequestDeclined: (payload) => {
        useFriendsStore.getState().handleRequestDeclined(payload.requestId);
      },

      onFriendOnline: (payload) => {
        useFriendsStore.getState().setFriendOnline(payload.userId, true);
      },

      onFriendOffline: (payload) => {
        useFriendsStore.getState().setFriendOnline(payload.userId, false);
      },

      onFriendMessage: (message) => {
        useChatStore.getState().addMessage(message.friendshipId, {
          id: message.id,
          chatId: message.friendshipId,
          senderId: message.senderId,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          content: message.content,
          createdAt: message.createdAt,
        });
      },

      // Calls
      onCallIncoming: (call) => {
        usePresenceStore.getState().setIncomingCall(call);
      },

      onCallAccepted: (payload) => {
        usePresenceStore.getState().handleCallAccepted(payload.callId);
      },

      onCallDeclined: (payload) => {
        usePresenceStore.getState().handleCallDeclined(payload.callId);
      },

      onCallEnded: (payload) => {
        usePresenceStore.getState().handleCallEnded(payload.callId);
      },

      onFocusSummary: (summary) => {
        usePresenceStore.getState().setFocusSummary(summary);
      },
    };

    return new PresenceClient(options);
  }, [wsToken]);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const client = buildClient();
    if (!client) return;

    clientRef.current = client;
    sharedClient = client;
    client.connect();
  }, [buildClient]);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    sharedClient = null;
  }, []);

  // Auto-connect when wsToken is available
  useEffect(() => {
    if (wsToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [wsToken, connect, disconnect]);

  // Handle app state transitions: disconnect on background, reconnect on foreground
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus): void {
      if (nextState === "active" && wsToken) {
        connect();
      } else if (nextState === "background" || nextState === "inactive") {
        disconnect();
      }
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [wsToken, connect, disconnect]);
}

/**
 * Hook to access the shared PresenceClient instance.
 * Use this in any component that needs to call client methods.
 */
export function usePresenceClient(): PresenceClient | null {
  return sharedClient;
}
