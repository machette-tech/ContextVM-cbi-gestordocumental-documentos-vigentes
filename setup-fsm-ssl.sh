#!/bin/bash

# Setup SSL/TLS for FSM Designer domain
# Domain: xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com

set -e

DOMAIN="xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com"
EMAIL="admin@controller-ai.com"

echo "🔐 Setting up SSL/TLS for $DOMAIN"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop services to free port 80
echo "🛑 Stopping services temporarily..."
docker compose down 2>/dev/null || true

# Request SSL certificate
echo "📜 Requesting SSL certificate..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domains "$DOMAIN"

# Create SSL directory for docker
echo "📁 Creating SSL directory..."
mkdir -p ./ssl

# Copy certificates
echo "📋 Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/

# Set permissions
chmod 644 ./ssl/fullchain.pem
chmod 600 ./ssl/privkey.pem

echo ""
echo "✅ SSL certificates configured successfully!"
echo ""
echo "Certificate locations:"
echo "  - Fullchain: ./ssl/fullchain.pem"
echo "  - Private key: ./ssl/privkey.pem"
echo ""
echo "Next steps:"
echo "1. Start services: ./dev.sh"
echo "2. Access FSM Designer: https://$DOMAIN"
echo ""
echo "Note: Certificates will auto-renew via certbot"
