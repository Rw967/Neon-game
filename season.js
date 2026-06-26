// ===== SEASON.JS — Season Pass =====
const SEASON_REWARDS = [
  { level:1, icon:'🔵', name:'Cyan Skin', type:'skin', id:'default', premium:false },
  { level:2, icon:'⭐', name:'50 Sterne', type:'stars', amount:50, premium:false },
  { level:3, icon:'💨', name:'Speed Boost', type:'boost', id:'boost_speed', premium:false },
  { level:4, icon:'🟡', name:'Golden Skin', type:'skin', id:'skin_gold', premium:true },
  { level:5, icon:'🔫', name:'AK-47', type:'weapon', id:'ak47', premium:false },
  { level:6, icon:'⭐', name:'100 Sterne', type:'stars', amount:100, premium:false },
  { level:7, icon:'🛡️', name:'Shield Boost', type:'boost', id:'boost_shield', premium:false },
  { level:8, icon:'⚡', name:'SMG', type:'weapon', id:'smg', premium:true },
  { level:9, icon:'⭐', name:'200 Sterne', type:'stars', amount:200, premium:false },
  { level:10, icon:'🟣', name:'Void Skin', type:'skin', id:'skin_purple', premium:true },
  { level:12, icon:'🎯', name:'Sniper', type:'weapon', id:'sniper', premium:false },
  { level:15, icon:'🔥', name:'Rage Mode', type:'boost', id:'boost_rage', premium:true },
  { level:20, icon:'🌈', name:'Rainbow Skin', type:'skin', id:'skin_rainbow', premium:true },
  { level:25, icon:'⭐', name:'500 Sterne', type:'stars', amount:500, premium:false },
  { level:30, icon:'👑', name:'Season Krone', type:'cosmetic', premium:true },
];

function renderSeasonPass() {
  const track = document.getElementById('seasonTrack');
  if (!track) return;

  track.innerHTML = SEASON_REWARDS.map(r => {
    const unlocked = STATE.seasonLevel > r.level;
    const current = STATE.seasonLevel === r.level;
    const premiumLocked = r.premium && !STATE.premiumPass;

    let cls = 'season-node';
    if (unlocked) cls += ' unlocked';
    if (current) cls += ' current';
    if (r.premium) cls += ' premium';

    return `<div class="${cls}">
      <div class="season-node-circle" title="${premiumLocked ? '👑 Premium nötig' : r.name}">
        ${premiumLocked ? '🔒' : unlocked ? '✓' : r.icon}
      </div>
      <div class="season-node-lvl">Lvl ${r.level}</div>
      <div class="season-node-reward">${r.name}${r.premium ? ' 👑' : ''}</div>
    </div>`;
  }).join('');

  // XP bar
  const xpPerLevel = 1000 + (STATE.seasonLevel - 1) * 500;
  const pct = Math.min(100, (STATE.seasonXP / xpPerLevel) * 100);
  const fill = document.getElementById('seasonXPFill');
  if (fill) fill.style.width = pct + '%';
  const lvlEl = document.getElementById('seasonLevel');
  if (lvlEl) lvlEl.textContent = STATE.seasonLevel;
  const xpEl = document.getElementById('seasonXP');
  if (xpEl) xpEl.textContent = STATE.seasonXP;
  const xpNEl = document.getElementById('seasonXPNext');
  if (xpNEl) xpNEl.textContent = xpPerLevel;
}

function buyPremium() {
  if (STATE.stars < 500) {
    alert('Du brauchst 500 ⭐ für den Premium Pass!');
    return;
  }
  STATE.stars -= 500;
  STATE.premiumPass = true;
  saveState();
  updateMenuCurrency();
  renderSeasonPass();
}

// Check and grant season rewards on level up
function checkSeasonRewards(oldLevel, newLevel) {
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    const reward = SEASON_REWARDS.find(r => r.level === lvl);
    if (!reward) continue;
    if (reward.premium && !STATE.premiumPass) continue;

    if (reward.type === 'stars') STATE.stars += reward.amount;
    else if (reward.type === 'weapon') {
      if (!STATE.ownedWeapons.includes(reward.id)) STATE.ownedWeapons.push(reward.id);
    } else if (reward.type === 'skin') {
      if (!STATE.ownedSkins.includes(reward.id)) STATE.ownedSkins.push(reward.id);
    } else if (reward.type === 'boost') {
      STATE.ownedBoosts.push(reward.id);
    }
  }
  saveState();
}
