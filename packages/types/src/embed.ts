export type EmbedPlan = "free" | "pro" | "team";

export interface EmbedColors {
  primary: string;
  background: string;
  text: string;
  accent: string;
}

export interface EmbedSite {
  id: string;
  ownerId: string;
  domain: string;
  siteKey: string;
  plan: EmbedPlan;
  customColors: EmbedColors | null;
  brandingHidden: boolean;
  createdAt: Date;
}

export interface EmbedConfig {
  siteId: string;
  position: "bottom-right" | "bottom-left";
  colors?: EmbedColors;
  chatEnabled: boolean;
  brandingHidden: boolean;
}
