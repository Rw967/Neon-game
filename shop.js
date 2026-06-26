// ===== SHOP.JS — Shop System =====
const SHOP_ITEMS = {
  weapons: [
    { id: 'pistol', name: 'Pistole', icon: '🔫', desc: 'Standard-Waffe. Infinite Ammo.', price: 0, stats: 'DMG:15 | SPD:Fast | Range:Med' },
    { id: 'ak47', name: 'AK-47', icon: '🪖', desc: 'Vollautomatisch. Hoher Schaden.', price: 300, stats: 'DMG:35 | SPD:Auto | Range:Long' },
    { id: 'sniper', name: 'Sniper', icon: '🎯', desc: 'Präzise Langstreckenwaffe.', price: 500, stats: 'DMG:80 | SPD:Slow | Range:Max' },
    { id: 'smg', name: 'SMG', icon: '⚡', desc: 'Blitzschnelle Kurzwaffe.', price: 400, stats: 'DMG:12 | SPD:Very Fast | Range:Short' },
  ],
  boosts: [
    { id: 'boost_speed', name: 'Speed Boost', icon: '💨', desc: '+30% Bewegungsgeschwindigkeit für eine Runde.', price: 50, stats: 'Einmalig pro Runde' },
    { id: 'boost_hp', name: 'HP Boost', icon: '❤️', desc: '+50 Max-HP für eine Runde.', price: 80, stats: 'Einmalig pro Runde' },
    { id: 'boost_double', name: 'Double Stars', icon: '⭐', desc: '2x Sterne für eine Runde.', price: 120, stats: 'Einmalig pro Runde' },
    { id: 'boost_shield', name: 'Shield', icon: '🛡️', desc: 'Absorbiert 50 Schaden.', price: 100, stats: 'Einmalig pro Runde' },
    { id: 'boost_magnet', name: 'Magnet', icon: '🧲', desc: 'Zieht Items automatisch an.', price: 60, stats: 'Einmalig pro Runde' },
    { id: 'boost_rage', name: 'Rage Mode', icon: '🔥', desc: '+50% Schaden für 30 Sekunden.', price: 150, stats: 'Einmalig pro Runde' },
  ],
  skins: [
    { id: 'default', name: 'Cyan', icon: '🔵', desc: 'Standard Skin.', price: 0, stats: 'Default' },
    { id: 'skin_gold', name: 'Golden', icon: '🟡', desc: 'Goldener Spieler.', price: 200, stats: 'Premium Look' },
    { id: 'skin_red', name: 'Crimson', icon: '🔴', desc: 'Roter Neon-Skin.', price: 150, stats: 'Aggressive Look' },
    { id: 'skin_green', name: 'Matrix', icon: '🟢', desc: 'Grüner Matrix-Skin.', price: 150, stats: 'Hacker Look' },
    { id: 'skin_purple', name: 'Void', icon: '🟣', desc: 'Lila Void-Skin.', price: 250, stats: 'Season Reward' },
    { id: 'skin_rainbow', name: 'Rainbow', icon: '🌈', desc: 'Farbwechsel-Effekt!', price: 800, stats: 'Ultra Rare' },
  ],
};

let currentShopTab = 'weapons';

function shopTab(tab) {
  currentShopTab = tab;
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderShop();
}

function renderShop() {
  const grid = document.getElementById('shopGrid');
  const starsEl = document.getElementById('shopStars');
  if (starsEl) starsEl.textContent = STATE.stars;
  if (!grid) return;

  const items = SHOP_ITEMS[currentShopTab];
  grid.innerHTML = items.map(item => {
    const owned = STATE.ownedWeapons.includes(item.id) ||
                  STATE.ownedBoosts.includes(item.id) ||
                  STATE.ownedSkins.includes(item.id) ||
                  item.price === 0;
    const equipped = STATE.equippedWeapon === item.id || STATE.equippedSkin === item.id;
    const canAfford = STATE.stars >= item.price;

    let btnText, btnClass, btnAction;
    if (owned && (currentShopTab === 'weapons' || currentShopTab === 'skins')) {
      if (equipped) { btnText = '✓ Ausgerüstet'; btnClass = 'equipped'; btnAction = ''; }
      else { btnText = 'Ausrüsten'; btnClass = 'owned'; btnAction = `equipItem('${item.id}','${currentShopTab}')`; }
    } else if (owned && currentShopTab === 'boosts') {
      btnText = `✓ Im Inventar`; btnClass = 'owned'; btnAction = '';
    } else {
      btnText = `${item.price} ⭐ Kaufen`; btnClass = canAfford ? '' : 'locked';
      btnAction = canAfford ? `buyItem('${item.id}','${currentShopTab}')` : '';
    }

    // Season lock for skin_purple
    const seasonLocked = item.id === 'skin_purple' && STATE.seasonLevel < 10;

    return `<div class="shop-item">
      ${seasonLocked ? '<div class="shop-item-locked">🔒</div>' : ''}
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
      <div class="shop-item-desc" style="color:var(--accent)">${item.stats}</div>
      <div class="shop-item-price">${item.price === 0 ? 'Kostenlos' : item.price + ' ⭐'}</div>
      <button class="shop-item-btn ${btnClass}" ${btnAction ? `onclick="${btnAction}"` : 'disabled'}>${btnText}</button>
    </div>`;
  }).join('');
}

function buyItem(id, tab) {
  const items = SHOP_ITEMS[tab];
  const item = items.find(i => i.id === id);
  if (!item || STATE.stars < item.price) return;

  STATE.stars -= item.price;
  if (tab === 'weapons') STATE.ownedWeapons.push(id);
  else if (tab === 'boosts') STATE.ownedBoosts.push(id);
  else if (tab === 'skins') STATE.ownedSkins.push(id);

  saveState();
  updateMenuCurrency();
  renderShop();
}

function equipItem(id, tab) {
  if (tab === 'weapons') STATE.equippedWeapon = id;
  else if (tab === 'skins') STATE.equippedSkin = id;
  saveState();
  renderShop();
}

function updateMenuCurrency() {
  const el1 = document.getElementById('menuStars');
  const el2 = document.getElementById('shopStars');
  if (el1) el1.textContent = STATE.stars;
  if (el2) el2.textContent = STATE.stars;
}
