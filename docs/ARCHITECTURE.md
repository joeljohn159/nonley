# Nonley Architecture

## System Overview

Nonley is a presence layer for the internet. Users across different products (web app, browser extension, embed widget) connect to a shared presence engine that tracks who is on what page in real-time.

## High-Level Architecture

```
[Chrome Extension] ─────┐
[Web App]          ──────┤──── WebSocket ────── [Presence Engine] ──── [Redis]
[Embed Widget]     ──────┤                             │
[Mobile App]       ──────┘                       [PostgreSQL]
```

## Components

### Presence Engine (`packages/presence-engine`)

The core real-time server. All products connect here via WebSocket (Socket.io).

**Key concepts:**

- **Rooms**: Every URL/activity is a "room" identified by a SHA-256 hash
- **Ring 1**: Friends/circle members in the same room (Redis SINTER)
- **Ring 2**: Sampled neighbors (15 random non-friends, scored by shared interests)
- **Ring 3**: Anonymous crowd count (Redis INCR/DECR counter)
- **Heartbeat**: 30s interval, 90s timeout for departure detection
- **Sub-rooms**: Rooms with 50+ users shard into ~20-user sub-rooms

**Scaling path:**

- 10K users: Single server + Redis
- 100K users: Horizontal scaling, sticky sessions, Redis Cluster
- 1M users: Hot path migration to Rust/Go, Redis Cluster with read replicas

### Database (PostgreSQL via Prisma)

Schema defined in `packages/presence-engine/prisma/schema.prisma`.

Key tables: users, user_profiles, circles, circle_members, connections, micro_chats, micro_chat_messages, embed_sites, bot_profiles, admin_audit_logs.

NextAuth tables: accounts, sessions, verification_tokens.

### Redis

Used for ephemeral presence state:

- Room user sets (`room:{hash}:users`)
- Room counters (`room:{hash}:count`)
- User heartbeats (`hb:{userId}:{roomHash}`)
- Friend lists (`user:{userId}:friends`)
- Rate limiting keys

### Web App (`apps/web`)

Next.js 14+ App Router. Server-side auth with NextAuth.js. Client state with Zustand. Server state with TanStack Query.

### Chrome Extension (`apps/extension`)

Manifest V3. Background service worker maintains a single WebSocket connection shared across all tabs. Content scripts inject a Shadow DOM bubble on every page. Preact popup for settings.

### Embed Widget (`apps/embed`)

Zero-dependency vanilla TypeScript. Compiles to a single IIFE script (<15KB gzipped). Shadow DOM isolation. WebSocket connection to presence engine.

## Authentication Flow

1. User signs in via Google/GitHub OAuth or email magic link (NextAuth.js)
2. Session stored in database (not JWT sessions)
3. For WebSocket auth: client requests a JWT from the web app API
4. JWT is sent in WebSocket handshake `auth.token`
5. Presence engine verifies JWT using NEXTAUTH_SECRET

## Chat Architecture

Three layers with increasing commitment:

1. **Reactions**: Real-time WebSocket events only, not stored in database
2. **Whispers**: 1:1 ephemeral chats, stored in `micro_chats` with 24h expiry
3. **Room Chat**: Group chat for sub-room members, stored with 24h expiry

## Privacy Architecture

- URLs are SHA-256 hashed before storage
- Integration tokens encrypted with AES-256-GCM
- Per-site visibility controls (ghost/anonymous/circles_only/open)
- Focus mode: complete UI disappearance, still counted in rooms
- No page content reading, no keystroke logging, no mouse tracking
