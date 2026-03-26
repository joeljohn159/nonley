# CLAUDE.md -- Instructions for Claude Code Sessions

## Project Overview

Nonley ("Not-Lonely") is the presence layer of the internet. It shows users who else is experiencing the same webpage, video, song, or app at the same time. This is a monorepo containing multiple products sharing one presence engine.

## Quick Reference

- **Package manager**: pnpm (with workspaces)
- **Build system**: Turborepo
- **Language**: TypeScript (strict mode, no `any` types)
- **Database**: PostgreSQL via Prisma ORM
- **Real-time**: Socket.io + Redis
- **Auth**: NextAuth.js (Google, GitHub, email magic link)
- **Payments**: Stripe

## Monorepo Structure

```
apps/
  web/              -- Next.js 14+ App Router (main web app)
  extension/        -- Chrome Manifest V3 extension (Preact + Vite)
  embed/            -- Embeddable widget (vanilla TS, zero deps)
  mobile/           -- React Native + Expo (Phase 2)
  desktop/          -- Tauri app (Phase 3)
packages/
  presence-engine/  -- Real-time server (Socket.io + Redis + Prisma)
  presence-client/  -- Shared WebSocket client library
  types/            -- Shared TypeScript types
  ui/               -- Shared React UI components
  crypto/           -- URL hashing (SHA-256) and AES-256-GCM encryption
  config/           -- Shared constants, env config, URL helpers
```

## Common Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode
pnpm build                # Build all packages and apps
pnpm typecheck            # Type-check everything
pnpm lint                 # Lint everything
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate           # Run Prisma migrations
pnpm db:studio            # Open Prisma Studio
```

## Code Style

- TypeScript strict mode everywhere. Never use `any`.
- ESLint with strict config. Prettier for formatting.
- Import order: builtins, external, internal, parent, sibling, index.
- Use `export type` for type-only exports.
- Tailwind CSS for styling. Use the `nonley-*` color tokens.
- React components use function declarations, not arrow functions.

## Architecture Rules

- The presence engine stores only hashed URLs (SHA-256), never raw URLs.
- All integration tokens are encrypted at rest (AES-256-GCM).
- WebSocket connections use WSS. HTTP uses HTTPS.
- No raw SQL. All queries go through Prisma.
- Bot profiles (`is_bot=true`) are excluded from all public API responses.
- The Chrome extension renders in Shadow DOM. It never modifies host page DOM or CSS.
- The embed widget is zero-dependency vanilla TypeScript.

## Design Principles

1. Present, not performative (no follower counts, no likes)
2. Whisper, not shout (small, peripheral, non-intrusive UI)
3. Ephemeral by default (chats disappear unless saved)
4. Serendipity over algorithm (shared context is the matching engine)
5. Warm, not cold (soft colors, gentle animations)
6. Ghost-proof privacy (per-site visibility controls)
7. Zero distraction mode (focus mode = Nonley disappears completely)
8. Never feel AI-generated (every interaction feels handcrafted)

## Security Non-Negotiables

- No passwords stored. Auth is magic link or OAuth only.
- Rate limiting: 100 req/min standard, 10 req/min auth.
- JWT tokens expire in 24 hours.
- CORS restricted to nonley.com, nonley.app, registered embed domains.
- XSS prevention: React escaping + DOMPurify for raw HTML.
- Extension requests minimal permissions (activeTab, storage only).

## Source of Truth

Read `PROMPT.md` for the full product blueprint. It contains complete specifications for every feature, database schema, payment plans, privacy policy, and marketing bot system.
