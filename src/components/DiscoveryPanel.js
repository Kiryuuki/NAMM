import * as radarr from '../api/radarr.js';
import * as sonarr from '../api/sonarr.js';
import { getTrendingMovies, getTrendingTV, getDiscoverAnime, getDiscoverKorean, classifyAndAdd } from '../api/classifier.js';
import { formatDate } from '../utils/format.js';
import { showToast } from './Toast.js';
import { showAmbiguityModal } from './Modal.js';

export function initDiscoveryPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="discovery-feed">

      <section id="upcoming-section" class="discovery-section">
        <h2 class="label decrypt-text shiny-text" data-text="[ UPCOMING RELEASES ]">[ UPCOMING RELEASES ]</h2>
        <div class="horizontal-scroll" id="upcoming-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
      </section>

      <section id="trending-movies-section" class="discovery-section">
        <h2 class="label decrypt-text shiny-text" data-text="[ TRENDING MOVIES ]">[ TRENDING MOVIES ]</h2>
        <div class="horizontal-scroll" id="trending-movies-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
      </section>

      <section id="trending-tv-section" class="discovery-section">
        <h2 class="label decrypt-text shiny-text" data-text="[ TRENDING TV SHOWS ]">[ TRENDING TV SHOWS ]</h2>
        <div class="horizontal-scroll" id="trending-tv-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
      </section>

      <section id="trending-anime-section" class="discovery-section">
        <h2 class="label decrypt-text shiny-text" data-text="[ TRENDING ANIME ]">[ TRENDING ANIME ]</h2>
        <div class="horizontal-scroll" id="trending-anime-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
      </section>

      <section id="trending-korean-section" class="discovery-section">
        <h2 class="label decrypt-text shiny-text" data-text="[ K-DRAMA & K-MOVIES ]">[ K-DRAMA & K-MOVIES ]</h2>
        <div class="horizontal-scroll" id="trending-korean-list">
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
          <div class="skeleton" style="width:200px;height:300px;flex-shrink:0"></div>
        </div>
      </section>

    </div>
  `;

  loadDiscoveryData();
}

/** Fetch all discovery data in parallel, safely */
async function loadDiscoveryData() {
  const now = new Date().toISOString();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const safeFetch = async (fn, fallback = []) => {
    try {
      const res = await fn;
      return res && !res.error ? res : fallback;
    } catch (e) {
      console.warn(`[Discovery] Fetch failed:`, e);
      return fallback;
    }
  };

  const [
    upcomingMovies, upcomingTV, 
    trendingMovies, trendingTV, 
    anime, korean,
    radarrLib, sonarrLib
  ] = await Promise.all([
    safeFetch(radarr.getCalendar(now, in30)),
    safeFetch(sonarr.getCalendar(now, in30)),
    safeFetch(getTrendingMovies(), { results: [] }),
    safeFetch(getTrendingTV(), { results: [] }),
    safeFetch(getDiscoverAnime(), { results: [] }),
    safeFetch(getDiscoverKorean(), { results: [] }),
    safeFetch(radarr.getMovies()),
    safeFetch(sonarr.getSeries()),
  ]);

  const radarrIds = new Set((radarrLib || []).map(m => m.tmdbId).filter(Boolean));
  const sonarrTitles = new Set((sonarrLib || []).map(s => (s.title || '').toLowerCase()).filter(Boolean));

  renderUpcoming(upcomingMovies, upcomingTV);
  renderTrending('trending-movies-list', trendingMovies.results || [], 'movie', radarrIds);
  renderTrending('trending-tv-list', trendingTV.results || [], 'tv', sonarrTitles);
  renderTrending('trending-anime-list', anime.results || [], 'tv', sonarrTitles);
  renderTrending('trending-korean-list', korean.results || [], 'tv', sonarrTitles);
}

/** Helper to render a unified discovery card (upcoming or trending) */
function renderCardHTML(item, type, options = {}) {
  const { rank, isTop3, showTypeBadge } = options;
  const title = item.title || item.series?.title || item.name || 'Unknown';
  const poster = item.poster || `https://image.tmdb.org/t/p/w342${item.poster_path}`;
  const dateObj = new Date(item.date || item.release_date || item.first_air_date);
  const year = dateObj.getFullYear() || 'N/A';
  const desc = (item.overview || '').slice(0, 140);
  const typeLabel = item.media_type === 'movie' ? 'FILM' : 'TV';
  const typeClass = item.media_type === 'movie' ? 'movie' : 'tv';
  const typeBadge = options.showTypeBadge ? `<div class="type-badge ${typeClass}">${typeLabel}</div>` : '';
  const episodeTag = item.isEpisode ? `<span class="episode-tag">S${item.seasonNumber}E${item.episodeNumber}</span>` : '';

  return `
    <div class="upcoming-card trending-card border-beam-auto ${options.className || ''}" data-beam-color="var(--cp-yellow)" data-id="${item.id}">
      <div class="poster-thumb" style="background-image: url('${poster}')">
        ${typeBadge}
        ${episodeTag}
        
        <div class="trending-overlay">
          <div class="card-desc">${desc}${desc.length >= 140 ? '...' : ''}</div>
          <div class="overlay-actions">
            <div class="card-btn-group">
              <button class="cp-button mini add-btn" data-type="${type}" data-tmdb-id="${item.id}">+</button>
              <button class="cp-button mini secondary seen-btn" title="Mark as Seen">✕</button>
            </div>
            ${item.id ? `<a href="https://www.themoviedb.org/${type}/${item.id}" target="_blank" class="cp-button mini imdb-link">DETAILS</a>` : ''}
          </div>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          <span class="card-title">${title}</span>
          <span class="card-year">${item.isEpisode ? formatDate(item.date) : year}</span>
        </div>
      </div>
    </div>
  `;
}

/** Render horizontal upcoming list */
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
      isEpisode: true,
      poster: s.series?.images?.find(i => i.coverType === 'poster')?.remoteUrl || s.images?.find(i => i.coverType === 'poster')?.remoteUrl
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
}

/** Render trending grid */
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
      
      let isInLibrary = false;
      if (type === 'movie') {
        isInLibrary = libraryIds.has(r.id);
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
