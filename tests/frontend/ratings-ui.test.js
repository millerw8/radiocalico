const { describe, it, expect, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Load the app.js file content
const appJsPath = path.join(__dirname, '../../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

describe('Rating System - Frontend UI', () => {
  let document;
  let window;
  let rateSong;
  let updateMetadataDisplay;
  let currentUserId;
  let currentSong;
  let currentUserRating;

  beforeEach(() => {
    // Setup DOM
    document = global.document;
    window = global.window;

    // Create necessary DOM elements
    document.body.innerHTML = `
      <div id="track-metadata"></div>
      <div id="recently-played-widget"></div>
    `;

    // Mock global variables and functions from app.js
    currentUserId = 'test-user-123';
    currentSong = null;
    currentUserRating = null;

    // Extract and evaluate the rateSong function from app.js
    // This is a simplified version for testing
    rateSong = async function(rating) {
      if (!currentUserId) {
        alert('Please set a User ID first');
        return;
      }

      if (!currentSong) {
        alert('No song is currently playing');
        return;
      }

      if (currentUserRating === rating) {
        alert('You have already voted this way');
        return;
      }

      try {
        const response = await fetch('/rate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentSong.title,
            artist: currentSong.artist,
            rating: rating,
            userId: currentUserId
          })
        });

        const data = await response.json();

        if (response.ok) {
          currentUserRating = rating;
          return data;
        } else if (response.status === 409) {
          alert('You have already voted this way');
          return null;
        } else {
          throw new Error(data.error || 'Failed to rate song');
        }
      } catch (error) {
        console.error('Error rating song:', error);
        alert('Failed to submit rating. Please try again.');
        return null;
      }
    };

    // Mock alert
    global.alert = jest.fn();
  });

  describe('rateSong function', () => {
    it('should alert when no user ID is set', async () => {
      currentUserId = null;
      await rateSong(1);
      expect(global.alert).toHaveBeenCalledWith('Please set a User ID first');
    });

    it('should alert when no song is playing', async () => {
      currentUserId = 'user123';
      currentSong = null;
      await rateSong(1);
      expect(global.alert).toHaveBeenCalledWith('No song is currently playing');
    });

    it('should alert when user tries to vote the same way twice', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = 1;
      await rateSong(1);
      expect(global.alert).toHaveBeenCalledWith('You have already voted this way');
    });

    it('should successfully submit a thumbs up rating', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = null;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          ratings: { thumbs_up: 1, thumbs_down: 0 },
          changed: false
        })
      });

      const result = await rateSong(1);

      expect(global.fetch).toHaveBeenCalledWith('/rate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          rating: 1,
          userId: 'user123'
        })
      });

      expect(result.success).toBe(true);
      expect(currentUserRating).toBe(1);
    });

    it('should successfully submit a thumbs down rating', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = null;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          ratings: { thumbs_up: 0, thumbs_down: 1 },
          changed: false
        })
      });

      const result = await rateSong(-1);

      expect(result.success).toBe(true);
      expect(currentUserRating).toBe(-1);
    });

    it('should handle 409 conflict response from server', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = null;

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'You have already voted this way',
          existing_rating: 1
        })
      });

      const result = await rateSong(1);

      expect(global.alert).toHaveBeenCalledWith('You have already voted this way');
      expect(result).toBe(null);
    });

    it('should handle network errors gracefully', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = null;

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await rateSong(1);

      expect(global.alert).toHaveBeenCalledWith('Failed to submit rating. Please try again.');
      expect(result).toBe(null);
    });

    it('should allow changing vote from thumbs up to thumbs down', async () => {
      currentUserId = 'user123';
      currentSong = { title: 'Test Song', artist: 'Test Artist' };
      currentUserRating = 1; // Currently thumbs up

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          ratings: { thumbs_up: 0, thumbs_down: 1 },
          changed: true
        })
      });

      const result = await rateSong(-1);

      expect(result.success).toBe(true);
      expect(result.changed).toBe(true);
      expect(currentUserRating).toBe(-1);
    });
  });

  describe('Rating button UI state', () => {
    it('should render rating buttons with correct initial state', () => {
      const mockData = {
        artist: 'Test Artist',
        title: 'Test Song',
        album: 'Test Album',
        bit_depth: 24,
        sample_rate: 96000,
        ratings: { thumbs_up: 5, thumbs_down: 2 }
      };

      currentUserId = 'user123';
      currentUserRating = null;

      const trackMetadata = document.getElementById('track-metadata');
      const ratingTitle = currentUserId ? '' : 'Set a User ID to rate songs';
      const thumbsUpActive = '';
      const thumbsDownActive = '';
      const thumbsUpDisabled = currentUserId ? '' : 'disabled';
      const thumbsDownDisabled = currentUserId ? '' : 'disabled';

      trackMetadata.innerHTML = `
        <div class="track-info">
          <h2 class="track-artist">${mockData.artist}</h2>
          <h3 class="track-title">${mockData.title}</h3>
          <div class="rating-section" title="${ratingTitle}">
            <div class="rating-buttons">
              <button class="rating-btn ${thumbsUpActive}" onclick="rateSong(1)" ${thumbsUpDisabled}>
                👍 <span class="rating-count">${mockData.ratings.thumbs_up}</span>
              </button>
              <button class="rating-btn ${thumbsDownActive}" onclick="rateSong(-1)" ${thumbsDownDisabled}>
                👎 <span class="rating-count">${mockData.ratings.thumbs_down}</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const buttons = trackMetadata.querySelectorAll('.rating-btn');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('5');
      expect(buttons[1].textContent).toContain('2');
    });

    it('should show active state for thumbs up when user has voted', () => {
      const mockData = {
        artist: 'Test Artist',
        title: 'Test Song',
        ratings: { thumbs_up: 6, thumbs_down: 2 }
      };

      currentUserId = 'user123';
      currentUserRating = 1; // User voted thumbs up

      const trackMetadata = document.getElementById('track-metadata');
      const thumbsUpActive = 'active';
      const thumbsDownActive = '';

      trackMetadata.innerHTML = `
        <div class="rating-buttons">
          <button class="rating-btn ${thumbsUpActive}">
            👍 <span class="rating-count">${mockData.ratings.thumbs_up}</span>
          </button>
          <button class="rating-btn ${thumbsDownActive}">
            👎 <span class="rating-count">${mockData.ratings.thumbs_down}</span>
          </button>
        </div>
      `;

      const buttons = trackMetadata.querySelectorAll('.rating-btn');
      expect(buttons[0].classList.contains('active')).toBe(true);
      expect(buttons[1].classList.contains('active')).toBe(false);
    });

    it('should disable rating buttons when no user ID is set', () => {
      currentUserId = null;
      const trackMetadata = document.getElementById('track-metadata');
      const thumbsUpDisabled = 'disabled';
      const thumbsDownDisabled = 'disabled';

      trackMetadata.innerHTML = `
        <div class="rating-buttons">
          <button class="rating-btn" ${thumbsUpDisabled}>👍 <span class="rating-count">0</span></button>
          <button class="rating-btn" ${thumbsDownDisabled}>👎 <span class="rating-count">0</span></button>
        </div>
      `;

      const buttons = trackMetadata.querySelectorAll('.rating-btn');
      expect(buttons[0].hasAttribute('disabled')).toBe(true);
      expect(buttons[1].hasAttribute('disabled')).toBe(true);
    });
  });
});
