import * as jellyfin from './api/jellyfin.js';
import * as radarr from './api/radarr.js';
import * as sonarr from './api/sonarr.js';
import * as prowlarr from './api/prowlarr.js';
import { initNavbar, updateNavbarHealth } from './components/Navbar.js';
import { initSidebarNav, setSidebarActiveTab } from './components/SidebarNav.js';
import { initDownloadQueue } from './components/DownloadQueue.js';
import { initStatsPanel } from './components/StatsPanel.js';
import { initDiscoveryPanel } from './components/DiscoveryPanel.js';
import { initLibraryPanel } from './components/LibraryPanel.js';
import { initJellyfinView } from './components/JellyfinView.js';

// Phase 10: ReactBits-inspired effects (vanilla ports)
import {
  initDecryptAnimations,
  initPixelTrail,
  initAurora,
  initGlitchHover,
  initCounters,
  initBorderBeams,
  initShinyText,
} from './utils/effects.js';

console.log('%c[NAMM] BOOTING...', "color:#FCE300;font-family:'Press Start 2P';font-size:14px;");

/** Poll all service health endpoints */
async function checkHealth() {
  const [jf, rd, sn, pr] = await Promise.allSettled([
    jellyfin.getSystemInfo(),
    radarr.getSystemStatus(),
    sonarr.getSystemStatus(),
    prowlarr.getSystemStatus(),
  ]);
  updateNavbarHealth({
    jellyfin: jf.status === 'fulfilled' && !jf.value?.error,
    radarr:   rd.status === 'fulfilled' && !rd.value?.error,
    sonarr:   sn.status === 'fulfilled' && !sn.value?.error,
    prowlarr: pr.status === 'fulfilled' && !pr.value?.error,
  });
}

/** Re-init text/counter effects after any panel re-render */
function refreshEffects() {
  initDecryptAnimations();
  initBorderBeams();
  initShinyText();
  initCounters();
}

/** Switch main panel — renders correct view and syncs nav state */
function switchTab(tab) {
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;

  mainPanel.innerHTML = '';

  if (tab === 'discovery')    initDiscoveryPanel('main-panel');
  else if (tab === 'library') initLibraryPanel('main-panel');
  else if (tab === 'jellyfin') initJellyfinView('main-panel');

  // Aurora only on discovery (main panel has content-heavy bg)
  if (tab === 'discovery') initAurora();

  refreshEffects();

  refreshEffects();
}

function initLayout() {
  // Navbar: brand + health dots only (no search, no tabs)
  initNavbar('navbar');

  // Sidebar: collapse btn + search btn + nav tabs
  initSidebarNav('sidebar-nav', switchTab);

  // Sidebar panels
  initDownloadQueue('download-queue');
  initStatsPanel('stats-panel');

  // Default view
  initDiscoveryPanel('main-panel');
  initAurora();

  // Global effects
  initPixelTrail();
  initGlitchHover('.brand');
  refreshEffects();
}

document.addEventListener('DOMContentLoaded', () => {
  initLayout();
  checkHealth();
  setInterval(checkHealth, 60_000);

  console.log('%c[NAMM] NEURAL LINK ESTABLISHED.', "color:#00F0FF;font-family:'Share Tech Mono';");
});
