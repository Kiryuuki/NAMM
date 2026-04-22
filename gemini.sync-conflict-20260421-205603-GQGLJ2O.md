---
title: "ARR Cockpit"
status: active
started: 2026-04-20
stack: [HTML, CSS, VanillaJS, Vite, PWA, Docker, docker-compose]
client: internal
priority: medium
skill_ref: https://mcpmarket.com/tools/skills/retro-pixel-ui-design
---

# ARR Cockpit — Agent Build Instructions

> You are Gemini, a coding agent. This file is your spec. Read every section before writing a single line of code.
> App name: **ARR Cockpit** — tagline: *"Your media stack, jacked in."*

---

## 0. Pre-flight: load the design skill

Before writing any CSS or HTML, fetch and internalize the retro pixel UI design skill at:
`https://mcpmarket.com/tools/skills/retro-pixel-ui-design`

Apply its cyberpunk/retro-pixel aesthetic rules to every UI decision in this project.
Core visual language:
- Dark background (`#0a0a0f` or similar near-black)
- Neon accent palette: cyan (`#00f5ff`), magenta (`#ff00aa`), amber (`#ffaa00`)
- Pixel/monospace fonts: `Press Start 2P` (Google Fonts) for headings, `Share Tech Mono` for data/code
- Scanline overlay (CSS pseudo-element, low opacity)
- Pixel-border cards: stepped box-shadow, NO border-radius anywhere
- Glitch text animation on hover
- CRT flicker on load (subtle CSS keyframe)

---

## 1. Project overview

**ARR Cockpit** is a self-hosted, single-page PWA dashboard that aggregates Jellyfin, Radarr, Sonarr, and Prowlarr into one cyberpunk-themed command center.

- Single HTML/CSS/JS app built with Vite
- All API keys in `.env` — never hardcoded
- Browser fetches directly to each service (CORS must be enabled on each service)
- Dockerized via `docker compose` — nginx serves the built `/dist`
- Installable as PWA (manifest + service worker)
- No backend, no database — pure frontend

---

## 2. Tech stack

| Layer | Tool |
|-------|------|
| Build | Vite 5 |
| Language | Vanilla JS (ES modules) — no frameworks |
| Styling | Plain CSS with custom properties — no Tailwind |
| PWA | vite-plugin-pwa (Workbox) |
| Container | nginx:alpine serving `/dist` |
| Orchestration | docker compose v2 |
| Config | `.env` → injected at build via `import.meta.env` |

---

## 3. Folder structure

```
arr-cockpit/
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── favicon.ico
├── src/
│   ├── main.js
│   ├── style.css
│   ├── api/
│   │   ├── jellyfin.js
│   │   ├── radarr.js
│   │   ├── sonarr.js
│   │   └── prowlarr.js
│   ├── components/
│   │   ├── ServiceCard.js
│   │   ├── QueuePanel.js
│   │   ├── CalendarPanel.js
│   │   ├── SessionsPanel.js
│   │   └── Navbar.js
│   └── utils/
│       ├── format.js
│       └── storage.js
├── .env.example
├── .env                  ← GITIGNORE THIS
├── .gitignore
├── vite.config.js
├── docker-compose.yml
├── nginx.conf
├── Dockerfile
├── package.json
└── index.html
```

---

## 4. Environment variables

`.env.example` — commit this, never `.env`:

```env
# Jellyfin
VITE_JELLYFIN_URL=http://192.168.100.X:8096
VITE_JELLYFIN_KEY=your_api_key_here
VITE_JELLYFIN_USER_ID=your_user_id_here

# Radarr
VITE_RADARR_URL=http://192.168.100.X:7878
VITE_RADARR_KEY=your_api_key_here

# Sonarr
VITE_SONARR_URL=http://192.168.100.X:8989
VITE_SONARR_KEY=your_api_key_here

# Prowlarr
VITE_PROWLARR_URL=http://192.168.100.X:9696
VITE_PROWLARR_KEY=your_api_key_here
```

Access in JS via `import.meta.env.VITE_RADARR_URL` etc.

---

## 5. API clients

Each `src/api/*.js` must:
- Export named async functions only (no classes)
- Wrap every fetch in try/catch — return `{ error: true, message }` on failure, never throw
- Auth headers per service:
  - Arr apps: `{ 'X-Api-Key': key }`
  - Jellyfin: `{ 'Authorization': 'MediaBrowser Token="' + key + '"' }`

### jellyfin.js
```js
getSystemInfo()       // GET /System/Info
getSessions()         // GET /Sessions
getLibraries()        // GET /Library/MediaFolders
getItems(query)       // GET /Items?searchTerm=query&Limit=20
refreshLibraries()    // POST /Library/Refresh
```

### radarr.js
```js
getSystemStatus()     // GET /api/v3/system/status
getMovies()           // GET /api/v3/movie
getQueue()            // GET /api/v3/queue?pageSize=50
getQueueStatus()      // GET /api/v3/queue/status
getMissing()          // GET /api/v3/wanted/missing?pageSize=10
getDiskspace()        // GET /api/v3/diskspace
```

### sonarr.js
```js
getSystemStatus()     // GET /api/v3/system/status
getSeries()           // GET /api/v3/series
getQueue()            // GET /api/v3/queue?pageSize=50
getMissing()          // GET /api/v3/wanted/missing?pageSize=10
getCalendar(s, e)     // GET /api/v3/calendar?start=ISO&end=ISO
getDiskspace()        // GET /api/v3/diskspace
```

### prowlarr.js
```js
getSystemStatus()     // GET /api/v1/system/status
getIndexers()         // GET /api/v1/indexer
getIndexerStats()     // GET /api/v1/indexerstats
getHistory()          // GET /api/v1/history?pageSize=20
```

---

## 6. UI layout

### Navbar
- `ARR COCKPIT` in Press Start 2P, neon cyan
- Four health dots (Jellyfin | Radarr | Sonarr | Prowlarr) — green/red/amber + pulse on loading
- `LAST SYNC` timestamp top-right in Share Tech Mono

### Summary cards (top row, one per service)
- Pixel-border style (stepped box-shadow, no border-radius)
- Service name with glitch animation on hover
- Key metric + secondary metric (counts)
- Service icon via CSS pixel art or inline SVG

### Tab panels
Four tabs: `> QUEUE_` | `> CALENDAR_` | `> SESSIONS_` | `> INDEXERS_`

**QUEUE** — merged Radarr + Sonarr queue
- Columns: Title | Service | Status | Progress | Size
- Status badges: DOWNLOADING / QUEUED / COMPLETED / FAILED
- Auto-refresh every 30s

**CALENDAR** — Sonarr upcoming 14 days
- Grouped by date, highlight today in amber
- Show: series name, SxxExx, air date

**SESSIONS** — Jellyfin active streams
- Who's watching, what, transcode vs direct play
- Progress bar per session
- Pixel art TV empty state

**INDEXERS** — Prowlarr health
- Columns: Name | Protocol | Enabled | 24h grabs | Status
- Red row for disabled/errored

### Footer
- `[ ARR COCKPIT v1.0.0 ]` | `[ BUILD: YYYY-MM-DD ]` | `[ STATUS: OPERATIONAL ]`
- Status derived from service health aggregate

---

## 7. Cyberpunk visual spec

### CSS custom properties (in `:root`)
```css
--bg-deep: #0a0a0f;
--bg-panel: #0f0f1a;
--bg-card: #13131f;
--accent-cyan: #00f5ff;
--accent-magenta: #ff00aa;
--accent-amber: #ffaa00;
--accent-green: #00ff88;
--accent-red: #ff3355;
--text-primary: #e0e0ff;
--text-secondary: #7070aa;
--font-pixel: 'Press Start 2P', monospace;
--font-mono: 'Share Tech Mono', monospace;
```

### Pixel-border card
```css
.card {
  background: var(--bg-card);
  border: 2px solid var(--accent-cyan);
  box-shadow:
    4px 0 0 0 var(--accent-cyan),
    0 4px 0 0 var(--accent-cyan),
    4px 4px 0 0 var(--accent-cyan);
  padding: 16px;
  /* NO border-radius */
}
```

### Scanline overlay
```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 245, 255, 0.03) 2px,
    rgba(0, 245, 255, 0.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### Glitch animation
```css
@keyframes glitch {
  0%, 100% { text-shadow: none; transform: none; }
  20% { text-shadow: -2px 0 var(--accent-magenta); transform: translateX(2px); }
  40% { text-shadow: 2px 0 var(--accent-cyan); transform: translateX(-2px); }
  60% { text-shadow: -1px 0 var(--accent-amber); transform: skewX(5deg); }
}
.glitch:hover { animation: glitch 0.4s steps(1) infinite; }
```

### Progress bars
No border-radius. 4px height. Neon fill color. Stepped look.

---

## 8. PWA manifest (`public/manifest.json`)

```json
{
  "name": "ARR Cockpit",
  "short_name": "COCKPIT",
  "description": "Your media stack, jacked in.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#00f5ff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Icons: pixel art style — dark bg, cyan signal/grid motif. Generate via canvas or SVG-to-PNG.

---

## 9. Vite config

```js
// vite.config.js
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: []
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

---

## 10. Docker setup

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }
}
```

### docker-compose.yml
```yaml
services:
  arr-cockpit:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arr-cockpit
    ports:
      - "3500:80"
    restart: unless-stopped
    env_file:
      - .env

networks:
  default:
    name: arr-cockpit-net
```

Deploy via **Dokploy UI** — do NOT run `docker compose` manually from Dokploy directories.
Expose on port `3500`. Suggest Cloudflare tunnel → `cockpit.kiryuuki.space`.

---

## 11. Build phases

### Phase 1 — Scaffold
- [ ] `npm create vite@latest arr-cockpit -- --template vanilla`
- [ ] Install: `npm install vite-plugin-pwa`
- [ ] Create folder structure (Section 3)
- [ ] `.env.example`, `.gitignore`, `vite.config.js`
- [ ] Verify `npm run dev` works

### Phase 2 — API clients
- [ ] Implement all 4 clients in `src/api/*.js`
- [ ] Test each against real endpoints (hardcoded URL in test script, not in app)
- [ ] Confirm error shape `{ error: true, message }` on failure

### Phase 3 — UI shell
- [ ] `index.html` — root, load Google Fonts, link CSS
- [ ] `style.css` — all CSS vars, reset, scanline, fonts
- [ ] `Navbar.js` — health dots + last sync
- [ ] Four summary cards (static structure)
- [ ] Tab switcher (plain JS, no router)

### Phase 4 — Data binding
- [ ] Wire API clients to cards (real live data)
- [ ] 30s auto-refresh via `setInterval`
- [ ] Loading skeleton (pixel pulse animation)
- [ ] Per-card error state (red border + message)

### Phase 5 — Tab panels
- [ ] QUEUE — merged list, progress bars
- [ ] CALENDAR — grouped by date, amber today row
- [ ] SESSIONS — active streams + empty state
- [ ] INDEXERS — health table, red errored rows

### Phase 6 — PWA + polish
- [ ] `public/manifest.json`
- [ ] Generate pixel art icons (192 + 512)
- [ ] Verify service worker install + offline shell
- [ ] Glitch, scanline, CRT effects
- [ ] Mobile responsive: cards stack 1-col at <768px
- [ ] Footer operational status

### Phase 7 — Docker + deploy
- [ ] `Dockerfile`, `nginx.conf`, `docker-compose.yml`
- [ ] Build test: `docker compose build && docker compose up -d`
- [ ] Verify at `http://localhost:3500`
- [ ] Deploy via Dokploy

---

## 12. Agent rules

1. Fetch and read the skill at `https://mcpmarket.com/tools/skills/retro-pixel-ui-design` before any code.
2. Write real working code — no placeholder TODOs in final output.
3. API keys via `import.meta.env.VITE_*` only — never hardcoded.
4. Vanilla JS only — no React, Vue, or any framework.
5. Zero `border-radius` on cards, buttons, progress bars — pixel aesthetic is hard-edged.
6. Every fetch in try/catch — dashboard must never fully crash from one failed service.
7. Build in phase order — verify in browser after each phase before moving on.
8. CORS note: if browser fetch is blocked, add README instructions for enabling CORS in each app's Settings > General. Do NOT add a proxy backend.
9. On completion: write `DONE.md` in this folder with notes and flag for portfolio entry.

---

## 13. Open questions for Aldrin (answer before starting)

- [x] Preferred subdomain? (`cockpit.kiryuuki.space`?)
- [x] CORS enabled on Radarr/Sonarr/Jellyfin/Prowlarr? (Settings > General)
- [x] Tailscale or LAN IPs for each service? (needed for `.env`)
- [x] Add search/add movie/show from dashboard? (Phase 2 extension)

---

## Progress Log

### 2026-04-20
- Folder + spec created by Minis (claude.ai)
- Ready for Gemini agent

## Links

[[claude/MOC — Master Index]]
[[Projects/Projects Index]]
