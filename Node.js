const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

// --- LOBBY SYSTEM ---
const lobbies = {}; // code -> { players: {id -> {ws, data}}, host }

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function broadcast(lobby, message, excludeId = null) {
  for (const [id, p] of Object.entries(lobby.players)) {
    if (id !== excludeId && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(message));
    }
  }
}

function getLobbyState(lobby) {
  return Object.entries(lobby.players).map(([id, p]) => ({
    id,
    name: p.data.name,
    score: p.data.score,
    hp: p.data.hp,
    x: p.data.x,
    y: p.data.y,
    weapon: p.data.weapon,
    color: p.data.color
  }));
}

wss.on('connection', (ws) => {
  const playerId = uuidv4();
  let currentLobbyCode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'HOST': {
        const code = generateCode();
        lobbies[code] = {
          players: {},
          host: playerId,
          started: false
        };
        lobbies[code].players[playerId] = {
          ws,
          data: { name: msg.name || 'Host', score: 0, hp: 100, x: 640, y: 360, weapon: 'pistol', color: '#50c8ff' }
        };
        currentLobbyCode = code;
        ws.send(JSON.stringify({ type: 'HOSTED', code, playerId }));
        break;
      }

      case 'JOIN': {
        const code = msg.code?.toUpperCase();
        if (!lobbies[code]) {
          ws.send(JSON.stringify({ type: 'ERROR', msg: 'Lobby nicht gefunden!' }));
          return;
        }
        if (lobbies[code].started) {
          ws.send(JSON.stringify({ type: 'ERROR', msg: 'Spiel läuft bereits!' }));
          return;
        }
        lobbies[code].players[playerId] = {
          ws,
          data: { name: msg.name || 'Spieler', score: 0, hp: 100, x: 200, y: 200, weapon: 'pistol', color: '#ff5082' }
        };
        currentLobbyCode = code;
        ws.send(JSON.stringify({ type: 'JOINED', code, playerId }));
        broadcast(lobbies[code], { type: 'PLAYER_JOINED', id: playerId, name: msg.name }, playerId);
        // Send current state to new player
        ws.send(JSON.stringify({ type: 'LOBBY_STATE', players: getLobbyState(lobbies[code]) }));
        break;
      }

      case 'START_GAME': {
        const lobby = lobbies[currentLobbyCode];
        if (!lobby || lobby.host !== playerId) return;
        lobby.started = true;
        for (const p of Object.values(lobby.players)) {
          if (p.ws.readyState === 1) {
            p.ws.send(JSON.stringify({ type: 'GAME_START' }));
          }
        }
        break;
      }

      case 'UPDATE': {
        const lobby = lobbies[currentLobbyCode];
        if (!lobby?.players[playerId]) return;
        Object.assign(lobby.players[playerId].data, msg.data);
        broadcast(lobby, { type: 'PLAYER_UPDATE', id: playerId, data: msg.data }, playerId);
        break;
      }

      case 'SHOOT': {
        const lobby = lobbies[currentLobbyCode];
        if (!lobby) return;
        broadcast(lobby, { type: 'BULLET', from: playerId, x: msg.x, y: msg.y, angle: msg.angle, weapon: msg.weapon }, playerId);
        break;
      }

      case 'HIT': {
        const lobby = lobbies[currentLobbyCode];
        if (!lobby) return;
        const target = lobby.players[msg.targetId];
        if (target) {
          target.data.hp -= msg.damage;
          broadcast(lobby, { type: 'PLAYER_HIT', id: msg.targetId, hp: target.data.hp, damage: msg.damage });
        }
        break;
      }

      case 'CHAT': {
        const lobby = lobbies[currentLobbyCode];
        if (!lobby) return;
        broadcast(lobby, { type: 'CHAT', from: lobby.players[playerId]?.data.name || 'Anon', text: msg.text });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!currentLobbyCode || !lobbies[currentLobbyCode]) return;
    const lobby = lobbies[currentLobbyCode];
    const name = lobby.players[playerId]?.data.name;
    delete lobby.players[playerId];
    broadcast(lobby, { type: 'PLAYER_LEFT', id: playerId, name });
    if (Object.keys(lobby.players).length === 0) {
      delete lobbies[currentLobbyCode];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ NeonQuest Server läuft auf http://localhost:${PORT}`);
  console.log(`   WebSocket bereit für Multiplayer`);
});
