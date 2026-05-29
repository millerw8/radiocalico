const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'radiocalico',
  user: process.env.DB_USER || 'radiocalico',
  password: process.env.DB_PASSWORD || 'radiocalico',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create song_ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS song_ratings (
        id SERIAL PRIMARY KEY,
        song_title TEXT NOT NULL,
        song_artist TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_title, song_artist, user_id)
      )
    `);

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_song_ratings_song
      ON song_ratings(song_title, song_artist)
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize on module load
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export pool for query execution
module.exports = pool;
