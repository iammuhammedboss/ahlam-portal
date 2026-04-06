#!/bin/bash
# ADL Enquiry Portal - DigitalOcean Deployment Script
# Run this on your Ubuntu droplet

set -e

echo "=== ADL Enquiry Portal Setup ==="

# 1. Install Node.js 20 LTS
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# 3. Create database and user
echo "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE adl_portal;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER adl_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE adl_portal TO adl_user;"
sudo -u postgres psql -d adl_portal -c "GRANT ALL ON SCHEMA public TO adl_user;"

# 4. Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# 5. Create upload directory
echo "Creating upload directory..."
sudo mkdir -p /var/data/adl-uploads
sudo chown $USER:$USER /var/data/adl-uploads

# 6. Setup Nginx
echo "Setting up Nginx..."
sudo apt-get install -y nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/adl-portal
sudo ln -sf /etc/nginx/sites-available/adl-portal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Install SSL certificate
echo "Installing SSL..."
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portal.ahlamdhofar.com

# 8. Install dependencies and build
echo "Installing dependencies..."
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# 9. Generate agent password hash
echo ""
echo "=== Generate Agent Password ==="
echo "Run this to generate your agent password hash:"
echo '  node -e "require('"'"'bcrypt'"'"').hash('"'"'YOUR_PASSWORD'"'"', 10).then(console.log)"'
echo ""
echo "Then add it to .env as AGENT_PASSWORD_HASH"

# 10. Start with PM2
echo "Starting application..."
pm2 start npm --name "adl-portal" -- start
pm2 save
pm2 startup

echo ""
echo "=== Setup Complete ==="
echo "1. Update .env with your actual credentials"
echo "2. Add DNS A record: portal.ahlamdhofar.com -> $(curl -s ifconfig.me)"
echo "3. Visit https://portal.ahlamdhofar.com"
