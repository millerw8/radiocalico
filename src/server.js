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

app.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    const result = await db.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [username, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getSongRatings(title, artist) {
  const thumbsUpResult = await db.query(
    'SELECT COUNT(*) as count FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND rating = 1',
    [title, artist]
  );
  const thumbsDownResult = await db.query(
    'SELECT COUNT(*) as count FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND rating = -1',
    [title, artist]
  );
  return {
    thumbs_up: parseInt(thumbsUpResult.rows[0].count),
    thumbs_down: parseInt(thumbsDownResult.rows[0].count)
  };
}

app.get('/now-playing', async (req, res) => {
  try {
    const response = await fetch('https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json');
    const metadata = await response.json();

    const ratings = await getSongRatings(metadata.title, metadata.artist);

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

app.post('/rate-song', async (req, res) => {
  try {
    const { title, artist, rating, userId } = req.body;

    if (!title || !artist || !rating || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
    }

    const existingRating = await db.query(
      'SELECT * FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND user_id = $3',
      [title, artist, userId]
    );

    if (existingRating.rows.length > 0) {
      if (existingRating.rows[0].rating === rating) {
        return res.status(409).json({ error: 'You have already voted this way', existing_rating: existingRating.rows[0].rating });
      }

      await db.query(
        'UPDATE song_ratings SET rating = $1, created_at = CURRENT_TIMESTAMP WHERE song_title = $2 AND song_artist = $3 AND user_id = $4',
        [rating, title, artist, userId]
      );
    } else {
      await db.query(
        'INSERT INTO song_ratings (song_title, song_artist, user_id, rating) VALUES ($1, $2, $3, $4)',
        [title, artist, userId, rating]
      );
    }

    const ratings = await getSongRatings(title, artist);

    res.json({ success: true, ratings, changed: existingRating.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-rating/:userId/:title/:artist', async (req, res) => {
  try {
    const { userId, title, artist } = req.params;
    const result = await db.query(
      'SELECT rating FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND user_id = $3',
      [title, artist, userId]
    );
    res.json({ rating: result.rows.length > 0 ? result.rows[0].rating : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: PostgreSQL at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
});
