# Nonley

**You are never alone on the internet.**

[![CI](https://img.shields.io/github/actions/workflow/status/nonley/nonley/ci.yml?branch=main&label=CI)](https://github.com/nonley/nonley/actions)
[![Coverage](https://img.shields.io/codecov/c/github/nonley/nonley)](https://codecov.io/gh/nonley/nonley)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Nonley is the presence layer of the internet. It shows you who else is experiencing the same webpage, video, song, or app at the same time -- turning every corner of the web into a shared space.

---

## Features

- **Real-time presence** -- See who else is on the same page, right now.
- **3-ring model** -- Presence is organized into Page, Site, and Global rings for layered awareness.
- **Ephemeral chat** -- Messages disappear by default. Conversations live in the moment unless explicitly saved.
- **Focus mode** -- When you need to concentrate, Nonley disappears completely.
- **Chrome extension** -- Manifest V3 extension that works on any website without modifying the host page.
- **Embeddable widget** -- Zero-dependency vanilla TypeScript widget that any site can drop in.

## Tech Stack

| Layer     | Technology                               |
| --------- | ---------------------------------------- |
| Language  | TypeScript (strict mode)                 |
| Web App   | Next.js 14+ (App Router)                 |
| Real-time | Socket.io + Redis                        |
| Database  | PostgreSQL via Prisma ORM                |
| Auth      | NextAuth.js (Google, GitHub, magic link) |
| Payments  | Stripe                                   |
| Build     | Turborepo + pnpm workspaces              |
| Styling   | Tailwind CSS                             |

## Monorepo Structure

| Path                       | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `apps/web`                 | Next.js 14+ App Router -- main web application    |
| `apps/extension`           | Chrome Manifest V3 extension (Preact + Vite)      |
| `apps/embed`               | Embeddable widget (vanilla TS, zero dependencies) |
| `packages/presence-engine` | Real-time server (Socket.io + Redis + Prisma)     |
| `packages/presence-client` | Shared WebSocket client library                   |
| `packages/types`           | Shared TypeScript types                           |
| `packages/ui`              | Shared React UI components                        |
| `packages/crypto`          | URL hashing (SHA-256) and AES-256-GCM encryption  |
| `packages/config`          | Shared constants, env config, URL helpers         |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Redis

### Setup

```bash
# Clone the repository
git clone https://github.com/nonley/nonley.git
cd nonley

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# Start all apps in development mode
pnpm dev
```

## Scripts

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Run all apps in development mode |
| `pnpm build`     | Build all packages and apps      |
| `pnpm test`      | Run unit tests                   |
| `pnpm test:e2e`  | Run end-to-end tests             |
| `pnpm lint`      | Lint all packages and apps       |
| `pnpm typecheck` | Type-check the entire monorepo   |
| `pnpm format`    | Format code with Prettier        |

## Documentation

- [Architecture](./docs/architecture.md)
- [Deployment](./docs/deployment.md)
- [Privacy Policy](./docs/privacy.md)
- [Terms of Service](./docs/terms.md)

## Contributing

We welcome contributions. Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).
