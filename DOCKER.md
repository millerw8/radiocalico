# Docker Deployment Guide - Radio Calico

## Overview

Radio Calico uses Docker and Docker Compose for containerized deployment with PostgreSQL as the database.

## Architecture

### Development Setup
- **App Container**: Node.js 20 Alpine with hot-reloading
- **Database**: PostgreSQL 16 Alpine
- **Network**: Isolated Docker network
- **Volumes**: Persistent PostgreSQL data

### Production Setup
- **App Container**: Node.js 20 Alpine (optimized, non-root user)
- **Database**: PostgreSQL 16 Alpine with health checks
- **Network**: Isolated Docker network
- **Volumes**: Persistent PostgreSQL data
- **Logging**: JSON file driver with rotation

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Development Mode

```bash
# Build and start development containers
make dev

# Or manually
docker compose up -d radiocalico-dev

# View logs
make logs-dev
# Or
docker compose logs -f radiocalico-dev
```

**Access:**
- Application: http://localhost:3000
- PostgreSQL: localhost:5434

### Production Mode

```bash
# Build and start production containers
make prod

# Or manually
docker compose up -d radiocalico-prod

# View logs
make logs-prod
# Or
docker compose logs -f radiocalico-prod
```

**Access:**
- Application: http://localhost:3001
- PostgreSQL: localhost:5433

## Environment Variables

### Development (.env)

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=postgres-dev
DB_PORT=5432
DB_NAME=radiocalico
DB_USER=radiocalico
DB_PASSWORD=radiocalico
```

### Production

For production, set these environment variables:

```env
PORT=3000
NODE_ENV=production

# PostgreSQL Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=radiocalico
DB_USER=radiocalico
DB_PASSWORD=your_strong_password_here
```

**Important**: Change the default password in production!

## Makefile Commands

### Development

```bash
make dev              # Build and start dev containers
make logs-dev         # View dev logs
make down             # Stop all containers
make restart-dev      # Restart dev containers
```

### Production

```bash
make prod             # Build and start prod containers
make logs-prod        # View prod logs
make restart-prod     # Restart prod containers
```

### Database

```bash
make db-dev           # Connect to dev database
make db-prod          # Connect to prod database
make backup           # Backup production database
```

### Testing

```bash
make test             # Run tests in container
make test-coverage    # Run tests with coverage
```

### Cleanup

```bash
make clean            # Remove containers and images
make clean-all        # Remove everything including volumes
```

## Docker Compose Files

### docker compose.yml (Development + Production)

Contains both development and production services:

- `postgres-dev` - Development PostgreSQL (port 5434)
- `radiocalico-dev` - Development app (port 3000)
- `postgres-prod` - Production PostgreSQL (port 5433)
- `radiocalico-prod` - Production app (port 3001)

### docker compose.prod.yml (Production Only)

Production-only configuration for deployment:

- `postgres` - PostgreSQL database
- `app` - Radio Calico application

Usage:
```bash
docker compose -f docker compose.prod.yml up -d
```

## Database Management

### Connect to PostgreSQL

**Development:**
```bash
# Using make
make db-dev

# Or directly
docker exec -it radiocalico-postgres-dev psql -U radiocalico -d radiocalico
```

**Production:**
```bash
# Using make
make db-prod

# Or directly
docker exec -it radiocalico-postgres-prod psql -U radiocalico -d radiocalico
```

### Backup Database

**Development:**
```bash
docker exec radiocalico-postgres-dev pg_dump -U radiocalico radiocalico > backup-dev-$(date +%Y%m%d).sql
```

**Production:**
```bash
# Using make
make backup

# Or directly
docker exec radiocalico-postgres-prod pg_dump -U radiocalico radiocalico > backup-prod-$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Development
docker exec -i radiocalico-postgres-dev psql -U radiocalico -d radiocalico < backup.sql

# Production
docker exec -i radiocalico-postgres-prod psql -U radiocalico -d radiocalico < backup.sql
```

### Reset Database

**Warning**: This will delete all data!

```bash
# Stop containers
docker compose down

# Remove volume
docker volume rm radiocalico_radiocalico-dev-db

# Restart
make dev
```

## Volume Management

### List Volumes

```bash
docker volume ls | grep radiocalico
```

### Inspect Volume

```bash
docker volume inspect radiocalico_radiocalico-dev-db
```

### Backup Volume

```bash
# Development
docker run --rm \
  -v radiocalico_radiocalico-dev-db:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup-dev.tar.gz /data

# Production
docker run --rm \
  -v radiocalico_radiocalico-prod-db:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup-prod.tar.gz /data
```

## Networking

### Network Configuration

All containers run on the `radiocalico-network` bridge network.

### Container Communication

- App containers connect to database using service names:
  - Dev: `postgres-dev`
  - Prod: `postgres-prod`

### Port Mapping

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| Dev App | 3000 | 3000 |
| Dev PostgreSQL | 5432 | 5434 |
| Prod App | 3000 | 3001 |
| Prod PostgreSQL | 5432 | 5433 |

## Health Checks

### PostgreSQL

```bash
test: ["CMD-SHELL", "pg_isready -U radiocalico"]
interval: 10s
timeout: 5s
retries: 5
```

### Application

```bash
test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', ...)"]
interval: 30s
timeout: 3s
retries: 3
start_period: 10s
```

### Check Health Status

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs radiocalico-dev

# Check if port is in use
lsof -i :3000

# Restart container
docker compose restart radiocalico-dev
```

### Database Connection Errors

```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker compose logs postgres-dev

# Verify environment variables
docker exec radiocalico-dev env | grep DB_
```

### Permission Errors

```bash
# Check volume permissions
docker exec radiocalico-postgres-dev ls -la /var/lib/postgresql/data

# If needed, recreate volume
docker compose down -v
docker compose up -d
```

### Port Already in Use

If you see "port is already allocated":

```bash
# Find what's using the port
lsof -i :3000

# Stop the conflicting service or change the port in docker compose.yml
```

### Database Schema Not Initialized

```bash
# The schema initializes automatically on startup
# If it fails, check logs:
docker compose logs radiocalico-dev | grep -i "database"

# Manually initialize if needed:
docker exec radiocalico-dev npm start
```

## Performance Tuning

### PostgreSQL Configuration

For production, consider tuning PostgreSQL:

```yaml
postgres:
  environment:
    - POSTGRES_INITDB_ARGS=--encoding=UTF8 --lc-collate=C --lc-ctype=C
  command:
    - postgres
    - -c
    - max_connections=100
    - -c
    - shared_buffers=256MB
```

### Application Configuration

Adjust connection pool size in `src/database.js`:

```javascript
const pool = new Pool({
  max: 20,  // Increase for high traffic
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Security Best Practices

### Production Checklist

- [ ] Change default PostgreSQL password
- [ ] Use environment variables for secrets
- [ ] Enable SSL/TLS for database connections
- [ ] Run application as non-root user (already configured)
- [ ] Implement rate limiting
- [ ] Set up firewall rules
- [ ] Enable log rotation
- [ ] Regular security updates

### Environment Variables

Never commit `.env` files with production credentials!

```bash
# Use docker secrets or external secret management
docker secret create db_password /path/to/password/file
```

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats radiocalico-dev radiocalico-postgres-dev

# One-time snapshot
docker stats --no-stream
```

### Logs

```bash
# Follow logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs radiocalico-dev
```

### Health Monitoring

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' radiocalico-dev

# View health check logs
docker inspect --format='{{json .State.Health}}' radiocalico-dev | jq
```

## Migration from SQLite

If migrating from SQLite:

1. **Export SQLite **
   ```bash
   sqlite3 database/app.db .dump > sqlite-export.sql
   ```

2. **Convert to PostgreSQL format** (manual adjustments needed):
   - Change `INTEGER PRIMARY KEY AUTOINCREMENT` to `SERIAL PRIMARY KEY`
   - Change `DATETIME` to `TIMESTAMP`
   - Remove SQLite-specific syntax

3. **Import to PostgreSQL:**
   ```bash
   docker exec -i radiocalico-postgres-dev psql -U radiocalico -d radiocalico < postgres-import.sql
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/millerw8/radiocalico/issues)
- Review application logs: `make logs-dev` or `make logs-prod`
- Check database logs: `docker compose logs postgres-dev`
