#!/bin/bash
# Initial Let's Encrypt SSL certificate setup for axomdana.in
# Run this ONCE on the server to generate the initial SSL certificate.
# After this, the certbot container in docker-compose will auto-renew.

set -e

DOMAIN="axomdana.in"
EMAIL="admin@axomdana.in"  # Change to your actual email

echo "=== Initializing Let's Encrypt SSL for $DOMAIN ==="

# Step 1: Start nginx and certbot containers for initial cert generation
echo "Starting nginx and certbot containers..."
docker compose -f docker-compose.prod.yml up -d nginx
sleep 3

# Step 2: Run certbot to obtain the certificate
echo "Requesting SSL certificate from Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# Step 3: Reload nginx to pick up the new certificates
echo "Reloading nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "=== SSL certificate setup complete! ==="
echo "Certificates are stored at: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "Auto-renewal is handled by the certbot container."
echo "To test renewal: docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run"
