import type { ApiError } from "./api";
import type {
  Reaction,
  WhisperMessage,
  RoomChatMessage,
  GroupChatInfo,
  NextPersonMatch,
  ChatLimitsInfo,
} from "./chat";
import type {
  FriendRequest,
  FriendMessageData,
  CallSession,
} from "./connection";
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

  // 1-1 whisper lifecycle
  whisper_request(payload: {
    chatId: string;
    from: { userId: string; name: string; avatarUrl: string };
  }): void;
  whisper_accepted(payload: { chatId: string }): void;
  whisper_declined(payload: { chatId: string }): void;

  // Group chat
  group_chat_created(chat: GroupChatInfo): void;
  group_chat_joined(payload: {
    chatId: string;
    user: { userId: string; name: string; avatarUrl: string };
  }): void;
  group_chat_left(payload: { chatId: string; userId: string }): void;
  group_chat_message(message: RoomChatMessage): void;
  group_chat_list(chats: GroupChatInfo[]): void;

  // Next person
  next_person_matched(match: NextPersonMatch): void;
  next_person_no_match(payload: { reason: string }): void;
  next_person_ended(payload: { chatId: string }): void;

  // Limits
  chat_limits(limits: ChatLimitsInfo): void;
  limit_exceeded(payload: {
    feature: string;
    limit: number;
    resetAt: string;
  }): void;

  // Friend system
  friend_request_received(request: FriendRequest): void;
  friend_request_accepted(payload: {
    requestId: string;
    friendship: { id: string; userId: string; name: string; avatarUrl: string };
  }): void;
  friend_request_declined(payload: { requestId: string }): void;
  friend_online(payload: { userId: string }): void;
  friend_offline(payload: { userId: string }): void;
  friend_message(message: FriendMessageData): void;

  // Calls (WebRTC signaling)
  call_incoming(call: CallSession): void;
  call_accepted(payload: { callId: string }): void;
  call_declined(payload: { callId: string }): void;
  call_ended(payload: { callId: string }): void;
  call_signal(payload: { callId: string; signal: unknown }): void;
}

export interface ClientToServerEvents {
  join_room(payload: JoinRoomPayload): void;
  leave_room(payload: LeaveRoomPayload): void;
  heartbeat(payload: HeartbeatPayload): void;
  send_reaction(reaction: Omit<Reaction, "timestamp">): void;
  send_whisper(payload: { chatId: string; content: string }): void;
  send_room_chat(payload: { chatId: string; content: string }): void;
  toggle_focus(enabled: boolean): void;

  // 1-1 whisper lifecycle
  initiate_whisper(payload: { targetUserId: string }): void;
  accept_whisper(payload: { chatId: string }): void;
  decline_whisper(payload: { chatId: string }): void;

  // Group chat
  create_group_chat(payload: { name: string; maxParticipants?: number }): void;
  join_group_chat(payload: { chatId: string }): void;
  leave_group_chat(payload: { chatId: string }): void;
  send_group_chat(payload: { chatId: string; content: string }): void;
  list_group_chats(payload: { roomHash: string }): void;

  // Next person
  next_person(payload: { roomHash: string }): void;
  end_next_person(payload: { chatId: string }): void;

  // Limits
  get_chat_limits(): void;

  // Friend system
  send_friend_request(payload: { targetUserId: string }): void;
  accept_friend_request(payload: { requestId: string }): void;
  decline_friend_request(payload: { requestId: string }): void;
  remove_friend(payload: { friendshipId: string }): void;
  send_friend_message(payload: { friendshipId: string; content: string }): void;
  get_friends(): void;
  get_friend_requests(): void;

  // Calls (WebRTC signaling)
  call_user(payload: { targetUserId: string; type: "audio" | "video" }): void;
  accept_call(payload: { callId: string }): void;
  decline_call(payload: { callId: string }): void;
  end_call(payload: { callId: string }): void;
  send_call_signal(payload: { callId: string; signal: unknown }): void;
}
