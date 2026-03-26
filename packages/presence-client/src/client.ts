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
