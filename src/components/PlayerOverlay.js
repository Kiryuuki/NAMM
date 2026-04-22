import * as jellyfin from '../api/jellyfin.js';

/**
 * NAMM Cyberpunk Media Player
 * Native HTML5 video with custom neon controls
 */
export function openPlayer(itemId, itemName) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const streamUrl = jellyfin.getStreamUrl(itemId);

  container.innerHTML = `
    <div class="player-overlay">
      <div class="player-container">
        <div class="player-header">
          <span class="player-title">▶ STREAMING: ${itemName.toUpperCase()}</span>
          <button class="player-close" id="close-player">✕</button>
        </div>
        
        <div class="video-wrapper">
          <video id="namm-video" autoplay controls crossorigin="anonymous" playsinline>
            <source src="${streamUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div id="player-error" class="player-error-overlay" style="display:none">
            <div class="error-msg">> ERROR: SIGNAL INTERRUPTED / CODE 404_</div>
          </div>
        </div>

        <div class="player-footer">
          <div class="player-status" id="player-status">LINK ESTABLISHED: 200 OK // BUFFERING...</div>
          <div class="player-branding">[ NAMM MEDIA ENGINE v1.2 ]</div>
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('namm-video');
  const closeBtn = document.getElementById('close-player');
  const statusLine = document.getElementById('player-status');
  const errorOverlay = document.getElementById('player-error');

  video.addEventListener('playing', () => {
    statusLine.innerText = 'LINK ESTABLISHED: 200 OK // STREAMING LIVE';
    statusLine.style.color = 'var(--cp-cyan)';
  });

  video.addEventListener('waiting', () => {
    statusLine.innerText = 'LINK UNSTABLE // BUFFERING DATA...';
    statusLine.style.color = 'var(--cp-yellow)';
  });

  video.addEventListener('error', () => {
    errorOverlay.style.display = 'flex';
    statusLine.innerText = 'LINK SEVERED // CRITICAL STREAM ERROR';
    statusLine.style.color = 'var(--cp-red)';
  });

  const closePlayer = () => {
    video.pause();
    video.src = "";
    video.load();
    container.innerHTML = "";
  };

  closeBtn.addEventListener('click', closePlayer);

  // Close on outside click
  const overlay = container.querySelector('.player-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePlayer();
  });

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closePlayer();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}
