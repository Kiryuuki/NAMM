import { renderHealthDots } from './HealthDots.js';

/** Navbar is static in index.html — just wire health dot updates */
export function initNavbar() {
  // Nothing to inject — brand, health, sync-info are in index.html
}

export function updateNavbarHealth(statuses) {
  const container = document.getElementById('health-indicators');
  if (container) container.innerHTML = renderHealthDots(statuses);

  const syncTime = document.getElementById('last-sync-time');
  if (syncTime) {
    syncTime.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
