export const PRESENCE = {
  HEARTBEAT_INTERVAL_MS: 30_000,
  HEARTBEAT_TIMEOUT_MS: 90_000,
  SUB_ROOM_THRESHOLD: 50,
  SUB_ROOM_SIZE: 20,
  RING2_SAMPLE_SIZE: 15,
} as const;

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  AUTH_REQUESTS_PER_MINUTE: 10,
  REACTIONS_COOLDOWN_MS: 10_000,
  WHISPER_INITIATIONS_PER_HOUR: 5,
  ROOM_CHAT_MESSAGES_PER_HOUR: 30,
} as const;

export const CHAT = {
  MAX_MESSAGE_LENGTH: 280,
  MAX_ROOM_CHAT_PARTICIPANTS: 20,
  WHISPER_MAX_VISIBLE_HEIGHT_PX: 200,
  EXPIRY_HOURS: 24,
  ROOM_CHAT_MIN_USERS: 3,
  LINK_STRIPPING: true,
  MAX_GROUP_CHAT_NAME_LENGTH: 50,
  GROUP_CHAT_EXPIRY_HOURS: 24,
  WHISPER_REQUEST_TIMEOUT_MS: 30_000,
} as const;

export const CHAT_LIMITS = {
  FREE: {
    whisperInitiationsPerDay: 5,
    nextPersonSkipsPerDay: 10,
    groupCreationsPerDay: 2,
    maxGroupParticipants: 5,
  },
  PRO: {
    whisperInitiationsPerDay: 50,
    nextPersonSkipsPerDay: 100,
    groupCreationsPerDay: 20,
    maxGroupParticipants: 20,
  },
  SITE: {
    whisperInitiationsPerDay: 999,
    nextPersonSkipsPerDay: 999,
    groupCreationsPerDay: 999,
    maxGroupParticipants: 50,
  },
  COMMUNITY: {
    whisperInitiationsPerDay: 999,
    nextPersonSkipsPerDay: 999,
    groupCreationsPerDay: 999,
    maxGroupParticipants: 100,
  },
} as const;

export const NEXT_PERSON = {
  COOLDOWN_BETWEEN_SKIPS_MS: 3_000,
  SESSION_TIMEOUT_MS: 300_000,
  MATCH_RETRY_ATTEMPTS: 3,
  EXCLUDE_RECENTLY_MATCHED_HOURS: 1,
} as const;

export const UI = {
  BUBBLE_HEIGHT_PX: 40,
  PANEL_MAX_WIDTH_PX: 320,
  PANEL_MAX_HEIGHT_PX: 400,
  REACTION_DISPLAY_MS: 3_000,
  FOCUS_FADE_IN_MS: 500,
  MAX_VIEWPORT_WIDTH_PERCENT: 25,
} as const;

export const PLANS = {
  FREE: {
    name: "Free",
    maxEmbedVisitors: 20,
    maxEmbedSites: 1,
    integrations: false,
    saveMicroChats: false,
    privateCircles: false,
    customVisibility: false,
    desktopApp: false,
  },
  PRO: {
    name: "Pro",
    priceMonthly: 700, // cents
    priceAnnual: 500, // cents per month
    maxEmbedVisitors: 200,
    maxEmbedSites: 1,
    integrations: true,
    saveMicroChats: true,
    privateCircles: true,
    customVisibility: true,
    desktopApp: true,
  },
  SITE: {
    name: "Site",
    priceMonthly: 2900,
    maxEmbedVisitors: Infinity,
    maxEmbedSites: Infinity,
    integrations: true,
    saveMicroChats: true,
    privateCircles: true,
    customVisibility: true,
    desktopApp: true,
    analytics: true,
    moderation: true,
    apiAccess: true,
  },
  COMMUNITY: {
    name: "Community",
    priceMonthly: 9900,
    maxEmbedVisitors: Infinity,
    maxEmbedSites: Infinity,
    integrations: true,
    saveMicroChats: true,
    privateCircles: true,
    customVisibility: true,
    desktopApp: true,
    analytics: true,
    moderation: true,
    apiAccess: true,
    whiteLabel: true,
    customDomain: true,
    dedicatedSupport: true,
  },
} as const;

export const FOCUS = {
  AUTO_SUGGEST_IDLE_MS: 1_800_000, // 30 minutes
  FADE_IN_MS: 500,
  KEYBOARD_SHORTCUT: "Ctrl+Shift+F",
} as const;

export const PERFORMANCE = {
  MAX_PAGE_LOAD_IMPACT_MS: 50,
  MAX_MEMORY_MB: 20,
  EMBED_MAX_GZIPPED_KB: 15,
} as const;

export const DATA_RETENTION = {
  WEB_TRAIL_DAYS: 30,
  CHAT_EXPIRY_HOURS: 24,
  ACCOUNT_DELETION_DAYS: 30,
} as const;

export const STRIPE_CONFIG = {
  GRACE_PERIOD_DAYS: 7,
} as const;

export const CONNECTION = {
  MAX_WS_PER_USER: 5,
} as const;

export const CORS_ALLOWED_ORIGINS = [
  "https://nonley.com",
  "https://www.nonley.com",
  "https://nonley.app",
  "https://nonley.io",
] as const;
