export class AudioManager {
  constructor(eventBus, audioCtx) {
    this.audioCtx = audioCtx || null;
    this.osc = null;
    this.gain = null;
    this.filter = null;
    this.unsubs = [];

    this.unsubs.push(eventBus.on('screech', i => this.playScreechSound(i)));
    this.unsubs.push(eventBus.on('score', () => this.playScoreSound()));
    this.unsubs.push(eventBus.on('swap', () => this.playSwapSound()));
    this.unsubs.push(eventBus.on('levelUp', () => this.playLevelUpSound()));
    this.unsubs.push(eventBus.on('crash', () => this.playCrashSound()));
  }

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.osc = this.audioCtx.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 50;
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 150;
    this.gain = this.audioCtx.createGain();
    this.gain.gain.value = 0;
    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.audioCtx.destination);
    this.osc.start();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  setIntensity(numCars, avgSpeed, gameState) {
    if (!this.audioCtx || !this.gain) return;
    if (gameState !== 'PLAYING') {
      this.gain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.2);
      return;
    }
    this.gain.gain.setTargetAtTime(Math.min(0.2, numCars * 0.015), this.audioCtx.currentTime, 0.1);
    this.osc.frequency.setTargetAtTime(40 + avgSpeed * 12, this.audioCtx.currentTime, 0.1);
    this.filter.frequency.setTargetAtTime(100 + avgSpeed * 50, this.audioCtx.currentTime, 0.1);
  }

  playTone(freq, type, duration, vol = 0.1) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playSwapSound() {
    this.playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(600, 'sine', 0.1, 0.05), 100);
  }

  playScoreSound() {
    this.playTone(880, 'sine', 0.05, 0.02);
  }

  playScreechSound(intensity) {
    if (!this.audioCtx) return;
    const dur = 0.4;
    const bufferSize = this.audioCtx.sampleRate * dur;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, this.audioCtx.currentTime);
    filter.Q.value = 2;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(Math.min(intensity * 0.02, 0.15), this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start();
  }

  playLevelUpSound() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }

  playCrashSound() {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1);
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start();
  }

  dispose() {
    this.unsubs.forEach(fn => fn());
    this.unsubs = [];
    if (this.osc) { try { this.osc.stop(); } catch (_) {} this.osc.disconnect(); }
    if (this.gain) this.gain.disconnect();
    if (this.filter) this.filter.disconnect();
    if (this.audioCtx) this.audioCtx.close();
    this.audioCtx = null;
  }
}
