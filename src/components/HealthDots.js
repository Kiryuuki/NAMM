export function renderHealthDots(statuses) {
  const services = [
    { id: 'jellyfin', label: 'JF' },
    { id: 'radarr', label: 'RD' },
    { id: 'sonarr', label: 'SN' },
    { id: 'prowlarr', label: 'PR' }
  ];

  return services.map(service => {
    const status = statuses[service.id];
    let stateClass = 'loading';
    
    if (status === true) stateClass = 'online';
    if (status === false) stateClass = 'offline';

    return `
      <div class="health-dot-container" title="${service.id.toUpperCase()}: ${stateClass.toUpperCase()}">
        <div class="health-dot ${stateClass}"></div>
        <span class="health-label">${service.label}</span>
      </div>
    `;
  }).join('');
}
