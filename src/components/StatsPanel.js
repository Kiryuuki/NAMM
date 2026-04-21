import * as jellyfin from '../api/jellyfin.js';
import * as radarr from '../api/radarr.js';
import * as sonarr from '../api/sonarr.js';
import * as prowlarr from '../api/prowlarr.js';
import { formatBytes } from '../utils/format.js';
import { animateCounter } from '../utils/effects.js';

export function initStatsPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="section-header">[ SYSTEM STATUS ]</div>
    <div id="stats-grid" class="stats-grid">
      ${'<div class="skeleton" style="height: 70px;"></div>'.repeat(6)}
      <div class="skeleton wide" style="height: 50px; grid-column: span 2;"></div>
    </div>
  `;

  updateStats();
  setInterval(updateStats, 60_000);
}

async function updateStats() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  const [movies, series, missingMovies, missingSeries, sessions, disk, indexers] = await Promise.all([
    radarr.getMovies(),
    sonarr.getSeries(),
    radarr.getMissing(),
    sonarr.getMissing(),
    jellyfin.getSessions(),
    radarr.getDiskspace(),
    prowlarr.getIndexers()
  ]);

  const activeStreams = (sessions || []).filter(s => s.NowPlayingItem).length;
  const onlineIndexers = (indexers || []).filter(i => i.enabled).length;
  const primaryDisk = (disk || [])[0] || { freeSpace: 0, totalSpace: 0 };
  const usedSpace = primaryDisk.totalSpace - primaryDisk.freeSpace;
  const diskPercent = primaryDisk.totalSpace > 0 ? Math.round((usedSpace / primaryDisk.totalSpace) * 100) : 0;

  const tiles = [
    { label: 'MOVIES',   value: movies.length || 0,               color: 'var(--cp-yellow)' },
    { label: 'SERIES',   value: series.length || 0,               color: 'var(--cp-cyan)' },
    { label: 'MISSING M',value: missingMovies.totalRecords || 0,  color: 'var(--cp-magenta)' },
    { label: 'MISSING S', value: missingSeries.totalRecords || 0, color: 'var(--cp-magenta)' },
  ];

  grid.innerHTML = tiles.map((t, i) => `
    <div class="stat-tile border-beam-auto"
         data-beam-color="${t.color}"
         data-beam-duration="${2.5 + i * 0.4}">
      <span class="stat-label">${t.label}</span>
      <span class="stat-value count-up" style="color: ${t.color}" data-value="${t.value}">0</span>
    </div>
  `).join('') + `
    <div class="stat-tile span-2 border-beam-auto" data-beam-color="var(--text-secondary)" data-beam-duration="4">
       <span class="stat-label">HEALTH</span>
       <span class="stat-value" style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">SYSTEM OPTIMAL</span>
    </div>
    <div class="stat-tile wide">
      <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
        <span class="stat-label">DISK USAGE</span>
        <span class="stat-label" style="color: var(--text-secondary)">
          ${formatBytes(usedSpace)} / ${formatBytes(primaryDisk.totalSpace)} — ${diskPercent}%
        </span>
      </div>
      <div class="progress-container">
        <div class="progress-bar ${diskPercent > 85 ? 'failed' : 'downloading'}"
             style="width: ${diskPercent}%"></div>
      </div>
    </div>
  `;

  // Animate counters after render
  grid.querySelectorAll('.count-up').forEach(el => {
    const val = parseFloat(el.dataset.value);
    if (!isNaN(val)) animateCounter(el, val);
  });

  // Init border beams on new tiles
  grid.querySelectorAll('.border-beam-auto').forEach(el => {
    const { default: _, ...opts } = {};
    el.classList.add('border-beam');
    el.style.setProperty('--beam-color', el.dataset.beamColor || '#FCE300');
    el.style.setProperty('--beam-duration', `${el.dataset.beamDuration || 3}s`);
  });
}
