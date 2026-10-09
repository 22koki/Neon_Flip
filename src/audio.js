/**
 * Tiny synthesizer for an asset-free game. Audio only begins after a user gesture.
 * All sounds are generated through the Web Audio API — no external media calls.
 */
export class AudioEngine {
  constructor() {
    let stored = null;
    try { stored = localStorage.getItem('neon-flip-muted'); } catch { /* ignored */ }
    this.muted = stored === 'true';
    this.context = null;
  }
  unlock() {
    if (this.muted) return;
    try {
      if (!this.context) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (Context) this.context = new Context();
      }
      if (this.context && this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { /* unsupported browser */ }
  }
  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('neon-flip-muted', String(this.muted)); } catch { /* ignored */ }
    if (!this.muted) this.unlock();
  }
  note(freq, length = .12, type = 'sine', volume = .045, target = null, delay = 0) {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (target) osc.frequency.exponentialRampToValueAtTime(Math.max(30, target), start + length);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.018, length / 3));
    gain.gain.exponentialRampToValueAtTime(.001, start + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length + .02);
  }
  play(name) {
    switch (name) {
      case 'start':
        this.note(220, .19, 'triangle', .05, 400);
        this.note(440, .22, 'sine', .05, 620, .11);
        break;
      case 'flip':
        this.note(290, .17, 'sawtooth', .024, 750);
        this.note(680, .2, 'sine', .035, 240, .03);
        break;
      case 'jump':
        this.note(280, .16, 'sine', .055, 490);
        break;
      case 'dash':
        this.note(140, .25, 'sawtooth', .032, 70);
        this.note(720, .12, 'triangle', .05, 1100);
        break;
      case 'crystal':
        this.note(780, .11, 'sine', .05, 1040);
        this.note(1200, .16, 'sine', .03, null, .07);
        break;
      case 'hurt':
        this.note(210, .38, 'sawtooth', .055, 55);
        this.note(95, .25, 'triangle', .07, 44, .08);
        break;
      case 'restore':
        this.note(270, .2, 'triangle', .04, 520);
        this.note(490, .24, 'triangle', .05, 820, .13);
        break;
      case 'checkpoint':
      case 'sector':
        this.note(380, .17, 'sine', .04, 450);
        this.note(560, .17, 'sine', .04, 670, .13);
        this.note(760, .25, 'sine', .04, 960, .26);
        break;
      case 'lose':
        this.note(430, .36, 'triangle', .06, 260);
        this.note(220, .45, 'triangle', .05, 90, .28);
        break;
      case 'win':
        [523, 659, 784, 1047, 1319].forEach((freq, i) =>
          this.note(freq, .31, 'sine', .055, freq * 1.08, i * .12));
        break;
      default: break;
    }
  }
}
