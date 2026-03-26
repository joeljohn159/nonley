export type ReactionType = "wave" | "nod" | "lightbulb" | "question" | "fire";

export type ChatType = "whisper" | "room";

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
