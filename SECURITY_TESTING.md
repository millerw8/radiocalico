# Security Testing Guide

## Overview

This guide explains the security testing tools available for Radio Calico and what each one covers.

## Quick Reference

```bash
make security        # Comprehensive security check (recommended)
make security-quick  # Quick npm audit only
make audit-fix       # Auto-fix npm vulnerabilities
```

## What Gets Tested

### 1. Dependency Vulnerabilities (`npm audit`)

**Command:** `make security-quick` or `npm audit`

**Tests:**
- ✅ Known vulnerabilities in npm packages
- ✅ Outdated packages with security patches
- ✅ Transitive dependencies

**Limitations:**
- ❌ Doesn't test your application code
- ❌ Doesn't test infrastructure
- ❌ Doesn't test runtime security

### 2. Comprehensive Security Check (`scripts/security-check.sh`)

**Command:** `make security`

**Tests:**
1. **Hardcoded Secrets** - Scans for passwords, API keys, tokens in code
2. **.env File Security** - Ensures .env is not tracked in git
3. **SQL Injection** - Looks for unsafe query patterns
4. **Default Passwords** - Checks docker-compose for default credentials
5. **Nginx Security Headers** - Verifies X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
6. **Exposed Ports** - Reviews port configuration
7. **Docker Security** - Checks for non-root user
8. **HTTPS Configuration** - Verifies SSL/TLS setup
9. **npm Audit** - Runs dependency scan
10. **Rate Limiting** - Checks for rate limiting configuration

## What's NOT Tested

The current tools don't cover:

### Application Security
- **Authentication/Authorization** - Manual testing required
- **Session Management** - Manual testing required
- **CSRF Protection** - Not implemented
- **Input Validation** - Partial coverage (SQL injection check only)
- **XSS Prevention** - Manual testing required
- **API Security** - Manual testing required

### Infrastructure Security
- **Container Scanning** - Use tools like Trivy or Snyk
- **Image Vulnerabilities** - Use Docker Scout or Clair
- **Network Security** - Use network scanners
- **Firewall Rules** - Manual review required
- **TLS Configuration** - Use SSL Labs or testssl.sh

### Runtime Security
- **Active Attacks** - Use WAF or IDS/IPS
- **DDoS Protection** - Use CDN or cloud provider tools
- **Log Monitoring** - Use SIEM or log analysis tools
- **Intrusion Detection** - Use specialized tools

## Recommended Additional Tools

### 1. Container Security Scanning

```bash
# Install Trivy
brew install aquasecurity/trivy/trivy

# Scan Docker images
trivy image radiocalico-radiocalico-prod:latest
trivy image postgres:16-alpine
trivy image nginx:alpine
```

### 2. Static Application Security Testing (SAST)

```bash
# Install ESLint security plugin
npm install --save-dev eslint-plugin-security

# Add to .eslintrc.json:
# {
#   "plugins": ["security"],
#   "extends": ["plugin:security/recommended"]
# }

# Run scan
npx eslint src/
```

### 3. Secrets Scanning

```bash
# Install gitleaks
brew install gitleaks

# Scan repository
gitleaks detect --source . --verbose
```

### 4. Web Application Scanning

```bash
# Install OWASP ZAP
brew install --cask owasp-zap

# Or use online tools:
# - Mozilla Observatory (https://observatory.mozilla.org/)
# - SecurityHeaders.com (https://securityheaders.com/)
# - SSL Labs (https://www.ssllabs.com/ssltest/)
```

### 5. Database Security

```bash
# Check PostgreSQL configuration
make shell-db-prod
\du  # List users and roles
SHOW hba_file;  # Show authentication config
```

## Security Testing Workflow

### Before Every Commit

```bash
make security        # Run all checks
make test            # Run unit tests
```

### Before Deployment

```bash
# 1. Comprehensive security check
make security

# 2. Update dependencies
npm update
make security-quick

# 3. Rebuild images
make build-prod

# 4. Scan Docker images (if Trivy installed)
trivy image radiocalico-radiocalico-prod:latest

# 5. Manual testing
# - Test authentication flows
# - Test input validation
# - Test error handling
# - Test rate limiting
```

### Weekly/Monthly

```bash
# Check for new vulnerabilities
make security

# Update all dependencies
npm update
npm audit fix

# Review security logs
make logs-prod | grep -i "error\|warning\|failed"
```

## Manual Security Testing Checklist

### Authentication & Authorization
- [ ] Test user authentication
- [ ] Test password requirements
- [ ] Test session timeout
- [ ] Test authorization checks
- [ ] Test privilege escalation

### Input Validation
- [ ] Test SQL injection in all inputs
- [ ] Test XSS in all inputs
- [ ] Test command injection
- [ ] Test path traversal
- [ ] Test file upload security

### API Security
- [ ] Test rate limiting
- [ ] Test API authentication
- [ ] Test CORS configuration
- [ ] Test API versioning
- [ ] Test error messages (no sensitive data)

### Infrastructure
- [ ] Review firewall rules
- [ ] Review network segmentation
- [ ] Review TLS/SSL configuration
- [ ] Review backup procedures
- [ ] Review logging configuration

### Configuration
- [ ] Change default passwords
- [ ] Review environment variables
- [ ] Review nginx configuration
- [ ] Review PostgreSQL configuration
- [ ] Review Docker security settings

## CI/CD Integration

The GitHub Actions workflow automatically runs:
- npm audit on every push/PR
- Weekly scheduled security scans
- Blocks merges on critical vulnerabilities

See `.github/workflows/security.yml` for details.

## Reporting Security Issues

See [SECURITY.md](SECURITY.md) for how to report security vulnerabilities.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Nginx Security](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)

---

**Last Updated:** 2026-05-29
