// ===== MUSIC.JS — Music Player =====
const TRACKS = [
  { name: 'Tycoons (AudioHub)', src: 'music/track1.mp3' },
  { name: 'Hawaii Vacation (Tvari)', src: 'music/track2.mp3' },
  { name: 'Lovesick (DJ PUMA)', src: 'music/track3.mp3' },
  { name: 'Mortals x Royalty (NCS)', src: 'music/track4.mp3' },
];

let currentTrack = 0;
let audio = new Audio();
let musicPlaying = false;
let seekDragging = false;

audio.volume = STATE.musicVol;

function loadTrack(index) {
  currentTrack = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
  audio.src = TRACKS[currentTrack].src;
  audio.load();
  const el = document.getElementById('trackName');
  if (el) el.textContent = TRACKS[currentTrack].name;
}

function playMusic() {
  audio.play().then(() => {
    musicPlaying = true;
    const btn = document.getElementById('playBtn');
    if (btn) btn.textContent = '⏸';
  }).catch(() => {});
}

function pauseMusic() {
  audio.pause();
  musicPlaying = false;
  const btn = document.getElementById('playBtn');
  if (btn) btn.textContent = '▶';
}

function toggleMusic() {
  if (musicPlaying) pauseMusic(); else playMusic();
}

function nextTrack() {
  loadTrack(currentTrack + 1);
  if (musicPlaying) playMusic();
}

function prevTrack() {
  // If more than 3 seconds in → restart, else go back
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadTrack(currentTrack - 1);
    if (musicPlaying) playMusic();
  }
}

function seekMusic(val) {
  if (audio.duration) {
    audio.currentTime = (val / 100) * audio.duration;
  }
}

function setMusicVol(val) {
  STATE.musicVol = val / 100;
  audio.volume = STATE.musicVol;
  const el = document.getElementById('musicVolVal');
  if (el) el.textContent = val + '%';
  saveState();
}

function setSfxVol(val) {
  STATE.sfxVol = val / 100;
  const el = document.getElementById('sfxVolVal');
  if (el) el.textContent = val + '%';
  saveState();
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Auto-next track
audio.addEventListener('ended', () => nextTrack());

// Update seek bar & time display
audio.addEventListener('timeupdate', () => {
  if (!audio.duration || seekDragging) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  const seek = document.getElementById('seekBar');
  if (seek) seek.value = pct;
  const now = document.getElementById('timeNow');
  if (now) now.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('durationchange', () => {
  const tot = document.getElementById('timeTotal');
  if (tot) tot.textContent = formatTime(audio.duration);
});

// Seek drag events
document.addEventListener('DOMContentLoaded', () => {
  const seek = document.getElementById('seekBar');
  if (seek) {
    seek.addEventListener('mousedown', () => seekDragging = true);
    seek.addEventListener('mouseup', () => { seekDragging = false; });
  }
});

// Init
loadTrack(0);
