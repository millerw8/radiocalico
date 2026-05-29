# Radio Calico

[![GitHub](https://img.shields.io/badge/GitHub-millerw8%2Fradiocalico-blue)](https://github.com/millerw8/radiocalico)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)](https://github.com/millerw8/radiocalico/actions)
[![Tests](https://img.shields.io/badge/tests-23%20passing-brightgreen)](TESTING.md)
[![Security](https://img.shields.io/badge/security-9%20checks-blue)](PERFORMANCE_OPTIMIZATION.md)
[![Performance](https://img.shields.io/badge/lighthouse-optimization%20guide-yellow)](PERFORMANCE_OPTIMIZATION.md)

A web-based internet radio streaming application that plays lossless HLS audio streams with real-time metadata display and song rating features.

![Radio Calico](RadioCalicoLayout.png)

## Features

- 🎵 **Lossless HLS Audio Streaming** - High-quality audio playback from CloudFront
- 📻 **Real-time Metadata** - Live track information including artist, title, album, and technical details
- 👍👎 **Song Rating System** - Thumbs up/down voting for tracks with PostgreSQL persistence
- 👤 **User Management** - Create and manage listener accounts
- 🕐 **Recently Played** - Track history of the last 5 songs
- 🎨 **Brand Design** - Clean UI following Radio Calico style guidelines
- ✅ **Comprehensive Testing** - 23 unit tests covering backend API and frontend UI
- 🔒 **Security Scanning** - Automated vulnerability detection and code analysis
- 🚀 **CI/CD Pipeline** - Automated testing, security scans, and Docker builds

## Tech Stack

- **Backend**: Node.js, Express 5.x, PostgreSQL (node-postgres)
- **Frontend**: Vanilla JavaScript, HLS.js for audio streaming
- **Design**: Custom CSS with Montserrat & Open Sans fonts
- **Testing**: Jest, Supertest, jsdom (23 tests, < 1s execution)
- **Infrastructure**: Docker, Docker Compose, nginx
- **CI/CD**: GitHub Actions with automated testing and security scanning

## Quick Start

### Prerequisites

- **Option 1 (Docker - Recommended)**: Docker and Docker Compose
- **Option 2 (Local)**: Node.js (v18 or v20) and PostgreSQL 16

### Installation

#### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/millerw8/radiocalico.git
cd radiocalico

# Development mode (with hot-reloading)
make dev

# Or production mode
make prod
```

The application will be available at:
- **Development**: `http://localhost:3000`
- **Production**: `http://localhost` (port 80)

For complete Docker documentation, see [DOCKER.md](DOCKER.md).

#### Local Installation

```bash
# Clone the repository
git clone https://github.com/millerw8/radiocalico.git
cd radiocalico

# Install dependencies
npm install

# Setup PostgreSQL database
# Make sure PostgreSQL is running, then:
make test-setup

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode

**Docker**:
```bash
make dev              # Build and start with logs
# Or
docker compose up -d radiocalico-dev
```

**Local**:
```bash
# Start with auto-reload on file changes
npm run dev
```

### Testing

```bash
# Run all tests (23 tests: 12 backend + 11 frontend)
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend
```

For detailed testing documentation, see [TESTING.md](TESTING.md).

### Security Scanning

```bash
# Run comprehensive security checks
make security

# Quick npm audit only
make security-quick

# Fix security issues automatically
make audit-fix
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=radiocalico
DB_USER=radiocalico
DB_PASSWORD=radiocalico
```

## API Endpoints

### User Management
- `GET /` - API status check
- `GET /users` - List all users
- `POST /users` - Create user (body: `{username, email}`)
- `GET /users/:id` - Get specific user

### Now Playing & Ratings
- `GET /now-playing` - Fetch current track metadata
- `POST /rate-song` - Submit song rating (body: `{title, artist, rating, userId}`)
  - `rating` must be 1 (thumbs up) or -1 (thumbs down)
- `GET /user-rating/:userId/:title/:artist` - Get user's rating for a song

## Project Structure

```
.
├── src/
│   ├── server.js           # Express server with REST API endpoints
│   └── database.js         # PostgreSQL database initialization and schema
├── public/                 # Static files served by Express/nginx
│   ├── index.html          # Full-featured player HTML structure (90 lines)
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
├── jest.config.js          # Jest test framework configuration
├── package.json            # Node.js dependencies and scripts
├── .env                    # Environment configuration
├── .env.test               # Test environment configuration
├── CLAUDE.md               # Development guidance for Claude Code
├── DOCKER.md               # Docker setup and usage guide
├── TESTING.md              # Testing framework overview
├── PERFORMANCE_OPTIMIZATION.md # Page speed optimization guide
├── TEST_SUMMARY.md         # Quick testing summary
├── GETTING_STARTED_WITH_TESTS.md # Testing quick start guide
├── README.md               # This file
└── RadioCalico_Style_Guide.txt  # Brand design system
```

## Database Schema

### users table (PostgreSQL)
- `id` - Serial primary key
- `username` - Unique username (TEXT)
- `email` - Unique email address (TEXT)
- `created_at` - Timestamp

### song_ratings table (PostgreSQL)
- `id` - Serial primary key
- `song_title` - Track title (TEXT)
- `song_artist` - Artist name (TEXT)
- `user_id` - User identifier (TEXT)
- `rating` - INTEGER: 1 (thumbs up) or -1 (thumbs down)
- `created_at` - Timestamp
- Unique constraint on (song_title, song_artist, user_id)
- Index on (song_title, song_artist)

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

## Stream Configuration

- **HLS Stream**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata Endpoint**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`

## Code Organization

The application follows a clean separation of concerns:
- **HTML** (`public/index.html`) - Structure and semantic markup only
- **CSS** (`public/styles.css`) - All styling, layout, and visual design
- **JavaScript** (`public/app.js`) - All application logic and interactivity

This modular structure makes the codebase easier to maintain, debug, and extend.

## Design System

Radio Calico follows a custom brand style guide with:

**Colors**:
- Mint (#D8F2D5) - Accents and background fills
- Forest Green (#1F4E23) - Primary buttons and headings
- Teal (#38A29D) - Navigation bar background
- Charcoal (#231F20) - Body text
- Cream (#F5EADA) - Secondary backgrounds

**Typography**:
- Montserrat (headings, bold)
- Open Sans (body text)

For complete styling details, see `RadioCalico_Style_Guide.txt`.

## Testing

Radio Calico includes a comprehensive test suite with 23 unit tests:

- **12 Backend Tests**: API endpoints, database operations, validation, multi-user scenarios
- **11 Frontend Tests**: UI interactions, client-side validation, error handling, state management

### Test Coverage

**Backend Tests** (`tests/backend/ratings.test.js`):
- ✅ POST /rate-song endpoint (create, update, validation)
- ✅ GET /user-rating endpoint (retrieval, null handling)
- ✅ Real PostgreSQL database testing (not mocked)
- ✅ Business logic and edge cases
- ✅ Async/await with connection pooling

**Frontend Tests** (`tests/frontend/ratings-ui.test.js`):
- ✅ rateSong function (validation, API calls, error handling)
- ✅ Rating button UI state (active states, disabled states)
- ✅ Mocked fetch, localStorage, and alert
- ✅ Client-side validation and user feedback

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode (auto-rerun on changes)
npm run test:coverage     # Generate coverage report
npm run test:backend      # Backend tests only
npm run test:frontend     # Frontend tests only
```

**Test Execution**: All 23 tests run in < 1 second

### CI/CD Pipeline

Automated testing and security scanning via GitHub Actions:

**On Every Push/PR:**
- ✅ Unit tests on Node.js 18.x and 20.x
- ✅ PostgreSQL service container for backend tests
- ✅ Coverage report upload to Codecov
- ✅ 9 security checks (npm audit, secrets, SQL injection, etc.)
- ✅ Trivy vulnerability scanning (filesystem + containers)
- ✅ Docker build verification
- ✅ Dependency review on pull requests

**Daily Scheduled:**
- ✅ Full security scan at 2 AM UTC
- ✅ Dependency updates check

See `.github/workflows/ci.yml` for details.

### Documentation

- **[TESTING.md](TESTING.md)** - Comprehensive testing guide
- **[tests/README.md](tests/README.md)** - Detailed documentation with examples
- **[GETTING_STARTED_WITH_TESTS.md](GETTING_STARTED_WITH_TESTS.md)** - Quick start guide
- **[TEST_SUMMARY.md](TEST_SUMMARY.md)** - Quick summary of test coverage

## Performance Optimization

Radio Calico includes a comprehensive performance optimization guide:

**Current Baseline:**
- Total Bundle Size: ~280-300 KB (uncompressed)
- First Contentful Paint: ~1.5s
- Lighthouse Score: ~75

**Optimization Potential:**
- 🚀 47% faster First Contentful Paint (1.5s → 0.8s)
- 📦 40% smaller bundle size (300 KB → 180 KB)
- ⚡ +20 points Lighthouse score (75 → 95+)

**Quick Wins (1-2 hours for 30-40% improvement):**
1. Optimize logo image (save 44 KB)
2. Add defer to scripts
3. Lazy load images
4. Add resource hints
5. Update cache headers

See **[PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)** for:
- Detailed performance analysis
- 11 optimization strategies with code examples
- Step-by-step implementation guides
- Before/after performance metrics

## Security

Comprehensive security measures:

**Automated Checks:**
- ✅ npm audit for dependency vulnerabilities
- ✅ Hardcoded secrets detection
- ✅ SQL injection pattern checking
- ✅ Default password detection
- ✅ nginx security headers validation
- ✅ Docker security configuration
- ✅ Trivy container scanning
- ✅ GitHub Security tab integration

**Run Security Scans:**
```bash
make security         # Comprehensive security check
make security-quick   # Quick npm audit
make audit-fix        # Auto-fix vulnerabilities
```

## Docker Support

Full Docker and Docker Compose support with:

- **Development Mode**: Hot-reloading, volume mounts, debugging
- **Production Mode**: Multi-stage builds, nginx reverse proxy, optimized
- **Database**: PostgreSQL 16 with persistent volumes
- **Health Checks**: Automatic container health monitoring
- **Backups**: Database backup scripts

**Quick Commands:**
```bash
make dev              # Start development environment
make prod             # Start production environment
make test             # Run tests
make security         # Run security scans
make logs-dev         # View development logs
make logs-prod        # View production logs
make backup           # Backup production database
make clean            # Clean up containers
```

See **[DOCKER.md](DOCKER.md)** for complete documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Before submitting:**
1. Run `npm test` to ensure all 23 tests pass
2. Run `make security` to check for vulnerabilities
3. Add tests for new features
4. Update documentation as needed
5. Follow the existing code style

**Development Workflow:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and security checks
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

ISC

## Author

millerw8

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- HLS streaming powered by [hls.js](https://github.com/video-dev/hls.js/)
- Testing with [Jest](https://jestjs.io/)
- Security scanning with [Trivy](https://trivy.dev/)
