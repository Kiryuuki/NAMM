export function ServiceCard(name, status, metrics = {}, error = null) {
  const statusColor = error ? 'var(--accent-red)' : 
                     status === 'loading' ? 'var(--text-secondary)' : 
                     'var(--accent-green)';
  
  const iconMap = {
    jellyfin: 'JF',
    radarr: 'RD',
    sonarr: 'SN',
    prowlarr: 'PR'
  };

  return `
    <div class="pixel-border service-card ${status}">
      <div class="card-header">
        <span class="service-icon">${iconMap[name.toLowerCase()] || '??'}</span>
        <h2 class="service-name glitch" data-text="${name.toUpperCase()}">${name.toUpperCase()}</h2>
        <span class="status-indicator" style="background-color: ${statusColor}"></span>
      </div>
      
      <div class="card-body">
        ${error ? `
          <div class="error-msg">ERROR: ${error}</div>
        ` : status === 'loading' ? `
          <div class="loading-pulse">SYNCING_DATA...</div>
        ` : `
          <div class="metrics">
            ${Object.entries(metrics).map(([label, value]) => `
              <div class="metric">
                <span class="metric-label">${label.toUpperCase()}:</span>
                <span class="metric-value">${value}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
      
      <div class="card-footer">
        <span class="status-text">${error ? 'OFFLINE' : status.toUpperCase()}</span>
      </div>
    </div>
  `;
}
