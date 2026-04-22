export function Navbar(health, lastSync) {
  const statusToColor = (status) => {
    switch (status) {
      case 'online': return 'var(--accent-green)';
      case 'degraded': return 'var(--accent-amber)';
      case 'offline': return 'var(--accent-red)';
      default: return 'var(--text-secondary)';
    }
  };

  return `
    <div class="navbar-inner container">
      <div class="nav-brand glitch" data-text="ARR COCKPIT">ARR COCKPIT</div>
      
      <div class="nav-health">
        <div class="health-item">
          <span class="health-dot" style="background-color: ${statusToColor(health.jellyfin)}"></span>
          <span class="health-label">JF</span>
        </div>
        <div class="health-item">
          <span class="health-dot" style="background-color: ${statusToColor(health.radarr)}"></span>
          <span class="health-label">RD</span>
        </div>
        <div class="health-item">
          <span class="health-dot" style="background-color: ${statusToColor(health.sonarr)}"></span>
          <span class="health-label">SN</span>
        </div>
        <div class="health-item">
          <span class="health-dot" style="background-color: ${statusToColor(health.prowlarr)}"></span>
          <span class="health-label">PR</span>
        </div>
      </div>

      <div class="nav-sync">
        <span class="sync-label">SYSTEM_STATUS:</span>
        <span class="sync-value">${lastSync || 'INITIALIZING...'}</span>
      </div>
    </div>
  `;
}
