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

![Search & Interaction](screenshots/search_results.png)
*Universal Search & Real-time Lookup*

### 📼 Native-Feel Management
- **Jellyfin Integration**: Native-looking media grid with drill-down views for all your libraries.
- **Library Tracker**: Monitor the status of your entire collection with real-time health indicators.
- **Action-First Workflow**: Rapidly add (`+`) or mark as seen (`×`) content directly from the discovery feed.

![Library & Jellyfin](screenshots/library.png)
*Radarr Library View*

![Interaction](screenshots/card_hover.png)
*Interactive Hover Overlays*

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

NAMM is designed to be lightweight and portable. You can deploy it via Docker, self-host it on a VPS, or run it locally for development.

### 1. Configure Environment
Before deploying, create your `.env` file by copying the template:
```bash
cp .env.example .env
```
Fill in your service details. **Important:** URLs must be accessible from your browser (e.g., use your local IP `192.168.x.x` if running locally).

| Variable | Description |
|----------|-------------|
| `VITE_JELLYFIN_URL` | Your Jellyfin server URL |
| `VITE_RADARR_URL` | Your Radarr instance URL |
| `VITE_SONARR_URL` | Your Sonarr instance URL |
| `VITE_TMDB_KEY` | TMDB API Key for discovery metadata |

---

### 2. Deployment Options

#### Option A: Docker Compose (Recommended)
This is the easiest way to get NAMM up and running in a production-ready Nginx container.
```bash
# Start the container
docker compose up -d
```
Your dashboard will be available at `http://localhost:3500`.

#### Option B: Self-Hosting (Dokploy)
If you are using **Dokploy** for your infrastructure:
1. Create a new "Docker Compose" application in your Dokploy dashboard.
2. Link your GitHub repository.
3. Add your `.env` variables in the Dokploy environment settings.
4. Deploy. Dokploy will automatically handle the build and serve NAMM on your configured domain.

#### Option C: Local Development
To run NAMM locally with hot-reloading:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The app will be live at `http://localhost:5173`.

---

### 3. PWA Installation
NAMM is a Progressive Web App. Once deployed:
1. Open the URL in Chrome or Edge.
2. Click the **"Install"** icon in the address bar (or "Add to Home Screen" on mobile).
3. NAMM will now behave like a native desktop/mobile application with its own window and offline shell.

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
