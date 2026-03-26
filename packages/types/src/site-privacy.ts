import type { PrivacyLevel } from "./user";

export interface SitePrivacyRule {
  userId: string;
  urlPattern: string;
  visibility: PrivacyLevel;
}
