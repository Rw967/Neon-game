// ===== STATE.JS — Global State & Persistence =====
const STATE = {
  // Player data
  stars: 0,
  highscore: 0,
  gamesPlayed: 0,
  totalKills: 0,
  playerName: 'Spieler',

  // Season
  seasonLevel: 1,
  seasonXP: 0,
  premiumPass: false,

  // Inventory
  ownedWeapons: ['pistol'],
  equippedWeapon: 'pistol',
  ownedBoosts: [],
  ownedSkins: [],
  equippedSkin: 'default',

  // Settings
  musicVol: 0.6,
  sfxVol: 0.8,
  particlesOn: true,
  crosshairStyle: 'cross',

  // Runtime (not saved)
  currentMode: 'solo',
  isOnline: false,
  currentScore: 0,
  currentWave: 1,
};

function saveState() {
  const toSave = {
    stars: STATE.stars,
    highscore: STATE.highscore,
    gamesPlayed: STATE.gamesPlayed,
    totalKills: STATE.totalKills,
    playerName: STATE.playerName,
    seasonLevel: STATE.seasonLevel,
    seasonXP: STATE.seasonXP,
    premiumPass: STATE.premiumPass,
    ownedWeapons: STATE.ownedWeapons,
    equippedWeapon: STATE.equippedWeapon,
    ownedBoosts: STATE.ownedBoosts,
    ownedSkins: STATE.ownedSkins,
    equippedSkin: STATE.equippedSkin,
    musicVol: STATE.musicVol,
    sfxVol: STATE.sfxVol,
    particlesOn: STATE.particlesOn,
    crosshairStyle: STATE.crosshairStyle,
  };
  try { sessionStorage.setItem('neonquest_save', JSON.stringify(toSave)); } catch(e) {}
  // Also store in memory fallback
  window._nqSave = toSave;
}

function loadState() {
  try {
    const raw = sessionStorage.getItem('neonquest_save') || JSON.stringify(window._nqSave || {});
    const saved = JSON.parse(raw);
    if (saved) Object.assign(STATE, saved);
  } catch(e) {}
}

// Call on boot
loadState();

// Award stars & XP after a round
function awardRound(score, kills) {
  const stars = Math.floor(score / 50);
  const xp = score + kills * 20;

  STATE.stars += stars;
  STATE.totalKills += kills;
  STATE.gamesPlayed += 1;
  if (score > STATE.highscore) STATE.highscore = score;

  // Season XP
  STATE.seasonXP += xp;
  const xpPerLevel = 1000 + (STATE.seasonLevel - 1) * 500;
  while (STATE.seasonXP >= xpPerLevel) {
    STATE.seasonXP -= xpPerLevel;
    STATE.seasonLevel += 1;
  }

  saveState();
  return stars;
}
