import './style.css';
import * as jellyfin from './api/jellyfin';
import * as radarr from './api/radarr';
import * as sonarr from './api/sonarr';
import * as prowlarr from './api/prowlarr';

import { Navbar } from './components/Navbar';
import { ServiceCard } from './components/ServiceCard';
import { Sidebar } from './components/Sidebar';
import { HeroCalendar } from './components/HeroCalendar';
import { QueuePanel } from './components/QueuePanel';
import { SessionsPanel } from './components/SessionsPanel';
import { IndexersPanel } from './components/IndexersPanel';

// App State
const state = {
  lastSync: null,
  health: {
    jellyfin: 'offline',
    radarr: 'offline',
    sonarr: 'offline',
    prowlarr: 'offline'
  },
  services: {
    jellyfin: { status: 'loading', data: null, error: null },
    radarr: { status: 'loading', data: null, error: null },
    sonarr: { status: 'loading', data: null, error: null },
    prowlarr: { status: 'loading', data: null, error: null }
  },
  activeTab: 'queue'
};

// Initial Render
function initialRender() {
  renderNavbar();
  renderSidebar();
  renderHeroCalendar();
  renderServiceCards();
  renderTabContent();
  setupEventListeners();
}

function renderNavbar() {
  const container = document.getElementById('navbar');
  if (container) container.innerHTML = Navbar(state.health, state.lastSync);
}

function renderSidebar() {
  const container = document.getElementById('sidebar-content');
  if (!container) return;
  
  const rStats = calculateRadarrStats(state.services.radarr.data?.movies, state.services.radarr.data?.queue);
  const sStats = calculateSonarrStats(state.services.sonarr.data?.series, state.services.sonarr.data?.queue);
  
  container.innerHTML = Sidebar(rStats, sStats);
}

function renderHeroCalendar() {
  const container = document.getElementById('hero-calendar');
  if (container) container.innerHTML = HeroCalendar(state.services.sonarr.data?.calendar || []);
}

function renderServiceCards() {
  const container = document.getElementById('service-cards');
  if (!container) return;
  container.innerHTML = '';
  
  Object.entries(state.services).forEach(([name, svc]) => {
    let metrics = {};
    if (svc.data && !svc.error) {
      if (name === 'jellyfin') {
        metrics = {
          sessions: svc.data.sessions?.filter(s => s.NowPlayingItem).length || 0,
          libraries: svc.data.libraries?.length || 0
        };
      } else if (name === 'radarr') {
        metrics = {
          movies: svc.data.movies?.length || 0,
          queue: svc.data.queueStatus?.queuedCount || 0
        };
      } else if (name === 'sonarr') {
        metrics = {
          series: svc.data.series?.length || 0,
          queue: svc.data.queue?.totalRecords || 0
        };
      } else if (name === 'prowlarr') {
        metrics = {
          indexers: svc.data.indexers?.length || 0,
          history: svc.data.history?.totalRecords || 0
        };
      }
    }
    
    container.innerHTML += ServiceCard(name, svc.status, metrics, svc.error);
  });
}

function renderTabContent() {
  const container = document.getElementById('tab-content');
  if (!container) return;

  switch (state.activeTab) {
    case 'queue':
      container.innerHTML = QueuePanel(state.services.radarr.data?.queue?.records, state.services.sonarr.data?.queue?.records);
      break;
    case 'sessions':
      container.innerHTML = SessionsPanel(state.services.jellyfin.data?.sessions);
      break;
    case 'indexers':
      container.innerHTML = IndexersPanel(state.services.prowlarr.data?.indexers);
      break;
    default:
      container.innerHTML = `<div class="empty-state">SELECT_TAB_</div>`;
  }
}

function calculateRadarrStats(movies = [], queue = { records: [] }) {
  if (movies.length === 0) return {};
  return {
    downloadedMonitored: movies.filter(m => m.monitored && m.hasFile).length,
    downloadedUnmonitored: movies.filter(m => !m.monitored && m.hasFile).length,
    missingMonitored: movies.filter(m => m.monitored && !m.hasFile && m.status !== 'announced').length,
    missingUnmonitored: movies.filter(m => !m.monitored && !m.hasFile && m.status !== 'announced').length,
    queued: queue.records?.length || 0,
    unreleased: movies.filter(m => m.status === 'announced').length
  };
}

function calculateSonarrStats(series = [], queue = { records: [] }) {
  if (series.length === 0) return {};
  // Sonarr stats are aggregate over all series
  const stats = {
    downloadedMonitored: 0,
    downloadedUnmonitored: 0,
    missingMonitored: 0,
    missingUnmonitored: 0,
    queued: queue.records?.length || 0,
    unreleased: 0
  };

  series.forEach(s => {
    if (s.statistics) {
       if (s.monitored) {
         stats.downloadedMonitored += s.statistics.episodeFileCount;
         stats.missingMonitored += (s.statistics.episodeCount - s.statistics.episodeFileCount);
       } else {
         stats.downloadedUnmonitored += s.statistics.episodeFileCount;
         stats.missingUnmonitored += (s.statistics.episodeCount - s.statistics.episodeFileCount);
       }
    }
  });

  return stats;
}

function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      state.activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTabContent();
    });
  });

  // Sidebar Toggle
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      toggle.querySelector('span').innerText = sidebar.classList.contains('collapsed') ? '>>' : '<<';
    });
  }
}

async function syncAll() {
  console.log('SYNC_START...');
  
  await Promise.all([
    syncJellyfin(),
    syncRadarr(),
    syncSonarr(),
    syncProwlarr()
  ]);

  state.lastSync = new Date().toLocaleTimeString();
  renderNavbar();
  renderSidebar();
  renderHeroCalendar();
  renderServiceCards();
  renderTabContent();
  console.log('SYNC_COMPLETE');
}

async function syncJellyfin() {
  try {
    const [info, sessions, libraries] = await Promise.all([
      jellyfin.getSystemInfo(),
      jellyfin.getSessions(),
      jellyfin.getLibraries()
    ]);
    if (info.error) throw new Error('OFFLINE');
    state.health.jellyfin = 'online';
    state.services.jellyfin = { status: 'online', data: { info, sessions, libraries }, error: null };
  } catch (e) {
    state.health.jellyfin = 'offline';
    state.services.jellyfin = { status: 'error', data: null, error: e.message };
  }
}

async function syncRadarr() {
  try {
    const [movies, queue, queueStatus] = await Promise.all([
      radarr.getMovies(),
      radarr.getQueue(),
      radarr.getQueueStatus()
    ]);
    if (movies.error) throw new Error('OFFLINE');
    state.health.radarr = 'online';
    state.services.radarr = { status: 'online', data: { movies, queue, queueStatus }, error: null };
  } catch (e) {
    state.health.radarr = 'offline';
    state.services.radarr = { status: 'error', data: null, error: e.message };
  }
}

async function syncSonarr() {
  try {
    // Current Month Range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const [series, queue, calendar] = await Promise.all([
      sonarr.getSeries(),
      sonarr.getQueue(),
      sonarr.getCalendar(start, end)
    ]);
    if (series.error) throw new Error('OFFLINE');
    state.health.sonarr = 'online';
    state.services.sonarr = { status: 'online', data: { series, queue, calendar }, error: null };
  } catch (e) {
    state.health.sonarr = 'offline';
    state.services.sonarr = { status: 'error', data: null, error: e.message };
  }
}

async function syncProwlarr() {
  try {
    const [indexers, status, history] = await Promise.all([
      prowlarr.getIndexers(),
      prowlarr.getSystemStatus(),
      prowlarr.getHistory()
    ]);
    if (indexers.error) throw new Error('OFFLINE');
    state.health.prowlarr = 'online';
    state.services.prowlarr = { status: 'online', data: { indexers, status, history }, error: null };
  } catch (e) {
    state.health.prowlarr = 'offline';
    state.services.prowlarr = { status: 'error', data: null, error: e.message };
  }
}

async function init() {
  console.log('ARR_COCKPIT_V1.1.0_UI_RESTRUCTURE...');
  initialRender();
  await syncAll();
  setInterval(syncAll, 30000);
}

init();
