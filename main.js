// ===== MAIN.JS — Boot, Loading Screen, Background =====

// ---- BACKGROUND PARTICLE CANVAS ----
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
const bgParticles = [];

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBg();
window.addEventListener('resize', resizeBg);

for (let i = 0; i < 80; i++) {
  bgParticles.push({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    size: Math.random() * 2.5 + 0.5,
    speed: Math.random() * 0.3 + 0.05,
    alpha: Math.random() * 0.4 + 0.1
  });
}

function drawBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles.forEach(p => {
    p.y += p.speed;
    if (p.y > bgCanvas.height) { p.y = 0; p.x = Math.random() * bgCanvas.width; }
    bgCtx.fillStyle = `rgba(240,245,255,${p.alpha})`;
    bgCtx.fillRect(p.x, p.y, p.size, p.size);
  });
  requestAnimationFrame(drawBg);
}
drawBg();

// ---- LOADING SCREEN ----
const TIPS = [
  '💡 Tipp: WASD zum Bewegen, Maus zum Zielen und Schießen!',
  '💡 Tipp: Drücke 1/2/3 um die Waffe zu wechseln.',
  '💡 Tipp: Sammle ⭐ Sterne um im Shop neue Waffen zu kaufen!',
  '💡 Tipp: Stelle einen Server her und schicke den Code deinen Freunden!',
  '💡 Tipp: Im Season Pass kannst du exklusive Skins freischalten.',
  '💡 Tipp: Boost-Items im Shop geben dir Vorteile für eine Runde!',
];

const LOADING_STEPS = [
  { p: 0.10, t: 'Initialisiere NeonQuest Engine...' },
  { p: 0.25, t: 'Lade Neon-Grafiken & Shader...' },
  { p: 0.40, t: 'Erstelle Partikelsystem...' },
  { p: 0.55, t: 'Generiere Gegner-KI...' },
  { p: 0.70, t: 'Lade Musik & Sound-Effekte...' },
  { p: 0.85, t: 'Synchronisiere Season-Daten...' },
  { p: 1.00, t: 'Bereit! Drücke eine beliebige Taste...' },
];

let loadProgress = 0;
let loadDone = false;
let currentTipIdx = Math.floor(Math.random() * TIPS.length);

const loadBarFill = document.getElementById('loadBarFill');
const loadBarGlow = document.getElementById('loadBarGlow');
const loadPercent = document.getElementById('loadPercent');
const loadStatus = document.getElementById('loadStatus');
const loadTip = document.getElementById('loadTip');
const loadAnyKey = document.getElementById('loadAnyKey');

// Rotate tips
setInterval(() => {
  currentTipIdx = (currentTipIdx + 1) % TIPS.length;
  if (loadTip) loadTip.style.opacity = '0';
  setTimeout(() => {
    if (loadTip) { loadTip.textContent = TIPS[currentTipIdx]; loadTip.style.opacity = '1'; }
  }, 300);
}, 3500);

// Animate loading bar
function animateLoading() {
  if (loadProgress < 1) {
    loadProgress = Math.min(loadProgress + 0.006, 1);
  }

  const pct = Math.round(loadProgress * 100);
  if (loadBarFill) loadBarFill.style.width = pct + '%';
  if (loadBarGlow) loadBarGlow.style.width = pct + '%';
  if (loadPercent) loadPercent.textContent = pct + '%';

  for (const step of LOADING_STEPS) {
    if (loadProgress <= step.p) {
      if (loadStatus) loadStatus.textContent = step.t;
      break;
    }
  }

  if (loadProgress >= 1 && !loadDone) {
    loadDone = true;
    if (loadAnyKey) {
      loadAnyKey.style.opacity = '1';
      loadAnyKey.style.transition = 'opacity 0.5s';
    }
  }

  if (!loadDone || loadProgress < 1) requestAnimationFrame(animateLoading);
}
animateLoading();

// Any key → show menu
document.addEventListener('keydown', onAnyKey);
document.addEventListener('click', onAnyKey);
document.getElementById('screen-loading').addEventListener('click', onAnyKey);

function onAnyKey(e) {
  if (!loadDone) return;
  // Don't fire on game controls
  if (['w','a','s','d','p'].includes(e.key?.toLowerCase())) return;
  document.removeEventListener('keydown', onAnyKey);
  document.removeEventListener('click', onAnyKey);
  
  // Fade out loading screen
  const ls = document.getElementById('screen-loading');
  ls.style.transition = 'opacity 0.5s';
  ls.style.opacity = '0';
  setTimeout(() => {
    ls.classList.remove('active');
    ls.style.display = 'none';
    showScreen('menu');
    updateInfoPanel();
    renderShop();
    renderSeasonPass();
    // Auto-start music (may require user interaction, which we just got)
    playMusic();
  }, 500);
}

// Settings: sync from STATE on load
window.addEventListener('DOMContentLoaded', () => {
  const mvEl = document.getElementById('musicVol');
  if (mvEl) mvEl.value = STATE.musicVol * 100;
  const svEl = document.getElementById('sfxVol');
  if (svEl) svEl.value = STATE.sfxVol * 100;
  const pOn = document.getElementById('particlesOn');
  if (pOn) pOn.checked = STATE.particlesOn;
  const cs = document.getElementById('crosshairStyle');
  if (cs) cs.value = STATE.crosshairStyle;
  const sn = document.getElementById('settingsName');
  if (sn) { sn.value = STATE.playerName; sn.addEventListener('input', () => { STATE.playerName = sn.value; saveState(); }); }
  const pOn2 = document.getElementById('particlesOn');
  if (pOn2) pOn2.addEventListener('change', () => { STATE.particlesOn = pOn2.checked; saveState(); });
  const cs2 = document.getElementById('crosshairStyle');
  if (cs2) cs2.addEventListener('change', () => { STATE.crosshairStyle = cs2.value; saveState(); });
  const mvVal = document.getElementById('musicVolVal');
  if (mvVal) mvVal.textContent = Math.round(STATE.musicVol * 100) + '%';
  const svVal = document.getElementById('sfxVolVal');
  if (svVal) svVal.textContent = Math.round(STATE.sfxVol * 100) + '%';
});
