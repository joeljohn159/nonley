export type ReactionType = "wave" | "nod" | "lightbulb" | "question" | "fire";

export type ChatType = "whisper" | "room" | "group" | "next_person";

export interface Reaction {
  type: ReactionType;
  fromUserId: string;
  toUserId: string;
  roomHash: string;
  timestamp: number;
}

export interface MicroChat {
  id: string;
  roomHash: string;
  type: ChatType;
  participants: string[];
  createdAt: Date;
  expiresAt: Date | null;
  savedBy: string[];
}

export interface Whisper {
  id: string;
  roomHash: string;
  participants: [string, string];
  createdAt: Date;
  expiresAt: Date | null;
  savedBy: string[];
}

export interface WhisperMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface RoomChat {
  id: string;
  roomHash: string;
  type: "room";
  participants: string[];
  createdAt: Date;
  expiresAt: Date | null;
  savedBy: string[];
}

export interface RoomChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: Date;
}

export interface GroupChatInfo {
  id: string;
  name: string;
  roomHash: string;
  participantCount: number;
  maxParticipants: number | null;
  createdBy: { userId: string; name: string; avatarUrl: string };
  isActive: boolean;
}

export interface NextPersonMatch {
  chatId: string;
  matchedUser: {
    userId: string;
    name: string;
    avatarUrl: string;
  };
}

export interface ChatLimitsInfo {
  plan: string;
  whisperInitiationsToday: number;
  whisperInitiationsMax: number;
  nextPersonSkipsToday: number;
  nextPersonSkipsMax: number;
  groupCreationsToday: number;
  groupCreationsMax: number;
}
