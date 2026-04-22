# [ NAMM ] — Not Another Media Manager

> *"Your media stack, jacked in."*

**NAMM** is an enterprise-grade, self-hosted PWA dashboard designed to manage your entire media ecosystem (Jellyfin, Radarr, Sonarr, Prowlarr) from a single, high-density Cyberpunk 2077-themed terminal.

![NAMM Dashboard Discovery](screenshots/discovery.png)

---

## ⚡ Core Features

### 📡 Unified Discovery & Search
- **Universal Search**: Jack into TMDB and your local libraries simultaneously.
- **Smart Classifier**: Automatic routing for new content (Movies → Radarr, TV → Sonarr).
- **Premium Discovery**: Interactive trending and upcoming feeds with IMDB deep-linking and one-click management.
- **Expanded Genres**: Dedicated feeds for **Trending Anime** and **K-DRAMA & K-MOVIES**.

![Search & Interaction](screenshots/search_results.png)
*Universal Search & Real-time Lookup*

### 📼 Media Engine v1.2
- **Advanced Playback**: Integrated media player with support for dynamic **Audio** and **Subtitle** track switching.
- **Jellyfin Integration**: Native-looking media grid with drill-down views for all your libraries.
- **Library Tracker**: Monitor the status of your entire collection with real-time health indicators.

![Player Controls](screenshots/player_controls.png)
*Integrated Player with Track Selectors*

### 🖥️ Command Center Interface
- **High-Density Sidebar**: Merged download queue (Radarr + Sonarr) and real-time system metrics.
- **Cyberpunk Aesthetics**: ReactBits-powered animations (DecryptedText, BorderBeam, PixelTrail) and scanline CRT overlays.
- **PWA Ready**: Installable on desktop and mobile with offline shell support.

---

## 🛠️ Tech Stack

- **Build Engine**: Vite 5
- **Language**: Vanilla JavaScript (ES Modules)
- **Styling**: Vanilla CSS (Cyberpunk Design System)
- **PWA**: Workbox / `vite-plugin-pwa`
- **Infrastructure**: Docker / Nginx Alpine

---

## 🚀 Installation & Deployment

NAMM is designed to be lightweight and portable. The recommended way to deploy is using Docker Compose.

### 1. Configure Environment
Before deploying, create your `.env` file by copying the template:
```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_JELLYFIN_URL` | YES | Your Jellyfin server URL |
| `VITE_JELLYFIN_KEY` | YES | Jellyfin API Key |
| `VITE_JELLYFIN_USER_ID` | YES | Your Jellyfin User ID |
| `VITE_RADARR_URL` | YES | Your Radarr instance URL |
| `VITE_RADARR_KEY` | YES | Radarr API Key |
| `VITE_SONARR_URL` | YES | Your Sonarr instance URL |
| `VITE_SONARR_KEY` | YES | Sonarr API Key |
| `VITE_TMDB_KEY` | YES | TMDB API Key for discovery metadata |

### 2. Docker Deployment
```bash
# Build and start the container in detached mode
docker compose up -d --build
```
Your dashboard will be available at `http://localhost:3500`.

### 3. Local Development
```bash
npm install
npm run dev
```
The app will be live at `http://localhost:5173`.

---

## 🏷️ Versioning

NAMM follows semantic versioning (`MAJOR.MINOR.PATCH`).

- **MAJOR**: Breaking architectural changes or complete UI overhauls.
- **MINOR**: New features (e.g., adding a new service, expanded discovery filters, player upgrades).
- **PATCH**: Bug fixes, styling tweaks, and performance optimizations.

Current Version: **v1.2.5-CP** (Cyberpunk Edition)

---

## 🎨 Design Philosophy

NAMM follows a strict **"Information First"** philosophy inspired by Night City data terminals.
- **Zero Border Radius**: Hard pixel edges only.
- **Cyberpunk Palette**: CP Yellow (`#FCE300`), CP Cyan (`#00F0FF`), and deep monochrome surfaces.
- **Reactive UI**: Every interaction triggers a micro-animation or a "data-stream" effect.

---

## 📜 License
MIT © 2026. NAMM is for personal, self-hosted use.

*"The Net is wide and vast. Jack in and stay connected."*
