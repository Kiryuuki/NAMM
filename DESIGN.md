# DESIGN.md — NAMM
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
