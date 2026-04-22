import * as jellyfin from '../api/jellyfin.js';
import { openPlayer } from './PlayerOverlay.js';

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
          <!-- Overlay removed as requested -->
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

  grid.querySelectorAll('.jellyfin-item-card').forEach(card => {
    card.addEventListener('click', () => showItemDetails(card.dataset.id));
  });
}

async function showItemDetails(itemId) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="details-modal-overlay">
      <div class="details-modal">
        <div class="details-header">
          <span>[ ITEM RETRIEVAL IN PROGRESS... ]</span>
          <button class="player-close" id="close-details">✕</button>
        </div>
        <div class="details-body skeleton-container">
          <div class="skeleton" style="width: 300px; height: 450px"></div>
          <div style="flex:1">
             <div class="skeleton" style="height: 40px; margin-bottom: 20px"></div>
             <div class="skeleton" style="height: 100px"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const closeBtn = document.getElementById('close-details');
  const closeDetails = () => modalContainer.innerHTML = '';
  
  closeBtn.addEventListener('click', closeDetails);

  // Close on outside click
  const overlay = modalContainer.querySelector('.details-modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDetails();
  });

  try {
    const item = await jellyfin.getItem(itemId);
    if (!item || item.error) throw new Error(item?.message || "Item not found");

    const poster = `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?maxWidth=600&api_key=${JELLYFIN_KEY}`;
    
    let episodesHTML = '';
    if (item.Type === 'Series') {
      const episodesData = await jellyfin.getEpisodes(itemId);
      const episodes = episodesData.Items || [];
      episodesHTML = `
        <div class="episodes-section">
          <h3 class="label decrypt-text" style="color:var(--cp-yellow); margin-bottom:16px">EPISODES</h3>
          <div class="episodes-list">
            ${episodes.map(ep => `
              <div class="episode-row">
                <div class="episode-thumb" style="background-image: url('${JELLYFIN_URL}/Items/${ep.Id}/Images/Primary?maxWidth=300&api_key=${JELLYFIN_KEY}')"></div>
                <div class="episode-info">
                  <div class="episode-title">S${ep.ParentIndexNumber}E${ep.IndexNumber} — ${ep.Name}</div>
                  <div class="episode-overview">${ep.Overview || 'No description available.'}</div>
                </div>
                <button class="cp-button mini play-episode-btn" data-id="${ep.Id}" data-name="${ep.Name}">▶ PLAY</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const duration = item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10000000 / 60) + ' min' : 'N/A';
    const rating = item.CommunityRating ? `★ ${item.CommunityRating.toFixed(1)}` : 'N/A';
    const itemName = item.Name || 'Unknown Item';
    const itemType = item.Type || 'Unknown';

    modalContainer.querySelector('.details-modal').innerHTML = `
      <div class="details-header">
        <span>[ ITEM ACCESS GRANTED: ${itemName.toUpperCase()} ]</span>
        <button class="player-close" id="close-details">✕</button>
      </div>
      <div class="details-body">
        <div class="details-left">
          <div class="details-poster">
            <img src="${poster}" alt="${itemName}">
          </div>
          <h1 class="details-title">${itemName}</h1>
          <div class="details-meta">
            <span>${item.ProductionYear || 'YEAR UNKNOWN'}</span>
            <span>${duration}</span>
            <span style="color:var(--cp-yellow)">${rating}</span>
            <span class="details-tag">${itemType.toUpperCase()}</span>
          </div>
          <div class="details-overview">${item.Overview || 'No neural link description available for this data fragment.'}</div>
          
          ${item.Genres && item.Genres.length ? `
            <div class="details-meta" style="margin-top:8px">
              ${item.Genres.map(g => `<span class="details-tag">${(g || '').toUpperCase()}</span>`).join('')}
            </div>
          ` : ''}

          <div class="details-actions">
            <button class="cp-button" id="play-main-item" style="width:100%">▶ PLAY ${item.Type === 'Series' ? 'SERIES' : 'MOVIE'}</button>
          </div>
        </div>

        <div class="details-right">
          ${episodesHTML || `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-dim); opacity:0.3">
               <div class="label" style="font-size:12px; margin-bottom:16px">> SYSTEM DIAGNOSTICS: OPTIMAL_</div>
               <div style="font-size:10px; font-family:var(--font-body)">NO SUPPLEMENTARY DATA STREAM DETECTED</div>
            </div>
          `}
        </div>
      </div>
    `;

    // Re-attach close event to the new close button
    document.getElementById('close-details').addEventListener('click', closeDetails);
    
    const playMain = document.getElementById('play-main-item');
    if (playMain) {
      playMain.addEventListener('click', () => openPlayer(item.Id, itemName));
    }

    modalContainer.querySelectorAll('.play-episode-btn').forEach(btn => {
      btn.addEventListener('click', () => openPlayer(btn.dataset.id, btn.dataset.name));
    });

  } catch (err) {
    console.error(err);
    modalContainer.querySelector('.details-body').innerHTML = `<div class="error">> ACCESS DENIED: ${err.message}_</div>`;
  }
}
