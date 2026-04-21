import * as radarr from '../api/radarr.js';
import * as sonarr from '../api/sonarr.js';
import { formatBytes } from '../utils/format.js';

/** Status → CSS class mapping */
const STATUS_CLASS = {
  'DOWNLOADING': 'downloading',
  'QUEUED':      'queued',
  'PAUSED':      'paused',
  'FAILED':      'failed',
  'COMPLETED':   'completed',
};

/** Status → progress bar class */
const BAR_CLASS = {
  'DOWNLOADING': 'downloading',
  'COMPLETED':   'completed',
  'FAILED':      'failed',
};

export function initDownloadQueue(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="section-header">[ DOWNLOAD QUEUE ]</div>
    <div id="queue-list" class="queue-container">
      ${'<div class="skeleton" style="height:80px;margin-bottom:8px"></div>'.repeat(2)}
    </div>
  `;

  updateQueue();
  setInterval(updateQueue, 30_000);
}

async function updateQueue() {
  const queueList = document.getElementById('queue-list');
  if (!queueList) return;

  const [radarrQueue, sonarrQueue] = await Promise.all([
    radarr.getQueue(),
    sonarr.getQueue(),
  ]);

  const merged = [
    ...(radarrQueue.records || []).map(item => ({ ...item, _src: 'R' })),
    ...(sonarrQueue.records || []).map(item => ({ ...item, _src: 'S' })),
  ].sort((a, b) => b.size - a.size);

  if (merged.length === 0) {
    queueList.innerHTML = `
      <div class="empty-state">
        <div style="font-size:22px;opacity:0.4">▣</div>
        <div>> NO ACTIVE DOWNLOADS_</div>
      </div>
    `;
    return;
  }

  queueList.innerHTML = merged.slice(0, 8).map(item => {
    const pct     = item.size > 0 ? Math.min((1 - (item.sizeleft / item.size)) * 100, 100) : 0;
    const status  = (item.status || 'QUEUED').toUpperCase();
    const barCls  = BAR_CLASS[status] || 'downloading';
    const srcCls  = item._src === 'R' ? 'badge movie' : 'badge tv';
    const sizeStr = formatBytes(item.size);
    const leftStr = formatBytes(item.sizeleft);

    return `
      <div class="queue-item">
        <div class="queue-item-header">
          <div class="queue-title" title="${item.title}">${item.title}</div>
          <span class="${srcCls}">${item._src}</span>
        </div>
        <div class="queue-meta">
          <span class="status-text ${barCls}">${status}</span>
          <span style="color:var(--text-dim)">${leftStr} / ${sizeStr}</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar ${barCls}" style="width:${pct.toFixed(1)}%"></div>
        </div>
      </div>
    `;
  }).join('');
}
