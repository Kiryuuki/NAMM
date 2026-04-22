/**
 * ARR Cockpit — Vanilla JS ports of ReactBits effects
 * Inspired by: https://reactbits.dev
 * All effects are framework-free, zero dependencies.
 */

// ─────────────────────────────────────────────
// DECRYPT TEXT (ReactBits: DecryptedText)
// Scrambles then reveals text char-by-char
// ─────────────────────────────────────────────
const GLYPHS = '▓░▒█▄▀■□▪▫◆◇○●◈ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789@#$%^&*_+=[]{}|<>?/';

export function decryptText(element, opts = {}) {
  const {
    speed = 25,
    scrambleCount = 2,
    onComplete = null,
  } = opts;

  const targetText = element.getAttribute('data-text') || element.innerText;
  element.setAttribute('data-text', targetText);
  const len = targetText.length;
  let frame = 0;
  let raf;

  const tick = () => {
    const revealed = Math.floor(frame / scrambleCount);
    element.innerText = targetText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        if (i < revealed) return targetText[i];
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join('');

    frame++;
    if (revealed < len) {
      raf = requestAnimationFrame(tick);
    } else {
      element.innerText = targetText;
      onComplete?.();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Init all .decrypt-text elements on DOM */
export function initDecryptAnimations(root = document) {
  root.querySelectorAll('.decrypt-text').forEach(el => decryptText(el));
}

// ─────────────────────────────────────────────
// SHINY TEXT (ReactBits: ShinyText)
// Animated gloss shimmer over text via CSS mask
// ─────────────────────────────────────────────
export function applyShinyText(element) {
  element.classList.add('shiny-text');
}

export function initShinyText(root = document) {
  root.querySelectorAll('.shiny-text-auto').forEach(el => applyShinyText(el));
}

// ─────────────────────────────────────────────
// BORDER BEAM (ReactBits: BorderBeam)
// Animated glowing border that sweeps around element
// Uses CSS custom property animation via JS
// ─────────────────────────────────────────────
export function applyBorderBeam(element, opts = {}) {
  const {
    color = '#FCE300',
    duration = 3,
    size = 80,
  } = opts;

  element.classList.add('border-beam');
  element.style.setProperty('--beam-color', color);
  element.style.setProperty('--beam-duration', `${duration}s`);
  element.style.setProperty('--beam-size', `${size}px`);
}

export function initBorderBeams(root = document) {
  root.querySelectorAll('.border-beam-auto').forEach(el =>
    applyBorderBeam(el, {
      color: el.dataset.beamColor || '#FCE300',
      duration: parseFloat(el.dataset.beamDuration) || 3,
    })
  );
}

// ─────────────────────────────────────────────
// PIXEL TRAIL (ReactBits: PixelTrail)
// Canvas cursor trail leaving glowing pixels
// ─────────────────────────────────────────────
let trailCanvas = null;
let trailCtx = null;
let trailPixels = [];

const TRAIL_COLORS = ['#FCE300', '#00F0FF', '#FF2D78'];
const TRAIL_LIFE = 30;   // frames
const TRAIL_SIZE = 4;    // px

export function initPixelTrail() {
  if (trailCanvas) return;

  trailCanvas = document.createElement('canvas');
  trailCanvas.id = 'pixel-trail';
  trailCanvas.style.cssText = `
    position: fixed; inset: 0; pointer-events: none;
    z-index: 9998; width: 100%; height: 100%;
  `;
  document.body.appendChild(trailCanvas);

  const resize = () => {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  trailCtx = trailCanvas.getContext('2d');

  // Throttled mousemove — spawn pixel every 12px of movement
  let lastX = 0, lastY = 0;
  document.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12) return;

    lastX = e.clientX;
    lastY = e.clientY;

    // Snap to pixel grid
    const px = Math.round(e.clientX / TRAIL_SIZE) * TRAIL_SIZE;
    const py = Math.round(e.clientY / TRAIL_SIZE) * TRAIL_SIZE;

    trailPixels.push({
      x: px,
      y: py,
      life: TRAIL_LIFE,
      color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
    });
  });

  let animId;
  const draw = () => {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

    trailPixels = trailPixels.filter(p => p.life > 0);
    for (const p of trailPixels) {
      const alpha = p.life / TRAIL_LIFE;
      trailCtx.fillStyle = p.color;
      trailCtx.globalAlpha = alpha * 0.7;
      trailCtx.fillRect(p.x, p.y, TRAIL_SIZE, TRAIL_SIZE);
      p.life--;
    }

    trailCtx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  };
  draw();
}

export function destroyPixelTrail() {
  trailCanvas?.remove();
  trailCanvas = null;
}

// ─────────────────────────────────────────────
// AURORA (ReactBits: Aurora)
// Animated gradient overlay for main panel bg
// Pure CSS class injection via JS
// ─────────────────────────────────────────────
export function initAurora(targetId = 'main-panel') {
  const el = document.getElementById(targetId);
  if (!el) return;
  // Insert aurora layer as first child
  const aurora = document.createElement('div');
  aurora.className = 'aurora-bg';
  aurora.setAttribute('aria-hidden', 'true');
  el.insertBefore(aurora, el.firstChild);
}

// ─────────────────────────────────────────────
// GLITCH TEXT (enhanced, JS-driven)
// On hover: rapid multi-layer glitch slices
// ─────────────────────────────────────────────
export function initGlitchHover(selector = '.glitch-hover') {
  document.querySelectorAll(selector).forEach(el => {
    let glitchRaf;
    let glitchTimeout;

    const startGlitch = () => {
      let frame = 0;
      const run = () => {
        const clips = [
          `polygon(0 ${10 + Math.random() * 30}%, 100% ${10 + Math.random() * 30}%, 100% ${40 + Math.random() * 20}%, 0 ${40 + Math.random() * 20}%)`,
          `polygon(0 ${50 + Math.random() * 20}%, 100% ${50 + Math.random() * 20}%, 100% ${70 + Math.random() * 20}%, 0 ${70 + Math.random() * 20}%)`,
          'none',
        ];
        const clip = clips[frame % clips.length];
        const tx = (Math.random() - 0.5) * 6;
        el.style.clipPath = clip;
        el.style.transform = clip === 'none' ? '' : `translateX(${tx}px)`;
        el.style.color = frame % 3 === 0 ? '#00F0FF' : '#FCE300';
        frame++;
        glitchRaf = requestAnimationFrame(run);
      };
      run();
    };

    const stopGlitch = () => {
      cancelAnimationFrame(glitchRaf);
      el.style.clipPath = '';
      el.style.transform = '';
      el.style.color = '';
    };

    el.addEventListener('mouseenter', startGlitch);
    el.addEventListener('mouseleave', stopGlitch);
  });
}

// ─────────────────────────────────────────────
// COUNTER ANIMATION
// Animates stat numbers from 0 → target
// ─────────────────────────────────────────────
export function animateCounter(element, target, duration = 800) {
  const start = performance.now();
  const isFloat = String(target).includes('.');
  const from = 0;

  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (target - from) * eased;

    element.innerText = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();

    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Init counter animation on all .count-up elements using data-value */
export function initCounters(root = document) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseFloat(el.dataset.value);
        if (!isNaN(val)) animateCounter(el, val);
        observer.unobserve(el);
      }
    });
  });

  root.querySelectorAll('.count-up').forEach(el => observer.observe(el));
}
