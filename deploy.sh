#!/bin/bash
set -e

APP_DIR="/var/apps/ahlam-portal"
REPO="https://github.com/iammuhammedboss/ahlam-portal.git"

echo "=== ADL Portal Deployment ==="

# Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo "Pulling latest..."
  cd "$APP_DIR"
  git stash 2>/dev/null || true
  git pull origin main
else
  echo "Cloning repo..."
  mkdir -p "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

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
ENVEOF

# Create uploads dir
mkdir -p /var/data/adl-uploads

# Install deps
echo "Installing dependencies..."
cd "$APP_DIR"
npm install

# Prisma
echo "Setting up database..."
npx prisma generate
npx prisma migrate dev --name init

# Build
echo "Building app..."
npm run build

# Nginx
echo "Setting up Nginx..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/adl-portal
ln -sf /etc/nginx/sites-available/adl-portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# PM2
echo "Starting/restarting app..."
pm2 delete adl-portal 2>/dev/null || true
cd "$APP_DIR"
pm2 start npm --name "adl-portal" -- start
pm2 save

echo ""
echo "=== Done! ==="
echo "Visit: https://portal.ahlamdhofar.com"
echo ""
echo "If SSL not setup yet, run:"
echo "  certbot --nginx -d portal.ahlamdhofar.com"
