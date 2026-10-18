// Tiny WebAudio synth: no audio files needed.
let ctx: AudioContext | null = null;
let enabled = true;
let musicOn = false;
let musicTimer = 0;

function ac(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, when = 0): void {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  const t = a.currentTime + when;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  setEnabled(v: boolean) { enabled = v; },
  tap() { if (enabled) tone(660, 0.08, 'triangle'); },
  pop() { if (enabled) { tone(520, 0.06, 'sine'); tone(880, 0.1, 'sine', 0.06, 0.05); } },
  good() { if (enabled) [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.09)); },
  bad() { if (enabled) { tone(300, 0.15, 'sawtooth', 0.04); tone(220, 0.2, 'sawtooth', 0.04, 0.12); } },
  shutter() { if (enabled) { tone(1800, 0.03, 'square', 0.03); tone(900, 0.05, 'square', 0.03, 0.04); } },
  fanfare() { if (enabled) [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.07, i * 0.12)); },
};

const MELODY = [392, 440, 523, 440, 392, 330, 392, 0, 349, 392, 440, 392, 349, 294, 330, 0];
export function setMusic(on: boolean): void {
  musicOn = on;
  clearInterval(musicTimer);
  if (!on) return;
  let i = 0;
  musicTimer = window.setInterval(() => {
    if (!musicOn) return;
    const f = MELODY[i++ % MELODY.length];
    if (f) tone(f, 0.35, 'sine', 0.025);
    if (i % 4 === 1) tone(f / 2 || 196, 0.6, 'triangle', 0.02);
  }, 420);
}
