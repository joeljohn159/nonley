export interface Connection {
  userId: string;
  connectedTo: string;
  createdAt: Date;
}

export interface Wave {
  id: string;
  fromUser: string;
  toUser: string;
  urlContext: string | null;
  createdAt: Date;
}

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  from?: { id: string; name: string | null; avatarUrl: string | null };
  to?: { id: string; name: string | null; avatarUrl: string | null };
}

export interface Friend {
  friendshipId: string;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  online: boolean;
  createdAt: Date;
}

export interface FriendMessageData {
  id: string;
  friendshipId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: Date;
}

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended" | "missed" | "declined";

export interface CallSession {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  calleeId: string;
  calleeName: string;
  calleeAvatar: string;
  type: CallType;
  status: CallStatus;
}
