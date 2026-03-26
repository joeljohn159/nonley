export type PrivacyLevel = "ghost" | "anonymous" | "circles_only" | "open";

export type UserPlan = "free" | "pro" | "site" | "community";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: UserPlan;
  createdAt: Date;
  updatedAt: Date;
  privacyDefault: PrivacyLevel;
  focusMode: boolean;
  isAdmin: boolean;
  isBot: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserProfile {
  userId: string;
  bio: string | null;
  interests: string[];
  locationCity: string | null;
  locationCountry: string | null;
  webTrailPublic: boolean;
  warmthScore: number;
}

export interface WebTrailEntry {
  urlHash: string;
  title: string;
  visitedAt: Date;
}

export interface FocusSchedule {
  enabled: boolean;
  ranges: Array<{
    start: string; // HH:mm
    end: string; // HH:mm
    days: number[]; // 0-6, Sunday=0
  }>;
}
