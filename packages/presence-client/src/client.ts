import { PRESENCE } from "@nonley/config";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomPresence,
  Reaction,
  WhisperMessage,
  RoomChatMessage,
  FocusSummary,
  JoinRoomPayload,
  ApiError,
  GroupChatInfo,
  NextPersonMatch,
  ChatLimitsInfo,
  FriendRequest,
  FriendMessageData,
  CallSession,
} from "@nonley/types";
import { io, Socket } from "socket.io-client";

export type PresenceSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface PresenceClientOptions {
  url: string;
  token: string;
  onPresenceUpdate?: (room: RoomPresence) => void;
  onReaction?: (reaction: Reaction) => void;
  onWhisperMessage?: (message: WhisperMessage) => void;
  onRoomChatMessage?: (message: RoomChatMessage) => void;
  onFocusSummary?: (summary: FocusSummary) => void;
  onError?: (error: ApiError) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;

  // 1-1 whisper lifecycle
  onWhisperRequest?: (payload: {
    chatId: string;
    from: { userId: string; name: string; avatarUrl: string };
  }) => void;
  onWhisperAccepted?: (payload: { chatId: string }) => void;
  onWhisperDeclined?: (payload: { chatId: string }) => void;

  // Group chat
  onGroupChatCreated?: (chat: GroupChatInfo) => void;
  onGroupChatJoined?: (payload: {
    chatId: string;
    user: { userId: string; name: string; avatarUrl: string };
  }) => void;
  onGroupChatLeft?: (payload: { chatId: string; userId: string }) => void;
  onGroupChatMessage?: (message: RoomChatMessage) => void;
  onGroupChatList?: (chats: GroupChatInfo[]) => void;

  // Next person
  onNextPersonMatched?: (match: NextPersonMatch) => void;
  onNextPersonNoMatch?: (payload: { reason: string }) => void;
  onNextPersonEnded?: (payload: { chatId: string }) => void;

  // Limits
  onChatLimits?: (limits: ChatLimitsInfo) => void;
  onLimitExceeded?: (payload: {
    feature: string;
    limit: number;
    resetAt: string;
  }) => void;

  // Friends
  onFriendRequestReceived?: (request: FriendRequest) => void;
  onFriendRequestAccepted?: (payload: {
    requestId: string;
    friendship: { id: string; userId: string; name: string; avatarUrl: string };
  }) => void;
  onFriendRequestDeclined?: (payload: { requestId: string }) => void;
  onFriendOnline?: (payload: { userId: string }) => void;
  onFriendOffline?: (payload: { userId: string }) => void;
  onFriendMessage?: (message: FriendMessageData) => void;

  // Calls
  onCallIncoming?: (call: CallSession) => void;
  onCallAccepted?: (payload: { callId: string }) => void;
  onCallDeclined?: (payload: { callId: string }) => void;
  onCallEnded?: (payload: { callId: string }) => void;
  onCallSignal?: (payload: { callId: string; signal: unknown }) => void;
}

export class PresenceClient {
  private socket: PresenceSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private currentRoomHash: string | null = null;
  private options: PresenceClientOptions;

  constructor(options: PresenceClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.options.url, {
      auth: { token: this.options.token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    }) as PresenceSocket;

    this.socket.on("connect", () => {
      this.options.onConnect?.();
      // Re-join room if we were in one
      if (this.currentRoomHash) {
        this.joinRoom({
          roomHash: this.currentRoomHash,
          urlHash: this.currentRoomHash,
        });
      }
    });

    this.socket.on("disconnect", (reason) => {
      this.stopHeartbeat();
      this.options.onDisconnect?.(reason);
    });

    this.socket.on("presence_update", (room) => {
      this.options.onPresenceUpdate?.(room);
    });

    this.socket.on("reaction", (reaction) => {
      this.options.onReaction?.(reaction);
    });

    this.socket.on("whisper_message", (message) => {
      this.options.onWhisperMessage?.(message);
    });

    this.socket.on("room_chat_message", (message) => {
      this.options.onRoomChatMessage?.(message);
    });

    this.socket.on("focus_summary", (summary) => {
      this.options.onFocusSummary?.(summary);
    });

    this.socket.on("error", (error) => {
      this.options.onError?.(error);
    });

    // 1-1 whisper lifecycle
    this.socket.on("whisper_request", (payload) => {
      this.options.onWhisperRequest?.(payload);
    });
    this.socket.on("whisper_accepted", (payload) => {
      this.options.onWhisperAccepted?.(payload);
    });
    this.socket.on("whisper_declined", (payload) => {
      this.options.onWhisperDeclined?.(payload);
    });

    // Group chat
    this.socket.on("group_chat_created", (chat) => {
      this.options.onGroupChatCreated?.(chat);
    });
    this.socket.on("group_chat_joined", (payload) => {
      this.options.onGroupChatJoined?.(payload);
    });
    this.socket.on("group_chat_left", (payload) => {
      this.options.onGroupChatLeft?.(payload);
    });
    this.socket.on("group_chat_message", (message) => {
      this.options.onGroupChatMessage?.(message);
    });
    this.socket.on("group_chat_list", (chats) => {
      this.options.onGroupChatList?.(chats);
    });

    // Next person
    this.socket.on("next_person_matched", (match) => {
      this.options.onNextPersonMatched?.(match);
    });
    this.socket.on("next_person_no_match", (payload) => {
      this.options.onNextPersonNoMatch?.(payload);
    });
    this.socket.on("next_person_ended", (payload) => {
      this.options.onNextPersonEnded?.(payload);
    });

    // Limits
    this.socket.on("chat_limits", (limits) => {
      this.options.onChatLimits?.(limits);
    });
    this.socket.on("limit_exceeded", (payload) => {
      this.options.onLimitExceeded?.(payload);
    });

    // Friends
    this.socket.on("friend_request_received", (request) => {
      this.options.onFriendRequestReceived?.(request);
    });
    this.socket.on("friend_request_accepted", (payload) => {
      this.options.onFriendRequestAccepted?.(payload);
    });
    this.socket.on("friend_request_declined", (payload) => {
      this.options.onFriendRequestDeclined?.(payload);
    });
    this.socket.on("friend_online", (payload) => {
      this.options.onFriendOnline?.(payload);
    });
    this.socket.on("friend_offline", (payload) => {
      this.options.onFriendOffline?.(payload);
    });
    this.socket.on("friend_message", (message) => {
      this.options.onFriendMessage?.(message);
    });

    // Calls
    this.socket.on("call_incoming", (call) => {
      this.options.onCallIncoming?.(call);
    });
    this.socket.on("call_accepted", (payload) => {
      this.options.onCallAccepted?.(payload);
    });
    this.socket.on("call_declined", (payload) => {
      this.options.onCallDeclined?.(payload);
    });
    this.socket.on("call_ended", (payload) => {
      this.options.onCallEnded?.(payload);
    });
    this.socket.on("call_signal", (payload) => {
      this.options.onCallSignal?.(payload);
    });
  }

  disconnect(): void {
    if (this.currentRoomHash) {
      this.leaveRoom();
    }
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(payload: JoinRoomPayload): void {
    this.socket?.emit("join_room", payload);
    this.currentRoomHash = payload.roomHash;
    this.startHeartbeat();
  }

  leaveRoom(): void {
    if (this.currentRoomHash) {
      this.socket?.emit("leave_room", { roomHash: this.currentRoomHash });
      this.currentRoomHash = null;
      this.stopHeartbeat();
    }
  }

  sendReaction(type: Reaction["type"], toUserId: string): void {
    if (!this.currentRoomHash) return;
    this.socket?.emit("send_reaction", {
      type,
      fromUserId: "", // Server fills this from auth
      toUserId,
      roomHash: this.currentRoomHash,
    });
  }

  sendWhisper(chatId: string, content: string): void {
    this.socket?.emit("send_whisper", { chatId, content });
  }

  sendRoomChat(chatId: string, content: string): void {
    this.socket?.emit("send_room_chat", { chatId, content });
  }

  toggleFocus(enabled: boolean): void {
    this.socket?.emit("toggle_focus", enabled);
  }

  // 1-1 Whisper lifecycle
  initiateWhisper(targetUserId: string): void {
    this.socket?.emit("initiate_whisper", { targetUserId });
  }

  acceptWhisper(chatId: string): void {
    this.socket?.emit("accept_whisper", { chatId });
  }

  declineWhisper(chatId: string): void {
    this.socket?.emit("decline_whisper", { chatId });
  }

  // Group chat
  createGroupChat(name: string, maxParticipants?: number): void {
    this.socket?.emit("create_group_chat", { name, maxParticipants });
  }

  joinGroupChat(chatId: string): void {
    this.socket?.emit("join_group_chat", { chatId });
  }

  leaveGroupChat(chatId: string): void {
    this.socket?.emit("leave_group_chat", { chatId });
  }

  sendGroupChat(chatId: string, content: string): void {
    this.socket?.emit("send_group_chat", { chatId, content });
  }

  listGroupChats(roomHash: string): void {
    this.socket?.emit("list_group_chats", { roomHash });
  }

  // Next person
  nextPerson(roomHash: string): void {
    this.socket?.emit("next_person", { roomHash });
  }

  endNextPerson(chatId: string): void {
    this.socket?.emit("end_next_person", { chatId });
  }

  // Limits
  getChatLimits(): void {
    this.socket?.emit("get_chat_limits");
  }

  // Friends
  sendFriendRequest(targetUserId: string): void {
    this.socket?.emit("send_friend_request", { targetUserId });
  }

  acceptFriendRequest(requestId: string): void {
    this.socket?.emit("accept_friend_request", { requestId });
  }

  declineFriendRequest(requestId: string): void {
    this.socket?.emit("decline_friend_request", { requestId });
  }

  removeFriend(friendshipId: string): void {
    this.socket?.emit("remove_friend", { friendshipId });
  }

  sendFriendMessage(friendshipId: string, content: string): void {
    this.socket?.emit("send_friend_message", { friendshipId, content });
  }

  // Calls
  callUser(targetUserId: string, type: "audio" | "video"): void {
    this.socket?.emit("call_user", { targetUserId, type });
  }

  acceptCall(callId: string): void {
    this.socket?.emit("accept_call", { callId });
  }

  declineCall(callId: string): void {
    this.socket?.emit("decline_call", { callId });
  }

  endCall(callId: string): void {
    this.socket?.emit("end_call", { callId });
  }

  sendCallSignal(callId: string, signal: unknown): void {
    this.socket?.emit("send_call_signal", { callId, signal });
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  get roomHash(): string | null {
    return this.currentRoomHash;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.currentRoomHash) {
        this.socket?.emit("heartbeat", { roomHash: this.currentRoomHash });
      }
    }, PRESENCE.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
