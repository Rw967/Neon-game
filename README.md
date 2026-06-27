# 🎮 Caps – Anleitung

## 📥 Schritt 1 – ZIP herunterladen (GitHub)

1. Geh auf dein GitHub-Repository: `github.com/Rw967/Neon-Spiel`
2. Klicke oben rechts auf den grünen Button **`< > Code`**
3. Klicke auf **"Download ZIP"**
4. ZIP entpacken (Rechtsklick → "Alle extrahieren")

---

## 🖥️ Schritt 2 – Node.js installieren

1. Geh auf 👉 **https://nodejs.org**
2. Lade die **LTS-Version** runter (empfohlen)
3. Installiere sie normal (einfach "Weiter" klicken)
4. Terminal/CMD öffnen und prüfen:
   ```
   node --version
   ```
   Du siehst sowas wie `v20.11.0` ✅

---

## ▶️ Schritt 3 – Spiel starten

1. Entpackten Ordner `caps_game` öffnen
2. **Rechtsklick** im Ordner → "Im Terminal öffnen"
   (oder VS Code öffnen → Strg+Ö für Terminal)
3. Tippe:
   ```
   npm install
   ```
   (einmalig nötig, lädt express & ws)

4. Danach:
   ```
   npm start
   ```

5. Du siehst:
   ```
   ✅ NeonQuest Server läuft auf http://localhost:3000
   ```

6. Browser öffnen → **http://localhost:3000** → Fertig! 🎮

---

## 🌐 Schritt 4 – Online mit Freunden spielen

### Option A: Gleicher WLAN-Router

1. Deine IP herausfinden:
   - Windows: `ipconfig` im CMD → "IPv4-Adresse" (z.B. `192.168.1.5`)
2. Freund muss im Browser öffnen: `http://192.168.1.5:3000`
3. Im Spiel: Modus → Online → Du "Server hosten", Freund gibt Code ein

### Option B: Über das Internet (ngrok – kostenlos)

1. Geh auf **https://ngrok.com** → kostenloser Account
2. ngrok herunterladen und installieren
3. Im Terminal (während npm start läuft, neues Fenster):
   ```
   ngrok http 3000
   ```
4. Du bekommst eine URL wie `https://abc123.ngrok.io`
5. Diese URL an Freund schicken → er öffnet sie im Browser

---

## 📤 Schritt 5 – ZIP bei GitHub Release hochladen

1. Auf GitHub: Dein Repo → **"Releases"** (rechte Seite) → **"Neues Release"**
2. **Tag erstellen**: Klicke auf "Tag wählen" → tippe `v1.0` → "Neuen Tag erstellen"
3. **Titel**: z.B. `Caps v1.0 – Season 1`
4. **Beschreibung** (kopieren):
   ```
   ## 🎮 Caps – Version 1.0

   ### Was ist neu:
   - ✅ Hauptmenü mit Shop, Season Pass & Einstellungen
   - ✅ 4 Spielmodi: Solo, Blitz, Survival, Online-Multiplayer
   - ✅ 4 Waffen: Pistole, AK-47, Sniper, SMG
   - ✅ Aimbot im Shop verfügbar
   - ✅ Season Pass bis Level 100
   - ✅ Animierter Loading Screen (25 Sekunden)
   - ✅ 7 Musik-Tracks, automatisch weiter
   - ✅ Neon-Hintergrund mit Hexagonen

   ### Spielen:
   1. ZIP herunterladen
   2. npm install && npm start
   3. http://localhost:3000 öffnen
   ```
5. Unten: **"Binärdateien anhängen"** → `Caps_v2.zip` reinziehen
6. Klick: **"Veröffentlichung der Veröffentlichung"** (grüner Button)

---

## 🎮 Spielanleitung

| Taste | Aktion |
|-------|--------|
| WASD | Bewegen |
| Maus | Zielen |
| Linke Maustaste | Schießen |
| 1 / 2 / 3 | Waffe wechseln |
| P / Escape | Pause |
| Enter | Chat (Online) |

## ⚔️ Waffen

| Waffe | Schaden | Feuerrate | Shop-Preis |
|-------|---------|-----------|------------|
| 🔫 Pistole | 15 | Mittel | Kostenlos |
| 🪖 AK-47 | 30 | Vollautomatisch | 300 ⭐ |
| 🎯 Sniper | 80 | Langsam | 500 ⭐ |
| ⚡ SMG | 10 | Sehr schnell | 400 ⭐ |
| 🎯 Auto-Aim | - | (Aimbot) | 1000 ⭐ |
