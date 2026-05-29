const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Test database setup
const TEST_DB_PATH = path.join(__dirname, '../fixtures/test.db');

describe('Rating System - Backend', () => {
  let app;
  let db;

  beforeEach(() => {
    // Create fresh test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    db = new Database(TEST_DB_PATH);

    // Initialize schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS song_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_title TEXT NOT NULL,
        song_artist TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_title, song_artist, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_song_ratings
        ON song_ratings(song_title, song_artist);
    `);

    // Setup Express app with test database
    app = express();
    app.use(express.json());

    // Helper function to get song ratings
    const getSongRatings = (title, artist) => {
      const thumbsUp = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_title = ? AND song_artist = ? AND rating = 1').get(title, artist);
      const thumbsDown = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_title = ? AND song_artist = ? AND rating = -1').get(title, artist);
      return {
        thumbs_up: thumbsUp.count,
        thumbs_down: thumbsDown.count
      };
    };

    // Rate song endpoint
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

    // Get user rating endpoint
    app.get('/user-rating/:userId/:title/:artist', (req, res) => {
      try {
        const { userId, title, artist } = req.params;
        const rating = db.prepare('SELECT rating FROM song_ratings WHERE song_title = ? AND song_artist = ? AND user_id = ?').get(title, artist, userId);
        res.json({ rating: rating ? rating.rating : null });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
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
      expect(response.body.changed).toBe(false);
      expect(response.body.ratings.thumbs_up).toBe(1);
      expect(response.body.ratings.thumbs_down).toBe(0);
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
      expect(response.body.existing_rating).toBe(1);
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
      expect(response.body.error).toBe('Rating must be 1 (thumbs up) or -1 (thumbs down)');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          rating: 1
          // Missing artist and userId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should handle multiple users voting on the same song', async () => {
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

    it('should treat songs with different titles as separate entities', async () => {
      // Vote on Song A
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Song A',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Vote on Song B with same artist
      const response = await request(app)
        .post('/rate-song')
        .send({
          title: 'Song B',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /user-rating/:userId/:title/:artist', () => {
    it('should return null when user has not rated the song', async () => {
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(null);
    });

    it('should return 1 when user has thumbs up rating', async () => {
      // Create rating
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Fetch rating
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(1);
    });

    it('should return -1 when user has thumbs down rating', async () => {
      // Create rating
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      // Fetch rating
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(-1);
    });

    it('should return updated rating after user changes vote', async () => {
      // Initial vote
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        });

      // Change vote
      await request(app)
        .post('/rate-song')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: -1,
          userId: 'user123'
        });

      // Fetch updated rating
      const response = await request(app)
        .get('/user-rating/user123/Test%20Song/Test%20Artist');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(-1);
    });
  });
});
