import * as jellyfin from '../api/jellyfin.js';

/**
 * NAMM Cyberpunk Media Player
 * Native HTML5 video with custom neon controls
 */
export async function openPlayer(itemId, itemName) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const pbInfo = await jellyfin.getPlaybackInfo(itemId);
  const mediaSource = pbInfo.MediaSources?.[0];
  const streams = mediaSource?.MediaStreams || [];

  const audioStreams = streams.filter(s => s.Type === 'Audio');
  const subStreams = streams.filter(s => s.Type === 'Subtitle');

  let currentAudioIndex = audioStreams.find(s => s.IsDefault)?.Index || audioStreams[0]?.Index;
  let currentSubIndex = -1; // -1 for Off

  const renderPlayer = (aIdx, sIdx) => {
    const streamUrl = jellyfin.getStreamUrl(itemId, { 
      audioIndex: aIdx,
      mediaSourceId: mediaSource?.Id 
    });
    
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
            <div class="player-controls-bar">
              <div class="player-status" id="player-status">LINK ESTABLISHED: 200 OK // BUFFERING...</div>
              <div class="player-tracks">
                <div class="track-group">
                  <span class="track-label">AUDIO:</span>
                  <select id="audio-select" class="cp-select">
                    ${audioStreams.map(s => `<option value="${s.Index}" ${s.Index == aIdx ? 'selected' : ''}>${s.Language?.toUpperCase() || 'UNK'} (${s.Codec?.toUpperCase()})</option>`).join('')}
                  </select>
                </div>
                <div class="track-group">
                  <span class="track-label">SUBS:</span>
                  <select id="sub-select" class="cp-select">
                    <option value="-1" ${sIdx == -1 ? 'selected' : ''}>OFF</option>
                    ${subStreams.map(s => {
                      const codec = (s.Codec || '').toLowerCase();
                      const isText = s.IsTextSubtitle || s.DeliveryMethod === 'External' || 
                                   ['srt', 'subrip', 'ass', 'ssa', 'vtt', 'mov_text'].includes(codec);
                      const label = `${(s.Language || 'UNK').toUpperCase()} - ${s.DisplayTitle || s.Title || 'Text'}${isText ? '' : ' (IMG/MAY FAIL)'}`;
                      return `<option value="${s.Index}" ${s.Index == sIdx ? 'selected' : ''}>${label}</option>`;
                    }).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="player-branding">[ NAMM MEDIA ENGINE v1.2 ]</div>
          </div>
        </div>
      </div>
    `;

    setupEvents(aIdx, sIdx);
    if (sIdx !== -1) {
      updateSubtitles(sIdx);
    }
  };

  const updateSubtitles = (sIdx) => {
    const video = document.getElementById('namm-video');
    if (!video) return;

    // Clear existing tracks
    const oldTracks = video.querySelectorAll('track');
    oldTracks.forEach(t => t.remove());

    if (sIdx === -1) return;

    const stream = subStreams.find(s => s.Index === sIdx);
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = stream ? (stream.DisplayTitle || stream.Title || 'Subtitles') : 'Jellyfin Subtitles';
    track.srclang = stream ? (stream.Language || 'en') : 'en';
    track.src = jellyfin.getSubtitleUrl(itemId, sIdx, mediaSource?.Id);
    track.default = true;
    
    video.appendChild(track);
    
    // Some browsers need a nudge to show the track
    track.addEventListener('load', () => {
      track.track.mode = 'showing';
    });
    
    // Force showing immediately too
    setTimeout(() => {
      if (track.track) track.track.mode = 'showing';
    }, 100);
  };

  const setupEvents = (aIdx, sIdx) => {
    const video = document.getElementById('namm-video');
    const closeBtn = document.getElementById('close-player');
    const statusLine = document.getElementById('player-status');
    const errorOverlay = document.getElementById('player-error');
    const audioSelect = document.getElementById('audio-select');
    const subSelect = document.getElementById('sub-select');

    video.addEventListener('playing', () => {
      statusLine.innerText = 'LINK ESTABLISHED: 200 OK // STREAMING LIVE';
      statusLine.style.color = 'var(--cp-cyan)';
    });

    video.addEventListener('waiting', () => {
      statusLine.innerText = 'LINK UNSTABLE // BUFFERING DATA...';
      statusLine.style.color = 'var(--cp-yellow)';
    });

    video.addEventListener('error', (e) => {
      console.error("[PLAYER] Video Error:", e);
      errorOverlay.style.display = 'flex';
      statusLine.innerText = 'LINK SEVERED // CRITICAL STREAM ERROR';
      statusLine.style.color = 'var(--cp-red)';
    });

    audioSelect.addEventListener('change', (e) => {
      const newAudioIdx = e.target.value;
      const currentTime = video.currentTime;
      const isPaused = video.paused;
      
      const newUrl = jellyfin.getStreamUrl(itemId, { 
        audioIndex: newAudioIdx,
        mediaSourceId: mediaSource?.Id 
      });
      
      video.querySelector('source').src = newUrl;
      video.load();
      video.currentTime = currentTime;
      if (!isPaused) video.play();
      
      currentAudioIndex = newAudioIdx;
    });

    subSelect.addEventListener('change', (e) => {
      const newSubIdx = parseInt(e.target.value);
      updateSubtitles(newSubIdx);
      currentSubIndex = newSubIdx;
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
  };

  renderPlayer(currentAudioIndex, currentSubIndex);
}
