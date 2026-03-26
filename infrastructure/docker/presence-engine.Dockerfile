# ---------- base ----------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/presence-engine/package.json packages/presence-engine/
COPY packages/types/package.json packages/types/
COPY packages/crypto/package.json packages/crypto/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY packages/presence-engine/ packages/presence-engine/
COPY packages/types/ packages/types/
COPY packages/crypto/ packages/crypto/
COPY packages/config/ packages/config/
RUN pnpm --filter @nonley/presence-engine exec prisma generate
RUN pnpm --filter @nonley/presence-engine exec tsc

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/packages/presence-engine/dist ./dist
COPY --from=build /app/packages/presence-engine/node_modules ./node_modules
COPY --from=build /app/packages/presence-engine/package.json ./
COPY --from=build /app/node_modules/.pnpm node_modules/.pnpm

EXPOSE 3001
CMD ["node", "dist/index.js"]
