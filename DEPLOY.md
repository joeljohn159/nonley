# Nonley - DigitalOcean Deployment Guide

## Architecture Overview

```
                    +-----------+
                    |  Cloudflare|  (DNS + SSL + CDN)
                    +-----+-----+
                          |
              +-----------+-----------+
              |                       |
        +-----v-----+         +------v------+
        |  Droplet 1 |         |  Droplet 2   |
        |  Next.js   |         |  Presence    |
        |  Web App   |         |  Engine      |
        |  (port 3000)|        |  (port 3001) |
        +-----+------+         +------+------+
              |                       |
        +-----v-----------------------v------+
        |    Managed PostgreSQL + Redis       |
        |    (DigitalOcean Managed Databases) |
        +-------------------------------------+
```

## Prerequisites

- DigitalOcean account
- Domain name (e.g., nonley.com) pointed to Cloudflare
- GitHub repo for the code
- Google OAuth credentials (for production auth)
- GitHub OAuth credentials (optional)
- Stripe account (for payments)

---

## Step 1: Create Infrastructure on DigitalOcean

### 1.1 Create a Managed PostgreSQL Database

1. Go to **Databases** > **Create Database Cluster**
2. Choose **PostgreSQL 16**
3. Plan: **Basic** ($15/mo - 1 vCPU, 1GB RAM, 10GB disk)
4. Region: Choose closest to your users (e.g., NYC1, SFO3)
5. Name: `nonley-db`
6. Click **Create Database Cluster**
7. Once ready, go to **Connection Details** and note:
   - Host, Port, Username, Password, Database name
   - Download the CA certificate
   - Connection string format: `postgresql://USER:PASS@HOST:PORT/DB?sslmode=require`

### 1.2 Create a Managed Redis Database

1. Go to **Databases** > **Create Database Cluster**
2. Choose **Redis 7**
3. Plan: **Basic** ($15/mo)
4. Same region as PostgreSQL
5. Name: `nonley-redis`
6. Note the connection string: `rediss://default:PASS@HOST:PORT`

### 1.3 Create Droplets

**Option A: Single Droplet (Budget - $12/mo)**

1. Go to **Droplets** > **Create Droplet**
2. Image: **Ubuntu 24.04 LTS**
3. Plan: **Basic** > $12/mo (2 vCPU, 2GB RAM)
4. Region: Same as databases
5. Authentication: **SSH Key** (add your public key)
6. Name: `nonley-app`
7. Enable **Monitoring**

**Option B: Two Droplets (Recommended - $24/mo)**

- Droplet 1: `nonley-web` (Next.js) - $12/mo
- Droplet 2: `nonley-engine` (Presence Engine) - $12/mo

---

## Step 2: Configure DNS (Cloudflare)

1. Add your domain to Cloudflare
2. Set DNS records:
   ```
   A     nonley.com        → Droplet IP (proxied)
   A     www.nonley.com    → Droplet IP (proxied)
   A     ws.nonley.com     → Engine Droplet IP (DNS only - not proxied)
   ```
3. SSL/TLS mode: **Full (strict)**
4. Enable **Always Use HTTPS**

> Note: WebSocket traffic (ws.nonley.com) should NOT be proxied through Cloudflare
> to avoid issues with long-lived connections. Set it to DNS-only (grey cloud).

---

## Step 3: Server Setup

SSH into your droplet(s):

```bash
ssh root@YOUR_DROPLET_IP
```

### 3.1 Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Git
apt install -y git

# Install Certbot (SSL - only needed if not using Cloudflare SSL)
# apt install -y certbot python3-certbot-nginx
```

### 3.2 Create App User

```bash
adduser --disabled-password nonley
usermod -aG sudo nonley
su - nonley
```

### 3.3 Clone and Build

```bash
cd /home/nonley
git clone https://github.com/YOUR_USER/nonley.git app
cd app

pnpm install --frozen-lockfile
pnpm build
```

---

## Step 4: Environment Variables

Create `/home/nonley/app/.env.production`:

```bash
# Database (from DigitalOcean managed DB connection details)
DATABASE_URL="postgresql://USER:PASS@HOST:25060/nonley?sslmode=require"

# Redis (from DigitalOcean managed Redis connection details)
REDIS_URL="rediss://default:PASS@HOST:25061"

# Auth - GENERATE NEW SECRETS FOR PRODUCTION
NEXTAUTH_URL="https://nonley.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# OAuth (get from Google Cloud Console / GitHub Developer Settings)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Presence Engine
PRESENCE_ENGINE_URL="wss://ws.nonley.com"
PRESENCE_ENGINE_PORT=3001

# Encryption - GENERATE A NEW KEY
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# App URLs
NEXT_PUBLIC_APP_URL="https://nonley.com"
NEXT_PUBLIC_WS_URL="wss://ws.nonley.com"
NODE_ENV="production"
```

**IMPORTANT**: Generate fresh secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

Copy the env file to the presence engine:

```bash
cp .env.production packages/presence-engine/.env
```

---

## Step 5: Database Migration

```bash
cd /home/nonley/app
export DATABASE_URL="your-production-database-url"
cd packages/presence-engine
npx prisma db push
```

---

## Step 6: Configure PM2

Create `/home/nonley/app/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "nonley-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env_file: "../../.env.production",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "nonley-engine",
      cwd: "./packages/presence-engine",
      script: "node_modules/.bin/tsx",
      args: "src/index.ts",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      max_memory_restart: "300M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

Start services:

```bash
cd /home/nonley/app
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions to enable auto-start on reboot
```

---

## Step 7: Configure Nginx

### 7.1 Web App (`/etc/nginx/sites-available/nonley`)

```nginx
server {
    listen 80;
    server_name nonley.com www.nonley.com;

    # Redirect HTTP to HTTPS (Cloudflare handles SSL)
    # If NOT using Cloudflare, add certbot SSL config here

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.2 Presence Engine (`/etc/nginx/sites-available/nonley-ws`)

```nginx
server {
    listen 80;
    server_name ws.nonley.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket specific
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}
```

Enable sites:

```bash
sudo ln -s /etc/nginx/sites-available/nonley /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/nonley-ws /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7.3 SSL with Certbot (if NOT using Cloudflare)

```bash
sudo certbot --nginx -d nonley.com -d www.nonley.com
sudo certbot --nginx -d ws.nonley.com
```

---

## Step 8: Firewall Setup

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Step 9: Chrome Extension Production Config

Update the extension to use production URLs:

1. In `apps/extension/src/content/index.ts`, the `NONLEY_ORIGINS` already includes `https://nonley.com`
2. In `apps/extension/src/background/index.ts`, the `wsUrl` default should be `wss://ws.nonley.com`
3. Rebuild the extension: `pnpm --filter @nonley/extension build`
4. Submit to Chrome Web Store:
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay $5 developer fee
   - Upload the `apps/extension/dist` folder as a ZIP
   - Fill in listing details, screenshots, description

---

## Step 10: Deployment Automation

Create `/home/nonley/deploy.sh`:

```bash
#!/bin/bash
set -e

cd /home/nonley/app
echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building..."
pnpm build

echo "Running database migrations..."
cd packages/presence-engine
npx prisma db push --accept-data-loss
cd ../..

echo "Restarting services..."
pm2 restart all

echo "Deployment complete!"
```

```bash
chmod +x /home/nonley/deploy.sh
```

---

## Step 11: Monitoring

```bash
# View logs
pm2 logs

# View specific app logs
pm2 logs nonley-web
pm2 logs nonley-engine

# Monitor resources
pm2 monit

# Check health
curl http://localhost:3001/health
```

Set up PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Step 12: Google OAuth Setup (Production)

1. Go to https://console.cloud.google.com
2. Create a project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `Nonley`
7. Authorized JavaScript origins: `https://nonley.com`
8. Authorized redirect URIs: `https://nonley.com/api/auth/callback/google`
9. Copy Client ID and Client Secret to `.env.production`

---

## Step 13: Stripe Webhook (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://nonley.com/api/stripe/webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the signing secret to `.env.production`

---

## Cost Summary

| Service                | Monthly Cost |
| ---------------------- | ------------ |
| Droplet (2GB)          | $12          |
| Managed PostgreSQL     | $15          |
| Managed Redis          | $15          |
| Cloudflare (free tier) | $0           |
| Domain name            | ~$1          |
| **Total**              | **~$43/mo**  |

### Budget Alternative ($12/mo total)

Use a single $12 droplet and run PostgreSQL + Redis as Docker containers on it:

```bash
apt install docker.io docker-compose-v2
# Use the existing docker-compose.yml with stronger passwords
```

This works for early stage but is less reliable than managed databases.

---

## Security Checklist Before Launch

- [ ] Generate new NEXTAUTH_SECRET (never reuse dev secret)
- [ ] Generate new ENCRYPTION_KEY
- [ ] Set strong PostgreSQL password
- [ ] Redis requires authentication (managed DB handles this)
- [ ] Remove localhost from CORS origins in production
- [ ] Verify NODE_ENV=production (disables dev credentials provider)
- [ ] Enable UFW firewall
- [ ] SSH key auth only (disable password auth)
- [ ] Set up automated backups for database
- [ ] Test all OAuth flows on production domain
- [ ] Test WebSocket connections on wss://
- [ ] Verify rate limiting is active
- [ ] Check that `/admin` routes require admin role
