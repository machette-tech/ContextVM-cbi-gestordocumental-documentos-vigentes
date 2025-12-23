# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please follow these steps:

### 1. Do NOT open a public issue

Please do not open a public GitHub issue for security vulnerabilities.

### 2. Report privately

Send an email to: security@machette.tech

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response timeline

- **24 hours**: Initial acknowledgment
- **7 days**: Preliminary assessment
- **30 days**: Fix development and testing
- **Coordinated disclosure**: We'll work with you on disclosure timing

## Security Best Practices

When using this ContextVM:

### 1. Environment Variables

- Never commit `.env` files
- Use strong passwords for database
- Rotate Nostr private keys regularly
- Use environment-specific configurations

### 2. Database Security

```bash
# Use strong passwords
DB_PASSWORD=$(openssl rand -base64 32)

# Restrict network access
# Only allow connections from app container
```

### 3. Nostr Keys

```bash
# Generate secure private key
NOSTR_PRIVATE_KEY=$(openssl rand -hex 32)

# Store securely (use secrets manager in production)
# Never expose in logs or responses
```

### 4. API Security

- Enable rate limiting in production
- Use HTTPS/TLS for all external communications
- Implement authentication/authorization
- Validate all inputs
- Sanitize outputs

### 5. Docker Security

```bash
# Run containers as non-root user (already implemented)
USER contextvm

# Use specific image versions (not 'latest')
FROM node:20-alpine

# Scan images for vulnerabilities
docker scan contextvm-documentos-vigentes
```

### 6. Network Security

```yaml
# Use internal networks
networks:
  internal:
    internal: true
    
  external:
    internal: false
```

### 7. Secrets Management

Production deployments should use:
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets
- Azure Key Vault

**Never**:
- Hardcode secrets in code
- Commit secrets to git
- Log sensitive data
- Expose secrets in error messages

## Known Security Considerations

### 1. Nostr Events

All events are **public** by default on Nostr relays:
- Don't include sensitive data in event content
- Use encryption for confidential information
- Consider private relays for sensitive contexts

### 2. Database Access

- Database contains full event history (Event Sourcing)
- Implement proper backup encryption
- Use PostgreSQL SSL/TLS connections
- Restrict database user permissions

### 3. Authentication

This ContextVM does **NOT** include authentication:
- Implement authentication layer in production
- Use reverse proxy (nginx/traefik) with auth
- Consider OAuth2/OIDC for user authentication
- Implement API key validation

### 4. Rate Limiting

Implement rate limiting to prevent:
- DoS attacks
- Spam document creation
- Excessive queries

Example with nginx:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location / {
    limit_req zone=api burst=20;
}
```

## Security Updates

Subscribe to security updates:
- Watch this repository for security advisories
- Follow [@MachetTech](https://twitter.com/machettetech) for announcements
- Check CHANGELOG.md for security patches

## Compliance

This system is designed to support:
- GDPR compliance (with proper configuration)
- SOC 2 requirements (audit trail via Event Sourcing)
- ISO 27001 controls (with additional security layers)

**Note**: Compliance requires additional configuration and processes beyond this ContextVM.

## Security Checklist for Production

- [ ] All secrets stored in secrets manager
- [ ] Database connections use SSL/TLS
- [ ] API behind authentication layer
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular security updates applied
- [ ] Vulnerability scanning enabled
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Incident response plan documented

## Responsible Disclosure

We follow responsible disclosure principles:
1. Report received and acknowledged
2. Vulnerability validated
3. Fix developed and tested
4. Security advisory prepared
5. Fix deployed to production
6. Advisory published
7. CVE requested (if applicable)

Thank you for helping keep this project secure! 🔐
