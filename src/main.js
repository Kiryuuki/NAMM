import * as jellyfin from './api/jellyfin.js';
import * as radarr from './api/radarr.js';
import * as sonarr from './api/sonarr.js';
import * as prowlarr from './api/prowlarr.js';
import { initNavbar, updateNavbarHealth } from './components/Navbar.js';
import { initSidebarNav } from './components/SidebarNav.js';
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

console.log(
  '%c[SYSTEM] BOOTING ARR COCKPIT...',
  "color: #FCE300; font-family: 'Press Start 2P'; font-size: 14px;"
);

/** Health check — polls all service /system/status endpoints */
async function checkHealth() {
  const [jf, rd, sn, pr] = await Promise.allSettled([
    jellyfin.getSystemInfo(),
    radarr.getSystemStatus(),
    sonarr.getSystemStatus(),
    prowlarr.getSystemStatus()
  ]);

  updateNavbarHealth({
    jellyfin: jf.status === 'fulfilled' && !jf.value.error,
    radarr:   rd.status === 'fulfilled' && !rd.value.error,
    sonarr:   sn.status === 'fulfilled' && !sn.value.error,
    prowlarr: pr.status === 'fulfilled' && !pr.value.error
  });
}

/** Re-init all reactive effects after panel re-render */
function refreshEffects() {
  initDecryptAnimations();
  initBorderBeams();
  initShinyText();
  initCounters();
}

/** Switch main panel view */
function switchTab(tab) {
  console.log(`[SYSTEM] SWITCHING TO TAB: ${tab.toUpperCase()}`);
  
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;

  // Clear current panel
  mainPanel.innerHTML = '';

  if (tab === 'discovery') {
    initDiscoveryPanel('main-panel');
  } else if (tab === 'library') {
    initLibraryPanel('main-panel');
  } else if (tab === 'jellyfin') {
    initJellyfinView('main-panel');
  }
  
  initDecryptAnimations();
  refreshEffects();
}

/** Bootstrap all panels and global effects */
function initLayout() {
  initNavbar('navbar');
  initSidebarNav('sidebar-nav', (tab) => switchTab(tab));
  initDownloadQueue('download-queue');
  initStatsPanel('stats-panel');
  initDiscoveryPanel('main-panel');
  
  // Phase 10 Effects
  initPixelTrail();
  initAurora();
  initGlitchHover('.brand');
  
  initDecryptAnimations();
}

document.addEventListener('DOMContentLoaded', () => {
  initLayout();
  checkHealth();

  // Poll health every 60s
  setInterval(checkHealth, 60_000);

  console.log(
    '%c[SYSTEM] NEURAL LINK ESTABLISHED.',
    "color: #00F0FF; font-family: 'Share Tech Mono';"
  );
});
