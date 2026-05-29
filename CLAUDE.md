# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Calico is a web-based internet radio streaming application that plays lossless HLS audio streams. The application consists of:
- An Express.js backend server with PostgreSQL database
- A frontend web player with HLS streaming support
- Real-time metadata display for now-playing information
- Song rating system (thumbs up/down)
- Comprehensive test suite (23 tests)
- CI/CD pipeline with automated testing and security scanning
- Docker support for development and production

## File Structure

```
.
├── src/
│   ├── server.js           # Express server with REST API endpoints
│   └── database.js         # PostgreSQL database initialization and schema
├── public/                 # Static files served by Express/nginx
│   ├── index.html          # Full-featured player HTML (90 lines - structure only)
│   ├── styles.css          # All CSS styling (682 lines)
│   ├── app.js              # All JavaScript logic (417 lines)
│   ├── users.html          # User management interface
│   └── logo.png            # Radio Calico logo
├── tests/                  # Test suite (Jest + Supertest + jsdom)
│   ├── backend/
│   │   └── ratings.test.js # Backend API tests (12 tests) - PostgreSQL
│   ├── frontend/
│   │   ├── setup.js        # Frontend test environment setup
│   │   └── ratings-ui.test.js # Frontend UI tests (11 tests)
│   ├── fixtures/           # Test data
│   └── README.md           # Detailed testing documentation
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline (tests + security + Docker)
├── scripts/
│   ├── setup-test-db.sh    # Test database initialization
│   └── security-check.sh   # Comprehensive security scanning
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Multi-stage Docker build
├── nginx.conf              # nginx reverse proxy configuration
├── Makefile                # Convenient Docker and test commands
├── index.html              # Simple standalone HLS player (root)
├── jest.config.js          # Jest test framework configuration
├── package.json            # Node.js dependencies and scripts
├── .env                    # Environment configuration
├── .env.test               # Test environment configuration
├── README.md               # Project documentation
├── DOCKER.md               # Docker setup and usage guide
├── TESTING.md              # Testing framework overview
├── PERFORMANCE_OPTIMIZATION.md # Page speed optimization guide
├── TEST_SUMMARY.md         # Quick testing summary
├── GETTING_STARTED_WITH_TESTS.md # Testing quick start guide
├── stream_URL.txt          # HLS stream URL reference
├── RadioCalico_Style_Guide.txt  # Design system colors and fonts
├── RadioCalicoLayout.png   # UI layout reference
├── RadioCalicoLogoTM.png   # Logo asset
└── RadioCalicoStyle.zip    # Design assets archive
```

## Architecture

### Backend (Node.js/Express)
- **Entry point**: `src/server.js` - Express server with REST API endpoints
- **Database**: `src/database.js` - PostgreSQL database setup using node-postgres (pg)
- **Database**: PostgreSQL 16 with connection pooling
- **Environment config**: `.env` file for PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

### Frontend
- **Main player**: `public/index.html` - Full-featured player HTML structure (90 lines)
- **Styling**: `public/styles.css` - All CSS styling separated from HTML (682 lines)
- **Application logic**: `public/app.js` - All JavaScript functionality separated from HTML (417 lines)
  - Radio player controls (play/pause, volume, progress)
  - HLS stream initialization and error handling
  - Now-playing metadata fetching and display
  - Song rating system with user authentication
  - Timer and progress bar updates
  - Album art management and recently played tracks
- **Simple player**: `index.html` (root) - Minimal standalone HLS player
- **User management**: `public/users.html` - User CRUD interface
- **Static assets**: `public/logo.png` - Radio Calico logo

### Database Schema (PostgreSQL)

**users table**:
- `id` (SERIAL PRIMARY KEY)
- `username` (TEXT NOT NULL UNIQUE)
- `email` (TEXT NOT NULL UNIQUE)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**song_ratings table**:
- `id` (SERIAL PRIMARY KEY)
- `song_title` (TEXT NOT NULL)
- `song_artist` (TEXT NOT NULL)
- `user_id` (TEXT NOT NULL)
- `rating` (INTEGER NOT NULL CHECK(rating IN (1, -1))) - 1 for thumbs up, -1 for thumbs down
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- UNIQUE constraint on (song_title, song_artist, user_id)
- Index on (song_title, song_artist)

## Development Commands

### Docker Development (Recommended)

```bash
# Development mode (with hot-reloading)
make dev

# Production mode
make prod

# Run tests
make test

# Security scanning
make security

# View logs
make logs-dev
make logs-prod

# Stop containers
make stop-dev
make stop-prod

# Database backup
make backup
```

### Local Development

```bash
# Start the server (production mode)
npm start

# Start with auto-reload on file changes (development mode)
npm run dev

# The server runs on http://localhost:3000

# Run tests (23 tests: 12 backend + 11 frontend)
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend
```

### Testing

**Prerequisites**: PostgreSQL must be running

```bash
# Setup test database (one-time)
make test-setup

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## API Endpoints

### User Management
- `GET /` - API status check
- `GET /users` - List all users
- `POST /users` - Create user (body: `{username, email}`)
- `GET /users/:id` - Get specific user

### Now Playing & Ratings
- `GET /now-playing` - Fetch current track metadata from CloudFront metadata endpoint
  - Returns: title, artist, album, date, bit_depth, sample_rate, flags (is_new, is_summer, is_vidgames), ratings, previous_tracks
- `POST /rate-song` - Submit song rating (body: `{title, artist, rating, userId}`)
  - rating must be 1 (thumbs up) or -1 (thumbs down)
  - Updates existing rating if user already voted
- `GET /user-rating/:userId/:title/:artist` - Get user's rating for a specific song

## Stream Configuration

**HLS Stream URL**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
**Metadata URL**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`

The stream is lossless quality HLS audio served from CloudFront. The frontend uses hls.js for browser compatibility.

## Key Implementation Details

### PostgreSQL Integration
- Uses node-postgres (pg) with connection pooling
- Async/await pattern for all database operations
- Parameterized queries ($1, $2, etc.) for SQL injection prevention
- Connection pool configuration:
  - Max 10 connections for production
  - Max 5 connections for tests
  - Automatic connection management

### HLS Player Configuration
- Uses hls.js library for HLS support in browsers
- Configured with `lowLatencyMode: true` and `backBufferLength: 90`
- Automatic error recovery with 3-second retry delay
- Falls back to native HLS support on Safari/iOS

### Rating System Logic
- Users can vote thumbs up (1) or thumbs down (-1) per song
- One vote per user per song (unique constraint)
- Users can change their vote (update replaces previous rating)
- Attempting to vote the same way twice returns 409 conflict
- Ratings are aggregated and displayed with now-playing metadata

### Metadata Polling
- Frontend polls `/now-playing` endpoint for current track info
- Backend fetches from CloudFront metadata endpoint
- Includes previous 5 tracks in response
- Ratings are calculated on-demand when metadata is fetched

## Design System

The application follows the Radio Calico brand style guide. For complete styling details including color palette, typography, UI components, layout spacing, and brand voice, refer to `RadioCalico_Style_Guide.txt`.

**Key brand colors**:
- Mint (#D8F2D5) - accents and background fills
- Forest Green (#1F4E23) - primary buttons and headings
- Teal (#38A29D) - nav bar background
- Charcoal (#231F20) - body text
- Cream (#F5EADA) - secondary backgrounds

**Typography**: Montserrat (headings, bold), Open Sans (body text)

**Logo assets**:
- `RadioCalicoLogoTM.png` - Full trademarked logo
- `public/logo.png` - Logo used in the web application
- `RadioCalicoLayout.png` - UI layout reference
- `RadioCalicoStyle.zip` - Complete design assets archive

## Testing the API

```bash
# Get all users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com"}'

# Get now playing
curl http://localhost:3000/now-playing

# Rate a song
curl -X POST http://localhost:3000/rate-song \
  -H "Content-Type: application/json" \
  -d '{"title":"Song Title","artist":"Artist Name","rating":1,"userId":"user123"}'
```

## Code Organization

The main application (`public/index.html`) follows a clean separation of concerns:
- **HTML** (`index.html`) - Structure and semantic markup only
- **CSS** (`styles.css`) - All styling, layout, and visual design
- **JavaScript** (`app.js`) - All application logic and interactivity

This modular structure makes the codebase easier to maintain, debug, and extend. When modifying the application:
- Edit `index.html` for structural changes (adding/removing elements)
- Edit `styles.css` for visual changes (colors, layout, spacing)
- Edit `app.js` for functional changes (behavior, API calls, event handlers)

## Testing Framework

The project includes a comprehensive unit testing framework using Jest, Supertest, and jsdom.

### Test Coverage
- **23 tests total** (12 backend + 11 frontend)
- **Execution time**: < 1 second
- **Backend tests**: API endpoints, database operations, validation, multi-user scenarios
- **Frontend tests**: UI interactions, client-side validation, error handling, state management

### Test Structure
- `tests/backend/ratings.test.js` - Backend API and database tests
  - Tests POST /rate-song endpoint (create, update, validation)
  - Tests GET /user-rating endpoint (retrieval, null handling)
  - Uses real PostgreSQL database with connection pooling
  - Validates business logic and edge cases
  - Async/await pattern throughout

- `tests/frontend/ratings-ui.test.js` - Frontend UI and interaction tests
  - Tests rateSong function (validation, API calls, error handling)
  - Tests rating button UI state (active states, disabled states)
  - Uses mocked fetch, localStorage, and alert
  - Tests client-side validation and user feedback

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode (recommended for development)
npm run test:coverage    # Generate coverage report
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
```

### Testing Documentation
- **TESTING.md** - Comprehensive testing overview and guide
- **tests/README.md** - Detailed documentation with examples
- **GETTING_STARTED_WITH_TESTS.md** - Quick start guide
- **TEST_SUMMARY.md** - Summary of test coverage

### CI/CD Integration
- GitHub Actions workflow at `.github/workflows/ci.yml`
- Runs on push to main/develop and on pull requests
- Tests against Node.js 18.x and 20.x
- PostgreSQL service container for backend tests
- Security scanning with npm audit and Trivy
- Docker build verification
- Uploads coverage reports to Codecov
- Daily scheduled security scans

### Test Dependencies
- **jest** - Test framework
- **@jest/globals** - Jest globals for ESM
- **supertest** - HTTP endpoint testing
- **jest-environment-jsdom** - DOM manipulation in tests

## Security

### Automated Security Checks

The project includes comprehensive security scanning:

**Run locally:**
```bash
make security         # Comprehensive security check (11 checks)
make security-quick   # Quick npm audit only
make audit-fix        # Automatically fix vulnerabilities
```

**Security checks include:**
1. Hardcoded secrets detection
2. .env file in git check
3. SQL injection pattern checking
4. Default passwords in docker-compose
5. nginx security headers
6. Exposed ports check
7. Docker user security
8. HTTPS/TLS configuration
9. npm audit
10. Rate limiting check
11. Trivy container scanning

**CI/CD Security:**
- Automated security scans on every push/PR
- Daily scheduled scans at 2 AM UTC
- Results uploaded to GitHub Security tab
- SARIF format for vulnerability tracking
- Dependency review on pull requests

## Performance Optimization

See **PERFORMANCE_OPTIMIZATION.md** for comprehensive page speed optimization guide.

**Current Performance:**
- Total Initial Load: ~280-300 KB (uncompressed)
- First Contentful Paint: ~1.5s
- Lighthouse Score: ~75

**Optimization Potential:**
- 47% faster First Contentful Paint (1.5s → 0.8s)
- 40% smaller bundle size (300 KB → 180 KB)
- +20 points Lighthouse score (75 → 95+)

**Quick wins (1-2 hours for 30-40% improvement):**
1. Optimize logo image (save 44 KB)
2. Add defer to scripts
3. Lazy load images
4. Add resource hints
5. Update cache headers

## Docker Support

### Development Environment
- Hot-reloading with volume mounts
- PostgreSQL on port 5434
- Application on port 3000
- Logs visible with `make logs-dev`

### Production Environment
- Multi-stage Docker build
- nginx reverse proxy on port 80
- PostgreSQL on port 5433
- Health checks enabled
- Optimized for production

### Docker Commands
```bash
make dev              # Start development
make prod             # Start production
make logs-dev         # View dev logs
make logs-prod        # View prod logs
make backup           # Backup production database
make clean            # Remove containers
```

See **DOCKER.md** for complete Docker documentation.

## Important Notes

- The database is PostgreSQL (not SQLite) - use async/await and parameterized queries
- Express 5.x is used (note: some middleware may need updates from Express 4.x patterns)
- Static files are served from the `public/` directory
- The root `index.html` is a simpler standalone player; `public/index.html` is the full-featured version
- All CSS and JavaScript are in separate files - avoid adding inline styles or scripts to HTML files
- **Always run tests before committing**: `npm test` (all 23 tests should pass)
- **Use watch mode during development**: `npm run test:watch` for auto-rerun on file changes
- **Run security checks**: `make security` before deploying
- **Database connection pooling**: Use the existing pool, don't create new connections
- **Environment variables**: Load from .env for local, from Docker environment in containers
