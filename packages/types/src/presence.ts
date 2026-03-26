import type { PrivacyLevel } from "./user";

export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string;
  privacyLevel: PrivacyLevel;
  ring: 1 | 2 | 3;
}

export interface RoomPresence {
  roomHash: string;
  totalCount: number;
  ring1: PresenceUser[];
  ring2: PresenceUser[];
  ring3Count: number;
}

export interface PresenceEvent {
  type: "join" | "leave" | "heartbeat" | "update";
  userId: string;
  roomHash: string;
  timestamp: number;
}

export interface JoinRoomPayload {
  roomHash: string;
  urlHash: string;
  visibilityOverride?: PrivacyLevel;
}

export interface LeaveRoomPayload {
  roomHash: string;
}

export interface HeartbeatPayload {
  roomHash: string;
}
