/**
 * React hook for managing the PresenceClient lifecycle.
 * Connects, joins rooms, and syncs presence state to Zustand stores.
 */

import { PresenceClient } from "@nonley/presence-client";
import type {
  RoomPresence,
  Reaction,
  FriendMessageData,
  CallSession,
  FriendRequest,
} from "@nonley/types";
import { useEffect, useRef, useCallback } from "react";

import { useFriendsStore } from "../stores/friends";
import { usePresenceStore } from "../stores/presence";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

interface UsePresenceOptions {
  wsToken: string | null;
  enabled: boolean;
}

export function usePresence({ wsToken, enabled }: UsePresenceOptions) {
  const clientRef = useRef<PresenceClient | null>(null);

  const setConnected = usePresenceStore((s) => s.setConnected);
  const setRoom = usePresenceStore((s) => s.setRoom);
  const addReaction = usePresenceStore((s) => s.addReaction);
  const setCall = usePresenceStore((s) => s.setCall);

  const addFriendMessage = useFriendsStore((s) => s.addMessage);
  const setFriendOnline = useFriendsStore((s) => s.setFriendOnline);
  const setFriendOffline = useFriendsStore((s) => s.setFriendOffline);
  const addFriendRequest = useFriendsStore((s) => s.addFriendRequest);

  const handlePresenceUpdate = useCallback(
    (room: RoomPresence) => {
      setRoom(room);
    },
    [setRoom],
  );

  const handleReaction = useCallback(
    (reaction: Reaction) => {
      addReaction(reaction);
    },
    [addReaction],
  );

  const handleFriendMessage = useCallback(
    (message: FriendMessageData) => {
      addFriendMessage(message);
    },
    [addFriendMessage],
  );

  const handleCallIncoming = useCallback(
    (call: CallSession) => {
      setCall(call);
    },
    [setCall],
  );

  const handleCallAccepted = useCallback((_payload: { callId: string }) => {
    usePresenceStore.getState().updateCallStatus("active");
  }, []);

  const handleCallDeclined = useCallback((_payload: { callId: string }) => {
    usePresenceStore.getState().updateCallStatus("declined");
  }, []);

  const handleCallEnded = useCallback((_payload: { callId: string }) => {
    usePresenceStore.getState().updateCallStatus("ended");
    setTimeout(() => {
      usePresenceStore.getState().setCall(null);
    }, 2000);
  }, []);

  const handleFriendOnline = useCallback(
    (payload: { userId: string }) => {
      setFriendOnline(payload.userId);
    },
    [setFriendOnline],
  );

  const handleFriendOffline = useCallback(
    (payload: { userId: string }) => {
      setFriendOffline(payload.userId);
    },
    [setFriendOffline],
  );

  const handleFriendRequestReceived = useCallback(
    (request: FriendRequest) => {
      addFriendRequest(request);
    },
    [addFriendRequest],
  );

  // Connect/disconnect based on token availability
  useEffect(() => {
    if (!wsToken || !enabled) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const client = new PresenceClient({
      url: WS_URL,
      token: wsToken,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onPresenceUpdate: handlePresenceUpdate,
      onReaction: handleReaction,
      onFriendMessage: handleFriendMessage,
      onFriendOnline: handleFriendOnline,
      onFriendOffline: handleFriendOffline,
      onFriendRequestReceived: handleFriendRequestReceived,
      onCallIncoming: handleCallIncoming,
      onCallAccepted: handleCallAccepted,
      onCallDeclined: handleCallDeclined,
      onCallEnded: handleCallEnded,
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, [
    wsToken,
    enabled,
    setConnected,
    handlePresenceUpdate,
    handleReaction,
    handleFriendMessage,
    handleFriendOnline,
    handleFriendOffline,
    handleFriendRequestReceived,
    handleCallIncoming,
    handleCallAccepted,
    handleCallDeclined,
    handleCallEnded,
  ]);

  const joinRoom = useCallback((roomHash: string, urlHash: string) => {
    clientRef.current?.joinRoom({ roomHash, urlHash });
  }, []);

  const leaveRoom = useCallback(() => {
    clientRef.current?.leaveRoom();
  }, []);

  const sendReaction = useCallback(
    (type: Reaction["type"], toUserId: string) => {
      clientRef.current?.sendReaction(type, toUserId);
    },
    [],
  );

  const toggleFocus = useCallback((enabled: boolean) => {
    clientRef.current?.toggleFocus(enabled);
  }, []);

  const sendFriendMessage = useCallback(
    (friendshipId: string, content: string) => {
      clientRef.current?.sendFriendMessage(friendshipId, content);
    },
    [],
  );

  const callUser = useCallback(
    (targetUserId: string, type: "audio" | "video") => {
      clientRef.current?.callUser(targetUserId, type);
    },
    [],
  );

  const acceptCall = useCallback((callId: string) => {
    clientRef.current?.acceptCall(callId);
  }, []);

  const declineCall = useCallback((callId: string) => {
    clientRef.current?.declineCall(callId);
  }, []);

  const endCall = useCallback((callId: string) => {
    clientRef.current?.endCall(callId);
  }, []);

  return {
    client: clientRef.current,
    joinRoom,
    leaveRoom,
    sendReaction,
    toggleFocus,
    sendFriendMessage,
    callUser,
    acceptCall,
    declineCall,
    endCall,
  };
}
