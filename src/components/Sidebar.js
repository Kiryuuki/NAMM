export function Sidebar(radarrStats = {}, sonarrStats = {}) {
  const renderStats = (title, stats) => `
    <div class="stats-group">
      <div class="stats-title">${title}</div>
      <div class="stat-item">
        <div class="indicator-box" style="background: var(--accent-green)"></div>
        <span class="stat-label">Downloaded (M)</span>
        <span class="stat-value">${stats.downloadedMonitored || 0}</span>
      </div>
      <div class="stat-item">
        <div class="indicator-box" style="background: #707070"></div>
        <span class="stat-label">Downloaded (U)</span>
        <span class="stat-value">${stats.downloadedUnmonitored || 0}</span>
      </div>
      <div class="stat-item">
        <div class="indicator-box" style="background: var(--accent-red)"></div>
        <span class="stat-label">Missing (M)</span>
        <span class="stat-value">${stats.missingMonitored || 0}</span>
      </div>
       <div class="stat-item">
        <div class="indicator-box" style="background: var(--accent-amber)"></div>
        <span class="stat-label">Missing (U)</span>
        <span class="stat-value">${stats.missingUnmonitored || 0}</span>
      </div>
      <div class="stat-item">
        <div class="indicator-box" style="background: var(--accent-magenta)"></div>
        <span class="stat-label">Queued</span>
        <span class="stat-value">${stats.queued || 0}</span>
      </div>
      <div class="stat-item">
        <div class="indicator-box" style="background: #33aaff"></div>
        <span class="stat-label">Unreleased</span>
        <span class="stat-value">${stats.unreleased || 0}</span>
      </div>
    </div>
  `;

  return `
    <div id="sidebar-content">
      ${renderStats('RADARR_MOVIES', radarrStats)}
      ${renderStats('SONARR_SERIES', sonarrStats)}
    </div>
  `;
}
