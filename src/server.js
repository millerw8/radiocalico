require('dotenv').config();
const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RadioCalico API', status: 'running' });
});

app.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users', (req, res) => {
  try {
    const { username, email } = req.body;
    const stmt = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
    const result = stmt.run(username, email);
    res.status(201).json({ id: result.lastInsertRowid, username, email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getSongRatings(title, artist) {
  const thumbsUp = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_title = ? AND song_artist = ? AND rating = 1').get(title, artist);
  const thumbsDown = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_title = ? AND song_artist = ? AND rating = -1').get(title, artist);
  return {
    thumbs_up: thumbsUp.count,
    thumbs_down: thumbsDown.count
  };
}

app.get('/now-playing', async (req, res) => {
  try {
    const response = await fetch('https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json');
    const metadata = await response.json();

    const ratings = getSongRatings(metadata.title, metadata.artist);

    const nowPlaying = {
      title: metadata.title || 'Unknown Track',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || '',
      date: metadata.date || '',
      bit_depth: metadata.bit_depth,
      sample_rate: metadata.sample_rate,
      is_new: metadata.is_new,
      is_summer: metadata.is_summer,
      is_vidgames: metadata.is_vidgames,
      ratings: ratings,
      previous_tracks: [
        { artist: metadata.prev_artist_1, title: metadata.prev_title_1 },
        { artist: metadata.prev_artist_2, title: metadata.prev_title_2 },
        { artist: metadata.prev_artist_3, title: metadata.prev_title_3 },
        { artist: metadata.prev_artist_4, title: metadata.prev_title_4 },
        { artist: metadata.prev_artist_5, title: metadata.prev_title_5 }
      ].filter(t => t.artist && t.title),
      timestamp: Date.now()
    };

    res.json(nowPlaying);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metadata', message: error.message });
  }
});

app.post('/rate-song', (req, res) => {
  try {
    const { title, artist, rating, userId } = req.body;

    if (!title || !artist || !rating || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
    }

    const existingRating = db.prepare('SELECT * FROM song_ratings WHERE song_title = ? AND song_artist = ? AND user_id = ?').get(title, artist, userId);

    if (existingRating) {
      if (existingRating.rating === rating) {
        return res.status(409).json({ error: 'You have already voted this way', existing_rating: existingRating.rating });
      }

      const updateStmt = db.prepare('UPDATE song_ratings SET rating = ?, created_at = CURRENT_TIMESTAMP WHERE song_title = ? AND song_artist = ? AND user_id = ?');
      updateStmt.run(rating, title, artist, userId);
    } else {
      const insertStmt = db.prepare('INSERT INTO song_ratings (song_title, song_artist, user_id, rating) VALUES (?, ?, ?, ?)');
      insertStmt.run(title, artist, userId, rating);
    }

    const ratings = getSongRatings(title, artist);

    res.json({ success: true, ratings, changed: !!existingRating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-rating/:userId/:title/:artist', (req, res) => {
  try {
    const { userId, title, artist } = req.params;
    const rating = db.prepare('SELECT rating FROM song_ratings WHERE song_title = ? AND song_artist = ? AND user_id = ?').get(title, artist, userId);
    res.json({ rating: rating ? rating.rating : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DATABASE_PATH}`);
});
