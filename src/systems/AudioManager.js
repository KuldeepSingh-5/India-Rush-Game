import Phaser from 'phaser';

const STORAGE_KEYS = {
  music: 'india-rush-audio-music',
  sfx: 'india-rush-audio-sfx',
};

export default class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicEnabled = this.loadPref(STORAGE_KEYS.music, true);
    this.sfxEnabled = this.loadPref(STORAGE_KEYS.sfx, true);
    this.musicNodes = [];
    this.musicInterval = null;
    this.musicStep = 0;
    this.audioUnlocked = false;
  }

  loadPref(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      return v === 'true';
    } catch (e) {
      return fallback;
    }
  }

  savePref(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {
      // localStorage may be unavailable
    }
  }

  unlock() {
    if (this.audioUnlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.08;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.25;
      this.sfxGain.connect(this.ctx.destination);
      this.audioUnlocked = true;
    } catch (e) {
      // Web Audio not available
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    this.savePref(STORAGE_KEYS.music, enabled);
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.savePref(STORAGE_KEYS.sfx, enabled);
  }

  playSfx(name) {
    if (!this.sfxEnabled || !this.audioUnlocked || !this.ctx) return;
    this.resume();
    switch (name) {
      case 'coin': this.playCoin(); break;
      case 'jump': this.playJump(); break;
      case 'slide': this.playSlide(); break;
      case 'lane': this.playLane(); break;
      case 'crash': this.playCrash(); break;
      case 'gameover': this.playGameOver(); break;
      case 'click': this.playClick(); break;
      case 'powerupMagnet': this.playPowerUpMagnet(); break;
      case 'powerupShield': this.playPowerUpShield(); break;
      case 'powerupSpeed': this.playPowerUpSpeed(); break;
      case 'shieldBreak': this.playShieldBreak(); break;
    }
  }

  playTone(freq, duration, type, gainVal, startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainVal || 0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playCoin() {
    const t = this.ctx.currentTime;
    this.playTone(988, 0.08, 'square', 0.2, t);
    this.playTone(1319, 0.12, 'square', 0.2, t + 0.06);
  }

  playJump() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playSlide() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playLane() {
    const t = this.ctx.currentTime;
    this.playTone(500, 0.06, 'triangle', 0.15, t);
    this.playTone(700, 0.06, 'triangle', 0.15, t + 0.04);
  }

  playCrash() {
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.3);

    this.playTone(120, 0.25, 'square', 0.3, t);
  }

  playGameOver() {
    const t = this.ctx.currentTime;
    const notes = [440, 392, 349, 294];
    for (let i = 0; i < notes.length; i++) {
      this.playTone(notes[i], 0.3, 'triangle', 0.2, t + i * 0.18);
    }
  }

  playClick() {
    const t = this.ctx.currentTime;
    this.playTone(800, 0.04, 'square', 0.15, t);
    this.playTone(1000, 0.04, 'square', 0.15, t + 0.03);
  }

  playPowerUpMagnet() {
    const t = this.ctx.currentTime;
    this.playTone(523, 0.1, 'triangle', 0.2, t);
    this.playTone(659, 0.1, 'triangle', 0.2, t + 0.08);
    this.playTone(784, 0.15, 'triangle', 0.2, t + 0.16);
  }

  playPowerUpShield() {
    const t = this.ctx.currentTime;
    this.playTone(440, 0.12, 'sine', 0.2, t);
    this.playTone(554, 0.12, 'sine', 0.2, t + 0.06);
    this.playTone(659, 0.2, 'sine', 0.2, t + 0.12);
  }

  playPowerUpSpeed() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
    this.playTone(880, 0.15, 'square', 0.15, t + 0.1);
  }

  playShieldBreak() {
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.2);
    this.playTone(300, 0.15, 'triangle', 0.2, t);
    this.playTone(200, 0.2, 'triangle', 0.15, t + 0.05);
  }

  startMusic() {
    if (!this.musicEnabled || !this.audioUnlocked || !this.ctx) return;
    this.stopMusic();
    this.resume();

    const bpm = 120;
    const beatLen = 60 / bpm;
    const barLen = beatLen * 4;
    const melody = [
      [523, 0], [659, 0.5], [784, 1], [659, 1.5],
      [523, 2], [659, 2.5], [784, 3], [880, 3.5],
      [784, 4], [659, 4.5], [523, 5], [440, 5.5],
      [523, 6], [440, 6.5], [392, 7], [523, 7.5],
    ];
    const bass = [
      [131, 0], [131, 2], [165, 4], [147, 6],
    ];

    const scheduleBar = () => {
      const barStart = this.ctx.currentTime + 0.1;
      for (const [freq, beat] of melody) {
        const t = barStart + beat * beatLen;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 0.9);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + beatLen);
        this.musicNodes.push(osc);
      }
      for (const [freq, beat] of bass) {
        const t = barStart + beat * beatLen;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 2);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + beatLen * 2);
        this.musicNodes.push(osc);
      }
    };

    scheduleBar();
    this.musicInterval = setInterval(scheduleBar, barLen * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    for (const node of this.musicNodes) {
      try { node.stop(); } catch (e) { /* already stopped */ }
    }
    this.musicNodes = [];
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) { /* already closed */ }
      this.ctx = null;
    }
    this.audioUnlocked = false;
  }
}
