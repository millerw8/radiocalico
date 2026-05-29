# Radio Calico

[![GitHub](https://img.shields.io/badge/GitHub-millerw8%2Fradiocalico-blue)](https://github.com/millerw8/radiocalico)

A web-based internet radio streaming application that plays lossless HLS audio streams with real-time metadata display and song rating features.

![Radio Calico](RadioCalicoLayout.png)

## Features

- 🎵 **Lossless HLS Audio Streaming** - High-quality audio playback from CloudFront
- 📻 **Real-time Metadata** - Live track information including artist, title, album, and technical details
- 👍👎 **Song Rating System** - Thumbs up/down voting for tracks
- 👤 **User Management** - Create and manage listener accounts
- 🕐 **Recently Played** - Track history of the last 5 songs
- 🎨 **Brand Design** - Clean UI following Radio Calico style guidelines

## Tech Stack

- **Backend**: Node.js, Express 5.x, SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript, HLS.js for audio streaming
- **Design**: Custom CSS with Montserrat & Open Sans fonts

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/millerw8/radiocalico.git
cd radiocalico

# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode

```bash
# Start with auto-reload on file changes
npm run dev
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_PATH=./database/app.db
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
- `GET /user-rating/:userId/:title/:artist` - Get user's rating for a song

## Project Structure

```
.
├── src/
│   ├── server.js           # Express server with REST API endpoints
│   └── database.js         # SQLite database initialization and schema
├── public/                 # Static files served by Express
│   ├── index.html          # Full-featured player HTML structure
│   ├── styles.css          # All CSS styling (682 lines)
│   ├── app.js              # All JavaScript logic (417 lines)
│   ├── users.html          # User management interface
│   └── logo.png            # Radio Calico logo
├── database/
│   └── app.db              # SQLite database (auto-created)
├── index.html              # Simple standalone HLS player (root)
├── package.json            # Node.js dependencies and scripts
├── .env                    # Environment configuration
├── CLAUDE.md               # Development guidance for Claude Code
├── README.md               # This file
└── RadioCalico_Style_Guide.txt  # Brand design system
```

## Database Schema

### users table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `created_at` - Timestamp

### song_ratings table
- `id` - Primary key
- `song_title` - Track title
- `song_artist` - Artist name
- `user_id` - User identifier
- `rating` - 1 (thumbs up) or -1 (thumbs down)
- `created_at` - Timestamp
- Unique constraint on (song_title, song_artist, user_id)

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

millerw8
