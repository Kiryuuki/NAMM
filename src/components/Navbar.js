import { renderHealthDots } from './HealthDots.js';

export function initNavbar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="nav-left">
      <div class="brand decrypt-text glitch-text" data-text="[ ARR COCKPIT ]">[ ARR COCKPIT ]</div>
    </div>
    <div class="nav-right">
      <div id="health-indicators" class="health-indicators">
        <!-- Health dots injected here -->
      </div>
      <div class="sync-info">
        <span class="label">LAST SYNC:</span>
        <span id="last-sync-time">NEURAL LINKING...</span>
      </div>
    </div>
  `;
}

export function updateNavbarHealth(statuses) {
  const healthContainer = document.getElementById('health-indicators');
  if (healthContainer) {
    healthContainer.innerHTML = renderHealthDots(statuses);
  }

  const syncTime = document.getElementById('last-sync-time');
  if (syncTime) {
    syncTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
