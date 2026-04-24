---
title: "ARR Cockpit"
status: active
started: 2026-04-20
stack: [HTML, CSS, VanillaJS, Vite, PWA, Docker, docker-compose]
client: internal
priority: medium
design_ref: DESIGN.md (in project root)
skill_ref: https://mcpmarket.com/tools/skills/retro-pixel-ui-design
---

# NAMM — Agent Build Instructions

> You are Gemini, a coding agent. This file is your full spec.
> Read every section before writing any code.
> App name: **NAMM** — tagline: *"Your media stack, jacked in."*

---

## 0. Pre-flight checklist (do these before any code)

1. Read `DESIGN.md` in the project root — it is the single source of truth for every visual decision.
2. Fetch and read the pixel UI skill: `https://mcpmarket.com/tools/skills/retro-pixel-ui-design`
3. Copy `.env.example` → `.env`, fill in real service URLs and API keys before first `npm run dev`.
4. Only then: scaffold, build, verify.

---

## 1. Project overview

**NAMM** is an enterprise-grade, self-hosted PWA dashboard for managing a full media stack (Jellyfin + Radarr + Sonarr + Prowlarr) from a single Cyberpunk 2077–themed interface.

### Core features
| Feature | Description |
|---------|-------------|
| **Universal search** | Single search bar — backend logic classifies query as movie or TV show by genre/metadata, routes to Radarr or Sonarr automatically |
| **Download panel** | Live download queue (right sidebar), merged from Radarr + Sonarr |
| **Stats panel** | Radarr / Sonarr / Jellyfin key metrics — right sidebar below queue |
| **Release calendar** | Grid calendar view showing upcoming movie/TV releases from the watchlist |
| **Service health** | Navbar health indicators per service |
| **PWA** | Installable, offline shell via service worker |

### What it is NOT
- No backend server — pure frontend, all API calls from browser
- No database — state in memory + localStorage for UI prefs
- No framework — vanilla JS ES modules only

---

## 2. Tech stack

| Layer | Tool |
|-------|------|
| Build | Vite 5 |
| Language | Vanilla JS (ES modules) — no React, Vue, Svelte |
| Styling | Plain CSS + CSS custom properties from `DESIGN.md` |
| PWA | vite-plugin-pwa (Workbox) |
| Container | nginx:alpine serving `/dist` |
| Orchestration | docker compose v2 |
| Orchestration | docker compose v2 |
| Config | Runtime Injection via `config.js` + `entrypoint.sh` |

---

## 3. Folder structure

```
arr-cockpit/
├── DESIGN.md                   ← Cyberpunk 2077 design system — READ FIRST
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-192.png        ← pixel art, dark bg, cyan motif
│   │   └── icon-512.png
│   └── favicon.ico
├── src/
│   ├── main.js                 ← app bootstrap, layout init
│   ├── style.css               ← global styles from DESIGN.md tokens
│   ├── api/
│   │   ├── jellyfin.js
│   │   ├── radarr.js
│   │   ├── sonarr.js
│   │   ├── prowlarr.js
│   │   └── classifier.js       ← genre/type classifier logic
│   ├── components/
│   │   ├── Navbar.js           ← top bar, search, health dots
│   │   ├── SearchBar.js        ← universal search with results dropdown
│   │   ├── MainPanel.js        ← calendar view (center, primary content)
│   │   ├── DownloadQueue.js    ← right sidebar — active downloads
│   │   ├── StatsPanel.js       ← right sidebar — service stats
│   │   └── CalendarGrid.js     ← release calendar grid component
│   └── utils/
│       ├── format.js           ← bytes, duration, date helpers
│       ├── storage.js          ← localStorage helpers for UI state
│       └── debounce.js         ← debounce for search input
├── .env.example
├── .env                        ← NEVER COMMIT — in .gitignore
├── .gitignore
├── DESIGN.md                   ← Cyberpunk 2077 design system
├── vite.config.js
├── docker-compose.yml
├── nginx.conf
├── Dockerfile
├── package.json
└── index.html
```

---

## 4. Environment variables

`.env.example`:
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

# Search classification (TMDB for metadata lookup)
VITE_TMDB_KEY=your_tmdb_api_key_here
```

Access via `import.meta.env.VITE_*` only. Never hardcode.

---

## 5. Layout architecture

### 5.1 Overall grid

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR: [ARR COCKPIT]  [SEARCH BAR]  [health dots]     │
├──────────────────────────────────┬──────────────────────┤
│                                  │  DOWNLOAD QUEUE      │
│                                  │  ─────────────────   │
│   MAIN PANEL                     │  [item] [progress]   │
│   (Release Calendar)             │  [item] [progress]   │
│                                  │  [item] [progress]   │
│   ┌──────────────────────────┐   ├──────────────────────┤
│   │  Calendar grid —         │   │  SERVICE STATS       │
│   │  movies + shows          │   │  ─────────────────   │
│   │  on watchlist            │   │  Radarr: 347 movies  │
│   └──────────────────────────┘   │  Sonarr: 89 series   │
│                                  │  Jellyfin: 2 streams │
│                                  │  Disk: 688GB / 1TB   │
└──────────────────────────────────┴──────────────────────┘
```

- Left/center: `flex: 1` — main content area
- Right sidebar: `320px` fixed width, scrollable
- Right sidebar splits vertically: queue (top, ~60%) + stats (bottom, ~40%)
- On mobile (<768px): sidebar collapses below main panel, stacks vertically

### 5.2 Navbar

- Left: `[ ARR COCKPIT ]` — Press Start 2P, neon yellow (#FCE300 — CP2077 primary)
- Center: Universal search bar — full-width input, prominent, glowing border on focus
- Right: health dots per service + `LAST SYNC` timestamp

### 5.3 Search bar (universal)

- Prominent, centered in navbar — it is the primary interaction
- Placeholder: `> JACK IN... search movies & shows_`
- On type (debounced 400ms): query TMDB `/search/multi` to get results
- Results dropdown (below bar): show poster thumbnail, title, year, type badge (MOVIE / TV)
- User clicks result → classifier runs → routes to Radarr (`POST /api/v3/movie`) or Sonarr (`POST /api/v3/series`) automatically
- Show confirmation toast: `[ QUEUED: Dune Part Two → RADARR ]`
- Search input uses Share Tech Mono font

### 5.4 Main panel — Release Calendar

- Grid calendar (month view, togglable to week view)
- Each day cell shows items from watchlist releasing that day
- Data sources:
  - Sonarr: `GET /api/v3/calendar?start=ISO&end=ISO`
  - Radarr: `GET /api/v3/calendar?start=ISO&end=ISO`
- Day cells with releases: highlighted, item thumbnail + title on hover tooltip
- Today: amber outline + `TODAY` badge
- Item type color coding: cyan = TV, yellow = Movie
- Navigation: prev/next month arrows, `TODAY` button

### 5.5 Download queue (right sidebar, top)

- Section header: `[ DOWNLOAD QUEUE ]` in pixel font
- Live merged queue from Radarr + Sonarr
- Auto-refresh every 30s
- Each row:
  - Title (truncated, tooltip on hover)
  - Source badge: `R` (Radarr, yellow) or `S` (Sonarr, cyan)
  - Status badge: `DOWNLOADING` / `QUEUED` / `PAUSED` / `FAILED`
  - Progress bar (pixel-stepped, neon fill)
  - Size (formatted: `4.2 GB`)
- Empty state: pixel art satellite dish, `> NO ACTIVE DOWNLOADS_`
- Max visible: 8 items, scrollable

### 5.6 Stats panel (right sidebar, bottom)

- Section header: `[ SYSTEM STATUS ]`
- Grid of metric tiles:

| Metric | Source |
|--------|--------|
| Total movies | Radarr `/api/v3/movie` count |
| Total series | Sonarr `/api/v3/series` count |
| Missing movies | Radarr `/api/v3/wanted/missing` totalRecords |
| Missing episodes | Sonarr `/api/v3/wanted/missing` totalRecords |
| Active streams | Jellyfin `/Sessions` count with NowPlayingItem |
| Disk used / total | Radarr `/api/v3/diskspace` (or Sonarr) |
| Indexers online | Prowlarr `/api/v1/indexer` enabled count |

- Each tile: label on top (muted), value below (large, neon)
- Disk: progress bar showing % used

---

## 6. API clients

### Rules for all clients
- Named async functions only — no classes
- Every fetch in `try/catch` — return `{ error: true, message }` on failure, never throw
- Auth headers:
  - Arr apps: `X-Api-Key: KEY`
  - Jellyfin: `Authorization: MediaBrowser Token="KEY"`
  - TMDB: `?api_key=KEY` query param

### classifier.js — smart search routing

```js
// Logic: query TMDB /search/multi, get top result
// Check result.media_type: 'movie' → Radarr, 'tv' → Sonarr
// Also check genres: animation + primetime → Sonarr, animation + runtime <60 → could be movie
// Fallback: if ambiguous, show user a modal to confirm MOVIE or TV before adding

async function classifyAndAdd(tmdbResult) {
  if (tmdbResult.media_type === 'movie') {
    return await radarr.addMovie(tmdbResult)
  } else if (tmdbResult.media_type === 'tv') {
    return await sonarr.addSeries(tmdbResult)
  } else {
    return { ambiguous: true, result: tmdbResult }
  }
}
```

When ambiguous: show a small modal with MOVIE / TV SHOW buttons, user confirms, then add.

### jellyfin.js exports
```js
getSystemInfo()        // GET /System/Info
getSessions()          // GET /Sessions
getLibraries()         // GET /Library/MediaFolders
searchItems(query)     // GET /Items?searchTerm=query&Limit=10
refreshLibraries()     // POST /Library/Refresh
```

### radarr.js exports
```js
getSystemStatus()      // GET /api/v3/system/status
getMovies()            // GET /api/v3/movie
getQueue()             // GET /api/v3/queue?pageSize=50
getQueueStatus()       // GET /api/v3/queue/status
getMissing()           // GET /api/v3/wanted/missing?pageSize=1 (need totalRecords)
getDiskspace()         // GET /api/v3/diskspace
getCalendar(s, e)      // GET /api/v3/calendar?start=s&end=e
addMovie(tmdbResult)   // POST /api/v3/movie — map TMDB result to Radarr payload
```

### sonarr.js exports
```js
getSystemStatus()      // GET /api/v3/system/status
getSeries()            // GET /api/v3/series
getQueue()             // GET /api/v3/queue?pageSize=50
getMissing()           // GET /api/v3/wanted/missing?pageSize=1
getDiskspace()         // GET /api/v3/diskspace
getCalendar(s, e)      // GET /api/v3/calendar?start=s&end=e
addSeries(tmdbResult)  // POST /api/v3/series — map TMDB result to Sonarr payload
```

### prowlarr.js exports
```js
getSystemStatus()      // GET /api/v1/system/status
getIndexers()          // GET /api/v1/indexer
getIndexerStats()      // GET /api/v1/indexerstats
```

### Adding to Radarr (POST payload)
```js
// Minimum required payload for Radarr addMovie
{
  tmdbId: result.id,
  title: result.title,
  year: new Date(result.release_date).getFullYear(),
  qualityProfileId: 1,          // get from GET /api/v3/qualityprofile, use first
  rootFolderPath: '/movies',    // get from GET /api/v3/rootfolder, use first
  monitored: true,
  addOptions: { searchForMovie: true }
}
```

### Adding to Sonarr (POST payload)
```js
{
  tvdbId: result.external_ids?.tvdb_id,  // may need TMDB /tv/{id}/external_ids
  title: result.name,
  qualityProfileId: 1,
  rootFolderPath: '/tv',
  monitored: true,
  addOptions: { searchForMissingEpisodes: true }
}
```

---

## 7. DESIGN.md (write this file to project root)

Gemini must create `DESIGN.md` in the project root with exactly this content:

```markdown
# DESIGN.md — ARR Cockpit
# Cyberpunk 2077 Pixel Theme Design System

## 1. Visual Theme & Atmosphere

**Mood:** Night City data terminal. High-contrast, high-density, neon-on-black.
Inspired by Cyberpunk 2077's UI: yellow primary accent, cyan secondary, magenta alerts,
monochrome dark surfaces. Pixel-grid aesthetic — every element feels like it was rendered
on a CRT screen in 2077.

**Density:** High. Enterprise dashboard — pack information. No wasted space.
**Philosophy:** Information first. Style serves function. Every glow has a reason.

## 2. Color Palette

| Name | Hex | Role |
|------|-----|------|
| CP Yellow | #FCE300 | Primary accent — brand, CTAs, active states |
| CP Cyan | #00F0FF | Secondary accent — TV shows, links, progress |
| CP Magenta | #FF2D78 | Danger, alerts, FAILED states |
| CP Red | #FF003C | Errors, critical |
| Deep Black | #0A0A0C | Page background |
| Panel Dark | #0F0F14 | Panel / sidebar background |
| Card Surface | #141420 | Card / tile background |
| Surface Hover | #1C1C2E | Hover state surface |
| Border Default | #2A2A3D | Default border |
| Border Active | #FCE300 | Active / focused border |
| Text Primary | #E8E8FF | Primary text |
| Text Secondary | #6B6B99 | Secondary / muted text |
| Text Dim | #3D3D5C | Placeholder, timestamps |

## 3. Typography

| Role | Font | Size | Weight | Case |
|------|------|------|--------|------|
| Brand / headings | Press Start 2P | 14–18px | 400 | UPPER |
| Section labels | Press Start 2P | 10–12px | 400 | UPPER |
| Body / data | Share Tech Mono | 13–15px | 400 | mixed |
| Metrics / values | Share Tech Mono | 20–28px | 400 | — |
| Timestamps | Share Tech Mono | 11px | 400 | — |
| Badges | Share Tech Mono | 10px | 400 | UPPER |

Load both from Google Fonts:
`https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap`

## 4. Component Styles

### Cards / Panels
- Background: `#141420`
- Border: `2px solid #2A2A3D`
- NO border-radius anywhere in the app — hard pixel edges only
- Active/hover border: `2px solid #FCE300`
- Pixel shadow (active state only):
  `box-shadow: 4px 4px 0 0 #FCE300`

### Buttons
- Background: transparent
- Border: `2px solid #FCE300`
- Text: `#FCE300`, Press Start 2P, 10px
- Hover: background `#FCE300`, text `#0A0A0C`
- Active: `transform: translate(2px, 2px)`
- NO border-radius

### Search bar
- Background: `#0F0F14`
- Border: `2px solid #2A2A3D`
- Focus border: `2px solid #FCE300`
- Focus glow: `box-shadow: 0 0 12px rgba(252, 227, 0, 0.3)`
- Text: `#E8E8FF`, Share Tech Mono, 14px
- Caret: `#FCE300`

### Progress bars
- Track: `#1C1C2E`, height 4px, NO border-radius
- Fill — downloading: `#FCE300`
- Fill — completed: `#00F0FF`
- Fill — failed: `#FF2D78`
- Pixel-stepped: use 1px gaps every 8px (CSS background-image trick)

### Status badges
- DOWNLOADING: bg `rgba(252,227,0,0.15)`, border `#FCE300`, text `#FCE300`
- QUEUED: bg `rgba(0,240,255,0.1)`, border `#00F0FF`, text `#00F0FF`
- COMPLETED: bg `rgba(0,240,255,0.08)`, border `#2A2A3D`, text `#6B6B99`
- FAILED: bg `rgba(255,45,120,0.15)`, border `#FF2D78`, text `#FF2D78`
- PAUSED: bg `rgba(107,107,153,0.15)`, border `#6B6B99`, text `#6B6B99`

### Health dots
- Online: `#00F0FF` with `box-shadow: 0 0 6px #00F0FF`
- Offline: `#FF2D78`
- Loading: `#FCE300`, pulsing opacity animation

### Calendar cells
- Default: `#141420`, border `#2A2A3D`
- Has content: border `#FCE300`, slight top accent `border-top: 2px solid #FCE300`
- Today: border `#FCE300`, bg `rgba(252,227,0,0.05)`, `TODAY` badge top-right
- TV item dot: `#00F0FF`
- Movie item dot: `#FCE300`

### Metric tiles (stats panel)
- bg: `#0F0F14`
- border: `1px solid #2A2A3D`
- Label: 11px, `#6B6B99`, Share Tech Mono, uppercase
- Value: 22px, `#FCE300`, Share Tech Mono
- NO border-radius

### Toast notifications
- Position: bottom-right, stacked
- bg: `#141420`, border-left: `4px solid #FCE300`
- Success border: `#00F0FF`
- Error border: `#FF2D78`
- Auto-dismiss: 4s
- Text: Share Tech Mono, 12px

## 5. Layout Principles

- Spacing scale: 4px, 8px, 12px, 16px, 24px, 32px
- Grid: CSS Grid for overall layout, Flexbox for component internals
- Main layout: `grid-template-columns: 1fr 320px`
- Right sidebar: `grid-template-rows: 60fr 40fr` (queue / stats)
- Navbar height: 56px
- All padding inside panels: 16px
- Section labels always 16px above their content

## 6. Depth & Elevation

No drop shadows for decoration. Elevation via:
- Color step (darker = lower surface)
- Border visibility (active items get bright border)
- Pixel offset shadow on interactive hover: `4px 4px 0 0 #FCE300`

## 7. Motion & Effects

### Scanline overlay
```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(252, 227, 0, 0.015) 3px,
    rgba(252, 227, 0, 0.015) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### Glitch animation (hover on brand elements)
```css
@keyframes glitch {
  0%, 100% { clip-path: none; transform: none; }
  20% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translateX(-3px); }
  40% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translateX(3px); }
  60% { clip-path: polygon(0 10%, 100% 10%, 100% 30%, 0 30%); transform: skewX(2deg); }
}
```

### Health dot pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px currentColor; }
  50% { opacity: 0.4; box-shadow: none; }
}
```

### CRT flicker (on load, once)
```css
@keyframes crt-boot {
  0% { opacity: 0; }
  10% { opacity: 0.8; }
  12% { opacity: 0.2; }
  14% { opacity: 0.9; }
  100% { opacity: 1; }
}
body { animation: crt-boot 0.4s ease-out forwards; }
```

### Loading skeleton
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #141420 0px, #1C1C2E 80px, #141420 160px);
  background-size: 400px;
  animation: shimmer 1.4s infinite linear;
}
```

## 8. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥1024px | Full 2-column layout (main + sidebar) |
| 768–1023px | Sidebar collapses to bottom, full-width tabs |
| <768px | Stack vertically, hamburger menu for stats |

Touch targets: minimum 44×44px.

## 9. Do's and Don'ts

**Do:**
- Use pixel-hard edges everywhere — no border-radius
- Use `#FCE300` as the primary call-to-action color
- Use Press Start 2P for labels and headings only (readability)
- Use Share Tech Mono for all data, values, body text
- Make the search bar the most prominent element in the navbar

**Don't:**
- No gradients on backgrounds (scanline is the only texture)
- No border-radius on any interactive element
- No blue — it doesn't exist in the CP2077 palette
- Don't use more than 3 accent colors in a single view
- No shadows for decoration — only pixel-offset on interaction
```

---

## 8. PWA manifest (`public/manifest.json`)

```json
{
  "name": "ARR Cockpit",
  "short_name": "COCKPIT",
  "description": "Your media stack, jacked in.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0C",
  "theme_color": "#FCE300",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Icons: pixel art on `#0A0A0C` background — a stylized signal grid or cockpit cross-hair in `#FCE300`. Generate via canvas in a build script.

---

## 9. Vite config

```js
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: []
      }
    })
  ],
  build: { outDir: 'dist', sourcemap: false }
})
```

---

## 12. Docker setup

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

  location / { try_files $uri $uri/ /index.html; }

  location ~* \.(js|css|png|ico|svg|woff2)$ {
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

**Deploy via Dokploy UI only.** Never run `docker compose` manually from Dokploy directories.
Port: `3500`. Cloudflare tunnel → `cockpit.kiryuuki.space` (confirm with Aldrin).

---

## 11. Build phases

### Phase 1 — Scaffold & design system
- [x] `npm create vite@latest arr-cockpit -- --template vanilla`
- [x] Install: `vite-plugin-pwa`
- [x] Create all folders per Section 3
- [x] Write `DESIGN.md` to project root (content from Section 7)
- [x] Write `src/style.css` — all CSS variables from DESIGN.md, global reset, scanline, CRT boot, fonts
- [x] Verify `npm run dev` runs clean

### Phase 2 — API clients
- [x] `src/api/jellyfin.js` — all exports
- [x] `src/api/radarr.js` — all exports including `addMovie()`
- [x] `src/api/sonarr.js` — all exports including `addSeries()`
- [x] `src/api/prowlarr.js` — all exports
- [x] `src/api/classifier.js` — TMDB search + classify + route logic
- [x] Test each client in browser console against real services
- [x] Confirm `{ error: true }` shape on failure

### Phase 3 — Layout shell
- [x] `index.html` — semantic structure, navbar + main grid + sidebar
- [x] `Navbar.js` — brand, search bar placeholder, health dots (static)
- [x] Layout grid CSS (2-col: main + 320px sidebar)
- [x] Sidebar split (queue top, stats bottom)
- [x] Verify grid renders correctly, no content yet

### Phase 4 — Search bar (priority feature)
- [x] `SearchBar.js` — input with debounce, TMDB query on type
- [x] Results dropdown — poster, title, year, type badge
- [x] `classifier.js` wired up — click result → classify → route to Radarr/Sonarr
- [x] Ambiguity modal (MOVIE vs TV confirm)
- [x] Toast notification on success/error
- [x] Keyboard nav: arrow keys in dropdown, Enter to select, Esc to close

### Phase 5 — Right sidebar (queue + stats)
- [x] `DownloadQueue.js` — merged Radarr+Sonarr queue, progress bars, status badges
- [x] 30s auto-refresh for queue
- [x] `StatsPanel.js` — all metric tiles wired to real API data
- [x] Disk usage bar
- [x] Loading skeletons for both sections

### Phase 6 — Discovery Panel (main panel)
- [x] `DiscoveryPanel.js` — feed of upcoming and trending items
- [x] Upcoming Releases Section: posters + dates from Radarr/Sonarr
- [x] Trending Movies Section: TMDB trending + quick-add buttons
- [x] Trending TV Shows Section: TMDB trending + quick-add buttons
- [x] Hover tooltips with ratings and descriptions

### Phase 7 — Health dots + navbar wiring
- [x] Poll all 4 `/system/status` endpoints on load + every 60s
- [x] Health dot states: green/red/amber + pulse animation
- [x] `LAST SYNC` timestamp updates

### Phase 8 — PWA + polish
- [x] `public/manifest.json`
- [x] Generate pixel art icons via canvas script
- [x] Verify service worker install in Chrome DevTools
- [x] Decrypted Text effect on section headers and brand
- [x] Glitch animation on brand text hover
- [x] All animations from DESIGN.md Section 7
- [x] Mobile responsive (breakpoints from DESIGN.md Section 8)
- [x] Full keyboard accessibility (focus rings: `0 0 0 2px #FCE300`)

### Phase 9 — Library Management
- [x] `LibraryPanel.js` — grid view of monitored media
- [x] Filter tabs: MOVIES (Radarr), TV SHOWS (Sonarr), LIBRARIES (Jellyfin)
- [x] Status badges: Monitored, Downloaded, Missing, Queued
- [x] Poster grid with status overlays/badges
- [x] Quick actions: Search for item, Toggle Monitor, Delete


### Phase 10 — Aesthetics Upgrade (ReactBits effects)
- [x] `src/utils/effects.js` — vanilla JS ports: DecryptedText, ShinyText, BorderBeam, PixelTrail, Aurora, GlitchHover, CounterAnimation
- [x] `src/style-upgrade.css` — layout/typography improvements (navbar 64px, sidebar 340px, stat values 26px, section labels 11px, poster grid 200px min)
- [x] `src/style-additions.css` — type-badge, upcoming-date-overlay, status-text colors, carousel-dots, section-header with yellow pip
- [x] `DiscoveryPanel.js` upgraded — shiny section headers, rank badges (#1/#2/#3 top-3 gold), carousel dot indicators, date overlay on upcoming cards
- [x] `DownloadQueue.js` upgraded — section-header style, source/left/size in queue meta, status color classes
- [x] `StatsPanel.js` upgraded — section-header, count-up animation on all stat values, border-beam on tiles, disk bar turns red >85%
- [x] `main.js` wired — initPixelTrail, initAurora, initGlitchHover('.brand'), refreshEffects on tab switch
- [x] `index.html` updated — imports style-upgrade.css + style-additions.css
- [x] Verified in browser: real data, effects rendering, no console errors
### Phase 11 — UX Refinements + Jellyfin Library View

#### 11.1 Move nav tabs into sidebar (remove from navbar)
- Remove DISCOVERY / LIBRARY tab buttons from navbar entirely
- Navbar becomes: `[ ARR COCKPIT ]` brand (left) + health dots + LAST SYNC (right) only
- Add vertical nav tabs at TOP of sidebar, above download queue:
  ```
  sidebar layout (top → bottom):
  [ NAV TABS        ]  ← new
  [ DOWNLOAD QUEUE  ]
  [ SYSTEM STATUS   ]
  ```
- Nav tab styles: full-width, flat buttons, Share Tech Mono 11px uppercase
  - Default: bg transparent, border-bottom 1px solid var(--border-default), color var(--text-secondary)
  - Active: border-left 3px solid var(--cp-yellow), color var(--cp-yellow), bg rgba(252,227,0,0.06)
  - Three tabs: `[ ▣ DISCOVERY ]` `[ ▣ LIBRARY ]` `[ ▣ JELLYFIN ]`
- SYSTEM STATUS: compress to 3-col grid (MOVIES / SERIES / MISSING M / MISSING S / DISK spanning full width)
  Drop STREAMS and INDEXERS tiles to save vertical space

#### 11.2 Search bar: Discovery tab only
- Move `#search-bar-container` OUT of navbar, INTO top of `#main-panel` (Discovery view only)
- Search bar renders as first child of `.discovery-feed`, full-width, prominent
- Placeholder stays: `> JACK IN... search movies & shows_`
- On Library / Jellyfin tabs: no search bar rendered at all

#### 11.3 Upcoming releases: images-only filter
- In `renderUpcoming()`, filter out items where `poster` is empty string or falsy BEFORE rendering
- `const items = [...].filter(item => item.images?.find(i => i.coverType === 'poster')?.remoteUrl)`
- This prevents blank dark cards with only a date label

#### 11.4 Jellyfin tab: native library grid (match Jellyfin's "My Media" UI)
- New function `initJellyfinView(containerId)` in `LibraryPanel.js` (or new `JellyfinView.js`)
- Fetch `jellyfin.getLibraries()` → `data.Items[]`
- Render full-bleed cover image cards (landscape ratio ~16:9 or square, not portrait):
  - Image URL: `${VITE_JELLYFIN_URL}/Items/${lib.Id}/Images/Primary?maxWidth=500&api_key=${VITE_JELLYFIN_KEY}`
  - Fallback: `${VITE_JELLYFIN_URL}/Items/${lib.Id}/Images/Backdrop?maxWidth=500&api_key=${VITE_JELLYFIN_KEY}`
  - Large bold label overlaid center (Press Start 2P, 16px, white + text-shadow)
  - Library type subtitle below card (Share Tech Mono, 11px, var(--text-secondary))
  - Card hover: scale(1.03), border-color var(--cp-yellow)
- On card click → drill into library:
  - Fetch `GET /Items?ParentId={lib.Id}&Limit=60&SortBy=SortName&api_key={KEY}`
  - Render poster grid of items (same `.discovery-card` style, no ADD/SEEN buttons)
  - Show back button `[ ← BACK ]` top-left using `.cp-button.secondary`
- CSS for library root grid:
  ```css
  .jellyfin-library-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-16);
  }
  .jellyfin-lib-card {
    position: relative;
    aspect-ratio: 16/9;
    background-size: cover;
    background-position: center;
    background-color: var(--card-surface);
    border: 2px solid var(--border-default);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .jellyfin-lib-card:hover {
    border-color: var(--cp-yellow);
    transform: scale(1.02);
  }
  .jellyfin-lib-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(transparent 30%, rgba(10,10,12,0.7) 100%);
    font-family: var(--font-brand);
    font-size: 14px;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  }
  ```

- If overflow: make Download Queue `flex: 1; overflow-y: auto; min-height: 120px`

- [x] Filter Trending results: Only show items with `release_date` <= Today.
- [x] Filter Library Items: Exclude items already present in Radarr/Sonarr library.
- [x] Card Layout: Match `upcoming-card` style (portrait aspect, overlay badges).
- [x] Buttons: Simplify to `+` (Add to downloads) and `x` (Mark as seen), moved inside hover overlay.
- [x] Hover Details: Show overview (summary), ratings, and a direct IMDB button (using DDG bang).
- [x] Style: Add `.discovery-card-hover` styles in `style-upgrade.css`.

### Phase 17 — UX Refinements & Mobile Optimization
- [x] Consistently apply `decrypt-text` glitch effect to all section headers across all panels.
- [x] Implement collapsible sidebar with toggle button in navbar.
- [x] Create `Dock.js` for floating bottom navigation on mobile devices.
- [x] Ensure mobile compatibility with responsive CSS overrides and dock navigation.
- [x] Sync tab state between sidebar and dock navigation.


#### 11.5 Sidebar: collapsible with icon-only mode
- Add a toggle button at the very top of the sidebar (above nav tabs)
- Button: `◀` (collapse) / `▶` (expand), Press Start 2P 8px, right-aligned
- **Expanded** (default, 340px): full sidebar — tabs with text labels, queue, stats visible
- **Collapsed** (icon-only, 52px): sidebar shrinks to icon strip only
  - Nav tabs show icon only (no text label), centered vertically
  - Download Queue and System Status sections are HIDDEN (display:none) when collapsed
  - Sidebar still fully functional — clicking icons still switches tabs
  - CSS: `#sidebar { transition: width 0.25s ease; }` + `#app.sidebar-collapsed #sidebar { width: 52px; }`
  - Toggle icon flips direction on state change
- Icon set (use Unicode/emoji that match CP2077 theme — consistent across all uses):
  - DISCOVERY: `◈` (compass/scan)
  - LIBRARY: `▤` (grid/list)
  - JELLYFIN: `▶` (play/media)
  - Toggle collapse: `◀` / `▶`
  - Search: `⌕` or `◎`
  - Download Queue header: `⬇`
  - System Status header: `◉`
- Collapsed sidebar CSS rule: `.nav-item .nav-label { display: none; }` when `#app.sidebar-collapsed`

#### 11.6 Search: remove from inline position, add as modal
- Remove the inline search bar from inside `#main-panel` / `.discovery-feed`
- Add a **SEARCH button** at the top of the sidebar nav section (below toggle, above nav tabs):
  - Full-width when expanded: `[ ⌕  SEARCH ]` — border 1px solid var(--border-default), Share Tech Mono 11px
  - Icon-only when collapsed: `⌕` centered
  - Clicking opens the Search Modal
- **Search Modal** (full overlay, inspired by Claude's search UI from screenshot):
  - Overlay: `position:fixed; inset:0; bg:rgba(0,0,0,0.85); z-index:3000; display:flex; align-items:flex-start; justify-content:center; padding-top:80px`
  - Modal box: `width:700px; max-width:90vw; background:var(--panel-dark); border:2px solid var(--cp-yellow); box-shadow:0 0 40px rgba(252,227,0,0.15)`
  - Search input at top of modal: full-width, Share Tech Mono 16px, `> JACK IN... search movies & shows_` placeholder, auto-focused on open
  - Close button top-right: `✕` or press Esc
  - Results list below input (no poster grid — use **list rows** like Claude's modal):
    - Each row: `display:flex; gap:16px; padding:12px 16px; border-bottom:1px solid var(--border-default); cursor:pointer`
    - Left: poster thumbnail 60×90px (2:3 ratio)
    - Right column:
      - Line 1: title (Share Tech Mono 14px, var(--text-primary)) + year (dim) + type badge (MOVIE/TV)
      - Line 2: rating `★ X.X / 10` (cp-yellow, 12px) + genre tags (dim, 11px)
      - Line 3: overview snippet (~120 chars, var(--text-secondary), 12px, italic)
    - Hover: `background:var(--surface-hover); border-left:3px solid var(--cp-yellow)`
    - Selected (keyboard): same as hover
  - Keyboard nav: ↑↓ arrows move selection, Enter adds selected item, Esc closes
  - On result click → `classifyAndAdd()` → show toast → modal stays open for more searches
  - Debounce 400ms on input, min 2 chars to trigger search

#### 11.7 Brand name: update to current value
- Brand text in navbar is now `[ NAMM ]` (per screenshot — Aldrin renamed the app)
- Update all references: `data-text="[ NAMM ]"`, console logs, manifest `name`, `short_name`
- Keep the glitch-hover effect on the brand

#### 11.8 Sidebar nav icon consistency rules (for all future components)
- Every sidebar section header uses its icon prefix: `⬇ [ DOWNLOAD QUEUE ]`, `◉ [ SYSTEM STATUS ]`
- Nav items always: `{icon}  {LABEL}` — single space between icon and label
- Icon font: system Unicode, NOT emoji (no color emoji — they break the mono theme)
- All icons must render correctly in Share Tech Mono / Press Start 2P fallback context
- Approved icon vocabulary:
  | Use | Icon |
  |-----|------|
  | Discovery/scan | `◈` |
  | Library/grid | `▤` |
  | Jellyfin/media | `▶` |
  | Search | `⌕` |
  | Download/queue | `⬇` |
  | Status/health | `◉` |
  | Collapse left | `◀` |
  | Expand right | `▶` |
  | Active indicator | `▣` |
  | Back | `←` |
  | Close | `✕` |
  | Star/rating | `★` |
### Phase 18 — UX Polish
- [x] Remove Mobile Dock navigation (standardize on sidebar/toggle)
- [x] Implement smooth sidebar hide/show transitions (0.4s cubic-bezier)
- [x] Stabilize card reflow with smooth transitions on `.poster-grid` and card elements
- [x] Optimize responsive sidebar overlay for mobile devices
- [x] `Dockerfile`, `nginx.conf`, `docker-compose.yml`
- [x] `docker compose build && docker compose up -d` — verify at `http://localhost:3500`
- [x] Deploy via Dokploy
- [x] **Runtime Injection**: Moved from build-time environment variables to runtime injection using `entrypoint.sh` and `config.js`.

### Phase 21 — CI/CD & Auto-Deployment
- [x] **Docker Optimization**: Fixed `.dockerignore` to include `nginx.conf` and `entrypoint.sh`.
- [x] **GitHub Actions**: Created `.github/workflows/docker-publish.yml` to build and push images to **GHCR**.
- [x] **Buildx Cache**: Configured `docker/setup-buildx-action` to fix GHA cache errors.
- [x] **Auto-Deploy**: Integrated Dokploy webhook trigger into the GitHub Action for automated redeploy on push.
- [x] **Node 24 Upgrade**: Opted into Node 24 for GitHub Actions to ensure long-term runner compatibility.

### Phase 22 — UI/UX Refinement (Discovery & Stats)
- [ ] **Discovery Hover**: Fix overflow/clipping of hover summary.
- [ ] **Discovery Actions**: Standardize buttons to `[+]` `[✕]` `[DETAILS]` with pixel spacing.
- [ ] **Branding**: Relocate `[ NAMM ]` to lower right; improve version visibility.
- [ ] **Health Overhaul**: Replace "SYSTEM OPTIMAL" with real service health dots + glow.
- [ ] **Sync Info**: Integrate "Last Sync" into the health/stats area.

### Phase 19 — Media Management & Playback
- [x] **Versioning**: Add `v1.2.5-CP` (Cyberpunk Edition) to sidebar bottom.
- [x] **Library Removal**:
    - [x] Add `deleteMovie` (Radarr) and `deleteSeries` (Sonarr) to API clients.
    - [x] Add `REMOVE` button to `LibraryPanel.js` card hover overlay.
    - [x] Implement a confirmation toast/modal before deletion.
- [x] **Jellyfin Playback**:
    - [x] Add `PLAY` button to `JellyfinView.js` items.
    - [x] Implement `PlayerOverlay.js` using native `<video>` tag.
    - [x] Stream via Jellyfin `/Videos/{Id}/stream` with direct auth token.
    - [x] Custom cyberpunk player controls (neon progress bar, pixel buttons).

### Phase 20 — Jellyfin UX Overhaul
- [x] **Card Cleanup**: Removed redundant hover overlays from Jellyfin cards.
- [x] **Details Modal**: Implement rich metadata modal (poster, summary, community rating, genres).
- [x] **Series Intelligence**: Support hierarchical episode listing for TV shows within the modal.
- [x] **Player Stability**: Fixed playback issues by optimizing stream URLs and adding error/buffering feedback.

---

## 12. Agent rules

1. Read `DESIGN.md` before writing a single CSS rule — it governs everything.
2. Real working code only — no placeholder TODOs in final output.
3. Keys via `import.meta.env.VITE_*` only — never hardcoded anywhere.
4. Vanilla JS only — no framework, no jQuery, no lodash.
5. Zero `border-radius` — hard pixel edges everywhere, no exceptions.
6. Every fetch in `try/catch` — one failing service must not crash the whole dashboard.
7. Build phases in order — browser-verify each phase before the next.
8. CORS: if browser fetch blocked, add note to `README.md` (Settings > General > enable CORS on each service). No proxy backend.
9. Search is the hero feature — it must feel fast, polished, and reliable.
10. On completion: write `DONE.md` in this folder with completion notes, then flag for portfolio entry.

---

## 13. Open questions for Aldrin (answer before starting)

- [x] Preferred subdomain? (`cockpit.kiryuuki.space`?)
- [x] CORS enabled on Radarr/Sonarr/Jellyfin/Prowlarr? (Settings > General)
- [x] Tailscale or LAN IPs for each service? (needed for `.env`)
- [x] TMDB API key? (free at themoviedb.org — needed for search classification)
- [x] Root folder paths on each service? (`/movies`, `/tv` — needed for add payloads)
- [x] Default quality profile ID? (get from Radarr/Sonarr `/api/v3/qualityprofile`)

---

## Progress Log

### 2026-04-20

### 2026-04-21
- Phase 11 spec added to gemini.md by Dash: sidebar nav tabs, search bar Discovery-only, image filter for carousel, Jellyfin native library grid with drill-down
- Phase 11 extended (11.5-11.8): sidebar collapse/icon-mode, search modal (Claude-style overlay with list rows + ratings), brand rename to NAMM, icon vocabulary standardized
- Phase 10 Aesthetics Upgrade completed by Dash (Claude Sonnet 4.6)
- ReactBits effects ported to vanilla JS: DecryptedText, ShinyText, BorderBeam, PixelTrail, Aurora, GlitchHover, CounterAnimation
- Layout improvements: navbar height 64px, sidebar 340px, stat values 26px, poster min 200px
- Discovery panel: shiny headers, #1/#2/#3 rank badges, carousel dots, date overlays on cards
- All components use new section-header pattern with yellow pip indicator
- Phase 11.6 Trending Refinements completed: released-only filter, library exclusion filter, enhanced hover cards with IMDB links.
- Phase 12 Docker + Deploy completed: Dockerfile, nginx.conf, and docker-compose.yml verified.
- Phase 13 Branding completed: Renamed project to NAMM (Not Another Media Manager).
- Phase 14 Security Audit completed: 
    - Enhanced .gitignore with industry-standard exclusions (keys, certs, build artifacts).
    - Verified zero hardcoded secrets in the source code (all keys use `import.meta.env`).
    - Created .env.example as a safe template for users.
- Created README.md and initialized Git repository (fixed .gitignore).
- Production build verified with `npm run build`.
- Final DONE.md completion report generated in project root.
### 2026-04-22
- **Phase 19 completed**: NAMM Media Engine v1.2 launched.
- Added app versioning `v1.2.5-CP` to sidebar footer.
- Implemented `deleteMovie` and `deleteSeries` with disk cleanup in Radarr/Sonarr clients.
- Added `REMOVE` button to Library cards with destructive confirmation logic.
- Launched integrated `PlayerOverlay.js` for native Jellyfin streaming via HTML5 video.
- Verified live at localhost:5173 — media playback active, library cleanup functional.
### 2026-04-22 (Later)
- **Phase 20 completed**: Jellyfin UX Overhaul.
- Removed redundant card overlays; enabled direct-to-modal card interaction.
- Implemented `showItemDetails` with movie/series intelligence.
- Added episode browsing for TV shows within the dashboard.
- Stabilized `PlayerOverlay.js` with `static=true` streaming and signal status feedback (BUFFERING/LIVE/ERROR).
- Fixed `toUpperCase` retrieval error via metadata safety checks in `JellyfinView.js`.
- Resolved Jellyfin API 400 error by robustifying endpoints to handle missing `USER_ID`.
- Restructured Details Modal into a dual-pane layout: fixed identity info (left) and scrollable secondary content/episodes (right).
- Enhanced Upcoming Releases with specific TV episode tags (SxxExx) and date formatting.
- Expanded Discovery with dedicated **Trending Anime** and **K-Drama/K-Movies** sections.
- Integrated **Advanced Streaming Controls**: Corrected subtitle identification (SRT/SUBRIP whitelist), dynamic metadata mapping (Language/Label), and hardened 'showing' mode activation.
- **Security Audit**: Performed full codebase sweep; verified zero hardcoded IPs/keys in `src`, confirmed `.env` exclusion in `.gitignore`, and validated documentation safety.
- Implemented `outside-click` to close for both Details Modal and Video Player.
- Folder + spec v1 created by Minis
- Spec v2 updated by Minis: added universal search + classifier, right sidebar layout (queue + stats), calendar main panel, full DESIGN.md spec (Cyberpunk 2077 theme), enterprise layout architecture, TMDB integration, Radarr/Sonarr add endpoints
### 2026-04-23
- **Phase 21 completed**: NAMM is now fully portable.
- Implemented **Runtime Injection** architecture. The app now loads `/config.js` at runtime, allowing users to update API keys and URLs via Dokploy UI without re-building.
- Automated **CI/CD Pipeline** launched: Every push to `main` builds a multi-arch image, pushes to GHCR, and triggers a Dokploy redeploy via webhook.
- Fixed Buildx cache errors and updated GitHub Actions to Node 24.
- Security verified: Zero secrets leaked in builds; all injection happens at the container edge.

## Links

[[claude/MOC — Master Index]]
[[Projects/Projects Index]]




