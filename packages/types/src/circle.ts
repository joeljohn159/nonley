export type CircleType = "manual" | "auto_detected" | "url_based";

export type CircleRole = "member" | "moderator" | "admin";

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  type: CircleType;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CircleMember {
  circleId: string;
  userId: string;
  joinedAt: Date;
  role: CircleRole;
}
