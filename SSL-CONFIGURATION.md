# SSL Configuration Guide

## Domain Configuration

The FSM Designer is configured to use the following domain:
```
xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com
```

## SSL Certificate Setup

### Automatic Setup (Recommended)

Run the setup script:
```bash
sudo ./setup-fsm-ssl.sh
```

This script will:
1. Install certbot if not present
2. Stop Docker services temporarily
3. Request SSL certificate from Let's Encrypt
4. Copy certificates to `./ssl/` directory
5. Set proper permissions

### Manual Setup

If you prefer manual setup:

1. **Install certbot**
```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

2. **Stop nginx temporarily**
```bash
sudo systemctl stop nginx
```

3. **Request certificate**
```bash
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@controller-ai.com \
  --domains xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com
```

4. **Copy certificates**
```bash
mkdir -p ./ssl
cp /etc/letsencrypt/live/xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com/privkey.pem ./ssl/
chmod 644 ./ssl/fullchain.pem
chmod 600 ./ssl/privkey.pem
```

5. **Restart nginx**
```bash
sudo systemctl start nginx
```

## Certificate Renewal

Certificates from Let's Encrypt expire after 90 days but renew automatically via certbot's scheduled task.

### Manual Renewal

If you need to manually renew:
```bash
sudo certbot renew
sudo ./setup-fsm-ssl.sh
docker compose restart cbi-gestordocumental-documentos-vigentes-fsm-designer
```

## Nginx Configuration

The FSM Designer nginx is configured with:
- HTTP → HTTPS redirect
- TLS 1.2 and 1.3
- Strong cipher suites
- Security headers (HSTS, X-Frame-Options, etc.)
- Gzip compression
- Proxy to app API

### Ports Exposed

- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (production)
- **4105**: Local development (HTTP)

## Verifying SSL

### Check certificate:
```bash
openssl x509 -in ./ssl/fullchain.pem -text -noout
```

### Test HTTPS connection:
```bash
curl -I https://xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com
```

### Check SSL rating:
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com

## Security Best Practices

1. **Keep certificates private**: The `./ssl/` directory contains sensitive keys
2. **Monitor expiration**: Certificates expire every 90 days
3. **Use strong protocols**: TLS 1.2+ only
4. **Enable HSTS**: Already configured in nginx
5. **Regular updates**: Keep certbot and nginx updated

## Troubleshooting

### Port 80 already in use
```bash
# Check what's using port 80
sudo ss -tlnp | grep :80

# Stop nginx temporarily
sudo systemctl stop nginx

# Re-run setup
sudo ./setup-fsm-ssl.sh

# Restart nginx
sudo systemctl start nginx
```

### Certificate not loading
```bash
# Check file permissions
ls -la ./ssl/

# Should see:
# -rw-r--r-- fullchain.pem
# -rw------- privkey.pem

# Fix if needed
chmod 644 ./ssl/fullchain.pem
chmod 600 ./ssl/privkey.pem
```

### Docker can't read certificates
```bash
# Ensure ssl directory is mounted in docker-compose.yml
volumes:
  - ./ssl:/etc/nginx/ssl:ro

# Restart container
docker compose restart cbi-gestordocumental-documentos-vigentes-fsm-designer
```

## Production Checklist

- [ ] DNS configured and pointing to server
- [ ] SSL certificates obtained and valid
- [ ] Nginx configured with HTTPS
- [ ] Docker Compose updated with SSL volume mounts
- [ ] Security headers configured
- [ ] HSTS enabled
- [ ] HTTP → HTTPS redirect working
- [ ] Certificate auto-renewal configured
- [ ] Backup of certificates taken
- [ ] Firewall rules updated (ports 80, 443)

## Support

For SSL/TLS issues:
- Let's Encrypt Community: https://community.letsencrypt.org
- Certbot Documentation: https://certbot.eff.org/docs/

For domain issues:
- Contact: admin@controller-ai.com
