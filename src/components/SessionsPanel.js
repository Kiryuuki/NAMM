export function SessionsPanel(sessions = []) {
  const activeSessions = sessions.filter(s => s.NowPlayingItem);

  if (activeSessions.length === 0) {
    return `
      <div class="empty-state">
        <div class="pixel-art-tv">
          [ NO_ACTIVE_STREAMS ]
          <br>
          |&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
          <br>
          |&nbsp;&nbsp;STATIC&nbsp;&nbsp;&nbsp;|
          <br>
          |&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-content sessions-grid">
      ${activeSessions.map(session => {
        const item = session.NowPlayingItem;
        const progress = session.PlayState?.PositionTicks ? (session.PlayState.PositionTicks / item.RunTimeTicks * 100).toFixed(1) : 0;
        const transcode = session.TranscodingInfo ? 'TRANSCODING' : 'DIRECT';
        
        return `
          <div class="pixel-border session-card">
            <div class="session-user">${session.UserName} @ ${session.DeviceName}</div>
            <div class="session-media">
              <div class="media-title">${item.Name}</div>
              <div class="media-meta">${item.SeriesName ? item.SeriesName + ' - ' : ''}${transcode}</div>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="session-footer">
              ${session.PlayState?.IsPaused ? 'PAUSED' : 'PLAYING'} | ${progress}%
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
