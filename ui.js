// ===== UI.JS — Menu Navigation & UI Functions =====

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
}

function menuNav(panel) {
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('panel-' + panel);
  if (el) el.classList.add('active');

  if (panel === 'shop') renderShop();
  if (panel === 'season') renderSeasonPass();
  updateMenuCurrency();
  updateInfoPanel();
}

function updateInfoPanel() {
  const hs = document.getElementById('infoHighscore');
  if (hs) hs.textContent = STATE.highscore.toLocaleString();
  const gp = document.getElementById('infoGames');
  if (gp) gp.textContent = STATE.gamesPlayed;
  const kl = document.getElementById('infoKills');
  if (kl) kl.textContent = STATE.totalKills;
  const lv = document.getElementById('infoLevel');
  if (lv) lv.textContent = STATE.seasonLevel;
  updateMenuCurrency();
}

function selectMode(mode) {
  document.querySelectorAll('.mode-card').forEach(c => c.style.borderColor = '');
  event.currentTarget.style.borderColor = 'var(--accent)';
  STATE.currentMode = mode;
  STATE.isOnline = mode === 'online';

  const onlinePanel = document.getElementById('online-panel');
  const modeSelected = document.getElementById('mode-selected');
  const modeInfo = document.getElementById('selectedModeInfo');

  if (mode === 'online') {
    onlinePanel.style.display = 'block';
    modeSelected.style.display = 'none';
  } else {
    onlinePanel.style.display = 'none';
    modeSelected.style.display = 'block';
    const descriptions = {
      solo: '🎯 Solo-Modus: Überlebe so lange wie möglich gegen Wellen von Gegnern.',
      blitz: '⚡ Blitz-Modus: 2 Minuten — sammle so viele Punkte wie möglich!',
      survival: '💀 Survival: Unendliche Wellen. Keine Gnade. Kein Ende.'
    };
    modeInfo.textContent = descriptions[mode] || '';
  }
}

function startGame() {
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  showScreen('game');
  playMusic();
  GAME.init(STATE.currentMode);
}

function resumeGame() {
  document.getElementById('pauseOverlay').style.display = 'none';
}

function goToMenu() {
  GAME.stop();
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  STATE.isOnline = false;
  showScreen('menu');
  updateInfoPanel();
  renderShop();
  renderSeasonPass();
}

// Pause key
document.addEventListener('keydown', e => {
  const gameScreen = document.getElementById('screen-game');
  if (!gameScreen.classList.contains('active')) return;
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    const pause = document.getElementById('pauseOverlay');
    const death = document.getElementById('deathScreen');
    if (death.style.display === 'flex') return;
    pause.style.display = pause.style.display === 'flex' ? 'none' : 'flex';
  }
});
