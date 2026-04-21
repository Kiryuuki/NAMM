import { initDecryptAnimations } from '../utils/animations.js';

export function initSidebarNav(containerId, onTabChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar-tabs">
      <button class="nav-tab active" data-tab="discovery">
        <span class="tab-icon">▣</span> DISCOVERY
      </button>
      <button class="nav-tab" data-tab="library">
        <span class="tab-icon">▣</span> LIBRARY
      </button>
      <button class="nav-tab" data-tab="jellyfin">
        <span class="tab-icon">▣</span> JELLYFIN
      </button>
    </div>
  `;

  const tabs = container.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (onTabChange) onTabChange(tab.dataset.tab);
      initDecryptAnimations();
    });
  });
}
