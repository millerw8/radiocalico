const { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

// Create test database pool
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'radiocalico_test',
  user: process.env.DB_USER || 'radiocalico',
  password: process.env.DB_PASSWORD || 'radiocalico',
  max: 5,
});

// Initialize test database schema
async function initTestDatabase() {
  await testPool.query(`
    DROP TABLE IF EXISTS song_ratings CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  await testPool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPool.query(`
    CREATE TABLE song_ratings (
      id SERIAL PRIMARY KEY,
      song_title TEXT NOT NULL,
      song_artist TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_title, song_artist, user_id)
    )
  `);

  await testPool.query(`
    CREATE INDEX idx_song_ratings_lookup ON song_ratings(song_title, song_artist)
  `);
}

// Clean up test data
async function cleanTestData() {
  await testPool.query('DELETE FROM song_ratings');
  await testPool.query('DELETE FROM users');
}

// Create test Express app
function createTestApp(db) {
  const app = express();
  app.use(express.json());

  // Helper function to get song ratings
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

  // POST /rate-song endpoint
  app.post('/rate-song', async (req, res) => {
    try {
      const { title, artist, rating, userId } = req.body;

      if (!title || !artist || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (rating !== 1 && rating !== -1) {
        return res.status(400).json({ error: 'Rating must be 1 or -1' });
      }

      // Check if user already rated this song
      const existingResult = await db.query(
        'SELECT rating FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND user_id = $3',
        [title, artist, userId]
      );

      let changed = false;

      if (existingResult.rows.length > 0) {
        const existingRating = existingResult.rows[0].rating;
        if (existingRating === rating) {
          return res.status(409).json({ error: 'You have already voted this way' });
        }
        // Update existing rating
        await db.query(
          'UPDATE song_ratings SET rating = $1 WHERE song_title = $2 AND song_artist = $3 AND user_id = $4',
          [rating, title, artist, userId]
        );
        changed = true;
      } else {
        // Insert new rating
        await db.query(
          'INSERT INTO song_ratings (song_title, song_artist, user_id, rating) VALUES ($1, $2, $3, $4)',
          [title, artist, userId, rating]
        );
      }

      const ratings = await getSongRatings(title, artist);
      res.json({ success: true, ratings, changed });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /user-rating/:userId/:title/:artist endpoint
  app.get('/user-rating/:userId/:title/:artist', async (req, res) => {
    try {
      const { userId, title, artist } = req.params;
      const result = await db.query(
        'SELECT rating FROM song_ratings WHERE user_id = $1 AND song_title = $2 AND song_artist = $3',
        [userId, title, artist]
      );

      if (result.rows.length === 0) {
        return res.json({ rating: null });
      }

      res.json({ rating: result.rows[0].rating });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

let app;

describe('Song Rating API', () => {
  beforeAll(async () => {
    // Initialize test database schema
    await initTestDatabase();
    app = createTestApp(testPool);
  });

  afterAll(async () => {
    // Close database connection
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean data before each test
    await cleanTestData();
  });

  describe('POST /rate-song', () => {
    it('should successfully create a new thumbs up rating', async () => {
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ratings.thumbs_up).toBe(1);
      expect(response.body.ratings.thumbs_down).toBe(0);
      expect(response.body.changed).toBe(false);
    });

    it('should successfully create a new thumbs down rating', async () => {
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ratings.thumbs_up).toBe(0);
      expect(response.body.ratings.thumbs_down).toBe(1);
      expect(response.body.changed).toBe(false);
    });

    it('should allow user to change their vote from thumbs up to thumbs down', async () => {
      // First vote: thumbs up
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Change vote to thumbs down
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.changed).toBe(true);
      expect(response.body.ratings.thumbs_up).toBe(0);
      expect(response.body.ratings.thumbs_down).toBe(1);
    });

    it('should allow user to change their vote from thumbs down to thumbs up', async () => {
      // First vote: thumbs down
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      // Change vote to thumbs up
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.changed).toBe(true);
      expect(response.body.ratings.thumbs_up).toBe(1);
      expect(response.body.ratings.thumbs_down).toBe(0);
    });

    it('should return 409 when user tries to vote the same way twice', async () => {
      // First vote
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Try to vote the same way again
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('You have already voted this way');
    });

    it('should return 400 when rating is not 1 or -1', async () => {
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 5,
          userId: 'user123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rating must be 1 or -1');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song'
          // Missing artist, rating, userId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should allow multiple users to rate the same song', async () => {
      // User 1 votes thumbs up
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user1'
        });

      // User 2 votes thumbs up
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user2'
        });

      // User 3 votes thumbs down
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user3'
        });

      expect(response.status).toBe(200);
      expect(response.body.ratings.thumbs_up).toBe(2);
      expect(response.body.ratings.thumbs_down).toBe(1);
    });

    it('should track ratings separately for different songs', async () => {
      // Rate song 1
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Song 1',
          artist: 'Artist 1',
          rating: 1,
          userId: 'user123'
        });

      // Rate song 2
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Song 2',
          artist: 'Artist 2',
          rating: -1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.ratings.thumbs_up).toBe(0);
      expect(response.body.ratings.thumbs_down).toBe(1);
    });
  });

  describe('GET /user-rating/:userId/:title/:artist', () => {
    it('should return null when user has not rated the song', async () => {
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(null);
    });

    it('should return the correct rating when user has rated thumbs up', async () => {
      // Create a rating
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Get the rating
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(1);
    });

    it('should return the updated rating after user changes their vote', async () => {
      // Initial vote: thumbs up
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Change to thumbs down
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      // Get the updated rating
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(-1);
    });
  });
});
