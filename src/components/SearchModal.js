import { searchTMDB, classifyAndAdd } from '../api/classifier.js';
import { showToast } from './Toast.js';
import { showAmbiguityModal } from './Modal.js';

let modalOpen = false;
let debounceTimer = null;
let selectedIndex = -1;
let currentResults = [];

/** Open the search modal — auto-focuses input */
export function openSearchModal() {
  if (modalOpen) return;
  modalOpen = true;

  const overlay = document.createElement('div');
  overlay.id = 'search-modal-overlay';
  overlay.innerHTML = `
    <div class="search-modal" role="dialog" aria-modal="true" aria-label="Search">
      <div class="search-modal-header">
        <span class="search-modal-icon">⌕</span>
        <input
          type="text"
          id="search-modal-input"
          class="search-modal-input"
          placeholder="> JACK IN... search movies & shows_"
          autocomplete="off"
          spellcheck="false"
        >
        <button class="search-modal-close" id="search-modal-close" title="Close (Esc)">✕</button>
      </div>
      <div id="search-modal-results" class="search-modal-results">
        <div class="search-modal-hint">
          Type at least 2 characters to search TMDB — results route to Radarr or Sonarr automatically.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Auto-focus
  const input = document.getElementById('search-modal-input');
  setTimeout(() => input?.focus(), 50);

  // Events
  input?.addEventListener('input', onInput);
  input?.addEventListener('keydown', onKeydown);
  document.getElementById('search-modal-close')?.addEventListener('click', closeSearchModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearchModal();
  });

  // Esc to close
  document.addEventListener('keydown', onEscClose);
}

export function closeSearchModal() {
  if (!modalOpen) return;
  modalOpen = false;

  const overlay = document.getElementById('search-modal-overlay');
  if (overlay) {
    overlay.classList.add('search-modal-exit');
    setTimeout(() => overlay.remove(), 200);
  }

  document.body.style.overflow = '';
  document.removeEventListener('keydown', onEscClose);

  // Reset state
  clearTimeout(debounceTimer);
  selectedIndex = -1;
  currentResults = [];
}

function onEscClose(e) {
  if (e.key === 'Escape') closeSearchModal();
}

function onInput(e) {
  const query = e.target.value.trim();
  clearTimeout(debounceTimer);
  selectedIndex = -1;

  if (query.length < 2) {
    showHint();
    return;
  }

  showLoading();
  debounceTimer = setTimeout(() => doSearch(query), 400);
}

function onKeydown(e) {
  const items = document.querySelectorAll('.search-modal-result');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    updateSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    updateSelection(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex >= 0 && currentResults[selectedIndex]) {
      handleSelect(currentResults[selectedIndex]);
    }
  }
}

function updateSelection(items) {
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
    if (i === selectedIndex) el.scrollIntoView({ block: 'nearest' });
  });
}

async function doSearch(query) {
  const data = await searchTMDB(query);
  const resultsEl = document.getElementById('search-modal-results');
  if (!resultsEl) return;

  if (data.error) {
    resultsEl.innerHTML = `<div class="search-modal-hint error">⚠ TMDB ERROR: ${data.message}</div>`;
    return;
  }

  currentResults = (data.results || [])
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 10);

  if (currentResults.length === 0) {
    resultsEl.innerHTML = `<div class="search-modal-hint">NO RESULTS FOUND FOR THIS QUERY_</div>`;
    return;
  }

  renderResults(currentResults, resultsEl);
}

function renderResults(results, container) {
  container.innerHTML = results.map((res, i) => {
    const title    = res.title || res.name || 'Unknown';
    const year     = new Date(res.release_date || res.first_air_date).getFullYear() || '—';
    const type     = res.media_type;                        // 'movie' | 'tv'
    const typeLabel = type === 'movie' ? 'MOVIE' : 'TV';
    const poster   = res.poster_path
      ? `https://image.tmdb.org/t/p/w92${res.poster_path}`
      : '';
    const rating   = res.vote_average ? (Math.round(res.vote_average * 10) / 10).toFixed(1) : null;
    const genres   = (res.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean).join(' · ');
    const overview = res.overview
      ? res.overview.slice(0, 130) + (res.overview.length > 130 ? '...' : '')
      : 'No description available.';

    return `
      <div class="search-modal-result" data-index="${i}" role="option" tabindex="-1">
        <div class="smr-poster" style="${poster ? `background-image:url('${poster}')` : ''}">
          ${!poster ? '<span class="smr-poster-fallback">?</span>' : ''}
        </div>
        <div class="smr-info">
          <div class="smr-row1">
            <span class="smr-title">${title}</span>
            <span class="smr-year">${year}</span>
            <span class="smr-badge ${type}">${typeLabel}</span>
          </div>
          <div class="smr-row2">
            ${rating ? `<span class="smr-rating">★ ${rating}</span>` : ''}
            ${genres ? `<span class="smr-genres">${genres}</span>` : ''}
          </div>
          <div class="smr-overview">${overview}</div>
        </div>
        <button class="smr-add-btn cp-button" title="Add to Radarr/Sonarr">+ ADD</button>
      </div>
    `;
  }).join('');

  // Wire click events
  container.querySelectorAll('.search-modal-result').forEach((el, i) => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('smr-add-btn')) return; // handled below
      selectedIndex = i;
      updateSelection(container.querySelectorAll('.search-modal-result'));
    });
    el.querySelector('.smr-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handleSelect(currentResults[i]);
    });
    el.addEventListener('dblclick', () => handleSelect(currentResults[i]));
  });
}

async function handleSelect(result) {
  const res = await classifyAndAdd(result);

  if (res?.ambiguous) {
    showAmbiguityModal(result, (type) => handleSelect({ ...result, media_type: type }));
    return;
  }

  const service = result.media_type === 'movie' ? 'RADARR' : 'SONARR';
  if (res?.error) {
    showToast(`FAILED: ${res.message}`, 'error');
  } else {
    showToast(`QUEUED: ${result.title || result.name} → ${service}`, 'success');
  }
  // Modal stays open for more searches
}

function showHint() {
  const el = document.getElementById('search-modal-results');
  if (el) el.innerHTML = `<div class="search-modal-hint">Type at least 2 characters to search TMDB — results route to Radarr or Sonarr automatically.</div>`;
}

function showLoading() {
  const el = document.getElementById('search-modal-results');
  if (el) el.innerHTML = `<div class="search-modal-hint">⌕ SEARCHING TMDB...</div>`;
}

/** TMDB genre ID → name map (most common IDs) */
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western',
  10759:'Action & Adventure', 10762:'Kids', 10763:'News', 10764:'Reality',
  10765:'Sci-Fi & Fantasy', 10766:'Soap', 10767:'Talk', 10768:'War & Politics',
};
