export function CalendarPanel(calendarData = []) {
  if (calendarData.length === 0) {
    return `<div class="empty-state">NO_UPCOMING_EPISODES_</div>`;
  }

  // Sort by date
  const sorted = [...calendarData].sort((a, b) => new Date(a.airDate) - new Date(b.airDate));
  
  // Group by date
  const groups = sorted.reduce((acc, item) => {
    const date = new Date(item.airDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString();

  return `
    <div class="panel-content calendar-grid">
      ${Object.entries(groups).map(([date, items]) => `
        <div class="calendar-group ${date === today ? 'today' : ''}">
          <div class="date-header">${date === today ? 'TODAY_[' + date + ']' : date}</div>
          <div class="date-items">
            ${items.map(item => `
              <div class="calendar-item">
                <span class="item-time">${new Date(item.airDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="item-series">${item.series?.title || 'Unknown'}</span>
                <span class="item-episode">S${String(item.seasonNumber).padStart(2, '0')}E${String(item.episodeNumber).padStart(2, '0')}</span>
                <span class="item-title">${item.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
