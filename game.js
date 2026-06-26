// ===== GAME.JS — Core Game Engine =====
const GAME = (() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // ---- WEAPONS CONFIG ----
  const WEAPONS = {
    pistol:  { name:'Pistole', icon:'🔫', dmg:15, fireRate:300, auto:false, range:600, bulletSpeed:12, bulletSize:5, color:'#50c8ff' },
    ak47:    { name:'AK-47',   icon:'🪖', dmg:30, fireRate:120, auto:true,  range:700, bulletSpeed:16, bulletSize:5, color:'#ffd23c' },
    sniper:  { name:'Sniper',  icon:'🎯', dmg:80, fireRate:800, auto:false, range:1400, bulletSpeed:28, bulletSize:4, color:'#ff5082' },
    smg:     { name:'SMG',     icon:'⚡', dmg:10, fireRate:80,  auto:true,  range:450, bulletSpeed:18, bulletSize:4, color:'#3cff8c' },
  };

  const SKIN_COLORS = {
    default:'#50c8ff', skin_gold:'#ffd23c', skin_red:'#ff4646',
    skin_green:'#3cff8c', skin_purple:'#b450ff', skin_rainbow:null
  };

  // ---- STATE ----
  let running = false;
  let animFrame = null;
  let lastTime = 0;
  let lastShot = 0;
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  let shootHeld = false;
  let blitzTimer = 120; // 2 min in seconds
  let blitzInterval = null;

  let player, enemies, bullets, particles, items;
  let wave, killCount, spawnTimer, enemiesInWave;
  let shieldHp = 0;
  let doubleStars = false;
  let rageDmg = false;
  let currentWeaponIdx = 0;
  let availableWeapons = [];
  let rainbowHue = 0;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function init(mode) {
    resize();
    running = true;
    wave = 1;
    killCount = 0;
    spawnTimer = 0;
    enemiesInWave = 3;
    bullets = [];
    particles = [];
    items = [];
    enemies = [];
    STATE.currentScore = 0;
    shieldHp = STATE.ownedBoosts.includes('boost_shield') ? 50 : 0;
    doubleStars = STATE.ownedBoosts.includes('boost_double');
    rageDmg = STATE.ownedBoosts.includes('boost_rage');

    // Available weapons
    availableWeapons = ['pistol'];
    if (STATE.ownedWeapons.includes('ak47')) availableWeapons[1] = 'ak47';
    if (STATE.ownedWeapons.includes('sniper') || STATE.ownedWeapons.includes('smg'))
      availableWeapons[2] = STATE.ownedWeapons.includes('sniper') ? 'sniper' : 'smg';

    currentWeaponIdx = 0;

    // Player
    const spd = STATE.ownedBoosts.includes('boost_speed') ? 7 : 5;
    const maxHp = STATE.ownedBoosts.includes('boost_hp') ? 150 : 100;
    player = {
      x: canvas.width / 2, y: canvas.height / 2,
      radius: 20, speed: spd, hp: maxHp, maxHp,
      color: SKIN_COLORS[STATE.equippedSkin] || '#50c8ff',
    };

    // Spawn initial items
    for (let i = 0; i < 8; i++) spawnItem();

    // Update HUD weapon slots
    updateWeaponSlots();

    // Blitz mode timer
    if (mode === 'blitz') {
      blitzTimer = 120;
      document.getElementById('hudTimer').style.display = 'block';
      blitzInterval = setInterval(() => {
        blitzTimer--;
        const m = Math.floor(blitzTimer / 60);
        const s = blitzTimer % 60;
        const el = document.getElementById('hudTimerVal');
        if (el) el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
        if (blitzTimer <= 0) endGame();
      }, 1000);
    } else {
      document.getElementById('hudTimer').style.display = 'none';
    }

    // Chat box for online
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.style.display = STATE.isOnline ? 'block' : 'none';
    const mpSb = document.getElementById('hud-bottomright');
    if (mpSb) mpSb.style.display = STATE.isOnline ? 'block' : 'none';

    if (animFrame) cancelAnimationFrame(animFrame);
    lastTime = performance.now();
    loop(lastTime);
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;
    update(dt, timestamp);
    draw();
    animFrame = requestAnimationFrame(loop);
  }

  // ---- UPDATE ----
  function update(dt, now) {
    if (STATE.equippedSkin === 'skin_rainbow') rainbowHue = (rainbowHue + 2) % 360;

    movePlayer(dt);
    handleShooting(now);
    moveBullets(dt);
    moveEnemies(dt);
    checkCollisions();
    updateParticles(dt);
    updateItems(dt);
    spawnLogic(dt);
    updateHUD();
    if (STATE.isOnline) syncOnline();
  }

  function movePlayer(dt) {
    const keys = window._keys || {};
    if (keys['w'] || keys['ArrowUp'])    player.y -= player.speed * dt;
    if (keys['s'] || keys['ArrowDown'])  player.y += player.speed * dt;
    if (keys['a'] || keys['ArrowLeft'])  player.x -= player.speed * dt;
    if (keys['d'] || keys['ArrowRight']) player.x += player.speed * dt;
    player.x = Math.max(player.radius, Math.min(canvas.width  - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  }

  function handleShooting(now) {
    const wid = availableWeapons[currentWeaponIdx];
    if (!wid) return;
    const w = WEAPONS[wid];
    if ((shootHeld || window._shootOnce) && now - lastShot > w.fireRate) {
      const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
      shoot(player.x, player.y, angle, wid);
      if (STATE.isOnline) sendShoot(player.x, player.y, angle, wid);
      lastShot = now;
      window._shootOnce = false;
    }
  }

  function shoot(x, y, angle, weaponId) {
    const w = WEAPONS[weaponId] || WEAPONS.pistol;
    const dmg = rageDmg ? w.dmg * 1.5 : w.dmg;
    // Add slight spread for auto weapons
    const spread = (weaponId === 'smg' || weaponId === 'ak47') ? (Math.random() - 0.5) * 0.08 : 0;
    bullets.push({
      x, y,
      vx: Math.cos(angle + spread) * w.bulletSpeed,
      vy: Math.sin(angle + spread) * w.bulletSpeed,
      color: w.color, size: w.bulletSize,
      dmg, range: w.range, traveled: 0,
      fromPlayer: true
    });
    // Muzzle flash
    for (let i = 0; i < 5; i++) spawnParticle(x, y, w.color, 2, 0.3);
  }

  function moveBullets(dt) {
    bullets = bullets.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.traveled += Math.hypot(b.vx * dt, b.vy * dt);
      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
      if (b.traveled > b.range) return false;
      return true;
    });
  }

  function moveEnemies(dt) {
    enemies.forEach(e => {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    });
  }

  function checkCollisions() {
    // Bullets vs enemies
    bullets.forEach((b, bi) => {
      if (!b.fromPlayer) return;
      enemies.forEach((e, ei) => {
        if (!e.alive) return;
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.size + e.radius) {
          e.hp -= b.dmg;
          bullets.splice(bi, 1);
          for (let i = 0; i < 8; i++) spawnParticle(e.x, e.y, e.color, 3, 0.5);
          if (e.hp <= 0) {
            e.alive = false;
            killCount++;
            const pts = 50 * wave * (doubleStars ? 2 : 1);
            STATE.currentScore += pts;
            showFloatingText(e.x, e.y, `+${pts}`, '#ffd23c');
          }
        }
      });
    });

    // Enemies vs player
    enemies.forEach(e => {
      if (!e.alive) return;
      if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
        if (shieldHp > 0) {
          shieldHp -= 0.3;
        } else {
          player.hp -= 0.4;
        }
        if (player.hp <= 0) endGame();
      }
    });

    // Remote bullet vs local player
    bullets.forEach((b, bi) => {
      if (b.fromPlayer) return;
      if (Math.hypot(b.x - player.x, b.y - player.y) < b.size + player.radius) {
        takeHit(b.dmg);
        bullets.splice(bi, 1);
      }
    });

    // Player vs items
    items.forEach(item => {
      if (!item.active) return;
      if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius ||
          STATE.ownedBoosts.includes('boost_magnet') && Math.hypot(player.x - item.x, player.y - item.y) < 120) {
        // Magnet pull
        if (STATE.ownedBoosts.includes('boost_magnet') && Math.hypot(player.x - item.x, player.y - item.y) >= player.radius + item.radius) {
          const ang = Math.atan2(player.y - item.y, player.x - item.x);
          item.x += Math.cos(ang) * 4;
          item.y += Math.sin(ang) * 4;
          return;
        }
        item.active = false;
        const pts = 20 * (doubleStars ? 2 : 1);
        STATE.currentScore += pts;
        showFloatingText(item.x, item.y, `+${pts}`, '#ffd23c');
        for (let i = 0; i < 6; i++) spawnParticle(item.x, item.y, '#ffd23c', 3, 0.5);
        setTimeout(() => spawnItem(), 3000);
      }
    });

    enemies = enemies.filter(e => e.alive);
  }

  function spawnLogic(dt) {
    spawnTimer += dt;
    const interval = Math.max(60 - wave * 4, 20);
    if (spawnTimer >= interval) {
      spawnTimer = 0;
      const count = Math.min(wave, 3);
      for (let i = 0; i < count; i++) spawnEnemy();
    }
    if (enemies.length === 0 && killCount >= enemiesInWave) {
      wave++;
      enemiesInWave = 3 + wave * 2;
      STATE.currentWave = wave;
      for (let i = 0; i < Math.min(wave + 2, 6); i++) spawnEnemy();
      showFloatingText(canvas.width/2, canvas.height/2 - 60, `⚡ Welle ${wave}!`, '#b450ff');
    }
  }

  function spawnEnemy() {
    // Spawn at edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random()*canvas.width; y = -30; }
    else if (side === 1) { x = canvas.width+30; y = Math.random()*canvas.height; }
    else if (side === 2) { x = Math.random()*canvas.width; y = canvas.height+30; }
    else { x = -30; y = Math.random()*canvas.height; }

    const hp = 30 + wave * 15;
    enemies.push({
      x, y, alive: true,
      radius: 14 + Math.min(wave, 5),
      speed: 1.5 + wave * 0.15 + Math.random(),
      hp, maxHp: hp,
      color: wave > 5 ? '#b450ff' : '#ff5082',
    });
  }

  function spawnItem() {
    items.push({
      x: 60 + Math.random() * (canvas.width - 120),
      y: 60 + Math.random() * (canvas.height - 120),
      radius: 10, active: true, pulse: 0
    });
  }

  // Remote bullet
  function spawnRemoteBullet(msg) {
    const w = WEAPONS[msg.weapon] || WEAPONS.pistol;
    bullets.push({
      x: msg.x, y: msg.y,
      vx: Math.cos(msg.angle) * w.bulletSpeed,
      vy: Math.sin(msg.angle) * w.bulletSpeed,
      color: '#ff5082', size: w.bulletSize,
      dmg: w.dmg, range: w.range, traveled: 0,
      fromPlayer: false
    });
  }

  function takeHit(dmg) {
    if (shieldHp > 0) { shieldHp = Math.max(0, shieldHp - dmg); return; }
    player.hp = Math.max(0, player.hp - dmg);
    if (player.hp <= 0) endGame();
  }

  // ---- PARTICLES ----
  function spawnParticle(x, y, color, size, life) {
    if (!STATE.particlesOn) return;
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*5,
      vy: (Math.random()-0.5)*5,
      color, size,
      life, maxLife: life
    });
  }

  function updateParticles(dt) {
    particles = particles.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= 0.04 * dt;
      return p.life > 0;
    });
  }

  function updateItems(dt) {
    items.forEach(i => { if (i.active) i.pulse = (i.pulse + 0.05 * dt) % (Math.PI * 2); });
  }

  // ---- FLOATING TEXT ----
  const floatingTexts = [];
  function showFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1, vy: -1.5 });
  }

  // ---- DRAW ----
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BG grid
    drawGrid();

    // Items
    items.forEach(item => {
      if (!item.active) return;
      const glow = 8 + Math.sin(item.pulse) * 4;
      ctx.save();
      ctx.shadowBlur = glow; ctx.shadowColor = '#ffd23c';
      ctx.fillStyle = '#ffd23c';
      ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⭐', item.x, item.y);
      ctx.restore();
    });

    // Enemies
    enemies.forEach(e => {
      if (!e.alive) return;
      ctx.save();
      ctx.shadowBlur = 16; ctx.shadowColor = e.color;
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2); ctx.fill();
      // HP bar above
      const bw = e.radius * 2.2;
      ctx.fillStyle = '#1a2040';
      ctx.fillRect(e.x - bw/2, e.y - e.radius - 10, bw, 5);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - bw/2, e.y - e.radius - 10, bw * (e.hp/e.maxHp), 5);
      ctx.restore();
    });

    // Remote players
    if (STATE.isOnline) {
      Object.entries(remotePlayers).forEach(([id, p]) => {
        ctx.save();
        ctx.shadowBlur = 16; ctx.shadowColor = '#ff5082';
        ctx.fillStyle = '#ff5082';
        ctx.beginPath(); ctx.arc(p.x||0, p.y||0, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f0f5ff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.name||'?', p.x||0, (p.y||0) - 28);
        ctx.restore();
      });
    }

    // Player
    const pColor = STATE.equippedSkin === 'skin_rainbow'
      ? `hsl(${rainbowHue},100%,60%)` : player.color;
    ctx.save();
    // Shield aura
    if (shieldHp > 0) {
      ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(80,200,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.shadowBlur = 20; ctx.shadowColor = pColor;
    ctx.fillStyle = pColor;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // Name tag
    ctx.fillStyle = '#f0f5ff'; ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(STATE.playerName, player.x, player.y - 28);

    // Bullets
    bullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // Particles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // Floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ctx.save(); ctx.globalAlpha = ft.life;
      ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8; ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      ft.y += ft.vy; ft.life -= 0.025;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Crosshair & Visier
    drawCrosshair();
    if (enemies.length > 0) drawVisier();
  }

  function drawGrid() {
    ctx.save(); ctx.strokeStyle = 'rgba(80,200,255,0.04)'; ctx.lineWidth = 1;
    const gs = 60;
    for (let x = 0; x < canvas.width; x += gs) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gs) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrosshair() {
    const style = STATE.crosshairStyle;
    const x = mouseX, y = mouseY, s = 12;
    ctx.save();
    ctx.strokeStyle = '#f0f5ff'; ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6; ctx.shadowColor = '#50c8ff';

    if (style === 'cross') {
      ctx.beginPath(); ctx.moveTo(x-s,y); ctx.lineTo(x-4,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+4,y); ctx.lineTo(x+s,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,y-s); ctx.lineTo(x,y-4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x,y+s); ctx.stroke();
    } else if (style === 'dot') {
      ctx.fillStyle = '#f0f5ff';
      ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
    } else if (style === 'circle') {
      ctx.beginPath(); ctx.arc(x,y,s,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function drawVisier() {
    // Find closest enemy for aim assist indicator
    let closest = null, minDist = Infinity;
    enemies.forEach(e => {
      const d = Math.hypot(mouseX - e.x, mouseY - e.y);
      if (d < minDist) { minDist = d; closest = e; }
    });
    if (!closest || minDist > 80) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,80,130,0.7)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff5082';
    ctx.beginPath(); ctx.arc(closest.x, closest.y, closest.radius + 8, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // ---- HUD ----
  function updateHUD() {
    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    const hpFill = document.getElementById('hudHp');
    if (hpFill) hpFill.style.width = hpPct + '%';
    const hpTxt = document.getElementById('hudHpText');
    if (hpTxt) hpTxt.textContent = Math.ceil(player.hp);

    const sc = document.getElementById('hudScore');
    if (sc) sc.textContent = STATE.currentScore.toLocaleString();

    const wv = document.getElementById('hudWave');
    if (wv) wv.textContent = wave;

    const wid = availableWeapons[currentWeaponIdx];
    const w = WEAPONS[wid] || WEAPONS.pistol;
    const hwEl = document.getElementById('hudWeapon');
    if (hwEl) hwEl.textContent = `${w.icon} ${w.name}`;

    // MP Scoreboard
    if (STATE.isOnline) {
      const rows = [
        `<div class="mp-player-row"><span class="mp-player-name" style="color:var(--accent)">${STATE.playerName} (Du)</span><span class="mp-player-score">${STATE.currentScore}</span></div>`,
        ...Object.entries(remotePlayers).map(([id, p]) =>
          `<div class="mp-player-row"><span class="mp-player-name">${p.name||'?'}</span><span class="mp-player-score">${p.score||0}</span></div>`)
      ];
      const sb = document.getElementById('mpScoreboard');
      if (sb) sb.innerHTML = rows.join('');
    }
  }

  function updateWeaponSlots() {
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`ws${i}`);
      if (!slot) continue;
      const wid = availableWeapons[i];
      if (!wid) { slot.classList.add('locked'); slot.querySelector('.wslot-icon').textContent = '🔒'; continue; }
      slot.classList.remove('locked');
      slot.querySelector('.wslot-icon').textContent = WEAPONS[wid].icon;
      if (i === currentWeaponIdx) slot.classList.add('active');
      else slot.classList.remove('active');
    }
  }

  function switchWeapon(idx) {
    if (availableWeapons[idx]) {
      currentWeaponIdx = idx;
      updateWeaponSlots();
    }
  }

  // ---- SYNC ONLINE ----
  function syncOnline() {
    sendPosition({ x: player.x, y: player.y, score: STATE.currentScore, hp: player.hp,
      weapon: availableWeapons[currentWeaponIdx], name: STATE.playerName });
  }

  // ---- END GAME ----
  function endGame() {
    running = false;
    cancelAnimationFrame(animFrame);
    if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }

    const oldLevel = STATE.seasonLevel;
    const starsEarned = awardRound(STATE.currentScore, killCount);
    checkSeasonRewards(oldLevel, STATE.seasonLevel);

    document.getElementById('deathScore').textContent = STATE.currentScore.toLocaleString();
    const hs = document.getElementById('deathHs');
    if (hs) hs.textContent = STATE.highscore > STATE.currentScore ? `Highscore: ${STATE.highscore.toLocaleString()}` : '🏆 Neuer Highscore!';
    document.getElementById('deathStars').textContent = starsEarned;
    document.getElementById('deathScreen').style.display = 'flex';
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animFrame);
    if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }
  }

  // ---- INPUT ----
  window._keys = {};
  window.addEventListener('keydown', e => {
    window._keys[e.key] = true;
    if (e.key === '1') switchWeapon(0);
    if (e.key === '2') switchWeapon(1);
    if (e.key === '3') switchWeapon(2);
  });
  window.addEventListener('keyup', e => { window._keys[e.key] = false; });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { shootHeld = true; window._shootOnce = true; }
  });
  canvas.addEventListener('mouseup', e => {
    if (e.button === 0) shootHeld = false;
  });

  window.addEventListener('resize', resize);

  return { init, stop, spawnRemoteBullet, takeHit, switchWeapon };
})();

function switchWeapon(idx) { GAME.switchWeapon(idx); }
