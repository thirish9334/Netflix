/**
 * NETFLIX CLONE - FULLSCREEN VIDEO PLAYER CONTROLLER
 * Supports scrubber seeking, keyboard shortcuts, volume/mute, speed selection, and idle auto-hide.
 */

class NetflixPlayer {
  constructor() {
    this.playerContainer = document.getElementById("playerContainer");
    this.video = document.getElementById("playerVideo");
    this.backBtn = document.getElementById("playerBackBtn");
    this.playPauseBtn = document.getElementById("playerPlayPauseBtn");
    this.rewindBtn = document.getElementById("playerRewindBtn");
    this.forwardBtn = document.getElementById("playerForwardBtn");
    this.volumeBtn = document.getElementById("playerVolumeBtn");
    this.volumeSlider = document.getElementById("playerVolumeSlider");
    this.scrubberWrap = document.getElementById("playerScrubberWrap");
    this.progressBar = document.getElementById("playerProgressBar");
    this.scrubberThumb = document.getElementById("playerScrubberThumb");
    this.timeDisplay = document.getElementById("playerTimeDisplay");
    this.titleDisplay = document.getElementById("playerTitleDisplay");
    this.fullscreenBtn = document.getElementById("playerFullscreenBtn");
    this.speedBtn = document.getElementById("playerSpeedBtn");

    this.idleTimer = null;
    this.isDraggingScrubber = false;
    this.activeMovie = null;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.playerContainer || !this.video) return;

    // Back button
    this.backBtn.addEventListener("click", () => this.closePlayer());

    // Play/Pause toggle
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.video.addEventListener("click", () => this.togglePlayPause());

    // Skip controls
    this.rewindBtn.addEventListener("click", () => this.skip(-10));
    this.forwardBtn.addEventListener("click", () => this.skip(10));

    // Volume controls
    this.volumeBtn.addEventListener("click", () => this.toggleMute());
    this.volumeSlider.addEventListener("input", (e) => {
      this.video.volume = e.target.value;
      this.video.muted = e.target.value == 0;
      this.updateVolumeIcon();
    });

    // Time update & Progress bar
    this.video.addEventListener("timeupdate", () => this.handleTimeUpdate());
    this.video.addEventListener("loadedmetadata", () => this.handleMetadataLoaded());

    // Scrubber seeking
    this.scrubberWrap.addEventListener("click", (e) => this.seekByEvent(e));
    this.scrubberWrap.addEventListener("mousedown", () => {
      this.isDraggingScrubber = true;
    });

    window.addEventListener("mouseup", () => {
      this.isDraggingScrubber = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isDraggingScrubber) {
        this.seekByEvent(e);
      }
      this.handleUserActivity();
    });

    // Fullscreen toggle
    this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());

    // Playback speed
    if (this.speedBtn) {
      this.speedBtn.addEventListener("click", () => this.cyclePlaybackSpeed());
    }

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (!this.playerContainer.classList.contains("active")) return;

      if (e.code === "Space") {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === "ArrowLeft") {
        this.skip(-10);
      } else if (e.code === "ArrowRight") {
        this.skip(10);
      } else if (e.key === "f" || e.key === "F") {
        this.toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        this.toggleMute();
      } else if (e.key === "Escape") {
        if (!document.fullscreenElement) {
          this.closePlayer();
        }
      }
    });
  }

  openPlayer(movie, episode = null) {
    this.activeMovie = movie;
    const streamUrl = movie.previewClip || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

    const titleText = episode
      ? `${movie.title}: ${episode.title || "Episode 1"}`
      : movie.title;

    this.titleDisplay.textContent = titleText;
    this.video.src = streamUrl;
    this.playerContainer.classList.add("active");
    document.body.style.overflow = "hidden";

    this.video.play().catch(() => {});
    this.updatePlayPauseIcon(true);
    this.handleUserActivity();
  }

  closePlayer() {
    this.video.pause();
    this.video.src = "";
    this.playerContainer.classList.remove("active");
    document.body.style.overflow = "";

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    clearTimeout(this.idleTimer);
  }

  togglePlayPause() {
    if (this.video.paused) {
      this.video.play();
      this.updatePlayPauseIcon(true);
    } else {
      this.video.pause();
      this.updatePlayPauseIcon(false);
    }
  }

  updatePlayPauseIcon(isPlaying) {
    if (isPlaying) {
      this.playPauseBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      `;
    } else {
      this.playPauseBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    }
  }

  skip(seconds) {
    this.video.currentTime = Math.max(0, Math.min(this.video.duration || 0, this.video.currentTime + seconds));
  }

  seekByEvent(e) {
    const rect = this.scrubberWrap.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (this.video.duration) {
      this.video.currentTime = pos * this.video.duration;
    }
  }

  handleTimeUpdate() {
    if (!this.video.duration) return;
    const progressPercent = (this.video.currentTime / this.video.duration) * 100;
    this.progressBar.style.width = `${progressPercent}%`;
    this.scrubberThumb.style.left = `${progressPercent}%`;

    const remaining = Math.max(0, this.video.duration - this.video.currentTime);
    this.timeDisplay.textContent = this.formatTime(remaining);
  }

  handleMetadataLoaded() {
    this.timeDisplay.textContent = this.formatTime(this.video.duration);
  }

  formatTime(seconds) {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.volumeSlider.value = this.video.muted ? 0 : (this.video.volume || 1);
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    if (this.video.muted || this.video.volume === 0) {
      this.volumeBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
    } else {
      this.volumeBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.playerContainer.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  cyclePlaybackSpeed() {
    const speeds = [0.75, 1, 1.25, 1.5];
    const current = this.video.playbackRate;
    const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
    const next = speeds[nextIdx];
    this.video.playbackRate = next;
    this.speedBtn.textContent = `${next}x`;
  }

  handleUserActivity() {
    this.playerContainer.classList.remove("idle");
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.video.paused) {
        this.playerContainer.classList.add("idle");
      }
    }, 2800);
  }
}

// Global player instance
document.addEventListener("DOMContentLoaded", () => {
  window.netflixPlayer = new NetflixPlayer();
});
