import * as jellyfin from '../api/jellyfin.js';
import { openPlayer } from './PlayerOverlay.js';
import { config } from '../api/config.js';

const JELLYFIN_URL = config.JELLYFIN_URL;
const JELLYFIN_KEY = config.JELLYFIN_KEY;

export async function showItemDetails(itemId, isJellyfin = true) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="details-modal-overlay">
      <div class="details-modal">
        <div class="details-hero skeleton"></div>
        <div class="details-body">
           <div class="details-left-pane">
              <div class="details-poster skeleton"></div>
           </div>
           <div class="details-right-pane">
              <div class="skeleton" style="height:40px; width:60%; margin-bottom:20px"></div>
              <div class="skeleton" style="height:20px; width:40%; margin-bottom:40px"></div>
              <div class="skeleton" style="height:100px; width:100%"></div>
           </div>
        </div>
      </div>
    </div>
  `;

  const closeDetails = () => modalContainer.innerHTML = '';

  try {
    let item;
    let poster, backdrop, logo;
    let videoInfo = 'N/A', audioInfo = 'N/A', subStreams = [];
    let duration = 'N/A', rating = 'N/A', contentRating = 'NR';
    let endsAtStr = null;

    if (isJellyfin) {
      item = await jellyfin.getItem(itemId);
      if (!item || item.error) throw new Error(item?.message || "Item not found");

      poster = `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?maxWidth=600&api_key=${JELLYFIN_KEY}`;
      backdrop = `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop?maxWidth=1920&api_key=${JELLYFIN_KEY}`;
      logo = `${JELLYFIN_URL}/Items/${item.Id}/Images/Logo?maxWidth=400&api_key=${JELLYFIN_KEY}`;
      
      const mainSource = item.MediaSources?.[0];
      const videoStream = mainSource?.MediaStreams?.find(s => s.Type === 'Video');
      const audioStream = mainSource?.MediaStreams?.find(s => s.Type === 'Audio');
      subStreams = mainSource?.MediaStreams?.filter(s => s.Type === 'Subtitle') || [];

      videoInfo = videoStream ? `${videoStream.DisplayTitle || videoStream.Codec.toUpperCase()}` : 'N/A';
      audioInfo = audioStream ? `${audioStream.DisplayTitle || audioStream.Codec.toUpperCase()}` : 'N/A';

      duration = item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10000000 / 60) + ' min' : 'N/A';
      rating = item.CommunityRating ? item.CommunityRating.toFixed(1) : 'N/A';
      contentRating = item.OfficialRating || 'NR';
      
      const endsAt = item.RunTimeTicks ? new Date(Date.now() + (item.RunTimeTicks / 10000)) : null;
      endsAtStr = endsAt ? endsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
    } else {
      // Fallback for TMDB items (future expansion if needed)
      // For now, we only use this for Jellyfin items per user request
    }

    modalContainer.innerHTML = `
      <div class="details-modal-overlay">
        <div class="details-modal">
          <div class="details-hero" style="background-image: url('${backdrop}')">
             <img src="${logo}" class="details-logo" onerror="this.style.display='none'">
             <button class="player-close" id="close-details" style="position:absolute; top:20px; right:20px; z-index:10; color:white">✕</button>
          </div>
          
          <div class="details-body">
            <div class="details-left-pane">
              <div class="details-poster">
                <img src="${poster}" alt="${item.Name}">
              </div>
              
              <div class="details-credits">
                <div class="credit-row">
                   <span class="credit-label">Genres</span>
                   <span class="credit-value">${item.Genres?.join(', ') || 'N/A'}</span>
                </div>
                ${item.People?.filter(p => p.Type === 'Director').length ? `
                  <div class="credit-row">
                    <span class="credit-label">Director</span>
                    <span class="credit-value">${item.People.filter(p => p.Type === 'Director').map(p => p.Name).join(', ')}</span>
                  </div>
                ` : ''}
                ${item.People?.filter(p => p.Type === 'Writer').length ? `
                  <div class="credit-row">
                    <span class="credit-label">Writer</span>
                    <span class="credit-value">${item.People.filter(p => p.Type === 'Writer').map(p => p.Name).join(', ')}</span>
                  </div>
                ` : ''}
                <div class="credit-row">
                   <span class="credit-label">Studios</span>
                   <span class="credit-value">${item.Studios?.map(s => s.Name).join(', ') || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="details-right-pane">
              <div class="details-main-info">
                <h1>${item.Name}</h1>
                <div class="details-sub-meta">
                   <span>${item.ProductionYear || ''}</span>
                   <span>${duration}</span>
                   <span class="meta-badge">${contentRating}</span>
                   <span><span class="rating-star">★</span> ${rating}</span>
                   ${endsAtStr ? `<span>Ends at ${endsAtStr}</span>` : ''}
                </div>

                <div class="details-actions-row">
                   <button class="action-btn" id="play-btn" title="Play">▶</button>
                   <button class="action-btn" title="Restart">↺</button>
                   <button class="action-btn" title="Mark as Played">✓</button>
                   <button class="action-btn" title="Favorite">❤</button>
                   <button class="action-btn" title="More">⋮</button>
                </div>

                <div class="details-tech-specs">
                   <div class="tech-row">
                      <span class="tech-label">Video</span>
                      <span class="tech-value">${videoInfo}</span>
                   </div>
                   <div class="tech-row">
                      <span class="tech-label">Audio</span>
                      <span class="tech-value">${audioInfo}</span>
                   </div>
                   <div class="tech-row">
                      <span class="tech-label">Subtitles</span>
                      <div class="tech-value">
                         <select class="cp-select" style="width:100%; max-width:400px">
                            <option value="-1">OFF</option>
                            ${subStreams.map(s => `<option value="${s.Index}">${s.DisplayTitle || s.Language || 'Unknown'}</option>`).join('')}
                         </select>
                      </div>
                   </div>
                </div>

                ${item.Taglines?.[0] ? `<div class="details-tagline">${item.Taglines[0]}</div>` : ''}
                <div class="details-summary">${item.Overview || 'No data fragment available.'}</div>
                
                <div class="details-tags-cloud">
                   ${item.Tags?.map(tag => `<span class="details-tag-item">${tag}</span>`).join('') || ''}
                </div>
              </div>

              ${item.Type === 'Series' ? `
                <div class="seasons-section">
                   <h3 class="label">[ SEASONS ]</h3>
                   <div id="seasons-grid" class="seasons-grid">
                      <div class="skeleton" style="width:150px; height:225px"></div>
                   </div>
                </div>
              ` : ''}

              <div id="episodes-container" class="episodes-section" style="display:none">
                 <h3 class="label" id="episodes-label">[ EPISODES ]</h3>
                 <div class="episodes-list-refined" id="episodes-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close-details').addEventListener('click', closeDetails);
    document.getElementById('play-btn').addEventListener('click', () => openPlayer(item.Id, item.Name));

    if (item.Type === 'Series') {
      loadSeasons(item.Id);
    }

  } catch (err) {
    console.error(err);
    modalContainer.innerHTML = `<div class="error-msg" style="padding:40px; text-align:center">> ACCESS DENIED: ${err.message}_</div>`;
  }
}

async function loadSeasons(seriesId) {
  const grid = document.getElementById('seasons-grid');
  if (!grid) return;

  const data = await jellyfin.getSeasons(seriesId);
  const seasons = data.Items || [];

  grid.innerHTML = seasons.map(s => `
    <div class="season-card" data-id="${s.Id}" data-name="${s.Name}">
       <div class="season-poster" style="background-image: url('${JELLYFIN_URL}/Items/${s.Id}/Images/Primary?maxWidth=300&api_key=${JELLYFIN_KEY}')"></div>
       <div class="season-title">${s.Name}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.season-card').forEach(card => {
    card.addEventListener('click', () => loadEpisodes(seriesId, card.dataset.id, card.dataset.name));
  });

  if (seasons.length > 0) {
    loadEpisodes(seriesId, seasons[0].Id, seasons[0].Name);
  }
}

async function loadEpisodes(seriesId, seasonId, seasonName) {
  const container = document.getElementById('episodes-container');
  const list = document.getElementById('episodes-list');
  const label = document.getElementById('episodes-label');
  if (!container || !list) return;

  container.style.display = 'block';
  label.innerText = `[ ${seasonName.toUpperCase()} EPISODES ]`;
  list.innerHTML = '<div class="skeleton" style="height:100px; width:100%"></div>';

  const data = await jellyfin.getEpisodes(seriesId, seasonId);
  const episodes = data.Items || [];

  list.innerHTML = episodes.map(ep => {
    const thumb = `${JELLYFIN_URL}/Items/${ep.Id}/Images/Primary?maxWidth=400&api_key=${JELLYFIN_KEY}`;
    return `
      <div class="episode-item-v2" data-id="${ep.Id}">
         <div class="episode-thumb-v2" style="background-image: url('${thumb}')">
            <div class="episode-play-overlay">▶</div>
         </div>
         <div class="episode-meta-v2">
            <div class="ep-title-row">
               <span>${ep.IndexNumber}. ${ep.Name}</span>
            </div>
            <div class="ep-sub-meta">
               ${Math.round(ep.RunTimeTicks / 10000000 / 60)} min • ★ ${ep.CommunityRating?.toFixed(1) || 'N/A'}
            </div>
            <div class="episode-overview" style="font-size:12px; margin-top:8px">${ep.Overview || 'No data fragment.'}</div>
         </div>
         <div class="ep-actions">
            <button class="action-btn" style="font-size:16px">✓</button>
            <button class="action-btn" style="font-size:16px">❤</button>
         </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.episode-item-v2').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn')) {
        openPlayer(item.dataset.id, item.querySelector('.ep-title-row span').innerText);
      }
    });
  });
}
