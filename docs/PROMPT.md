# PROMPT.md -- Nonley Company Blueprint

This document is the single source of truth for building Nonley. Every Claude Code session, every developer, every decision references this file. Read it completely before writing any code.

---

## Company

Name: Nonley
Meaning: Not-Lonely. The internet is a solo experience. Nonley makes it shared.
Domain: nonley.com (primary), nonley.app, nonley.io
Tagline: You are never alone on the internet.
Legal entity: Nonley Inc.
Founded: 2026
Headquarters: Denton, Texas, United States

---

## Mission

Build the presence layer of the internet. Every webpage, every video, every song, every app, every physical place -- Nonley shows you who else is experiencing the same thing as you, right now. Not a social network. Not a chat app. A quiet, ambient awareness that the internet has other people in it.

---

## Design Philosophy

Nonley is invisible until it matters. It should feel like peripheral vision -- you know someone is nearby without staring at them. The product must follow these principles at all times:

1. Present, not performative. No follower counts. No likes. No public metrics. The value is in being together, not performing for each other.
2. Whisper, not shout. The UI is always small, peripheral, non-intrusive. It never covers content. It never interrupts reading. It never demands attention. It sits in the corner like a candle in a quiet room.
3. Ephemeral by default. Micro-chats disappear after the session ends unless both people explicitly save them. This removes the anxiety of permanent record.
4. Serendipity over algorithm. No algorithm decides who you see. You see people based on shared context -- same page, same song, same place. The internet itself is the matching engine.
5. Warm, not cold. Soft colors. Gentle animations. Optional subtle sounds. The product should feel like a campfire, not a control panel.
6. Ghost-proof privacy. Users control exactly what is shared. Ghost mode (invisible), presence-only (anonymous count), visible to circles, or fully open. Per-site and per-app controls.
7. Zero distraction mode. When a user activates focus mode, Nonley disappears completely. No bubble, no count, nothing. It returns when focus mode ends. Reading and working always come first.
8. Never feel AI-generated. Every piece of text, every animation, every interaction must feel handcrafted by humans who care deeply about the experience. No generic patterns. No template energy. Every pixel is intentional.

---

## Product Architecture

Nonley is a company with multiple products that share one presence engine. Each product is a separate codebase in a monorepo, independently deployable, but connected through shared infrastructure.

### Product 1: Nonley Web App (nonley.com)

The home base. Where users have accounts, profiles, circles, and the live activity map.

Repository: apps/web
Stack: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI
Database: PostgreSQL via Prisma ORM
Auth: NextAuth.js with Google, GitHub, email magic link
Real-time: Socket.io client connecting to the presence engine
Hosting: Vercel (frontend), Railway or Fly.io (API)
State: Zustand for client state, React Query for server state

Core screens:

- Live Map (home): Real-time visualization of where your network is across the web. Bubbles representing URLs/apps sized by how many connections are there. Click to drop in.
- Circles: Groups that form organically around shared browsing patterns, declared interests, or manual creation. Each circle has a member list, live online status, persistent chat thread, and shared link history.
- Profile: Not a bio page. A live signal. Currently browsing (opt-in), interests (auto-generated plus manual), circles, web trail (public breadcrumb of recent reads), warmth score (activity level, not vanity), wave button.
- Discovery: Browse public circles by topic, location, or activity. Trending URLs. People-like-you matching based on browsing overlap.
- Settings: Privacy controls per site, per app. Notification preferences. Connected integrations. Account management.
- Admin Panel: For Nonley team only. User management. Fake bot management (see Marketing section). Analytics. Moderation tools.

### Product 2: Nonley Chrome Extension

The primary distribution channel. Works on every webpage without any website owner doing anything. Every user who installs this becomes part of the presence network.

Repository: apps/extension
Stack: Chrome Manifest V3, TypeScript, Preact (lightweight UI), Tailwind
Permissions: Minimal. activeTab for URL reading. Storage for user preferences. WebSocket connection to presence engine. No broad host permissions. No page content reading. Only the URL.
Build: Vite with CRXJS plugin

How it works:

1. User installs extension from Chrome Web Store.
2. Extension authenticates with Nonley account (or creates one).
3. On every page load, extension sends to presence engine: user ID, current URL (hashed for privacy), visibility setting.
4. Presence engine returns: total count for this URL, Ring 1 people (friends/circle members), Ring 2 people (matched neighbors).
5. Extension renders a small floating bubble in the bottom-right corner showing the count.
6. Click to expand: see who is here, wave, react, or start a micro-chat.
7. Focus mode: user presses keyboard shortcut or clicks "focus" -- bubble disappears entirely until deactivated.

Collapsed state: A pill-shaped bubble, 40px tall, showing a green dot and a number. If friends are present, their tiny avatars appear. If nobody is here, the bubble shows a dim gray dot with "0" and fades to near-invisible.

Expanded state: A clean panel (max 320px wide, max 400px tall) showing Ring 1 (your people), Ring 2 (neighbors), Ring 3 (total count), and action buttons (wave, chat, react). Never covers more than 25% of viewport width.

Performance requirements: The extension must not slow down any page. It must not inject CSS into the host page. It must not modify DOM of the host page. It renders inside a shadow DOM container. It adds less than 50ms to page load. It uses less than 20MB of memory. WebSocket connection is shared across tabs, not per-tab.

### Product 3: Nonley Embed Widget

For website owners who want to add Nonley presence to their site natively, with more control and customization than the extension provides.

Repository: apps/embed
Stack: Vanilla TypeScript compiled to a single JS file. Zero dependencies. Shadow DOM for style isolation.
Distribution: CDN-hosted script tag or npm package (@nonley/embed).
Size: Under 15KB gzipped.

Integration:

```html
<script src="https://cdn.nonley.com/embed.js" data-site="SITE_ID"></script>
```

or

```bash
npm install @nonley/embed
```

```javascript
import { Nonley } from "@nonley/embed";
Nonley.init({ siteId: "SITE_ID" });
```

Features for site owners: Customizable position (bottom-right, bottom-left). Custom colors to match their brand. Analytics dashboard (when are people on your site, popular pages, dwell time). Moderation controls. Option to disable chat and only show presence count.

Viral mechanic: Free tier shows a small "Powered by Nonley" link. Users click it, discover Nonley, install the extension or create an account. This is the organic growth engine for site owner adoption.

### Product 4: Nonley Mobile App

Phase 2 product. Extends presence beyond the browser to location, music, and other mobile activities.

Repository: apps/mobile
Stack: React Native with Expo
Features: Location check-in (opt-in), currently playing audio detection, push notifications for circle activity, full main app functionality on mobile.

### Product 5: Nonley Desktop Companion

Phase 3 product. Detects active desktop applications (Figma, VS Code, Spotify, Steam, etc.) and reports them to the presence engine.

Repository: apps/desktop
Stack: Electron or Tauri (prefer Tauri for smaller binary size)
Features: Detect active application via OS APIs. Report to presence engine. System tray icon showing circle activity.

---

## Shared Infrastructure

### Presence Engine

The core of everything. A standalone real-time server that all products connect to.

Repository: packages/presence-engine
Stack: Node.js with Socket.io, Redis for presence state, PostgreSQL for persistence
Hosting: Dedicated server on Railway or Fly.io with Redis addon

Architecture:

- Every URL/activity is a "room" identified by a hash of the URL or activity identifier.
- Rooms with fewer than 50 users are single WebSocket rooms. All users receive all presence updates.
- Rooms with 50+ users are sharded into sub-rooms of approximately 20 users each. Each user connects to one sub-room.
- Total room count is a Redis counter. INCR on join, DECR on leave. O(1) cost regardless of room size.
- Ring 1 matching (friends): On user arrival, intersect user's friend list with the room's user set. Redis SINTER operation. O(min(N,M)) where N and M are set sizes.
- Ring 2 matching (neighbors): On user arrival, sample 15 users from the room. Score by shared interests, shared circles, geographic proximity, arrival time proximity. One-time computation, not continuous. Results cached for the session.
- Ring 3 (crowd): Just the Redis counter. Zero computation.
- Heartbeat: Every client sends a heartbeat every 30 seconds. If no heartbeat for 90 seconds, presence engine marks the user as departed and decrements the room counter.
- Graceful departure: When user closes tab or navigates away, extension/embed sends a departure event. Immediate decrement.

Scaling targets:

- 10,000 concurrent users: Single server with Redis. No sharding needed.
- 100,000 concurrent users: Horizontal scaling with sticky sessions. Multiple presence engine instances behind a load balancer. Redis Cluster for presence state.
- 1,000,000 concurrent users: Dedicated infrastructure. Consider migrating hot path to Rust or Go. Redis Cluster with read replicas. CDN for static embed assets.

### Database Schema (PostgreSQL)

```
users
  id              UUID PRIMARY KEY
  email           TEXT UNIQUE NOT NULL
  name            TEXT
  avatar_url      TEXT
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP DEFAULT NOW()
  privacy_default TEXT DEFAULT 'circles_only'  -- ghost, anonymous, circles_only, open
  focus_mode      BOOLEAN DEFAULT FALSE
  is_admin        BOOLEAN DEFAULT FALSE
  is_bot          BOOLEAN DEFAULT FALSE  -- for admin-created marketing bots

user_profiles
  user_id         UUID REFERENCES users(id) PRIMARY KEY
  bio             TEXT
  interests       TEXT[]  -- array of interest tags
  location_city   TEXT
  location_country TEXT
  web_trail_public BOOLEAN DEFAULT FALSE
  warmth_score    INTEGER DEFAULT 0

circles
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL
  description     TEXT
  type            TEXT DEFAULT 'manual'  -- manual, auto_detected, url_based
  is_public       BOOLEAN DEFAULT TRUE
  created_by      UUID REFERENCES users(id)
  created_at      TIMESTAMP DEFAULT NOW()

circle_members
  circle_id       UUID REFERENCES circles(id)
  user_id         UUID REFERENCES users(id)
  joined_at       TIMESTAMP DEFAULT NOW()
  role            TEXT DEFAULT 'member'  -- member, moderator, admin
  PRIMARY KEY (circle_id, user_id)

connections
  user_id         UUID REFERENCES users(id)
  connected_to    UUID REFERENCES users(id)
  created_at      TIMESTAMP DEFAULT NOW()
  PRIMARY KEY (user_id, connected_to)

site_privacy_rules
  user_id         UUID REFERENCES users(id)
  url_pattern     TEXT NOT NULL  -- domain or URL pattern
  visibility      TEXT NOT NULL  -- ghost, anonymous, circles_only, open
  PRIMARY KEY (user_id, url_pattern)

waves
  id              UUID PRIMARY KEY
  from_user       UUID REFERENCES users(id)
  to_user         UUID REFERENCES users(id)
  url_context     TEXT
  created_at      TIMESTAMP DEFAULT NOW()

micro_chats
  id              UUID PRIMARY KEY
  room_hash       TEXT NOT NULL
  created_at      TIMESTAMP DEFAULT NOW()
  expires_at      TIMESTAMP  -- NULL if saved by both users
  saved_by        UUID[]  -- array of user IDs who saved this chat

micro_chat_messages
  id              UUID PRIMARY KEY
  chat_id         UUID REFERENCES micro_chats(id)
  sender_id       UUID REFERENCES users(id)
  content         TEXT NOT NULL
  created_at      TIMESTAMP DEFAULT NOW()

integrations
  user_id         UUID REFERENCES users(id)
  provider        TEXT NOT NULL  -- spotify, steam, github, strava, goodreads
  access_token    TEXT  -- encrypted
  refresh_token   TEXT  -- encrypted
  connected_at    TIMESTAMP DEFAULT NOW()
  PRIMARY KEY (user_id, provider)

embed_sites
  id              UUID PRIMARY KEY
  owner_id        UUID REFERENCES users(id)
  domain          TEXT NOT NULL UNIQUE
  site_key        TEXT NOT NULL UNIQUE
  plan            TEXT DEFAULT 'free'  -- free, pro, team
  custom_colors   JSONB
  branding_hidden BOOLEAN DEFAULT FALSE
  created_at      TIMESTAMP DEFAULT NOW()

bot_profiles  -- admin-controlled fake presence for early marketing
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)  -- links to a users row with is_bot=TRUE
  behavior_type   TEXT NOT NULL  -- lurker, friendly, active
  active_urls     TEXT[]  -- URLs where this bot should appear
  active_hours    JSONB  -- time ranges when bot is active
  auto_wave       BOOLEAN DEFAULT FALSE
  created_at      TIMESTAMP DEFAULT NOW()
```

### Shared Packages

Repository: packages/

- packages/types -- Shared TypeScript types across all products.
- packages/presence-client -- WebSocket client library used by web app, extension, embed, mobile, and desktop. Handles connection, reconnection, heartbeat, room joining/leaving, event handling. One implementation, used everywhere.
- packages/ui -- Shared UI components (React) used by web app and mobile. The bubble, the expanded panel, the avatar stack, the wave animation.
- packages/crypto -- Encryption utilities for tokens, integration credentials, URL hashing.
- packages/config -- Shared configuration (API endpoints, WebSocket URLs, environment-specific settings).

---

## Monorepo Structure

```
nonley/
  apps/
    web/              -- Next.js main app
    extension/        -- Chrome extension
    embed/            -- Embeddable widget
    mobile/           -- React Native app (phase 2)
    desktop/          -- Tauri app (phase 3)
  packages/
    presence-engine/  -- Real-time server
    presence-client/  -- Shared WebSocket client
    types/            -- Shared TypeScript types
    ui/               -- Shared UI components
    crypto/           -- Encryption utilities
    config/           -- Shared configuration
  infrastructure/
    docker/           -- Docker configs for local dev
    terraform/        -- Infrastructure as code (later)
  docs/
    PROMPT.md         -- This file
    ARCHITECTURE.md   -- Technical architecture deep dive
    PRIVACY.md        -- Privacy policy
    TERMS.md          -- Terms of service
    DISCLAIMER.md     -- Legal disclaimers
  CLAUDE.md           -- Instructions for Claude Code sessions
  package.json        -- Root workspace config
  turbo.json          -- Turborepo config
  .env.example        -- Environment variable template
```

Package manager: pnpm with workspaces.
Build system: Turborepo for parallel builds and caching.
Language: TypeScript everywhere. Strict mode. No any types.
Linting: ESLint with strict config. Prettier for formatting.
Testing: Vitest for unit tests. Playwright for E2E tests on the web app. Extension testing with Chrome Extension test utilities.

---

## Security

### Non-Negotiable Security Requirements

1. All WebSocket connections use WSS (encrypted).
2. All HTTP traffic uses HTTPS.
3. User passwords are never stored. Auth is magic link or OAuth only.
4. Integration tokens (Spotify, Steam, etc.) are encrypted at rest using AES-256-GCM. Encryption key is stored in environment variables, never in code.
5. URL hashing: The presence engine stores hashed URLs (SHA-256), not raw URLs. This prevents anyone with database access from reconstructing browsing history.
6. Rate limiting on all API endpoints. 100 requests per minute per user for standard endpoints. 10 requests per minute for auth endpoints.
7. WebSocket connections are authenticated with a JWT token that expires in 24 hours. Tokens are refreshed silently.
8. CORS is restricted to nonley.com, nonley.app, and registered embed domains.
9. Content Security Policy headers on all web responses.
10. SQL injection prevention via Prisma parameterized queries. No raw SQL anywhere.
11. XSS prevention: All user-generated content is sanitized before rendering. React's default escaping plus DOMPurify for any raw HTML.
12. The Chrome extension requests minimal permissions. It does not read page content. It does not inject scripts into pages. It only reads the URL from the activeTab API.
13. Bot profiles (marketing bots) are only accessible to admin users. The API endpoint for managing bots requires admin authentication and is not documented publicly.
14. All admin actions are logged in an audit table with timestamp, admin user ID, action type, and affected resource.

### Penetration Testing Checklist

Before any public launch:

- WebSocket injection testing
- JWT token manipulation testing
- Rate limit bypass testing
- IDOR (Insecure Direct Object Reference) testing on all API endpoints
- Extension permission escalation testing
- Embed widget cross-origin testing
- Database credential rotation procedure documented and tested

---

## Payments

Provider: Stripe
Integration: Stripe Checkout for subscription creation. Stripe Customer Portal for subscription management. Stripe Webhooks for subscription lifecycle events.

Plans:

Free:

- Chrome extension with full presence on any page
- Web app with full access
- Join unlimited circles
- Manual check-ins for activities
- 1 embed site with Nonley branding and up to 20 concurrent visitors

Pro ($7/month billed monthly, $5/month billed annually):

- All integrations (Spotify, Steam, GitHub, Strava, Goodreads)
- Save micro-chat history
- Create private circles
- Custom visibility rules per site/app
- Priority neighbor matching
- Desktop companion app access
- Remove branding on 1 embed site, up to 200 concurrent visitors

Site ($29/month):

- Everything in Pro
- Unlimited embed visitors
- Analytics dashboard for site owners
- Moderation tools
- Custom widget styling
- API access
- Multiple sites under one account

Community ($99/month):

- Everything in Site
- White-label the widget completely
- Branded circle pages
- Admin and member management tools
- Custom domain for circle pages
- Dedicated support

Stripe implementation:

- Webhook events to handle: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- Implement grace period: 7 days after payment failure before downgrading
- Store Stripe customer ID and subscription ID in users table
- Use Stripe's test mode for all development. Never use live keys in development.

---

## Marketing Bots (Admin Only)

In the early days before organic critical mass, the product needs to feel alive. Empty rooms kill social products. The admin panel includes a bot management system.

How it works:

1. Admin creates bot accounts through the admin panel. These are real user records in the database with is_bot=TRUE.
2. Each bot has a profile: name, avatar, interests, behavior type (lurker, friendly, active).
3. Each bot has a list of URLs where it should appear (popular pages, documentation sites, trending articles).
4. Each bot has active hours (to simulate realistic timezone behavior).
5. The presence engine has a bot scheduler that connects bots to their assigned rooms during active hours. Bots appear as regular users in the room.
6. Friendly bots can auto-wave at new users who arrive. Active bots can send pre-written micro-chat messages from a curated library of natural conversation starters.
7. Bot behavior must be indistinguishable from real user behavior. Response timing has random delays (2-15 seconds). Message content varies. Bots do not respond to every message.
8. As real user count grows, bots are gradually retired. The admin panel shows a dashboard comparing real users vs. bots per room. Target: bots drop below 10% of active users within 6 months.
9. Bot accounts are never exposed through the API. The is_bot field is excluded from all public API responses. Only admin endpoints return bot data.
10. All bot interactions are clearly logged internally for transparency if ever audited.

Ethics note: This system exists solely to solve the cold-start problem that kills every social product. It is not used to deceive users about engagement metrics shown externally, inflate numbers to investors, or generate fake testimonials. Once organic usage reaches critical mass, bots are fully retired and the system is disabled.

---

## Focus Mode

Focus mode is a first-class feature, not an afterthought. When a user is reading, working, or concentrating, Nonley must disappear completely.

Activation:

- Keyboard shortcut: Ctrl+Shift+F (customizable)
- Click the focus icon in the bubble
- Scheduled: user can set focus hours (e.g., 9am-12pm every weekday)
- Auto-detect: if user has not interacted with the bubble for 30 minutes and is actively scrolling/reading, offer to enable focus mode via a one-time subtle suggestion

Behavior in focus mode:

- The bubble disappears entirely. Not minimized, not faded. Gone.
- No notifications of any kind.
- No sounds.
- The user is still counted in room presence (others can see them), but the user sees nothing from Nonley.
- When focus mode ends, the bubble gently fades back in over 500ms with a brief summary: "While you were focused: 2 waves, 1 new person in your Rust circle."

Focus mode is stored locally in the extension and synced to the server. If the user enables focus mode on the extension, the web app and mobile app also respect it.

---

## Chat System

Chat exists in Nonley but it is not the product. Presence is the product. Chat is one of several ways people can act on presence. The chat system has three layers, each with increasing commitment. Users naturally graduate from reactions to whispers to room chat as comfort grows.

### Layer 1: Reactions (zero effort, zero commitment)

Reactions are the lightest possible social signal. You see people are here. You tap a reaction. It appears briefly on their screen. No conversation started. No reply expected.

Available reactions (exactly 5, no more):

- Wave (hand) -- "hey, I see you"
- Nod (checkmark) -- "I agree" or "same"
- Lightbulb -- "this is interesting"
- Question mark -- "I am confused about this"
- Fire -- "this is great"

Behavior:

- Reactions float up from the bubble as a small icon, visible for 3 seconds, then fade.
- No reaction history. No reaction counts. No record that a reaction happened.
- A user can send 1 reaction per 10 seconds to prevent spam.
- Reactions are broadcast to all users in the same sub-room (Ring 1 and Ring 2 only, not all 100K users).
- Receiving a reaction makes the sender's avatar glow briefly in the panel. That is the only acknowledgment.

### Layer 2: Whispers (one-on-one, ephemeral)

A whisper is a short private message sent to a specific person you can see in the presence panel.

Behavior:

- Click on a person's avatar in the expanded panel. A small text input appears inline below their name.
- Maximum 280 characters per message. No images. No files. No links (links are stripped to prevent spam and phishing).
- Whispers are strictly one-on-one. There is no group whisper.
- Whispers are ephemeral. The entire conversation disappears when both users leave the page. If one leaves but the other stays, the conversation persists until the remaining user also leaves.
- Either user can tap "save this conversation" at any time. If saved, the conversation moves to the user's Nonley inbox on the web app and both users are prompted to connect.
- No typing indicators. No seen receipts. No online status within the whisper. This keeps the pressure low.
- Maximum 5 new whisper initiations per hour per user (rate limit to prevent spam).
- A user can block another user from within a whisper with one tap.

UI in extension:

- Whisper input appears inline in the expanded panel, directly below the recipient's avatar. No separate window. No popup.
- Messages appear in a minimal thread below the input. Maximum visible height: 200px with scroll.
- Closing the panel does not end the whisper. Re-opening the panel shows the ongoing thread.
- Background color of whisper messages uses var(--color-chat-bubble-self) for sent and var(--color-chat-bubble-other) for received.

### Layer 3: Room Chat (group, opt-in, ephemeral)

Room chat is an open conversation visible to everyone in the sub-room who opts in. It is not shown by default.

Behavior:

- A "chat" button appears in the expanded panel when 3 or more people are in the sub-room.
- Clicking "chat" opens a chat thread within the panel. Only users who explicitly open chat see the messages.
- Messages are broadcast to all users in the sub-room who have chat open.
- Maximum 280 characters per message. No images. No files. No links.
- Messages show first name and avatar only. No profile link. No full name. Privacy by default.
- Room chat disappears 24 hours after the last message, unless any participant saves the thread.
- Saving a room chat thread stores it in the user's Nonley inbox with a snapshot of participants and the URL context.
- Maximum 30 messages per hour per room (not per user). This prevents the chat from becoming a firehose. When the limit is reached, a gentle message says "Quiet hour. Chat reopens in [minutes]."
- Maximum 20 participants can have chat open simultaneously in one sub-room. Additional users see "Chat is full. You can still wave and whisper."

UI in extension:

- Room chat replaces the Ring 2 neighbor list in the expanded panel when activated. Users can switch between "people" view and "chat" view with a tab.
- Chat input is at the bottom. Messages scroll up. Newest at bottom.
- Compact design. Each message is one line: avatar (16px) + name (bold) + message. No timestamps visible by default (hover to see relative time).

### What Nonley Chat Is Not

- Not a messaging app. There is no inbox of ongoing conversations (unless whispers/chats are explicitly saved).
- Not persistent. Nothing survives the browsing session by default.
- Not a replacement for Discord, Slack, or iMessage. Nonley chat is contextual -- it exists because you are on the same page, watching the same video, in the same moment. When the moment passes, the chat passes with it.
- Not a dating feature. There are no "interested" buttons, no swiping, no matching beyond shared browsing context.

### Chat in the Database

The existing micro_chats and micro_chat_messages tables handle all three layers:

- Reactions are not stored in the database. They are real-time WebSocket events only.
- Whispers create a micro_chats row with type='whisper' and a two-element participants array.
- Room chats create a micro_chats row with type='room' and a multi-element participants array.
- Both whispers and room chats have expires_at set to 24 hours after creation. A cron job deletes expired rows nightly.
- When a user saves a conversation, their user ID is appended to the saved_by array and expires_at is set to NULL.

Updated micro_chats schema addition:

```
micro_chats (updated)
  id              UUID PRIMARY KEY
  room_hash       TEXT NOT NULL
  type            TEXT NOT NULL DEFAULT 'room'  -- 'whisper' or 'room'
  participants    UUID[] NOT NULL  -- user IDs involved
  created_at      TIMESTAMP DEFAULT NOW()
  expires_at      TIMESTAMP  -- NULL if saved by any user
  saved_by        UUID[]  -- array of user IDs who saved this chat
```

---

## Privacy and Legal

### Privacy Policy Summary (full document in PRIVACY.md)

What Nonley collects:

- Email address and name (for account creation)
- Hashed URLs of pages visited (only while extension is active and user is not in ghost mode)
- Activity data from connected integrations (Spotify listening history, Steam game status, etc.) only when explicitly connected by the user
- Approximate location (city-level, only if user opts in)
- Micro-chat messages (deleted after session unless saved)

What Nonley never collects:

- Page content (text, images, forms, passwords)
- Browsing history (URLs are hashed and not stored beyond the active session unless user enables web trail)
- Keystrokes or mouse movements
- Data from other tabs or applications (extension only reads the active tab URL)
- Any data when in ghost mode or focus mode

What Nonley never sells:

- User data of any kind to any third party, ever.

Data retention:

- Active session presence data: Stored in Redis, deleted when user leaves the room.
- Micro-chat messages: Deleted 24 hours after session ends, unless saved.
- Web trail (if enabled): Rolling 30-day history. Older entries are permanently deleted.
- Account data: Retained until user deletes their account. Deletion is permanent and irreversible within 30 days of request.

GDPR compliance:

- Right to access: Users can export all their data from Settings.
- Right to deletion: Users can delete their account and all associated data.
- Right to portability: Data export includes all circles, connections, saved chats, and profile data in JSON format.
- Data Processing Agreement available for enterprise customers.

CCPA compliance:

- Do Not Sell My Personal Information link in footer.
- Annual data transparency report published on the website.

### Terms of Service Summary (full document in TERMS.md)

- Users must be 13 years or older.
- Users are responsible for the content they share in micro-chats.
- Nonley reserves the right to suspend accounts that violate community guidelines.
- Nonley is not responsible for the content of third-party websites where the extension operates.
- The embed widget is provided "as-is" to site owners. Nonley does not guarantee uptime.
- Pricing may change with 30 days notice to existing subscribers.

### Disclaimer Summary (full document in DISCLAIMER.md)

- Nonley does not monitor or moderate content on third-party websites.
- Nonley is not responsible for interactions between users that occur outside the platform.
- The presence count is approximate and may not reflect exact real-time numbers.
- Bot accounts used during early-stage growth are an internal tool and do not constitute fraud or misrepresentation.
- Nonley makes no guarantees about the identity of other users. Users interact at their own risk.
- Nonley is not a substitute for emergency services, mental health support, or professional advice.

### Cookie Policy

Nonley uses essential cookies only:

- Session authentication cookie (HTTP-only, secure, SameSite=Strict)
- User preference cookie (theme, focus mode schedule)
- No tracking cookies. No third-party cookies. No analytics cookies from third parties.

Analytics: Self-hosted Plausible Analytics or PostHog. No Google Analytics. No Facebook Pixel. No third-party tracking of any kind.

---

## Claude Code Session Management

### Memory Preservation

Every Claude Code session is finite. Before the context window fills or the session ends, Claude must preserve state so the next session can continue seamlessly.

At the end of every session (or when context is running low), Claude must:

1. Update CLAUDE.md in the repository root with:
   - What was completed in this session
   - What is in progress (with file paths and line numbers)
   - What should be done next (prioritized list)
   - Any bugs discovered but not yet fixed
   - Any architectural decisions made and the reasoning behind them
   - Current state of each product (web app, extension, embed, etc.)

2. Update a SESSION_LOG.md file with:
   - Session date and approximate duration
   - Summary of changes made
   - Files created or modified
   - Tests written or updated
   - Known issues introduced

3. Commit all changes with a clear commit message summarizing the session.

### CLAUDE.md Template

The CLAUDE.md file at repository root should always contain:

````markdown
# Nonley -- Claude Code Instructions

Read PROMPT.md first. It is the source of truth for all decisions.

## Current State

[Updated each session]

### Completed

- [List of completed features/tasks]

### In Progress

- [Feature]: [Current state, file paths, what remains]

### Next Up

1. [Highest priority task]
2. [Second priority]
3. [Third priority]

### Known Issues

- [Issue description]: [File path, how to reproduce]

### Decisions Made

- [Decision]: [Reasoning]

## Coding Standards

- TypeScript strict mode everywhere. Enable all strict flags in tsconfig: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes.
- No any types. Use unknown for truly dynamic data, then narrow with type guards.
- All functions have explicit return types. No implicit inference for exported functions.
- All components have Props interfaces defined and exported separately.
- Error handling: never swallow errors. Log them with context. Surface them to the user when appropriate. Every try/catch must log or rethrow.
- No console.log in production code. Use a structured logger (pino) with levels: error, warn, info, debug. Log as JSON for machine parsing.
- Database queries go through Prisma. No raw SQL anywhere. Use Prisma transactions for multi-step mutations.
- API routes validate all input with Zod schemas. Never trust client data. Validate on entry, not deeper in the stack.
- All user-facing text is in English. Internationalization structure ready but not populated (extracted string files, not hardcoded).
- Git commits are conventional: feat:, fix:, chore:, docs:, refactor:, test:. Enforced by commitlint in a pre-commit hook.
- Branch strategy: main is production. dev is staging. Feature branches off dev. PRs require at least passing CI before merge.

## Engineering Practices (2026 Standards)

### Package Management

Use pnpm exclusively. Not npm. Not yarn. pnpm enforces strict dependency trees with symlinks, prevents phantom dependencies (importing packages not in your package.json), and uses a content-addressable store that saves disk space across projects. All CI pipelines use pnpm. Lock file is pnpm-lock.yaml and must be committed.

pnpm workspace configuration (pnpm-workspace.yaml):

```yaml
packages:
  - "apps/*"
  - "packages/*"
```
````

### Build System

Turborepo orchestrates all builds, tests, and linting across the monorepo. Configure turbo.json with proper dependency graphs so packages build in the correct order and nothing rebuilds unnecessarily.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "env": ["NODE_ENV", "DATABASE_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

Enable Vercel Remote Caching so builds are shared between local dev, teammates, and CI. A developer pulling the latest code never rebuilds what CI already built.

### TypeScript Configuration

Base tsconfig in packages/typescript-config/base.json. All apps and packages extend it. Key settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

Run typecheck as a Turborepo task. CI fails on any type error. No exceptions, no ts-ignore without a linked issue explaining why.

### WebSocket Architecture (Critical Path)

The presence engine is the most performance-sensitive component. Architecture decisions:

Layer 1 (0-50K connections): Socket.io with @socket.io/redis-adapter. Redis Pub/Sub syncs events across multiple server instances. JWT authentication on WebSocket handshake. Connection limit of 5 per user (multi-tab). 30-second heartbeat interval with 90-second timeout.

Layer 2 (50K-500K connections): If Socket.io becomes a bottleneck at scale, migrate hot-path rooms (rooms with 1000+ users) to raw ws module (the same library Trello uses for 400K+ connections). Socket.io remains for smaller rooms where its room management and reconnection features add value.

Layer 3 (500K+ connections): Evaluate managed solutions (Ably, Pusher) for the broadcast layer, or write a custom presence service in Rust/Go that handles the fan-out while Node.js handles business logic.

Redis adapter setup (mandatory for horizontal scaling):

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

Connection state is stored in Redis, not in-memory. This means no sticky sessions required. Any server instance can serve any reconnecting client by reading state from Redis.

### API Design

REST for CRUD operations. WebSocket for real-time presence events. No GraphQL (unnecessary complexity for this product's data access patterns).

API versioning: All endpoints prefixed with /api/v1/. When breaking changes are needed, create /api/v2/ and maintain v1 for 6 months.

Response format (consistent across all endpoints):

```json
{
  "data": {},
  "error": null,
  "meta": { "requestId": "uuid", "timestamp": "ISO8601" }
}
```

Error response format:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  },
  "meta": { "requestId": "uuid", "timestamp": "ISO8601" }
}
```

Every API route follows this pattern:

1. Authenticate (middleware)
2. Validate input (Zod schema)
3. Authorize (does this user have permission?)
4. Execute business logic (service layer, not in the route handler)
5. Return consistent response

Business logic lives in service files (services/), not in route handlers. Route handlers are thin: validate, call service, return response. This makes services testable without HTTP.

### Database Practices

Prisma ORM for all database access. Migrations committed to version control. Seed scripts for development data.

Naming conventions: snake_case for table and column names. UUID for all primary keys (never auto-incrementing integers -- they leak information about row counts). created_at and updated_at on every table. Soft deletes where appropriate (deleted_at column) for data recovery.

Query performance: Add database indexes for all columns used in WHERE clauses and JOIN conditions. Use Prisma's explain feature during development to catch slow queries. Connection pooling via PgBouncer in production.

Migrations: Never edit a migration after it has been applied. Create a new migration to fix issues. Run migrations in CI against a test database before deploying to production.

### Testing Strategy

Unit tests: Vitest. Test business logic in service files. Mock external dependencies (database, Redis, third-party APIs). Coverage threshold: 80% for packages/presence-engine, 70% for apps/web.

Integration tests: Test API endpoints with real database (Docker Postgres in CI). Test WebSocket flows with real Redis.

E2E tests: Playwright for the web app. Test critical user flows: signup, circle creation, privacy settings, payment. Run in CI on every PR.

Extension tests: Manual testing checklist for each release. Automated tests for core logic (URL hashing, presence client, WebSocket connection) using Vitest.

Load tests: k6 for WebSocket load testing before any major release. Target: 10,000 concurrent connections on a single server instance with p99 latency under 200ms.

### CI/CD Pipeline

GitHub Actions. Every PR triggers:

1. pnpm install (cached)
2. turbo typecheck (type checking across all packages)
3. turbo lint (ESLint across all packages)
4. turbo test (all unit and integration tests)
5. turbo build (verify everything compiles)

Merge to dev triggers deployment to staging environment.
Merge to main triggers deployment to production (with manual approval gate).

Deployment:

- Web app: Vercel (automatic preview deploys on PR, production on main)
- Presence engine: Fly.io or Railway (Docker container, auto-scaling)
- Database: Neon or Supabase Postgres (branching for preview environments)
- Redis: Upstash (serverless Redis, auto-scaling) or Railway Redis addon

### Dependency Management

Run pnpm audit weekly. Fix critical and high vulnerabilities within 48 hours.
Use Renovate or Dependabot for automated dependency updates. Pin major versions. Allow minor and patch auto-merge if tests pass.
Keep the dependency count minimal. Before adding a package, ask: can this be done in 20 lines of code? If yes, write it. If no, add the package and document why in the PR.

### Logging and Observability

Structured logging with pino. Log level: info in production, debug in development.
Every log entry includes: timestamp, level, message, requestId (for tracing), userId (if authenticated), and relevant context.

Error tracking: Sentry for production error monitoring. Every unhandled exception and rejected promise is captured with full context.

Metrics: Track WebSocket connection count, room count, message throughput, API response times, and error rates. Use Prometheus + Grafana or a hosted solution (Datadog, Axiom).

Health checks: Every service exposes a /health endpoint that checks database connectivity, Redis connectivity, and returns uptime. Load balancers use this for routing decisions.

### Feature Flags

Use a feature flag system (PostHog feature flags, LaunchDarkly, or a simple Redis-backed implementation) for:

- Rolling out new features gradually (1% -> 10% -> 50% -> 100%)
- Killing a broken feature in production without deploying
- A/B testing different chat UI layouts or presence thresholds
- Enabling bot management tools only for admin users

Every new user-facing feature ships behind a flag. Flag is enabled for internal team first, then beta users, then general availability.

## Environment Variables

See .env.example for the complete list. Never hardcode secrets.

````

---

## Development Priorities (Build Order)

### Phase 1: Foundation (Month 1-2)

Priority 1: Presence engine
- WebSocket server with room management
- Redis integration for presence counters
- Heartbeat system
- URL hashing
- Ring 1/2/3 matching logic
- Unit tests for all matching algorithms

Priority 2: Chrome extension MVP
- Manifest V3 setup
- Authentication flow (connect to Nonley account)
- URL detection and hashing
- WebSocket connection to presence engine
- Collapsed bubble UI (count + avatars)
- Expanded panel UI (rings, wave button)
- Shadow DOM isolation
- Focus mode (keyboard shortcut + button)
- Performance budget enforcement (50ms load, 20MB memory)

Priority 3: Web app MVP
- User registration and authentication
- Profile creation and editing
- Privacy settings
- Circles CRUD (create, join, leave)
- Live map (basic version showing active rooms)
- Connections (add, remove, view)

### Phase 2: Growth Features (Month 3-4)

Priority 4: Embed widget
- Script tag integration
- Shadow DOM rendering
- Site owner dashboard
- Custom styling API
- Viral "Powered by Nonley" link

Priority 5: Micro-chat
- Real-time messaging within rooms
- Ephemeral by default (24-hour expiry)
- Save functionality
- Message history for saved chats

Priority 6: Stripe integration
- Subscription plans
- Checkout flow
- Customer portal
- Webhook handling
- Grace period logic

Priority 7: Admin panel
- User management
- Bot profile creation and management
- Bot scheduler
- Analytics dashboard (real users vs bots, room activity, growth metrics)

### Phase 3: Integrations (Month 5-6)

Priority 8: Spotify integration
Priority 9: YouTube enhanced detection (video ID extraction, show co-watchers)
Priority 10: GitHub integration (show repo activity)
Priority 11: Steam integration (game presence)

### Phase 4: Mobile and Desktop (Month 7+)

Priority 12: Mobile app (React Native)
Priority 13: Desktop companion (Tauri)
Priority 14: Additional integrations (Strava, Goodreads, etc.)

---

## Quality Standards

### Performance Budgets

- Web app: Lighthouse score above 90 on all metrics. First Contentful Paint under 1.5s. Time to Interactive under 3s.
- Extension: Page load impact under 50ms. Memory usage under 20MB. No layout shifts caused by the bubble.
- Embed widget: Script size under 15KB gzipped. Initialization under 100ms. No layout shifts.
- Presence engine: Room join latency under 200ms. Heartbeat processing under 10ms. 99.9% uptime target.

### Testing Requirements

- All presence engine matching algorithms have unit tests with edge cases.
- All API endpoints have integration tests.
- Extension has manual testing checklist for each release (10 most popular websites).
- Web app has E2E tests for critical flows: signup, circle creation, privacy settings.
- No PR is merged without tests for new functionality.

### Code Review Checklist

Before merging any code:
- Does it follow the design philosophy (invisible, warm, non-intrusive)?
- Does it handle errors gracefully with user-friendly messages?
- Does it respect privacy settings (ghost mode, focus mode)?
- Does it work in both light and dark mode?
- Is the text human-written, not template-generated?
- Are there no exposed secrets or hardcoded credentials?
- Does it pass the TypeScript strict mode compiler?
- Are all new dependencies justified and audited for security?

---

## UI/UX Specifications

### Color System (CSS Custom Properties)

Every color in every product is a CSS variable. No hardcoded hex values anywhere in components. To rebrand or adjust the entire product, change the variables in one file and everything updates.

The variable file lives at: packages/ui/styles/tokens.css

This file is imported by the web app, injected into the extension's shadow DOM, and bundled into the embed widget.

```css
:root {
  /* Brand */
  --color-primary: #6B5CE7;
  --color-primary-hover: #5A4BD6;
  --color-primary-active: #4A3BC5;
  --color-primary-subtle: #EDE9FC;
  --color-primary-text: #FFFFFF;

  --color-secondary: #2EC4B6;
  --color-secondary-hover: #25B0A3;
  --color-secondary-active: #1D9D91;
  --color-secondary-subtle: #E0F5F2;
  --color-secondary-text: #FFFFFF;

  --color-accent: #FF6B6B;
  --color-accent-hover: #FF5252;
  --color-accent-active: #FF3838;
  --color-accent-subtle: #FFE8E8;
  --color-accent-text: #FFFFFF;

  /* Backgrounds */
  --color-bg-page: #FAFAFA;
  --color-bg-surface: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-bg-sunken: #F3F4F6;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text */
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-text-inverse: #FFFFFF;
  --color-text-link: #6B5CE7;
  --color-text-link-hover: #5A4BD6;

  /* Borders */
  --color-border-default: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-border-subtle: #F3F4F6;
  --color-border-focus: #6B5CE7;

  /* Status */
  --color-success: #10B981;
  --color-success-subtle: #D1FAE5;
  --color-success-text: #065F46;
  --color-warning: #F59E0B;
  --color-warning-subtle: #FEF3C7;
  --color-warning-text: #92400E;
  --color-error: #EF4444;
  --color-error-subtle: #FEE2E2;
  --color-error-text: #991B1B;

  /* Presence-specific */
  --color-presence-online: #10B981;
  --color-presence-away: #F59E0B;
  --color-presence-offline: #9CA3AF;
  --color-presence-ghost: transparent;
  --color-bubble-bg: var(--color-bg-surface);
  --color-bubble-border: var(--color-border-default);
  --color-bubble-shadow: rgba(0, 0, 0, 0.08);
  --color-ring1-highlight: var(--color-primary-subtle);
  --color-ring2-highlight: var(--color-secondary-subtle);

  /* Chat-specific */
  --color-chat-bubble-self: var(--color-primary);
  --color-chat-bubble-self-text: var(--color-primary-text);
  --color-chat-bubble-other: var(--color-bg-sunken);
  --color-chat-bubble-other-text: var(--color-text-primary);
  --color-chat-input-bg: var(--color-bg-surface);
  --color-chat-input-border: var(--color-border-default);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-bubble: 0 2px 8px var(--color-bubble-shadow);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 22px;
  --font-size-2xl: 28px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
  --letter-spacing-tight: -0.01em;
  --letter-spacing-normal: 0em;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;

  /* Z-index scale */
  --z-bubble: 999990;
  --z-panel: 999991;
  --z-overlay: 999992;
  --z-modal: 999993;

  /* Breakpoints (for reference, used in media queries) */
  /* --bp-sm: 640px; */
  /* --bp-md: 768px; */
  /* --bp-lg: 1024px; */
  /* --bp-xl: 1280px; */
}

/* Dark mode -- same variable names, different values */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #8B7CF7;
    --color-primary-hover: #9B8EFF;
    --color-primary-active: #ABA0FF;
    --color-primary-subtle: #2A2550;
    --color-primary-text: #FFFFFF;

    --color-secondary: #3DD4C6;
    --color-secondary-hover: #4DE4D6;
    --color-secondary-active: #5DF4E6;
    --color-secondary-subtle: #1A3A36;
    --color-secondary-text: #FFFFFF;

    --color-accent: #FF8080;
    --color-accent-hover: #FF9999;
    --color-accent-active: #FFB3B3;
    --color-accent-subtle: #3D1F1F;
    --color-accent-text: #FFFFFF;

    --color-bg-page: #0F0F1A;
    --color-bg-surface: #1A1A2E;
    --color-bg-elevated: #16213E;
    --color-bg-sunken: #0A0A14;
    --color-bg-overlay: rgba(0, 0, 0, 0.7);

    --color-text-primary: #E8E8E8;
    --color-text-secondary: #9CA3AF;
    --color-text-tertiary: #6B7280;
    --color-text-inverse: #1A1A2E;
    --color-text-link: #8B7CF7;
    --color-text-link-hover: #9B8EFF;

    --color-border-default: #2D2D44;
    --color-border-strong: #3D3D5C;
    --color-border-subtle: #1F1F33;
    --color-border-focus: #8B7CF7;

    --color-success: #34D399;
    --color-success-subtle: #064E3B;
    --color-success-text: #A7F3D0;
    --color-warning: #FBBF24;
    --color-warning-subtle: #78350F;
    --color-warning-text: #FDE68A;
    --color-error: #F87171;
    --color-error-subtle: #7F1D1D;
    --color-error-text: #FECACA;

    --color-bubble-shadow: rgba(0, 0, 0, 0.3);
  }
}
````

Rules for using the color system:

1. Never use a hex value directly in any component, page, or stylesheet. Always use var(--color-\*).
2. When building Tailwind classes for the web app, extend the Tailwind config to map these variables into Tailwind's color system. Example: colors: { primary: 'var(--color-primary)' }.
3. The extension and embed widget import tokens.css directly into their shadow DOM scope.
4. When a site owner customizes embed colors, their overrides are injected as inline style variables on the embed container, which cascade over the defaults.
5. If the entire brand needs to change, edit tokens.css only. Zero changes needed in any component file.
6. All new UI work must pass a "variable audit" before merge: grep the diff for any raw hex value and reject it.

### Typography

Font family: var(--font-sans) for all UI text. var(--font-mono) for code contexts only.
Headings: var(--font-weight-semibold), var(--letter-spacing-tight)
Body: var(--font-weight-regular), var(--letter-spacing-normal)
Base size: var(--font-size-base) (15px)
Line height: var(--line-height-normal) for body, var(--line-height-tight) for headings

### Animation Principles

- Duration: var(--transition-fast) for micro-interactions (hover, click). var(--transition-normal) for transitions (panel open/close). var(--transition-slow) for focus mode fade in/out.
- Easing: ease-out for entering elements. ease-in for exiting elements. ease-in-out for state changes.
- No animation when prefers-color-scheme: reduced-motion is set. Wrap all animations and transitions in @media (prefers-reduced-motion: no-preference).
- The bubble breathes (very subtle scale oscillation, 0.98 to 1.02, 4-second cycle) when there are people present. This creates the feeling of life without being distracting. Uses var(--color-presence-online) for the glow.

### Responsive Behavior

- Extension bubble: Fixed position, bottom-right, var(--space-lg) from edges. On mobile-width viewports (under 768px), bubble moves to bottom-center.
- Web app: Fully responsive. Mobile-first design. Breakpoints at 640px, 768px, 1024px, 1280px.
- Embed widget: Adapts to container width. Minimum width 200px. Maximum width 400px.

---

## Launch Plan

### Pre-Launch (Week 1-2 before launch)

- Deploy all infrastructure to production.
- Seed 50 bot profiles across popular domains (GitHub, Hacker News, Stack Overflow, popular blogs).
- Invite 20 personal contacts for closed beta testing.
- Fix all critical bugs from beta.
- Record a 60-second demo video showing the product in action.
- Write launch blog post explaining the vision.
- Prepare ProductHunt listing.

### Launch Day

- Submit to Chrome Web Store (allow 3-5 business days for review before launch date).
- Publish on ProductHunt.
- Post on Hacker News (Show HN: Nonley -- the presence layer for the internet).
- Post on Reddit: r/SideProject, r/InternetIsBeautiful, r/webdev.
- Post on Twitter/X with demo video.
- Post on DEV.to with technical deep-dive article.

### Post-Launch (Week 1-4)

- Monitor error logs and fix issues within 24 hours.
- Respond to every comment on every launch platform.
- Gradually reduce bot presence as real users grow.
- Publish weekly changelog on the blog.
- Collect user feedback through in-app feedback widget.

---

## Metrics That Matter

Track these. Ignore vanity metrics.

- DAU (Daily Active Users): People who had the extension active and were present on at least one page.
- Concurrent Connections: Peak and average WebSocket connections per hour.
- Room Engagement Rate: Percentage of users who expanded the bubble (not just saw the count).
- Wave Rate: Number of waves sent per active user per day.
- Chat Initiation Rate: Percentage of room visits that resulted in a micro-chat.
- Circle Formation Rate: New circles created per week (both manual and auto-detected).
- Extension Retention: Percentage of users who still have the extension installed after 7 days, 30 days, 90 days.
- Embed Adoption: Number of new sites adding the embed per week.
- Bot Ratio: Percentage of active presence that is bots vs real users. Target: under 10% by month 6, 0% by month 12.

---

## Error Handling Philosophy

Users should never see a stack trace, a generic "Something went wrong", or a blank screen.

Every error has three components:

1. A human-readable message explaining what happened in plain language.
2. A suggested action the user can take (retry, check connection, contact support).
3. A logged error on the server with full context for debugging.

Examples:

- WebSocket disconnection: The bubble dims slightly and shows a subtle reconnecting animation. No popup. No alert. It reconnects silently and resumes. If reconnection fails after 30 seconds, the bubble shows a small offline indicator.
- API failure on profile load: Show cached data if available. If no cache, show a gentle placeholder with "Having trouble loading. Trying again..." and auto-retry every 10 seconds.
- Extension cannot reach the presence engine: Bubble shows a dim gray state. No error messages cluttering the host page.

---

## Notification Design

Notifications are the most dangerous feature in any social product. They can create addiction or annoyance. Nonley treats them with extreme care.

Rules:

- Maximum 3 notifications per day unless the user explicitly raises the limit.
- No notification badges with numbers. No red dots demanding attention.
- Notifications are grouped and delivered in a single digest, not individually.
- The default notification setting is "minimal" -- only waves and direct messages. Users must opt up, not opt down.
- Push notifications on mobile require explicit opt-in after the user has used the app for at least 3 days.
- No dark patterns. No "you have not opened Nonley in 3 days" re-engagement messages.
- The notification sound (if enabled) is a single soft tone, never repeating, never escalating.

---

## Moderation and Abuse Prevention

Micro-chats are the primary abuse vector. Nonley must protect users without creating a surveillance apparatus.

Approach:

- Users can block any other user with one tap. Blocked users are invisible to the blocker across all rooms.
- Users can report micro-chat messages. Reports go to the moderation queue in the admin panel.
- Repeat offenders (3+ reports from different users) are automatically shadow-banned. Their presence is still counted but they cannot initiate waves or chats.
- Content filtering: micro-chat messages are checked client-side against a local blocklist of slurs and explicit content. No server-side content scanning of message text for privacy reasons.
- Rate limiting on waves: maximum 10 waves per hour to prevent spam-waving.
- Rate limiting on micro-chats: maximum 5 new chat initiations per hour.

---

## Internationalization Readiness

The product launches in English. But the architecture is prepared for internationalization from day one.

- All user-facing strings are extracted into a locale file, not hardcoded in components.
- Date and time formatting uses the Intl API with the user's locale.
- The database schema supports UTF-8 throughout.
- Right-to-left layout support is not required at launch but the CSS structure does not prevent it.
- The name "Nonley" works across languages. It is not an English word that would confuse non-English speakers.

---

## Final Notes

Nonley is not a social media company. It is not a messaging company. It is not an analytics company.

Nonley is a presence company.

The entire internet was built for content. Nonley adds people.

Build it with care. Build it with warmth. Build it to last.

Every decision, every line of code, every pixel should answer one question: Does this make the internet feel less lonely?

If yes, ship it. If no, cut it.

---

End of PROMPT.md
