/**
 * NETFLIX CLONE - CORE APPLICATION CONTROLLER
 * Handles rows generation, hover preview, modal, search, watchlist, and navigation.
 */

class NetflixApp {
  constructor() {
    this.movies = MOVIES_DATABASE;
    this.rows = ROW_DEFINITIONS;
    this.profiles = USER_PROFILES;
    this.activeProfile = this.loadActiveProfile();
    this.myList = this.loadMyList();
    this.currentHeroIndex = 0;
    this.heroRotationInterval = null;
    this.hoverTimeout = null;
    this.activeHoverCard = null;
    this.activeModalMovie = null;

    this.initElements();
    this.bindEvents();
    this.renderHeaderProfiles();
    this.renderHeroBillboard();
    this.renderAllRows();
    this.setupNavbarScroll();
    this.setupFAQ();
  }

  /* ------------------------------------------------------------------------
   * INITIALIZATION & DOM REFERENCES
   * ------------------------------------------------------------------------ */
  initElements() {
    this.header = document.getElementById("netflixHeader");
    this.heroContainer = document.getElementById("heroBillboard");
    this.mainContent = document.getElementById("mainContent");
    this.hoverCard = document.getElementById("hoverPreviewCard");
    this.modalOverlay = document.getElementById("modalOverlay");
    this.searchResults = document.getElementById("searchResultsSection");
    this.browseView = document.getElementById("browseView");
    this.landingView = document.getElementById("landingView");
    this.toast = document.getElementById("toastNotice");

    // Search inputs
    this.searchWrapper = document.getElementById("searchWrapper");
    this.searchInput = document.getElementById("searchInput");
    this.searchClearBtn = document.getElementById("searchClearBtn");

    // Notification dropdown
    this.notificationBtn = document.getElementById("notificationBtn");
    this.notificationDropdown = document.getElementById("notificationDropdown");

    // Profile dropdown
    this.profileMenu = document.getElementById("profileMenu");
    this.profileDropdown = document.getElementById("profileDropdown");
    this.activeProfileAvatar = document.getElementById("activeProfileAvatar");
  }

  /* ------------------------------------------------------------------------
   * EVENT BINDINGS
   * ------------------------------------------------------------------------ */
  bindEvents() {
    // Mode toggle (Browse <-> Landing)
    const modeBtn = document.getElementById("modeToggleBtn");
    if (modeBtn) {
      modeBtn.addEventListener("click", () => this.toggleViewMode());
    }

    const landingGetStarted = document.getElementById("landingGetStartedBtn");
    if (landingGetStarted) {
      landingGetStarted.addEventListener("click", () => {
        const emailInput = document.getElementById("landingEmailInput");
        const emailVal = emailInput ? emailInput.value.trim() : "";
        if (emailVal) {
          this.showToast(`Welcome! Signed in as ${emailVal}`);
        }
        this.switchView("browse");
      });
    }

    // Navigation links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const category = link.getAttribute("data-category");
        this.handleNavFilter(category, link);
      });
    });

    // Brand logo returns to home
    const brandLogo = document.getElementById("brandLogo");
    if (brandLogo) {
      brandLogo.addEventListener("click", () => {
        this.handleNavFilter("home", document.querySelector('.nav-link[data-category="home"]'));
      });
    }

    // Search bar toggle
    const searchToggleBtn = document.getElementById("searchToggleBtn");
    if (searchToggleBtn) {
      searchToggleBtn.addEventListener("click", () => {
        this.searchWrapper.classList.toggle("open");
        if (this.searchWrapper.classList.contains("open")) {
          this.searchInput.focus();
        }
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => this.handleLiveSearch(e.target.value));
    }

    if (this.searchClearBtn) {
      this.searchClearBtn.addEventListener("click", () => {
        this.searchInput.value = "";
        this.handleLiveSearch("");
        this.searchInput.focus();
      });
    }

    // Notifications toggle
    if (this.notificationBtn) {
      this.notificationBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.notificationDropdown.classList.toggle("show");
        this.profileDropdown.classList.remove("show");
      });
    }

    // Close popups on document click
    document.addEventListener("click", (e) => {
      if (this.notificationDropdown && !this.notificationDropdown.contains(e.target)) {
        this.notificationDropdown.classList.remove("show");
      }
      if (this.hoverCard && !this.hoverCard.contains(e.target)) {
        this.hideHoverCard();
      }
    });

    // Close modal on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });

    // Close modal button & backdrop
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", () => this.closeModal());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener("click", (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Hover card mouse interactions
    if (this.hoverCard) {
      this.hoverCard.addEventListener("mouseenter", () => {
        clearTimeout(this.hoverTimeout);
      });
      this.hoverCard.addEventListener("mouseleave", () => {
        this.hideHoverCard();
      });
    }
  }

  /* ------------------------------------------------------------------------
   * NAVBAR & SCROLL BEHAVIOR
   * ------------------------------------------------------------------------ */
  setupNavbarScroll() {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 30) {
        this.header.classList.add("scrolled");
      } else {
        this.header.classList.remove("scrolled");
      }
    });
  }

  /* ------------------------------------------------------------------------
   * USER PROFILES & WATCHLIST PERSISTENCE
   * ------------------------------------------------------------------------ */
  loadActiveProfile() {
    const saved = localStorage.getItem("netflix_active_profile");
    if (saved) {
      const found = this.profiles.find((p) => p.id === saved);
      if (found) return found;
    }
    return this.profiles[0];
  }

  setActiveProfile(profileId) {
    const prof = this.profiles.find((p) => p.id === profileId);
    if (!prof) return;
    this.activeProfile = prof;
    localStorage.setItem("netflix_active_profile", prof.id);
    this.renderHeaderProfiles();
    this.renderAllRows();
    this.showToast(`Switched profile to ${prof.name}`);
  }

  renderHeaderProfiles() {
    if (this.activeProfileAvatar) {
      this.activeProfileAvatar.src = this.activeProfile.avatar;
      this.activeProfileAvatar.alt = this.activeProfile.name;
    }

    const profilesList = document.getElementById("profilesListContainer");
    if (profilesList) {
      profilesList.innerHTML = this.profiles
        .map(
          (p) => `
          <div class="profile-item ${p.id === this.activeProfile.id ? "active-prof" : ""}" data-prof-id="${p.id}">
            <img src="${p.avatar}" alt="${p.name}">
            <span>${p.name} ${p.isKids ? '<span style="font-size:0.7rem; color:#aaa;">(Kids)</span>' : ""}</span>
          </div>
        `
        )
        .join("");

      profilesList.querySelectorAll(".profile-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-prof-id");
          this.setActiveProfile(id);
        });
      });
    }
  }

  loadMyList() {
    try {
      const saved = localStorage.getItem("netflix_my_list");
      return saved ? JSON.parse(saved) : ["stranger-things", "squid-game", "interstellar"];
    } catch {
      return ["stranger-things", "squid-game", "interstellar"];
    }
  }

  saveMyList() {
    localStorage.setItem("netflix_my_list", JSON.stringify(this.myList));
  }

  toggleMyList(movieId) {
    const idx = this.myList.indexOf(movieId);
    const movie = this.movies.find((m) => m.id === movieId);
    const title = movie ? movie.title : "Title";

    if (idx > -1) {
      this.myList.splice(idx, 1);
      this.showToast(`Removed "${title}" from My List`);
    } else {
      this.myList.push(movieId);
      this.showToast(`Added "${title}" to My List`);
    }
    this.saveMyList();
    this.renderMyListRow();
    this.updateCardActionStates();
  }

  isInMyList(movieId) {
    return this.myList.includes(movieId);
  }

  /* ------------------------------------------------------------------------
   * HERO BILLBOARD RENDERING
   * ------------------------------------------------------------------------ */
  renderHeroBillboard() {
    const heroMovies = this.movies.filter((m) => m.hero || m.isOriginal).slice(0, 5);
    const current = heroMovies[this.currentHeroIndex] || this.movies[0];

    const inList = this.isInMyList(current.id);

    this.heroContainer.innerHTML = `
      <img class="billboard-backdrop" id="heroBackdropImg" src="${current.backdrop}" alt="${current.title}" />
      <video class="billboard-video" id="heroVideoPreview" muted loop playsinline src="${current.previewClip}"></video>
      <div class="billboard-vignette-left"></div>
      <div class="billboard-vignette-bottom"></div>

      <div class="billboard-content">
        <div class="billboard-badge">
          <span class="billboard-badge-n">N</span>
          <span>${current.isOriginal ? "A NETFLIX ORIGINAL FILM" : "FEATURED ON NETFLIX"}</span>
        </div>
        <h1 class="billboard-title">${current.logoText || current.title}</h1>
        <div class="billboard-rank">
          <span class="billboard-rank-box">TOP 10</span>
          <span>#1 in Movies Today</span>
        </div>
        <p class="billboard-synopsis">${current.synopsis}</p>

        <div class="billboard-actions">
          <button class="btn-play" id="heroPlayBtn" data-movie-id="${current.id}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <button class="btn-more-info" id="heroMoreInfoBtn" data-movie-id="${current.id}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            More Info
          </button>
        </div>
      </div>

      <div class="billboard-right-edge">
        <button class="btn-billboard-audio" id="heroAudioToggle" title="Toggle audio preview">
          <svg id="heroAudioIcon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
        <span class="billboard-age-rating">${current.rating}</span>
      </div>
    `;

    // Bind Hero Buttons
    const heroPlay = document.getElementById("heroPlayBtn");
    if (heroPlay) {
      heroPlay.addEventListener("click", () => {
        window.netflixPlayer.openPlayer(current);
      });
    }

    const heroMoreInfo = document.getElementById("heroMoreInfoBtn");
    if (heroMoreInfo) {
      heroMoreInfo.addEventListener("click", () => {
        this.openModal(current);
      });
    }

    // Hero video preview delayed start
    const heroVid = document.getElementById("heroVideoPreview");
    const heroAudio = document.getElementById("heroAudioToggle");
    if (heroVid && heroAudio) {
      setTimeout(() => {
        heroVid.play().then(() => {
          heroVid.classList.add("playing");
        }).catch(() => {});
      }, 2500);

      heroAudio.addEventListener("click", () => {
        heroVid.muted = !heroVid.muted;
        const icon = document.getElementById("heroAudioIcon");
        if (heroVid.muted) {
          icon.innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
        } else {
          icon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
   * ROW & CAROUSEL RENDERING
   * ------------------------------------------------------------------------ */
  renderAllRows() {
    let html = "";

    // Insert My List row at the very top of rows if user has items
    html += this.generateMyListRowMarkup();

    // Generate each defined catalog row
    this.rows.forEach((rowDef) => {
      let filtered = this.movies.filter(rowDef.filter);

      // Kids profile safety filter
      if (this.activeProfile.isKids) {
        filtered = filtered.filter((m) => m.rating !== "18+" && !m.genres.includes("Horror"));
      }

      if (filtered.length > 0) {
        html += this.generateRowMarkup(rowDef, filtered);
      }
    });

    this.mainContent.innerHTML = html;
    this.bindRowInteractions();
  }

  generateMyListRowMarkup() {
    const listMovies = this.movies.filter((m) => this.myList.includes(m.id));
    if (listMovies.length === 0) {
      return `
        <div class="movie-row" id="row-my-list" style="display:none;"></div>
      `;
    }

    return `
      <section class="movie-row" id="row-my-list">
        <div class="row-header">
          <h2 class="row-title">
            My List
            <span class="see-all-indicator">Explore All &gt;</span>
          </h2>
        </div>
        <div class="carousel-wrapper">
          <button class="slider-arrow left" aria-label="Previous">‹</button>
          <div class="carousel-track">
            ${listMovies.map((movie) => this.generateCardMarkup(movie, false, false)).join("")}
          </div>
          <button class="slider-arrow right" aria-label="Next">›</button>
        </div>
      </section>
    `;
  }

  renderMyListRow() {
    const existing = document.getElementById("row-my-list");
    if (existing) {
      existing.outerHTML = this.generateMyListRowMarkup();
      const updated = document.getElementById("row-my-list");
      if (updated) {
        this.bindSingleRowInteractions(updated);
      }
    }
  }

  generateRowMarkup(rowDef, items) {
    const isTop10 = !!rowDef.isTop10;
    const isTall = !!rowDef.isTallPoster;

    return `
      <section class="movie-row" id="row-${rowDef.id}">
        <div class="row-header">
          <h2 class="row-title">
            ${rowDef.title}
            <span class="see-all-indicator">Explore All &gt;</span>
          </h2>
        </div>
        <div class="carousel-wrapper">
          <button class="slider-arrow left" aria-label="Previous">‹</button>
          <div class="carousel-track">
            ${items
              .map((movie, index) =>
                isTop10
                  ? this.generateTop10CardMarkup(movie, index + 1)
                  : this.generateCardMarkup(movie, isTall, false)
              )
              .join("")}
          </div>
          <button class="slider-arrow right" aria-label="Next">›</button>
        </div>
      </section>
    `;
  }

  generateCardMarkup(movie, isTall = false, isTop10 = false) {
    const imgSource = isTall ? movie.poster : movie.backdrop || movie.poster;
    return `
      <div class="movie-card ${isTall ? "tall-poster" : ""}" data-movie-id="${movie.id}">
        <img class="card-image" src="${imgSource}" alt="${movie.title}" loading="lazy" />
        ${
          movie.isOriginal
            ? `<span class="card-badge netflix-n">N</span>`
            : movie.badge
            ? `<span class="card-badge">${movie.badge}</span>`
            : ""
        }
        <div class="card-title-fallback">${movie.title}</div>
      </div>
    `;
  }

  generateTop10CardMarkup(movie, rank) {
    // Generate authentic styled SVG outlined number
    const svgNum = this.getTop10NumberSvg(rank);

    return `
      <div class="movie-card top10-card" data-movie-id="${movie.id}">
        <div class="top10-number-svg">${svgNum}</div>
        <div class="top10-poster-wrap">
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" />
        </div>
      </div>
    `;
  }

  getTop10NumberSvg(rank) {
    // Sharp Netflix style 3D outlined rank numerals
    return `
      <svg viewBox="0 0 100 140" width="100%" height="100%">
        <text x="50%" y="82%" 
          text-anchor="middle" 
          font-family="Impact, 'Bebas Neue', Arial Black, sans-serif" 
          font-size="130" 
          font-weight="900" 
          fill="#141414" 
          stroke="#595959" 
          stroke-width="4"
          paint-order="stroke fill"
          stroke-linejoin="round"
          filter="drop-shadow(3px 5px 6px rgba(0,0,0,0.9))">
          ${rank}
        </text>
      </svg>
    `;
  }

  /* ------------------------------------------------------------------------
   * ROW CAROUSEL SCROLL & HOVER BINDING
   * ------------------------------------------------------------------------ */
  bindRowInteractions() {
    document.querySelectorAll(".movie-row").forEach((row) => {
      this.bindSingleRowInteractions(row);
    });
  }

  bindSingleRowInteractions(row) {
    const track = row.querySelector(".carousel-track");
    const prevBtn = row.querySelector(".slider-arrow.left");
    const nextBtn = row.querySelector(".slider-arrow.right");

    if (track && prevBtn && nextBtn) {
      prevBtn.addEventListener("click", () => {
        const scrollDist = track.clientWidth * 0.75;
        track.scrollBy({ left: -scrollDist, behavior: "smooth" });
      });

      nextBtn.addEventListener("click", () => {
        const scrollDist = track.clientWidth * 0.75;
        track.scrollBy({ left: scrollDist, behavior: "smooth" });
      });
    }

    // Card hover preview triggers
    row.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const movieId = card.getAttribute("data-movie-id");
        this.hoverTimeout = setTimeout(() => {
          this.showHoverCard(card, movieId);
        }, 400);
      });

      card.addEventListener("mouseleave", () => {
        clearTimeout(this.hoverTimeout);
      });

      card.addEventListener("click", () => {
        const movieId = card.getAttribute("data-movie-id");
        const movie = this.movies.find((m) => m.id === movieId);
        if (movie) this.openModal(movie);
      });
    });
  }

  /* ------------------------------------------------------------------------
   * DYNAMIC HOVER PREVIEW CARD
   * ------------------------------------------------------------------------ */
  showHoverCard(cardElem, movieId) {
    const movie = this.movies.find((m) => m.id === movieId);
    if (!movie) return;

    this.activeHoverCard = movie;
    const rect = cardElem.getBoundingClientRect();

    const hoverWidth = 320;
    let left = rect.left + rect.width / 2 - hoverWidth / 2;
    let top = rect.top - 20;

    // Viewport edge collision guards
    if (left < 16) left = 16;
    if (left + hoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - hoverWidth - 16;
    }
    if (top < 70) top = rect.bottom - 40;

    const inList = this.isInMyList(movie.id);

    this.hoverCard.innerHTML = `
      <div class="preview-media-container">
        <img src="${movie.backdrop || movie.poster}" alt="${movie.title}" />
        <video id="hoverVideoClip" src="${movie.previewClip}" muted loop playsinline></video>
        <div class="preview-title-overlay">${movie.title}</div>
        <button class="preview-sound-toggle" id="hoverSoundToggle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
      </div>

      <div class="preview-info-box">
        <div class="preview-action-row">
          <div class="preview-actions-left">
            <button class="action-circle-btn btn-play-card" id="hoverPlayBtn" title="Play">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button class="action-circle-btn ${inList ? "active" : ""}" id="hoverListBtn" title="My List">
              ${
                inList
                  ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                  : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
              }
            </button>
            <button class="action-circle-btn" id="hoverLikeBtn" title="I like this">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </button>
          </div>
          <button class="action-circle-btn" id="hoverMoreInfoBtn" title="More Info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <div class="preview-metadata">
          <span class="match-score">${movie.matchScore}% Match</span>
          <span class="badge-age">${movie.rating}</span>
          <span class="duration-text">${movie.duration || movie.seasons}</span>
          <span class="badge-quality">HD</span>
        </div>

        <div class="preview-genre-tags">
          ${movie.genres.map((g) => `<span>${g}</span>`).join("")}
        </div>
      </div>
    `;

    this.hoverCard.style.top = `${top}px`;
    this.hoverCard.style.left = `${left}px`;
    this.hoverCard.classList.add("visible");

    // Video auto-start in preview
    const clip = document.getElementById("hoverVideoClip");
    const soundBtn = document.getElementById("hoverSoundToggle");
    if (clip) {
      clip.play().then(() => clip.classList.add("active")).catch(() => {});
      if (soundBtn) {
        soundBtn.addEventListener("click", () => {
          clip.muted = !clip.muted;
          soundBtn.classList.toggle("unmuted", !clip.muted);
        });
      }
    }

    // Bind action buttons
    document.getElementById("hoverPlayBtn").addEventListener("click", () => {
      this.hideHoverCard();
      window.netflixPlayer.openPlayer(movie);
    });

    document.getElementById("hoverListBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMyList(movie.id);
      this.showHoverCard(cardElem, movie.id);
    });

    document.getElementById("hoverLikeBtn").addEventListener("click", function () {
      this.classList.toggle("active");
    });

    document.getElementById("hoverMoreInfoBtn").addEventListener("click", () => {
      this.hideHoverCard();
      this.openModal(movie);
    });
  }

  hideHoverCard() {
    if (this.hoverCard) {
      this.hoverCard.classList.remove("visible");
      const clip = document.getElementById("hoverVideoClip");
      if (clip) clip.pause();
    }
  }

  updateCardActionStates() {
    // Refresh modal list button if open
    if (this.activeModalMovie) {
      const modalListBtn = document.getElementById("modalListBtn");
      if (modalListBtn) {
        const inList = this.isInMyList(this.activeModalMovie.id);
        modalListBtn.classList.toggle("active", inList);
        modalListBtn.innerHTML = inList
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      }
    }
  }

  /* ------------------------------------------------------------------------
   * DETAIL MODAL ("MORE INFO")
   * ------------------------------------------------------------------------ */
  openModal(movie) {
    this.activeModalMovie = movie;
    const inList = this.isInMyList(movie.id);

    const modalTitle = document.getElementById("modalTitle");
    const modalBannerImg = document.getElementById("modalBannerImg");
    const modalMatchScore = document.getElementById("modalMatchScore");
    const modalYear = document.getElementById("modalYear");
    const modalAgeRating = document.getElementById("modalAgeRating");
    const modalDuration = document.getElementById("modalDuration");
    const modalQuality = document.getElementById("modalQuality");
    const modalSynopsis = document.getElementById("modalSynopsis");
    const modalCast = document.getElementById("modalCast");
    const modalGenres = document.getElementById("modalGenres");
    const modalTags = document.getElementById("modalTags");
    const episodesSection = document.getElementById("modalEpisodesSection");
    const moreLikeThisGrid = document.getElementById("moreLikeThisGrid");

    if (modalTitle) modalTitle.textContent = movie.title;
    if (modalBannerImg) modalBannerImg.src = movie.backdrop || movie.poster;
    if (modalMatchScore) modalMatchScore.textContent = `${movie.matchScore}% Match`;
    if (modalYear) modalYear.textContent = movie.year;
    if (modalAgeRating) modalAgeRating.textContent = movie.rating;
    if (modalDuration) modalDuration.textContent = movie.duration || movie.seasons;
    if (modalQuality) modalQuality.textContent = movie.quality;
    if (modalSynopsis) modalSynopsis.textContent = movie.synopsis;

    if (modalCast) modalCast.textContent = movie.cast.join(", ");
    if (modalGenres) modalGenres.textContent = movie.genres.join(", ");
    if (modalTags) modalTags.textContent = movie.tags ? movie.tags.join(", ") : "Exciting";

    // Play button in modal
    const modalPlayBtn = document.getElementById("modalPlayBtn");
    if (modalPlayBtn) {
      modalPlayBtn.onclick = () => {
        this.closeModal();
        window.netflixPlayer.openPlayer(movie);
      };
    }

    // List button in modal
    const modalListBtn = document.getElementById("modalListBtn");
    if (modalListBtn) {
      modalListBtn.classList.toggle("active", inList);
      modalListBtn.innerHTML = inList
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      modalListBtn.onclick = () => {
        this.toggleMyList(movie.id);
      };
    }

    // Episodes list for TV shows
    if (episodesSection) {
      if (movie.type === "tv" && movie.episodes && movie.episodes.length > 0) {
        episodesSection.style.display = "flex";
        const epListContainer = document.getElementById("episodesListContainer");
        if (epListContainer) {
          epListContainer.innerHTML = movie.episodes
            .map(
              (ep) => `
              <div class="episode-item" data-ep-id="${ep.id}">
                <div class="episode-num">${ep.number}</div>
                <div class="episode-thumb-wrap">
                  <img src="${ep.thumbnail}" alt="${ep.title}" />
                  <div class="episode-play-icon">▶</div>
                </div>
                <div class="episode-details">
                  <div class="episode-title-row">
                    <span class="episode-title">${ep.title}</span>
                    <span class="episode-duration">${ep.duration}</span>
                  </div>
                  <p class="episode-desc">${ep.overview}</p>
                </div>
              </div>
            `
            )
            .join("");

          epListContainer.querySelectorAll(".episode-item").forEach((item) => {
            item.addEventListener("click", () => {
              this.closeModal();
              window.netflixPlayer.openPlayer(movie, epListContainer);
            });
          });
        }
      } else {
        episodesSection.style.display = "none";
      }
    }

    // Recommendations ("More Like This")
    if (moreLikeThisGrid) {
      const similar = this.movies
        .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
        .slice(0, 6);

      moreLikeThisGrid.innerHTML = similar
        .map(
          (sim) => `
          <div class="recom-card" data-movie-id="${sim.id}">
            <img class="recom-img" src="${sim.backdrop || sim.poster}" alt="${sim.title}" />
            <div class="recom-info">
              <span class="match-score">${sim.matchScore}% Match</span>
              <div class="recom-title">${sim.title}</div>
              <p class="recom-desc">${sim.synopsis}</p>
            </div>
          </div>
        `
        )
        .join("");

      moreLikeThisGrid.querySelectorAll(".recom-card").forEach((rc) => {
        rc.addEventListener("click", () => {
          const mId = rc.getAttribute("data-movie-id");
          const found = this.movies.find((m) => m.id === mId);
          if (found) this.openModal(found);
        });
      });
    }

    this.modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove("active");
      document.body.style.overflow = "";
      this.activeModalMovie = null;
    }
  }

  /* ------------------------------------------------------------------------
   * SEARCH & FILTERING
   * ------------------------------------------------------------------------ */
  handleLiveSearch(query) {
    const q = query.trim().toLowerCase();

    if (!q) {
      this.searchWrapper.classList.remove("has-query");
      this.searchResults.classList.remove("active");
      this.mainContent.style.display = "flex";
      this.heroContainer.style.display = "block";
      return;
    }

    this.searchWrapper.classList.add("has-query");
    this.mainContent.style.display = "none";
    this.heroContainer.style.display = "none";
    this.searchResults.classList.add("active");

    const matched = this.movies.filter((m) => {
      return (
        m.title.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q)) ||
        m.cast.some((c) => c.toLowerCase().includes(q)) ||
        m.synopsis.toLowerCase().includes(q)
      );
    });

    const searchTitle = document.getElementById("searchQueryTitle");
    const searchGrid = document.getElementById("searchGridContainer");

    if (searchTitle) {
      searchTitle.innerHTML = `Search results for: <span>"${query}"</span> (${matched.length} titles)`;
    }

    if (searchGrid) {
      if (matched.length === 0) {
        searchGrid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 60px 0; text-align: center; color: #888;">
            <h3>Your search for "${query}" did not have any matches.</h3>
            <p style="margin-top: 10px; font-size: 0.95rem;">Suggestions: Try different keywords, check for typos, or browse genres.</p>
          </div>
        `;
      } else {
        searchGrid.innerHTML = matched.map((m) => this.generateCardMarkup(m, false, false)).join("");
        searchGrid.querySelectorAll(".movie-card").forEach((card) => {
          card.addEventListener("click", () => {
            const mId = card.getAttribute("data-movie-id");
            const movie = this.movies.find((m) => m.id === mId);
            if (movie) this.openModal(movie);
          });
        });
      }
    }
  }

  handleNavFilter(category, clickedLink) {
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    // Close search if open
    if (this.searchResults.classList.contains("active")) {
      this.searchInput.value = "";
      this.handleLiveSearch("");
    }

    if (category === "home") {
      this.heroContainer.style.display = "block";
      this.renderAllRows();
    } else if (category === "tv") {
      this.heroContainer.style.display = "block";
      const tvShows = this.movies.filter((m) => m.type === "tv");
      this.renderFilteredRows("TV Shows", tvShows);
    } else if (category === "movies") {
      this.heroContainer.style.display = "block";
      const moviesOnly = this.movies.filter((m) => m.type === "movie");
      this.renderFilteredRows("Movies", moviesOnly);
    } else if (category === "popular") {
      this.heroContainer.style.display = "block";
      const popular = this.movies.filter((m) => m.matchScore >= 95);
      this.renderFilteredRows("New & Popular", popular);
    } else if (category === "my-list") {
      this.heroContainer.style.display = "none";
      const listMovies = this.movies.filter((m) => this.myList.includes(m.id));
      this.renderFilteredRows("My List", listMovies, true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderFilteredRows(title, items, isMyList = false) {
    if (items.length === 0) {
      this.mainContent.innerHTML = `
        <div style="padding: 140px 4% 80px 4%; text-align: center; color: #888;">
          <h2>${title}</h2>
          <p style="margin-top: 14px; font-size: 1.1rem;">${
            isMyList ? "You haven't added any titles to your list yet." : "No titles found in this category."
          }</p>
        </div>
      `;
      return;
    }

    this.mainContent.innerHTML = `
      <section class="movie-row" style="margin-top: 60px;">
        <div class="row-header">
          <h2 class="row-title">${title} (${items.length} titles)</h2>
        </div>
        <div class="search-grid" style="margin-top: 18px;">
          ${items.map((m) => this.generateCardMarkup(m, false, false)).join("")}
        </div>
      </section>
    `;

    this.mainContent.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("click", () => {
        const mId = card.getAttribute("data-movie-id");
        const movie = this.movies.find((m) => m.id === mId);
        if (movie) this.openModal(movie);
      });
    });
  }

  /* ------------------------------------------------------------------------
   * VIEW MODE TOGGLE (Browse vs Landing Page)
   * ------------------------------------------------------------------------ */
  toggleViewMode() {
    const isBrowse = this.browseView.style.display !== "none";
    this.switchView(isBrowse ? "landing" : "browse");
  }

  switchView(mode) {
    const modeBtn = document.getElementById("modeToggleBtn");
    if (mode === "landing") {
      this.browseView.style.display = "none";
      this.landingView.classList.add("active");
      if (modeBtn) modeBtn.textContent = "Go to Browse";
    } else {
      this.landingView.classList.remove("active");
      this.browseView.style.display = "block";
      if (modeBtn) modeBtn.textContent = "Landing Page";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------------------------
   * FAQ ACCORDION
   * ------------------------------------------------------------------------ */
  setupFAQ() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const q = item.querySelector(".faq-question");
      if (q) {
        q.addEventListener("click", () => {
          const isOpen = item.classList.contains("open");
          document.querySelectorAll(".faq-item").forEach((fi) => fi.classList.remove("open"));
          if (!isOpen) item.classList.add("open");
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
   * TOAST NOTIFICATION
   * ------------------------------------------------------------------------ */
  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add("show");
    setTimeout(() => {
      this.toast.classList.remove("show");
    }, 2800);
  }
}

// Instantiate on DOM load
document.addEventListener("DOMContentLoaded", () => {
  window.netflixApp = new NetflixApp();
});
