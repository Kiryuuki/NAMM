export function HeroCalendar(calendarData = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const monthName = now.toLocaleString('default', { month: 'long' });
  
  // First day of month
  const firstDay = new Date(year, month, 1).getDay();
  // Total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const today = now.getDate();
  
  let daysHtml = '';
  
  // Empty slots for start of month
  for (let i = 0; i < firstDay; i++) {
    daysHtml += `<div class="calendar-day empty"></div>`;
  }
  
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Find events for this day (checking only the date part of ISO string)
    const dayEvents = calendarData.filter(item => item.airDate.startsWith(dateStr));
    
    daysHtml += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="day-number">${d}</div>
        <div class="day-events">
          ${dayEvents.slice(0, 3).map(event => {
            const isDownloaded = event.hasFile;
            return `
              <div class="event-dot ${isDownloaded ? 'downloaded' : 'missing'}" title="${event.series?.title || '??'}: ${event.title}">
                ${event.series?.title || '??'}
              </div>
            `;
          }).join('')}
          ${dayEvents.length > 3 ? `<div class="event-dot">+${dayEvents.length - 3} MORE_</div>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="hero-inner">
      <div class="hero-title">${monthName.toUpperCase()} ${year} // MISSION_TIMELINE_</div>
      <div class="month-grid">
        <div class="day-header">SUN</div>
        <div class="day-header">MON</div>
        <div class="day-header">TUE</div>
        <div class="day-header">WED</div>
        <div class="day-header">THU</div>
        <div class="day-header">FRI</div>
        <div class="day-header">SAT</div>
        ${daysHtml}
      </div>
    </div>
  `;
}
