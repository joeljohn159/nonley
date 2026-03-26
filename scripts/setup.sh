#!/usr/bin/env bash
set -euo pipefail

echo "=== Nonley Local Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install from https://docker.com"; exit 1; }

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Node.js 20+ is required. Current: $(node -v)"
  exit 1
fi

echo "[1/6] Starting PostgreSQL and Redis..."
docker compose up -d
echo "Waiting for services to be healthy..."
sleep 3

# Wait for postgres
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U nonley >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[2/6] Installing dependencies..."
pnpm install

echo "[3/6] Generating Prisma client..."
pnpm db:generate

echo "[4/6] Pushing database schema..."
pnpm db:push

echo "[5/6] Building packages..."
pnpm build

echo "[6/6] Running tests to verify..."
pnpm test

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start development:"
echo "  pnpm dev"
echo ""
echo "This runs:"
echo "  - Web app:          http://localhost:3000"
echo "  - Presence engine:  ws://localhost:3001"
echo "  - Health check:     http://localhost:3001/health"
echo ""
echo "Other commands:"
echo "  pnpm test           Run unit tests"
echo "  pnpm test:e2e       Run E2E tests"
echo "  pnpm db:studio      Open Prisma Studio"
echo "  pnpm docker:down    Stop PostgreSQL and Redis"
