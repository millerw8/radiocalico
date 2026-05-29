# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Calico is a web-based internet radio streaming application that plays lossless HLS audio streams. The application consists of:
- An Express.js backend server with SQLite database
- A frontend web player with HLS streaming support
- Real-time metadata display for now-playing information
- Song rating system (thumbs up/down)

## File Structure

```
.
├── src/
│   ├── server.js           # Express server with REST API endpoints
│   └── database.js         # SQLite database initialization and schema
├── public/                 # Static files served by Express
│   ├── index.html          # Full-featured player HTML (90 lines - structure only)
│   ├── styles.css          # All CSS styling (682 lines)
│   ├── app.js              # All JavaScript logic (417 lines)
│   ├── users.html          # User management interface
│   └── logo.png            # Radio Calico logo
├── database/
│   └── app.db              # SQLite database (auto-created)
├── index.html              # Simple standalone HLS player (root)
├── package.json            # Node.js dependencies and scripts
├── .env                    # Environment configuration (PORT, DATABASE_PATH)
├── README.md               # Project documentation
├── stream_URL.txt          # HLS stream URL reference
├── RadioCalico_Style_Guide.txt  # Design system colors and fonts
├── RadioCalicoLayout.png   # UI layout reference
├── RadioCalicoLogoTM.png   # Logo asset
└── RadioCalicoStyle.zip    # Design assets archive
```

## Architecture

### Backend (Node.js/Express)
- **Entry point**: `src/server.js` - Express server with REST API endpoints
- **Database**: `src/database.js` - SQLite database setup using better-sqlite3
- **Database location**: `./database/app.db` (auto-created on first run)
- **Environment config**: `.env` file for PORT and DATABASE_PATH

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

### Database Schema

**users table**:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `username` (TEXT NOT NULL UNIQUE)
- `email` (TEXT NOT NULL UNIQUE)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

**song_ratings table**:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `song_title` (TEXT NOT NULL)
- `song_artist` (TEXT NOT NULL)
- `user_id` (TEXT NOT NULL)
- `rating` (INTEGER NOT NULL CHECK(rating IN (1, -1))) - 1 for thumbs up, -1 for thumbs down
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- UNIQUE constraint on (song_title, song_artist, user_id)
- Index on (song_title, song_artist)

## Development Commands

```bash
# Start the server (production mode)
npm start

# Start with auto-reload on file changes (development mode)
npm run dev

# The server runs on http://localhost:3000
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

## Important Notes

- The database is auto-created on first server start
- better-sqlite3 is used for synchronous database operations (no async/await needed for queries)
- Express 5.x is used (note: some middleware may need updates from Express 4.x patterns)
- Static files are served from the `public/` directory
- The root `index.html` is a simpler standalone player; `public/index.html` is the full-featured version
- All CSS and JavaScript are in separate files - avoid adding inline styles or scripts to HTML files
