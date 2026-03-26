import type { ApiError } from "./api";
import type { Reaction, WhisperMessage, RoomChatMessage } from "./chat";
import type {
  RoomPresence,
  JoinRoomPayload,
  LeaveRoomPayload,
  HeartbeatPayload,
} from "./presence";

export interface FocusSummary {
  waves: number;
  newCircleMembers: string[];
  missedReactions: number;
}

export interface ServerToClientEvents {
  presence_update(room: RoomPresence): void;
  reaction(reaction: Reaction): void;
  whisper_message(message: WhisperMessage): void;
  room_chat_message(message: RoomChatMessage): void;
  focus_summary(summary: FocusSummary): void;
  error(error: ApiError): void;
}

export interface ClientToServerEvents {
  join_room(payload: JoinRoomPayload): void;
  leave_room(payload: LeaveRoomPayload): void;
  heartbeat(payload: HeartbeatPayload): void;
  send_reaction(reaction: Omit<Reaction, "timestamp">): void;
  send_whisper(payload: { chatId: string; content: string }): void;
  send_room_chat(payload: { chatId: string; content: string }): void;
  toggle_focus(enabled: boolean): void;
}
