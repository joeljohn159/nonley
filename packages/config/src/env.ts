function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function validateEnv(): void {
  // Only validate on server-side (not in browser builds)
  if (typeof window !== "undefined") return;

  const requiredVars = [
    "DATABASE_URL",
    "REDIS_URL",
    "NEXTAUTH_SECRET",
    "ENCRYPTION_KEY",
  ];

  const missing = requiredVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}`,
    );
  }
}

export const env = {
  database: {
    get url() {
      return required("DATABASE_URL");
    },
  },
  redis: {
    url: optional("REDIS_URL", "redis://localhost:6379"),
  },
  auth: {
    get nextAuthUrl() {
      return optional("NEXTAUTH_URL", "http://localhost:3000");
    },
    get nextAuthSecret() {
      return required("NEXTAUTH_SECRET");
    },
    googleClientId: optional("GOOGLE_CLIENT_ID", ""),
    googleClientSecret: optional("GOOGLE_CLIENT_SECRET", ""),
    githubClientId: optional("GITHUB_CLIENT_ID", ""),
    githubClientSecret: optional("GITHUB_CLIENT_SECRET", ""),
  },
  stripe: {
    secretKey: optional("STRIPE_SECRET_KEY", ""),
    publishableKey: optional("STRIPE_PUBLISHABLE_KEY", ""),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET", ""),
  },
  presence: {
    url: optional("PRESENCE_ENGINE_URL", "ws://localhost:3001"),
    get port() {
      return parseInt(optional("PRESENCE_ENGINE_PORT", "3001"), 10);
    },
  },
  encryption: {
    get key() {
      return required("ENCRYPTION_KEY");
    },
  },
  app: {
    url: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    wsUrl: optional("NEXT_PUBLIC_WS_URL", "ws://localhost:3001"),
    cdnUrl: optional("NEXT_PUBLIC_CDN_URL", "http://localhost:3002"),
  },
} as const;
