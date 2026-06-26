# Neon-game

# 🎮 NeonQuest – Setup & Start

## Was du brauchst
- **Node.js** (https://nodejs.org — LTS Version)
- **VS Code** (empfohlen)

## Schritt-für-Schritt Start

### 1. Node.js installieren
Geh auf https://nodejs.org und lade die **LTS**-Version runter. Installiere sie normal.

### 2. Abhängigkeiten installieren
Öffne einen Terminal / die VS Code-Konsole **in diesem Ordner** (`neonquest/`) und tippe:
```
npm install
```

### 3. Server starten
```
npm start
```

Du siehst dann:
```
✅ NeonQuest Server läuft auf http://localhost:3000
   WebSocket bereit für Multiplayer
```

### 4. Spiel öffnen
Öffne deinen Browser und geh auf:
```
http://localhost:3000
```

### 5. Freund einladen (Multiplayer)
- Du und dein Freund müssen im **selben Netzwerk (WLAN)** sein,  
  ODER du nutzt einen Tunneling-Service wie **ngrok** (kostenlos).
- Mit ngrok: `ngrok http 3000` → gibt dir eine öffentliche URL
- Im Spiel: Modus → Online → "Server hosten" → Code deinem Freund schicken
- Freund: Modus → Online → Code eingeben → Joinen

---

## Spielanleitung

| Taste | Aktion |
|-------|--------|
| WASD / Pfeiltasten | Bewegen |
| Maus | Zielen |
| Linke Maustaste | Schießen |
| 1 / 2 / 3 | Waffe wechseln |
| P / Escape | Pause |
| Enter (Online) | Chat |

## Waffen
| Waffe | Schaden | Feuerrate | Besonderheit |
|-------|---------|-----------|--------------|
| Pistole | 15 | Mittel | Immer verfügbar |
| AK-47 | 30 | Vollautomatisch | Shop: 300 ⭐ |
| Sniper | 80 | Langsam | Shop: 500 ⭐ |
| SMG | 10 | Sehr schnell | Shop: 400 ⭐ |

## Struktur
```
neonquest/
├── public/
│   ├── index.html       ← Hauptseite
│   ├── style.css        ← Alle Styles
│   ├── music/           ← MP3 Dateien
│   └── js/
│       ├── state.js     ← Spielstand & Speichern
│       ├── music.js     ← Musik-Player
│       ├── network.js   ← Multiplayer WebSocket
│       ├── shop.js      ← Shop-System
│       ├── season.js    ← Season Pass
│       ├── game.js      ← Game Engine
│       ├── ui.js        ← Menü-Navigation
│       └── main.js      ← Boot & Loading Screen
└── server/
    └── server.js        ← Node.js Backend
```
