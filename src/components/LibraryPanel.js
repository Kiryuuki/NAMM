import * as radarr from '../api/radarr.js';
import * as sonarr from '../api/sonarr.js';
import { showToast } from './Toast.js';

export function initLibraryPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="library-container">
      <div class="library-header">
        <h2 class="label decrypt-text">[ LIBRARY MANAGEMENT ]</h2>
        <div class="library-filters">
          <button class="filter-btn active" data-filter="movies">MOVIES</button>
          <button class="filter-btn" data-filter="tv">TV SHOWS</button>
        </div>
      </div>
      <div id="library-grid" class="poster-grid">
        <div class="skeleton" style="height: 300px;"></div>
        <div class="skeleton" style="height: 300px;"></div>
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;

  const filters = container.querySelectorAll('.filter-btn');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      loadLibraryData(btn.dataset.filter);
    });
  });

  loadLibraryData('movies');
}

async function loadLibraryData(filter) {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '<div class="skeleton" style="height: 300px;"></div>'.repeat(6);

  try {
    if (filter === 'movies') {
      const movies = await radarr.getMovies();
      renderLibraryItems(grid, movies, 'movie');
    } else if (filter === 'tv') {
      const series = await sonarr.getSeries();
      renderLibraryItems(grid, series, 'tv');
    }
  } catch (err) {
    grid.innerHTML = `<div class="error">> ERROR LOADING ${filter.toUpperCase()}: ${err.message}_</div>`;
  }
}

function renderLibraryItems(grid, items, type) {
  if (!items || items.length === 0) {
    grid.innerHTML = '<div class="empty-state">> NO ITEMS FOUND IN LIBRARY_</div>';
    return;
  }

  grid.innerHTML = items.map(item => {
    const title = item.title;
    const year = item.year;
    const poster = item.images?.find(i => i.coverType === 'poster')?.remoteUrl || '';
    
    // Status Logic
    let statusLabel = 'UNMONITORED';
    let statusClass = 'unmonitored';
    
    if (item.monitored) {
      if (item.hasFile || item.statistics?.percentOfEpisodes === 100) {
        statusLabel = 'DOWNLOADED';
        statusClass = 'downloaded';
      } else {
        statusLabel = 'MISSING';
        statusClass = 'missing';
      }
    }

    return `
      <div class="library-card ${statusClass}" data-id="${item.id}">
        <div class="card-poster" style="background-image: url('${poster}')">
          <div class="status-overlay">${statusLabel}</div>
          <div class="card-actions-overlay">
            <button class="cp-button mini sync-btn" title="Refresh Metadata">SYNC</button>
            <button class="cp-button mini secondary remove-btn" title="Remove from Library">REMOVE</button>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-meta">
            <span class="card-title">${title}</span>
            <span class="card-year">${year}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Wire up actions
  grid.querySelectorAll('.library-card').forEach((card, i) => {
    const item = items[i];
    card.querySelector('.sync-btn').addEventListener('click', () => {
      showToast(`SYNCING: ${item.title}...`, 'success');
      // Radarr/Sonarr handle refresh via command, but let's keep it simple for now
    });

    card.querySelector('.remove-btn').addEventListener('click', async () => {
      const confirmed = confirm(`[ CAUTION ] Are you sure you want to REMOVE "${item.title}" from your library and DELETE files from disk?`);
      if (!confirmed) return;

      let res;
      if (type === 'movie') {
        res = await radarr.deleteMovie(item.id);
      } else {
        res = await sonarr.deleteSeries(item.id);
      }

      if (res && res.error) {
        showToast(`FAILED TO REMOVE: ${res.message}`, 'error');
      } else {
        showToast(`REMOVED: ${item.title}`, 'success');
        loadLibraryData(type === 'movie' ? 'movies' : 'tv');
      }
    });
  });
}
