export type BotBehavior = "lurker" | "friendly" | "active";

export interface ActiveHoursConfig {
  timezone: string;
  ranges: Array<{
    start: string;
    end: string;
    days: number[];
  }>;
}

export interface BotProfile {
  id: string;
  userId: string;
  behaviorType: BotBehavior;
  activeUrls: string[];
  activeHours: ActiveHoursConfig;
  autoWave: boolean;
  createdAt: Date;
}
