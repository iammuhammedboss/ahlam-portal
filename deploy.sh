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

# Write .env
echo "Writing .env..."
cat > "$APP_DIR/.env" << 'ENVEOF'
DATABASE_URL="postgresql://adl_user:14946145af3ca326ac71bc1080bbcdf0@localhost:5432/adl_portal"
AGENT_USERNAME="admin"
AGENT_PASSWORD_HASH="$2b$10$lPoiG0Qm52/9tt352tEUCeNjtsqxJcRKe.j8RRaiTGU2PYksYVmN2"
SESSION_SECRET="edb3592ccd3a457a29614aa97ddfb51b1c9eba54c73ff587a4c69143cd3d65f7"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="no-reply@ahlamdhofar.com"
SMTP_PASS="aoed lnpe rqcd zjwi"
SMTP_FROM="Ahlam Dhofar Logistics <no-reply@ahlamdhofar.com>"
AGENT_NOTIFICATION_EMAIL="jezz@ahlamdhofar.com"
NEXT_PUBLIC_APP_URL="https://portal.ahlamdhofar.com"
UPLOAD_DIR="/var/data/adl-uploads"
MAX_FILE_SIZE_MB="15"
PORT="3456"
ENVEOF

# Create uploads dir
mkdir -p /var/data/adl-uploads

# Install deps
echo "Installing dependencies..."
npm install

# Prisma
echo "Setting up database..."
npx prisma generate
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

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
echo "Visit: https://portal.ahlamdhofar.com"
echo ""
echo "If SSL not setup yet, run:"
echo "  certbot --nginx -d portal.ahlamdhofar.com"
