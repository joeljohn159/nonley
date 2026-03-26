# Nonley Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database (PostgreSQL)](#database-postgresql)
4. [Redis](#redis)
5. [Presence Engine](#presence-engine)
6. [Web App](#web-app)
7. [Chrome Extension](#chrome-extension)
8. [Embed Widget](#embed-widget)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Observability](#monitoring--observability)
11. [Scaling Guide](#scaling-guide)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.1.0
- PostgreSQL 15+
- Redis 7+
- Stripe account with configured products
- Google OAuth credentials
- GitHub OAuth credentials
- Domain: nonley.com (or your domain)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/nonley/nonley.git
cd nonley
pnpm install
```

### 2. Configure Environment Variables

Copy the example and fill in all values:

```bash
cp .env.example .env.local
```

**Required variables:**

| Variable                 | Description                   | Example                                   |
| ------------------------ | ----------------------------- | ----------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string  | `postgresql://user:pass@host:5432/nonley` |
| `REDIS_URL`              | Redis connection string       | `redis://:pass@host:6379`                 |
| `NEXTAUTH_SECRET`        | Random 32-byte secret         | `openssl rand -base64 32`                 |
| `NEXTAUTH_URL`           | Web app public URL            | `https://nonley.com`                      |
| `ENCRYPTION_KEY`         | 32-byte hex key for AES-256   | `openssl rand -hex 32`                    |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID        | From Google Cloud Console                 |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth secret           | From Google Cloud Console                 |
| `GITHUB_CLIENT_ID`       | GitHub OAuth app ID           | From GitHub Developer Settings            |
| `GITHUB_CLIENT_SECRET`   | GitHub OAuth secret           | From GitHub Developer Settings            |
| `STRIPE_SECRET_KEY`      | Stripe secret key             | `sk_live_...`                             |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key        | `pk_live_...`                             |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret | `whsec_...`                               |
| `PRESENCE_ENGINE_URL`    | WebSocket server URL          | `wss://presence.nonley.com`               |
| `NEXT_PUBLIC_APP_URL`    | Public web app URL            | `https://nonley.com`                      |
| `NEXT_PUBLIC_WS_URL`     | Public WebSocket URL          | `wss://presence.nonley.com`               |

### 3. Generate Secrets

```bash
# NextAuth secret
openssl rand -base64 32

# Encryption key (32 bytes = 64 hex chars)
openssl rand -hex 32
```

---

## Database (PostgreSQL)

### Option A: Managed (Recommended)

Use a managed PostgreSQL provider:

- **Neon** (serverless, recommended for starting) - neon.tech
- **Supabase** - supabase.com/database
- **Railway** - railway.app
- **AWS RDS** / **Google Cloud SQL** (for scale)

### Option B: Self-hosted

```bash
docker run -d \
  --name nonley-postgres \
  -e POSTGRES_DB=nonley \
  -e POSTGRES_USER=nonley \
  -e POSTGRES_PASSWORD=your-secure-password \
  -p 5432:5432 \
  -v nonley-pgdata:/var/lib/postgresql/data \
  postgres:15-alpine
```

### Initialize Schema

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (for initial setup)
pnpm db:push

# Or use migrations (recommended for production)
pnpm db:migrate
```

### Create Admin User

After first login via OAuth, promote yourself to admin:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

---

## Redis

### Option A: Managed (Recommended)

- **Upstash** (serverless, recommended) - upstash.com
- **Redis Cloud** - redis.com/cloud
- **Railway** - railway.app
- **AWS ElastiCache** / **Google Memorystore** (for scale)

### Option B: Self-hosted

```bash
docker run -d \
  --name nonley-redis \
  -p 6379:6379 \
  -v nonley-redis:/data \
  redis:7-alpine redis-server --requirepass your-redis-password
```

---

## Presence Engine

The presence engine is a Node.js WebSocket server. Deploy it as a long-running process.

### Option A: Railway (Recommended for start)

```bash
# Create Railway project
railway init

# Deploy
railway up --service presence-engine

# Set environment variables in Railway dashboard
# Point to: packages/presence-engine
# Build command: pnpm --filter @nonley/presence-engine build
# Start command: node packages/presence-engine/dist/index.js
```

### Option B: Fly.io

Create `fly.toml` in `packages/presence-engine/`:

```toml
app = "nonley-presence"
primary_region = "dfw"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true

  [[http_service.checks]]
    path = "/health"
    interval = "30s"
    timeout = "5s"

[env]
  NODE_ENV = "production"
  PRESENCE_ENGINE_PORT = "3001"
```

Create `Dockerfile` in `packages/presence-engine/`:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/presence-engine/package.json packages/presence-engine/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/crypto/package.json packages/crypto/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY packages/config/ packages/config/
COPY packages/crypto/ packages/crypto/
COPY packages/presence-engine/ packages/presence-engine/

RUN pnpm --filter @nonley/types build && \
    pnpm --filter @nonley/config build && \
    pnpm --filter @nonley/crypto build && \
    pnpm --filter @nonley/presence-engine build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/package.json ./packages/config/
COPY --from=builder /app/packages/crypto/dist ./packages/crypto/dist
COPY --from=builder /app/packages/crypto/package.json ./packages/crypto/
COPY --from=builder /app/packages/presence-engine/dist ./packages/presence-engine/dist
COPY --from=builder /app/packages/presence-engine/package.json ./packages/presence-engine/
COPY --from=builder /app/packages/presence-engine/prisma ./packages/presence-engine/prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter @nonley/presence-engine db:generate

EXPOSE 3001
CMD ["node", "packages/presence-engine/dist/index.js"]
```

Deploy:

```bash
cd packages/presence-engine
fly deploy
fly secrets set DATABASE_URL="..." REDIS_URL="..." NEXTAUTH_SECRET="..."
```

### WebSocket Reverse Proxy (Nginx)

If using a reverse proxy:

```nginx
upstream presence {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl;
    server_name presence.nonley.com;

    ssl_certificate /etc/ssl/certs/nonley.com.pem;
    ssl_certificate_key /etc/ssl/private/nonley.com.key;

    location / {
        proxy_pass http://presence;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Health Check

Verify the engine is running:

```bash
curl https://presence.nonley.com/health
# {"status":"ok","timestamp":"2026-03-26T..."}

curl https://presence.nonley.com/ready
# {"status":"ready"}
```

---

## Web App

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from monorepo root
vercel --prod

# Configure in Vercel Dashboard:
# - Root Directory: apps/web
# - Framework: Next.js
# - Build Command: pnpm --filter @nonley/web build
# - Install Command: pnpm install
```

**Important Vercel settings:**

- Add all environment variables in the Vercel dashboard
- Set `NEXTAUTH_URL` to your production URL
- Add the Prisma schema path if needed: `PRISMA_SCHEMA=../../packages/presence-engine/prisma/schema.prisma`

### Option B: Docker

Create `Dockerfile` in `apps/web/`:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @nonley/types build && \
    pnpm --filter @nonley/config build && \
    pnpm --filter @nonley/crypto build && \
    pnpm --filter @nonley/ui build && \
    pnpm --filter @nonley/presence-client build && \
    pnpm --filter @nonley/presence-engine db:generate && \
    pnpm --filter @nonley/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
```

### Stripe Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://nonley.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### Domain & SSL

Configure your DNS:

```
nonley.com          A       → Vercel/Server IP
www.nonley.com      CNAME   → nonley.com
presence.nonley.com A       → Presence engine IP
```

---

## Chrome Extension

### Build

```bash
pnpm --filter @nonley/extension build
```

The built extension is in `apps/extension/dist/`.

### Chrome Web Store Submission

1. Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 registration fee
3. Zip the `dist/` directory:
   ```bash
   cd apps/extension/dist
   zip -r ../nonley-extension.zip .
   ```
4. Upload `nonley-extension.zip` to the Developer Dashboard
5. Fill in the listing:
   - Name: Nonley
   - Description: "You are never alone on the internet. See who's on the same page as you."
   - Category: Social & Communication
   - Add screenshots (1280x800 or 640x400)
   - Add icon (128x128)
6. Submit for review (takes 1-7 days)

**Important:** Before submission, update the WebSocket URL in `chrome.storage` defaults to point to production `wss://presence.nonley.com`.

### Icons

You need to create extension icons before publishing:

- `icons/icon-16.png` (16x16)
- `icons/icon-48.png` (48x48)
- `icons/icon-128.png` (128x128)

---

## Embed Widget

### Build

```bash
pnpm --filter @nonley/embed build
```

Output: `apps/embed/dist/embed.js`

### CDN Distribution

Upload `embed.js` to a CDN:

**Option A: CloudFlare R2 + Workers**

```bash
# Upload to R2 bucket
wrangler r2 object put nonley-cdn/embed.js --file apps/embed/dist/embed.js
```

**Option B: AWS S3 + CloudFront**

```bash
aws s3 cp apps/embed/dist/embed.js s3://nonley-cdn/embed.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=3600"
```

**Option C: Vercel Edge**

Deploy as a static file alongside the web app.

### Usage

Site owners add this to their HTML:

```html
<script
  src="https://cdn.nonley.com/embed.js"
  data-site="YOUR_SITE_ID"
  async
></script>
```

With customization:

```html
<script
  src="https://cdn.nonley.com/embed.js"
  data-site="YOUR_SITE_ID"
  data-position="bottom-left"
  data-color-primary="#6366f1"
  data-color-bg="#1e1e2e"
  data-chat="true"
  data-branding="false"
  async
></script>
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm typecheck
      - run: pnpm lint

  deploy-web:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod

  deploy-presence:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --config packages/presence-engine/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-embed:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @nonley/embed build
      - uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl public-read --cache-control "public, max-age=3600"
        env:
          AWS_S3_BUCKET: nonley-cdn
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: apps/embed/dist
```

---

## Monitoring & Observability

### Health Checks

- Web App: `https://nonley.com/api/health` (add this route)
- Presence Engine: `https://presence.nonley.com/health`
- Database: Checked via `/ready` endpoint

### Recommended Stack

- **Uptime monitoring**: BetterUptime, Checkly, or UptimeRobot
- **Error tracking**: Sentry (`@sentry/nextjs` for web, custom for presence engine)
- **Analytics**: Plausible (self-hosted or cloud) or PostHog
- **Logging**: Axiom, Datadog, or Logtail
- **APM**: Datadog or New Relic (once at scale)

### Key Metrics to Monitor

| Metric                | Alert Threshold               |
| --------------------- | ----------------------------- |
| WebSocket connections | > 10K per instance            |
| Redis memory          | > 80% capacity                |
| Room count (stale)    | Rooms with 0 heartbeats > 100 |
| API latency p99       | > 500ms                       |
| Error rate            | > 1% of requests              |
| Database connections  | > 80% pool                    |

---

## Scaling Guide

### Stage 1: 0-10K Users

- Single presence engine instance
- Single Redis instance
- PostgreSQL with connection pooling (PgBouncer or Prisma Accelerate)
- Vercel for web app (auto-scales)

### Stage 2: 10K-100K Users

- Multiple presence engine instances behind a load balancer
- Add `@socket.io/redis-adapter` for cross-instance room broadcasting
- Redis Cluster or Sentinel for HA
- Read replicas for PostgreSQL
- CDN for embed widget with edge caching

### Stage 3: 100K-1M Users

- Hot path optimization (consider rewriting presence handler in Rust/Go)
- Redis Cluster with multiple shards
- Database sharding or move presence-heavy reads to Redis entirely
- Geographic distribution (deploy presence engines in multiple regions)
- WebSocket connection routing based on geography

---

## Troubleshooting

### Common Issues

**"Missing required environment variable"**
-> Ensure all variables from `.env.example` are set in your deployment environment.

**WebSocket connection fails**
-> Check that your reverse proxy supports WebSocket upgrades. Verify the `wss://` URL is correct and SSL is properly configured.

**Prisma can't connect to database**
-> Ensure `DATABASE_URL` is correct and the database accepts connections from your server's IP. Check connection pooling limits.

**Redis connection refused**
-> Verify `REDIS_URL` includes the password if required. Check Redis is accepting remote connections.

**Extension not connecting**
-> The extension stores the WebSocket URL in `chrome.storage.local`. Ensure `wsUrl` is set to the production URL.

**Embed widget not appearing**
-> Check browser console for errors. Verify `data-site` attribute matches a registered site ID. Check CSP headers on the host site allow connections to `wss://presence.nonley.com`.

**Stale presence counts**
-> The cleanup job runs every 60 seconds. If counts seem stuck, check Redis connectivity and the heartbeat cleanup logs.

### Useful Commands

```bash
# Check database schema
pnpm db:studio

# View Redis state
redis-cli -u $REDIS_URL KEYS "room:*"
redis-cli -u $REDIS_URL SMEMBERS "room:{hash}:users"

# Check presence engine health
curl https://presence.nonley.com/health
curl https://presence.nonley.com/ready

# Rebuild all packages
pnpm clean && pnpm install && pnpm build
```
