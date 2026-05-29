# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Radio Calico, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly (if available)
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Measures

### Dependency Management

We regularly scan our dependencies for known vulnerabilities using:

- **npm audit** - Run on every push via GitHub Actions
- **Weekly scans** - Automated security audits every Monday
- **Manual reviews** - Before major releases

### Running Security Scans Locally

```bash
# Run security audit
make security

# Automatically fix vulnerabilities
make audit-fix

# Generate detailed report
make audit-report
```

### CI/CD Security

Our GitHub Actions workflows:

- Run security audits on every push and pull request
- Generate security reports as artifacts
- Fail builds if critical vulnerabilities are found
- Run weekly scheduled scans

### Production Security

**Nginx Configuration:**
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Gzip compression enabled
- Health check endpoints
- Backend not directly exposed

**Docker Security:**
- Non-root user execution in production
- Multi-stage builds to minimize attack surface
- Minimal Alpine Linux base images
- Regular base image updates

**Database Security:**
- PostgreSQL with password authentication
- Isolated Docker networks
- Persistent volumes for data
- Connection pooling with limits

**Environment Variables:**
- Sensitive data in `.env` files (not committed)
- `.env.example` provided as template
- Production passwords should be changed from defaults

## Security Best Practices

### For Development

1. **Never commit sensitive data**
   - Use `.env` files for secrets
   - Add sensitive files to `.gitignore`
   - Review commits before pushing

2. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update dependencies with `npm update`
   - Review changelogs for breaking changes

3. **Use strong passwords**
   - Change default database passwords
   - Use environment variables for credentials
   - Never hardcode passwords in code

### For Production

1. **Change default credentials**
   ```bash
   # Update .env with strong passwords
   DB_PASSWORD=your_strong_password_here
   ```

2. **Enable HTTPS**
   - Use a reverse proxy (Traefik, Caddy, nginx)
   - Obtain SSL/TLS certificates (Let's Encrypt)
   - Force HTTPS redirects

3. **Regular updates**
   - Pull latest security patches
   - Rebuild Docker images regularly
   - Monitor security advisories

4. **Backup regularly**
   ```bash
   make backup  # Creates database backup
   ```

5. **Monitor logs**
   ```bash
   make logs-prod  # Monitor production logs
   ```

## Security Checklist

Before deploying to production:

- [ ] Change default database password
- [ ] Run security audit (`make security`)
- [ ] Enable HTTPS/SSL
- [ ] Review nginx security headers
- [ ] Set up log monitoring
- [ ] Configure automated backups
- [ ] Restrict database access
- [ ] Review firewall rules
- [ ] Test authentication flows
- [ ] Verify CORS settings

## Known Security Considerations

### Rate Limiting

Currently, there is no rate limiting implemented. For production use, consider:

- Adding nginx rate limiting
- Implementing API rate limits
- Using a WAF (Web Application Firewall)

### Input Validation

All user inputs are validated on the backend, but consider:

- Adding additional input sanitization
- Implementing CSRF protection for forms
- Adding request size limits

### Authentication

The current implementation uses simple user IDs. For production:

- Implement proper authentication (JWT, OAuth)
- Add session management
- Implement password hashing
- Add multi-factor authentication

## Updates and Patches

Security updates are released as soon as possible after a vulnerability is confirmed. Check the [GitHub Releases](https://github.com/millerw8/radiocalico/releases) page for security advisories.

## Contact

For security concerns, please contact the project maintainers.

---

**Last Updated:** 2026-05-29
