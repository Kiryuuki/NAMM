import { openSearchModal } from './SearchModal.js';

/** Approved icon vocabulary (Unicode only, no emoji) */
const ICONS = {
  discovery : '◈',
  library   : '▤',
  jellyfin  : '▶',
  search    : '⌕',
  collapse  : '◀',
  expand    : '▶',
};

const TABS = [
  { id: 'discovery', label: 'DISCOVERY', icon: ICONS.discovery },
  { id: 'library',   label: 'LIBRARY',   icon: ICONS.library },
  { id: 'jellyfin',  label: 'JELLYFIN',  icon: ICONS.jellyfin },
];

export function initSidebarNav(containerId, onTabChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar-nav-inner">

      <!-- Collapse toggle -->
      <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Toggle sidebar">
        <span class="collapse-icon">${ICONS.collapse}</span>
        <span class="collapse-label">COLLAPSE</span>
      </button>

      <!-- Search button -->
      <button class="sidebar-search-btn" id="sidebar-search-btn" title="Search (⌕)">
        <span class="snav-icon">${ICONS.search}</span>
        <span class="snav-label">SEARCH</span>
      </button>

      <!-- Nav tabs -->
      <div class="sidebar-tabs">
        ${TABS.map((t, i) => `
          <button class="nav-tab${i === 0 ? ' active' : ''}" data-tab="${t.id}" title="${t.label}">
            <span class="snav-icon">${t.icon}</span>
            <span class="snav-label">${t.label}</span>
          </button>
        `).join('')}
      </div>

    </div>
  `;

  // Tab switching
  const tabs = container.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      onTabChange?.(tab.dataset.tab);
    });
  });

  // Search button → open modal
  document.getElementById('sidebar-search-btn')?.addEventListener('click', () => {
    openSearchModal();
  });

  // Collapse toggle
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', toggleSidebar);
}

/** Toggle sidebar between expanded (340px) and icon-only (52px) */
function toggleSidebar() {
  const app = document.getElementById('app');
  if (!app) return;

  const collapsed = app.classList.toggle('sidebar-collapsed');
  const btn = document.getElementById('sidebar-collapse-btn');
  if (btn) {
    const icon = btn.querySelector('.collapse-icon');
    if (icon) icon.textContent = collapsed ? ICONS.expand : ICONS.collapse;
    btn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }
}

/** Called from main.js to set active tab programmatically */
export function setSidebarActiveTab(tabId) {
  document.querySelectorAll('#sidebar-nav .nav-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabId)
  );
}
