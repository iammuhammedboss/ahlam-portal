#!/bin/bash
set -e

APP_DIR="/var/apps/ahlam-portal"

echo "=== ADL Portal Deployment ==="

# Stop existing PM2 process
echo "Stopping existing process..."
pm2 delete adl-portal 2>/dev/null || true

# Kill anything on port 3456
fuser -k 3456/tcp 2>/dev/null || true

cd "$APP_DIR"

# Copy .env.example to .env if .env doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
  echo "Creating .env from .env.example..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

# Create uploads dir
mkdir -p /var/data/adl-uploads

# Install deps
echo "Installing dependencies..."
npm install

# Prisma generate + push schema
echo "Setting up database..."
npx prisma generate
npx prisma db push

# Seed agent credentials
echo "Seeding agent credentials..."
npx tsx prisma/seed.ts

# Build Next.js
echo "Building Next.js..."
npx next build

# Nginx - remove old config first
echo "Setting up Nginx..."
rm -f /etc/nginx/sites-enabled/adl-portal
rm -f /etc/nginx/sites-available/adl-portal
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/adl-portal
ln -sf /etc/nginx/sites-available/adl-portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Start with PM2 using tsx directly
echo "Starting app with PM2..."
cd "$APP_DIR"
NODE_ENV=production pm2 start ./node_modules/.bin/tsx \
  --name "adl-portal" \
  --cwd "$APP_DIR" \
  -- server.ts
pm2 save

echo ""
echo "=== Checking status ==="
sleep 3
pm2 logs adl-portal --lines 5 --nostream

echo ""
echo "=== Done! ==="
echo "Agent login: admin / 1234"
echo "Visit: https://portal.ahlamdhofar.com"
