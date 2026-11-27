// audio.js — procedural sound, no audio files: every gobble, whistle and
// sting is a few oscillators shaped in code, so the game stays asset-free.
//
// The context is created lazily on the first user gesture (browsers refuse
// sound before one) and every call is safe before that: it just stays quiet.

let context = null;
let muted = false;

export function unlockAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  context = new Ctor();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
  if (!context || muted) return;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain).connect(context.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function playGobble() {
  // A proud, wobbly gobble: five quick falling chirps.
  for (let i = 0; i < 5; i++) tone(620 - i * 40, 240, 0.07, 'sawtooth', 0.05, i * 0.055);
}

export function playSpotted() {
  tone(880, 880, 0.09, 'square', 0.06);
  tone(1174, 1174, 0.14, 'square', 0.06, 0.09);
}

export function playKnifeWhistle() {
  tone(1900, 3200, 0.16, 'sine', 0.035);
}

export function playThud() {
  tone(160, 55, 0.22, 'triangle', 0.16);
}

export function playCorn() {
  tone(740, 1180, 0.09, 'triangle', 0.07);
}

export function playCloseCall() {
  tone(520, 780, 0.1, 'triangle', 0.06);
  tone(780, 1040, 0.12, 'triangle', 0.06, 0.08);
}

export function playEscapeJingle() {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((n, i) => tone(n, n, 0.16, 'triangle', 0.08, i * 0.11));
}

export function playCaughtSting() {
  const notes = [392, 370, 349, 311];
  notes.forEach((n, i) => tone(n, n * 0.97, 0.22, 'sawtooth', 0.06, i * 0.16));
}
