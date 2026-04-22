export function QueuePanel(radarrQueue = [], sonarrQueue = []) {
  const merged = [
    ...radarrQueue.map(item => ({ ...item, service: 'RADARR' })),
    ...sonarrQueue.map(item => ({ ...item, service: 'SONARR' }))
  ];

  if (merged.length === 0) {
    return `<div class="empty-state">NO_ACTIVE_DOWNLOADS_</div>`;
  }

  return `
    <div class="panel-content">
      <table class="pixel-table">
        <thead>
          <tr>
            <th>TITLE</th>
            <th>SERVICE</th>
            <th>STATUS</th>
            <th>PROGRESS</th>
            <th>SIZE</th>
          </tr>
        </thead>
        <tbody>
          ${merged.map(item => {
            const progress = (item.sizeleft > 0) ? ((item.size - item.sizeleft) / item.size * 100).toFixed(1) : 100;
            const statusClass = item.status?.toUpperCase() || 'UNKNOWN';
            
            return `
              <tr>
                <td class="col-title">${item.title || item.series?.title || 'Unknown'}</td>
                <td class="col-service">${item.service}</td>
                <td class="col-status"><span class="badge ${statusClass}">${statusClass}</span></td>
                <td class="col-progress">
                  <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                  </div>
                  <span class="progress-text">${progress}%</span>
                </td>
                <td class="col-size">${(item.size / 1024 / 1024 / 1024).toFixed(2)} GB</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
