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
- **Jellyfin Detail Views**: High-fidelity item details with hero backdrops, technical specs, and series navigation.
- **Advanced Playback**: Integrated media player with support for dynamic **Audio** and **Subtitle** track switching.
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
- **Deployment**: GitHub Actions CI/CD to GHCR

---

## 🚀 Installation & Deployment

NAMM is designed to be lightweight and portable. The recommended way to deploy is using the pre-built image.

### 1. Simple Deployment (Docker Compose)
Create a `docker-compose.yml` file:

```yaml
services:
  namm:
    image: ghcr.io/kiryuuki/namm:latest
    container_name: namm
    ports:
      - "3500:80"
    restart: unless-stopped
    environment:
      - VITE_JELLYFIN_URL=http://your-ip:8096
      - VITE_JELLYFIN_KEY=your_key
      - VITE_JELLYFIN_USER_ID=your_id
      - VITE_RADARR_URL=http://your-ip:7878
      - VITE_RADARR_KEY=your_key
      - VITE_SONARR_URL=http://your-ip:8989
      - VITE_SONARR_KEY=your_key
      - VITE_PROWLARR_URL=http://your-ip:9696
      - VITE_PROWLARR_KEY=your_key
      - VITE_TMDB_KEY=your_tmdb_key
```

Run it:
```bash
docker compose up -d
```

### 2. Dokploy / Cloud Deployment
NAMM supports **Runtime Injection**. You can update your environment variables directly in the Dokploy/Portainer UI without re-building the image.

---

## 🏷️ Versioning

NAMM follows semantic versioning (`MAJOR.MINOR.PATCH`).

- **MAJOR**: Breaking architectural changes or complete UI overhauls.
- **MINOR**: New features (e.g., adding a new service, expanded discovery filters, player upgrades).
- **PATCH**: Bug fixes, styling tweaks, and performance optimizations.

Current Version: **v1.2.6-CP** (Cyberpunk Edition)

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
