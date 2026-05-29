// Radio Player Logic
const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const volumeSlider = document.getElementById('volumeSlider');
const radioStatus = document.getElementById('radioStatus');
const elapsedTime = document.getElementById('elapsedTime');
const remainingTime = document.getElementById('remainingTime');
const progressBar = document.getElementById('progressBar');
const trackMetadata = document.getElementById('trackMetadata');
const mainAlbumArt = document.getElementById('mainAlbumArt');
const recentlyPlayedWidget = document.getElementById('recentlyPlayedWidget');
const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';

let isPlaying = false;
let hls = null;
let timerInterval = null;
let nowPlayingInterval = null;
let currentSong = null;
let songStartTime = null;
let estimatedDuration = 210;
let currentUser = null;
let currentUserRating = null;
let currentAlbumArtUrl = null;

audioPlayer.volume = volumeSlider.value / 100;

async function loadUsers() {
    try {
        const response = await fetch('/users');
        const users = await response.json();
        const userSelect = document.getElementById('userSelect');

        console.log('Loaded users:', users);

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = `${user.username} (${user.email})`;
            userSelect.appendChild(option);
        });

        console.log('User select options:', userSelect.options.length);

        const savedEmail = localStorage.getItem('radiocalico_user_email');
        if (savedEmail) {
            const user = users.find(u => u.email === savedEmail);
            if (user) {
                loginUser(user.email, user.username);
            }
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function loginUser(email, username) {
    currentUser = { email, username };
    localStorage.setItem('radiocalico_user_email', email);

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('loggedInContainer').style.display = 'block';
    document.getElementById('currentUserDisplay').textContent = username;

    if (currentSong) {
        checkUserRating(currentSong.title, currentSong.artist);
    }
}

function logoutUser() {
    currentUser = null;
    currentUserRating = null;
    localStorage.removeItem('radiocalico_user_email');

    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('loggedInContainer').style.display = 'none';
    document.getElementById('userSelect').value = '';

    if (currentSong) {
        updateNowPlayingWidget(currentSong);
    }
}

document.getElementById('userSelect').addEventListener('change', function(e) {
    if (e.target.value) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const username = selectedOption.textContent.split(' (')[0];
        loginUser(e.target.value, username);
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function rateSong(rating) {
    if (!currentSong || !currentUser) {
        alert('Please select your account to rate songs');
        return;
    }

    if (currentUserRating === rating) {
        alert('You have already voted this way!');
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
                userId: currentUser.email
            })
        });

        const result = await response.json();
        console.log('Rating response:', { status: response.status, ok: response.ok, result });

        if (response.ok) {
            const oldRating = currentUserRating;
            currentUserRating = rating;
            currentSong.ratings = result.ratings;
            updateTrackMetadata(currentSong);

            if (result.changed) {
                console.log(`Changed vote from ${oldRating === 1 ? 'thumbs up' : 'thumbs down'} to ${rating === 1 ? 'thumbs up' : 'thumbs down'}`);
            }
        } else if (response.status === 409) {
            alert(result.error || 'You have already voted this way!');
        } else {
            alert('Failed to submit rating: ' + result.error);
        }
    } catch (error) {
        console.error('Rating error:', error);
        alert('Failed to submit rating');
    }
}

async function checkUserRating(title, artist) {
    if (!currentUser) {
        currentUserRating = null;
        return;
    }

    try {
        const response = await fetch(`/user-rating/${encodeURIComponent(currentUser.email)}/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`);
        const data = await response.json();
        currentUserRating = data.rating;
    } catch (error) {
        console.error('Failed to check user rating:', error);
        currentUserRating = null;
    }
}

function updateTrackMetadata(data) {
    let badgesHtml = '';
    badgesHtml += `<span class="quality-badge">${data.bit_depth}-bit</span>`;
    badgesHtml += `<span class="quality-badge">${(data.sample_rate / 1000).toFixed(1)}kHz</span>`;
    if (data.is_new) badgesHtml += `<span class="quality-badge">✨ NEW</span>`;
    if (data.is_summer) badgesHtml += `<span class="quality-badge">☀️ SUMMER</span>`;
    if (data.is_vidgames) badgesHtml += `<span class="quality-badge">🎮 GAMES</span>`;

    const albumInfo = data.album && data.date ? `<div class="track-album">${data.album} (${data.date})</div>` : '';

    const thumbsUpActive = currentUserRating === 1 ? 'active' : '';
    const thumbsDownActive = currentUserRating === -1 ? 'active' : '';
    const thumbsUpDisabled = !currentUser || currentUserRating === 1 ? 'disabled' : '';
    const thumbsDownDisabled = !currentUser || currentUserRating === -1 ? 'disabled' : '';
    const ratingTitle = !currentUser ? 'Please select your account to rate' : 'Click to vote or change your vote';

    const existingInfo = trackMetadata.querySelector('.track-info');

    if (existingInfo) {
        existingInfo.querySelector('.track-artist').textContent = data.artist;
        existingInfo.querySelector('.track-title').textContent = data.title;
        const albumDiv = existingInfo.querySelector('.track-album');
        if (albumInfo) {
            if (albumDiv) {
                albumDiv.innerHTML = albumInfo;
            } else {
                existingInfo.querySelector('.track-artist').insertAdjacentHTML('afterend', albumInfo);
            }
        } else if (albumDiv) {
            albumDiv.remove();
        }
        existingInfo.querySelector('.quality-badges').innerHTML = badgesHtml;

        const ratingButtons = existingInfo.querySelectorAll('.rating-btn');
        ratingButtons[0].className = `rating-btn ${thumbsUpActive}`;
        ratingButtons[0].disabled = thumbsUpDisabled !== '';
        ratingButtons[0].title = currentUserRating === 1 ? 'You voted thumbs up' : 'Vote thumbs up';
        ratingButtons[0].querySelector('.rating-count').textContent = data.ratings.thumbs_up;

        ratingButtons[1].className = `rating-btn ${thumbsDownActive}`;
        ratingButtons[1].disabled = thumbsDownDisabled !== '';
        ratingButtons[1].title = currentUserRating === -1 ? 'You voted thumbs down' : 'Vote thumbs down';
        ratingButtons[1].querySelector('.rating-count').textContent = data.ratings.thumbs_down;
    } else {
        trackMetadata.innerHTML = `
            <div class="track-info">
                <h2 class="track-artist">${data.artist}</h2>
                <h3 class="track-title">${data.title}</h3>
                ${albumInfo}
                <div class="stream-quality">
                    <strong>Stream Quality:</strong> ${data.bit_depth}-bit / ${(data.sample_rate / 1000).toFixed(1)} kHz Lossless
                </div>
                <div class="quality-badges">${badgesHtml}</div>
                <div class="rating-section" title="${ratingTitle}">
                    <div class="rating-buttons">
                        <button class="rating-btn ${thumbsUpActive}" onclick="rateSong(1)" ${thumbsUpDisabled} title="${currentUserRating === 1 ? 'You voted thumbs up' : 'Vote thumbs up'}">
                            👍 <span class="rating-count">${data.ratings.thumbs_up}</span>
                        </button>
                        <button class="rating-btn ${thumbsDownActive}" onclick="rateSong(-1)" ${thumbsDownDisabled} title="${currentUserRating === -1 ? 'You voted thumbs down' : 'Vote thumbs down'}">
                            👎 <span class="rating-count">${data.ratings.thumbs_down}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateRecentlyPlayedWidget(tracks) {
    if (!tracks || tracks.length === 0) {
        recentlyPlayedWidget.innerHTML = '<div class="empty-state">No recent tracks yet</div>';
        return;
    }

    const tracksHtml = tracks.map(track => `
        <div class="recent-track">
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
        </div>
    `).join('');

    recentlyPlayedWidget.innerHTML = `<div class="recently-played-list">${tracksHtml}</div>`;
}

async function fetchNowPlaying() {
    try {
        const response = await fetch('/now-playing');
        const data = await response.json();

        const songChanged = !currentSong || currentSong.title !== data.title || currentSong.artist !== data.artist;

        if (songChanged) {
            currentSong = data;
            songStartTime = Date.now();
            estimatedDuration = 210;

            const newAlbumArtUrl = `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg?t=${Date.now()}`;
            if (currentAlbumArtUrl !== newAlbumArtUrl) {
                mainAlbumArt.src = newAlbumArtUrl;
                currentAlbumArtUrl = newAlbumArtUrl;
            }

            await checkUserRating(data.title, data.artist);
            updateTrackMetadata(data);
            updateRecentlyPlayedWidget(data.previous_tracks);
        } else if (currentSong) {
            currentSong.ratings = data.ratings;
            updateTrackMetadata(currentSong);
        }
    } catch (error) {
        console.error('Failed to fetch now playing:', error);
    }
}

function updateSongProgress() {
    if (!currentSong || !songStartTime) return;

    const elapsed = Math.floor((Date.now() - songStartTime) / 1000);
    const remaining = Math.max(0, estimatedDuration - elapsed);
    const progress = Math.min(100, (elapsed / estimatedDuration) * 100);

    elapsedTime.textContent = formatTime(elapsed);
    remainingTime.textContent = `-${formatTime(remaining)}`;
    progressBar.style.width = `${progress}%`;
}

function startTimer() {
    if (!nowPlayingInterval) {
        fetchNowPlaying();
        nowPlayingInterval = setInterval(fetchNowPlaying, 10000);
    }
    timerInterval = setInterval(updateSongProgress, 1000);
    updateSongProgress();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (nowPlayingInterval) {
        clearInterval(nowPlayingInterval);
        nowPlayingInterval = null;
    }
    currentSong = null;
    songStartTime = null;
    elapsedTime.textContent = '0:00';
    remainingTime.textContent = '-0:00';
    progressBar.style.width = '0%';
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function initializePlayer() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audioPlayer);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('HLS manifest loaded');
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);
            if (data.fatal) {
                radioStatus.textContent = 'Stream error. Retrying...';
                radioStatus.className = 'radio-status error';
                setTimeout(() => {
                    if (hls) {
                        hls.destroy();
                    }
                    initializePlayer();
                    if (isPlaying) {
                        audioPlayer.play();
                    }
                }, 3000);
            }
        });
    } else if (audioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        audioPlayer.src = streamUrl;
    } else {
        radioStatus.textContent = 'HLS not supported in this browser';
        radioStatus.className = 'radio-status error';
    }
}

playButton.addEventListener('click', function() {
    if (!hls && !audioPlayer.src) {
        initializePlayer();
    }

    if (isPlaying) {
        audioPlayer.pause();
        playButton.textContent = '▶';
        radioStatus.textContent = 'Paused';
        radioStatus.className = 'radio-status';
        pauseTimer();
        isPlaying = false;
    } else {
        audioPlayer.play().then(() => {
            playButton.textContent = '⏸';
            radioStatus.textContent = 'Now Playing';
            radioStatus.className = 'radio-status playing';
            startTimer();
            isPlaying = true;
        }).catch(error => {
            console.error('Playback error:', error);
            radioStatus.textContent = 'Playback failed. Please try again.';
            radioStatus.className = 'radio-status error';
        });
    }
});

volumeSlider.addEventListener('input', function() {
    audioPlayer.volume = this.value / 100;
});

audioPlayer.addEventListener('waiting', function() {
    radioStatus.textContent = 'Buffering...';
    radioStatus.className = 'radio-status';
});

audioPlayer.addEventListener('playing', function() {
    radioStatus.textContent = 'Now Playing';
    radioStatus.className = 'radio-status playing';
});

audioPlayer.addEventListener('pause', function() {
    if (isPlaying) {
        radioStatus.textContent = 'Paused';
        radioStatus.className = 'radio-status';
    }
});

audioPlayer.addEventListener('ended', function() {
    stopTimer();
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    loadUsers();
});

// Load initial metadata even when not playing
fetchNowPlaying();
setInterval(fetchNowPlaying, 10000);

