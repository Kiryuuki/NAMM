import * as jellyfin from '../api/jellyfin.js';

const JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL;
const JELLYFIN_KEY = import.meta.env.VITE_JELLYFIN_KEY;

export async function initJellyfinView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="library-container">
      <div class="library-header">
        <h2 class="label decrypt-text shiny-text" data-text="[ JELLYFIN LIBRARIES ]">[ JELLYFIN LIBRARIES ]</h2>
      </div>
      <div id="jellyfin-grid" class="jellyfin-library-grid">
        ${'<div class="skeleton" style="aspect-ratio: 16/9"></div>'.repeat(4)}
      </div>
    </div>
  `;

  const libs = await jellyfin.getLibraries();
  const items = libs.Items || (Array.isArray(libs) ? libs : []);
  
  renderLibraryGrid(items);
}

function renderLibraryGrid(libraries) {
  const grid = document.getElementById('jellyfin-grid');
  if (!grid) return;

  if (libraries.length === 0) {
    grid.innerHTML = '<div class="empty-state">> NO JELLYFIN LIBRARIES FOUND_</div>';
    return;
  }

  grid.innerHTML = libraries.map(lib => {
    const imageUrl = `${JELLYFIN_URL}/Items/${lib.Id}/Images/Primary?maxWidth=400&api_key=${JELLYFIN_KEY}`;
    return `
      <div class="jellyfin-lib-card" data-id="${lib.Id}">
        <div class="card-poster" style="background-image: url('${imageUrl}')">
          <div class="jellyfin-lib-label">
            <span>${lib.Name.toUpperCase()}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-meta">
            <span class="card-title">${lib.Name}</span>
            <span class="card-year">${lib.CollectionType || 'LIBRARY'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.jellyfin-lib-card').forEach(card => {
    card.addEventListener('click', () => drillDown(card.dataset.id, card.querySelector('.jellyfin-lib-label span').innerText));
  });
}

async function drillDown(libraryId, libraryName) {
  const container = document.querySelector('.library-container');
  if (!container) return;

  container.innerHTML = `
    <div class="library-header" style="display:flex; justify-content:space-between; align-items:center">
      <h2 class="label decrypt-text shiny-text" data-text="[ ${libraryName} ]">[ ${libraryName} ]</h2>
      <button class="cp-button secondary" id="back-to-libs">[ ← BACK ]</button>
    </div>
    <div id="jellyfin-items-grid" class="poster-grid">
      ${'<div class="skeleton" style="aspect-ratio: 2/3"></div>'.repeat(8)}
    </div>
  `;

  document.getElementById('back-to-libs').addEventListener('click', () => initJellyfinView('main-panel'));

  const data = await jellyfin.getLibraryItems(libraryId);
  const items = data.Items || [];
  
  renderItemsGrid(items);
}

function renderItemsGrid(items) {
  const grid = document.getElementById('jellyfin-items-grid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state">> LIBRARY IS EMPTY_</div>';
    return;
  }

  grid.innerHTML = items.map(item => {
    const poster = `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?maxWidth=400&api_key=${JELLYFIN_KEY}`;
    const year = item.ProductionYear || 'N/A';
    return `
      <div class="discovery-card jellyfin-item-card" data-id="${item.Id}">
        <div class="card-poster" style="background-image: url('${poster}')">
          <div class="trending-overlay">
            <button class="cp-button mini play-btn" data-id="${item.Id}">▶ PLAY</button>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-meta">
            <span class="card-title">${item.Name}</span>
            <span class="card-year">${year}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
