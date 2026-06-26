// ===== NETWORK.JS — Multiplayer WebSocket =====
let ws = null;
let myPlayerId = null;
let myLobbyCode = null;
let isHost = false;
const remotePlayers = {}; // id -> data

function connectWS(onOpen) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onopen = () => { if (onOpen) onOpen(); };
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
  ws.onclose = () => { setOnlineStatus('Verbindung getrennt.'); };
  ws.onerror = () => { setOnlineStatus('Verbindungsfehler!'); };
}

function sendWS(msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function hostGame() {
  const name = document.getElementById('playerNameInput').value.trim() || STATE.playerName;
  STATE.playerName = name;
  setOnlineStatus('Verbinde...');
  connectWS(() => {
    sendWS({ type: 'HOST', name });
  });
}

function joinGame() {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (!code || code.length < 4) { setOnlineStatus('Bitte gib einen Code ein!'); return; }
  const name = document.getElementById('playerNameInput').value.trim() || STATE.playerName;
  STATE.playerName = name;
  setOnlineStatus('Verbinde...');
  connectWS(() => {
    sendWS({ type: 'JOIN', code, name });
  });
}

function startOnlineGame() {
  sendWS({ type: 'START_GAME' });
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'HOSTED':
      myPlayerId = msg.playerId;
      myLobbyCode = msg.code;
      isHost = true;
      document.getElementById('lobby-display').style.display = 'block';
      document.getElementById('lobbyCodeText').textContent = msg.code;
      document.getElementById('startGameBtn').style.display = 'block';
      setOnlineStatus(`✅ Server gehostet! Code: ${msg.code}`);
      break;

    case 'JOINED':
      myPlayerId = msg.playerId;
      myLobbyCode = msg.code;
      isHost = false;
      document.getElementById('lobby-display').style.display = 'block';
      document.getElementById('lobbyCodeText').textContent = msg.code;
      setOnlineStatus('✅ Beigetreten! Warte auf Host...');
      break;

    case 'LOBBY_STATE':
      updateLobbyDisplay(msg.players);
      break;

    case 'PLAYER_JOINED':
      setOnlineStatus(`👋 ${msg.name} ist beigetreten!`);
      break;

    case 'PLAYER_LEFT':
      delete remotePlayers[msg.id];
      setOnlineStatus(`${msg.name} hat verlassen.`);
      break;

    case 'GAME_START':
      STATE.isOnline = true;
      STATE.currentMode = 'online';
      startGame();
      break;

    case 'PLAYER_UPDATE':
      remotePlayers[msg.id] = Object.assign(remotePlayers[msg.id] || {}, msg.data);
      break;

    case 'BULLET':
      if (window.GAME) GAME.spawnRemoteBullet(msg);
      break;

    case 'PLAYER_HIT':
      if (msg.id === myPlayerId && window.GAME) GAME.takeHit(msg.damage);
      break;

    case 'CHAT':
      appendChat(msg.from, msg.text);
      break;

    case 'ERROR':
      setOnlineStatus('❌ ' + msg.msg);
      break;
  }
}

function sendPosition(data) {
  sendWS({ type: 'UPDATE', data });
}

function sendShoot(x, y, angle, weapon) {
  sendWS({ type: 'SHOOT', x, y, angle, weapon });
}

function sendHit(targetId, damage) {
  sendWS({ type: 'HIT', targetId, damage });
}

function sendChat(text) {
  sendWS({ type: 'CHAT', text });
}

function setOnlineStatus(text) {
  const el = document.getElementById('online-status');
  if (el) el.textContent = text;
}

function updateLobbyDisplay(players) {
  const el = document.getElementById('lobby-players');
  if (!el) return;
  el.innerHTML = players.map(p =>
    `<div class="lobby-player-row">
      <span style="color:${p.color}">●</span>
      <span>${p.name}</span>
      ${p.id === myPlayerId ? '<span style="color:var(--accent);font-size:11px">(Du)</span>' : ''}
    </div>`
  ).join('');
}

function copyCode() {
  if (myLobbyCode) {
    try { navigator.clipboard.writeText(myLobbyCode); } catch(e) {}
    setOnlineStatus(`📋 Code "${myLobbyCode}" kopiert!`);
  }
}

function appendChat(from, text) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="chat-msg-name">${from}:</span> ${text}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Chat input handler
document.addEventListener('keydown', (e) => {
  const input = document.getElementById('chatInput');
  if (!input || !STATE.isOnline) return;
  if (document.activeElement === input && e.key === 'Enter') {
    const text = input.value.trim();
    if (text) { sendChat(text); input.value = ''; }
  }
  if (e.key === 'Enter' && document.activeElement !== input) {
    input.focus();
  }
});
