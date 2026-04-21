import * as radarr from '../api/radarr.js';
import * as sonarr from '../api/sonarr.js';
import { getTrendingMovies, getTrendingTV, classifyAndAdd } from '../api/classifier.js';
import { formatDate } from '../utils/format.js';
import { showToast } from './Toast.js';
import { showAmbiguityModal } from './Modal.js';
import { initSearchBar } from './SearchBar.js';

export function initDiscoveryPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="discovery-feed">
      <div id="search-bar-container">
        <input type="text" id="universal-search" placeholder="> JACK IN... search movies & shows_" autocomplete="off">
      </div>

      <section id="upcoming-section" class="discovery-section">
        <h2 class="label shiny-text" data-text="[ UPCOMING RELEASES ]">[ UPCOMING RELEASES ]</h2>
        <div class="carousel-controls">
          <button class="carousel-btn" id="upcoming-prev">&lt;</button>
          <button class="carousel-btn" id="upcoming-next">&gt;</button>
        </div>
        <div class="horizontal-scroll" id="upcoming-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
        <div class="carousel-dots" id="upcoming-dots"></div>
      </section>

      <section id="trending-movies-section" class="discovery-section">
        <h2 class="label shiny-text" data-text="[ TRENDING MOVIES ]">[ TRENDING MOVIES ]</h2>
        <div class="poster-grid" id="trending-movies-list">
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
        </div>
      </section>

      <section id="trending-tv-section" class="discovery-section">
        <h2 class="label shiny-text" data-text="[ TRENDING TV SHOWS ]">[ TRENDING TV SHOWS ]</h2>
        <div class="poster-grid" id="trending-tv-list">
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
          <div class="skeleton" style="height:320px"></div>
        </div>
      </section>

    </div>
  `;

  initCarouselControls();
  initSearchBar();
  loadDiscoveryData();
}

/** Set up carousel scroll buttons + auto-advance */
function initCarouselControls() {
  const list = document.getElementById('upcoming-list');
  if (!list) return;

  const scroll = (amount) => list.scrollBy({ left: amount, behavior: 'smooth' });

  document.getElementById('upcoming-prev')?.addEventListener('click', () => scroll(-500));
  document.getElementById('upcoming-next')?.addEventListener('click', () => scroll(500));

  // Auto-advance every 6s, pause on hover
  let paused = false;
  list.addEventListener('mouseenter', () => paused = true);
  list.addEventListener('mouseleave', () => paused = false);

  setInterval(() => {
    if (paused) return;
    const atEnd = list.scrollLeft + list.offsetWidth >= list.scrollWidth - 10;
    list.scrollBy({ left: atEnd ? -list.scrollWidth : 300, behavior: 'smooth' });
  }, 6000);
}

/** Fetch all discovery data in parallel */
async function loadDiscoveryData() {
  const now = new Date().toISOString();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [upcomingMovies, upcomingTV, trendingMovies, trendingTV, radarrLib, sonarrLib] = await Promise.all([
    radarr.getCalendar(now, in30),
    sonarr.getCalendar(now, in30),
    getTrendingMovies(),
    getTrendingTV(),
    radarr.getMovies(),
    sonarr.getSeries(),
  ]);

  // Extract IDs for filtering
  const radarrIds = new Set((radarrLib || []).map(m => m.tmdbId).filter(Boolean));
  const sonarrTitles = new Set((sonarrLib || []).map(s => (s.title || '').toLowerCase()).filter(Boolean));

  renderUpcoming(upcomingMovies, upcomingTV);
  renderTrending('trending-movies-list', trendingMovies.results || [], 'movie', radarrIds);
  renderTrending('trending-tv-list', trendingTV.results || [], 'tv', sonarrTitles);
}

/** Helper to render a unified discovery card (upcoming or trending) */
function renderCardHTML(item, type, options = {}) {
  const { rank, isTop3, showTypeBadge } = options;
  const title = item.title || item.series?.title || item.name || 'Unknown';
  const poster = item.poster || `https://image.tmdb.org/t/p/w342${item.poster_path}`;
  const dateObj = new Date(item.date || item.release_date || item.first_air_date);
  const year = dateObj.getFullYear() || 'N/A';
  const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fullDate = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const rating = item.vote_average ? (Math.round(item.vote_average * 10) / 10).toFixed(1) : 'N/A';
  const desc = (item.overview || '').slice(0, 140);
  const typeLabel = item.media_type === 'movie' ? 'FILM' : 'TV';
  const typeClass = item.media_type === 'movie' ? 'movie' : 'tv';
  const imdbUrl = `https://duckduckgo.com/?q=!imdb+${encodeURIComponent(title + ' ' + year)}`;

  return `
    <div class="upcoming-card ${options.className || ''}" data-id="${item.id}">
      <div class="poster-thumb" style="background-image: url('${poster}')">
        ${showTypeBadge ? `<div class="type-badge ${typeClass}">${typeLabel}</div>` : ''}
        ${rank ? `<div class="rank-badge ${isTop3 ? 'top-3' : ''}">#${rank}</div>` : ''}
        
        <div class="card-overlay trending-overlay">
          <div class="card-desc">${desc}${desc.length >= 140 ? '...' : ''}</div>
          <div class="card-rating">★ ${rating} / 10</div>
          <div class="overlay-actions">
            <a href="${imdbUrl}" target="_blank" class="cp-button mini imdb-link">IMDB</a>
            <div class="card-btn-group">
              <button class="cp-button mini add-btn" data-type="${type}" title="Add to Downloads">+</button>
              <button class="cp-button mini secondary seen-btn" title="Mark as Seen">×</button>
            </div>
          </div>
        </div>
        
        ${options.showDateOverlay ? `<div class="upcoming-date-overlay">${shortDate}</div>` : ''}
      </div>
      <div class="card-info">
        <div class="card-title" title="${fullDate}">${title}</div>
        <div class="card-date">${options.showDateOverlay ? shortDate : year}</div>
      </div>
    </div>
  `;
}

/** Render horizontal upcoming carousel */
function renderUpcoming(movies, tv) {
  const list = document.getElementById('upcoming-list');
  if (!list) return;

  const items = [
    ...(movies || []).map(m => ({
      ...m, media_type: 'movie',
      date: m.physicalRelease || m.inCinemas || m.releaseDate,
      poster: m.images?.find(i => i.coverType === 'poster')?.remoteUrl
    })),
    ...(tv || []).map(s => ({ 
      ...s, media_type: 'tv', date: s.airDate,
      poster: s.images?.find(i => i.coverType === 'poster')?.remoteUrl
    })),
  ].filter(item => item.poster)
   .sort((a, b) => new Date(a.date) - new Date(b.date))
   .slice(0, 30);

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state">> NO UPCOMING RELEASES FOUND_</div>';
    return;
  }

  list.innerHTML = items.map(item => renderCardHTML(item, item.media_type, { 
    showTypeBadge: true, 
    showDateOverlay: true,
    className: 'upcoming-item'
  })).join('');

  // Wire up buttons
  list.querySelectorAll('.upcoming-item').forEach((card, i) => {
    const item = items[i];
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handleAdd(item, item.media_type);
    });
    card.querySelector('.seen-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      markAsSeen(item.id, item.media_type);
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
    });
  });

  // Dot indicators
  renderDots(items.length);
  list.addEventListener('scroll', () => updateDots(list));
}

/** Render dot indicators for carousel */
function renderDots(count) {
  const dotsEl = document.getElementById('upcoming-dots');
  if (!dotsEl || count === 0) return;
  const visible = Math.min(count, 10);
  dotsEl.innerHTML = Array.from({ length: visible }, (_, i) =>
    `<div class="carousel-dot${i === 0 ? ' active' : ''}"></div>`
  ).join('');
}

/** Update active dot on scroll */
function updateDots(list) {
  const dots = document.querySelectorAll('.carousel-dot');
  if (!dots.length) return;
  const cardWidth = 216; // 200 + 16 gap
  const idx = Math.min(Math.round(list.scrollLeft / cardWidth), dots.length - 1);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

/** Render trending grid with rank badges */
function renderTrending(containerId, results, type, libraryIds = new Set()) {
  const list = document.getElementById(containerId);
  if (!list) return;

  const seenIds = JSON.parse(localStorage.getItem(`seen_${type}`) || '[]');
  const today = new Date();
  const filtered = results
    .filter(r => {
      const releaseDate = new Date(r.release_date || r.first_air_date);
      const isReleased = releaseDate <= today;
      const isSeen = seenIds.includes(r.id);
      
      // Library check
      let isInLibrary = false;
      if (type === 'movie') {
        isInLibrary = libraryIds.has(r.id); // TMDB ID
      } else {
        const title = (r.name || '').toLowerCase();
        isInLibrary = libraryIds.has(title);
      }

      return isReleased && !isSeen && !isInLibrary;
    })
    .slice(0, 10);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">> ALL TRENDING ITEMS MARKED AS SEEN_</div>';
    return;
  }

  list.innerHTML = filtered.map((res, index) => {
    return renderCardHTML({ ...res, media_type: type }, type, {
      rank: index + 1,
      isTop3: index < 3,
      className: 'trending-card'
    });
  }).join('');

  // Wire up buttons
  list.querySelectorAll('.trending-card').forEach((card, i) => {
    const item = filtered[i];
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handleAdd(item, type);
    });
    card.querySelector('.seen-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      markAsSeen(item.id, type);
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.92)';
      setTimeout(() => card.remove(), 320);
    });
  });
}

/** Persist seen IDs to localStorage */
function markAsSeen(id, type) {
  const key = `seen_${type}`;
  const seenIds = JSON.parse(localStorage.getItem(key) || '[]');
  if (!seenIds.includes(id)) {
    seenIds.push(id);
    localStorage.setItem(key, JSON.stringify(seenIds));
  }
}

/** Classify and route to Radarr/Sonarr */
async function handleAdd(result, type) {
  const res = await classifyAndAdd({ ...result, media_type: type });

  if (res.ambiguous) {
    showAmbiguityModal(result, (confirmedType) => handleAdd(result, confirmedType));
    return;
  }

  if (res.error) {
    showToast(`FAILED: ${res.message}`, 'error');
  } else {
    showToast(`QUEUED: ${result.title || result.name} → ${type === 'movie' ? 'RADARR' : 'SONARR'}`, 'success');
  }
}
