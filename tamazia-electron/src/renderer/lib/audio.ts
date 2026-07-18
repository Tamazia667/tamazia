let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let mp3: HTMLAudioElement | null = null;
let synthNodes: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode }[] = [];
let started = false;
let muted = false;
let clickBound = false;

function ensureCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function startSynth(): void {
  const ctx = ensureCtx();
  if (!masterGain) return;
  ctx.resume();

  const make = (semitone: number, detune: number, type: OscillatorType, baseGain: number, lfoRate: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = 174 * Math.pow(2, semitone / 12);
    osc.detune.value = detune;
    const gain = ctx.createGain();
    gain.gain.value = baseGain;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = baseGain * 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start();
    lfo.start();
    return { osc, lfo, gain };
  };

  const pad1 = make(0, 3, 'sine', 0.20, 0.08);
  const pad2 = make(7, -4, 'triangle', 0.13, 0.06);
  const sub = make(-12, 1, 'sine', 0.06, 0.03);
  const shimmer = make(12, 0, 'sine', 0.03, 0.4);
  synthNodes = [pad1, pad2, sub, shimmer];
}

function stopSynth(): void {
  synthNodes.forEach((n) => {
    try { n.osc.stop(); n.lfo.stop(); } catch {}
  });
  synthNodes = [];
}

function startMp3(): boolean {
  try {
    mp3 = new Audio('assets/sahara.mp3');
    mp3.loop = true;
    mp3.volume = 0.5;
    mp3.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function startAmbience(): void {
  if (started) return;
  started = true;
  const ok = startMp3();
  if (!ok) startSynth();
}

function now(): number {
  return ensureCtx().currentTime;
}

function envTone(freq: number, dur: number, type: OscillatorType, peak: number, slideTo?: number): void {
  const ctx = ensureCtx();
  if (!masterGain) return;
  const t = now();
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBuffer(dur: number): AudioBuffer {
  const ctx = ensureCtx();
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playDrum(): void {
  const ctx = ensureCtx();
  if (!masterGain) return;
  const t = now();
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(0.25);
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(800, t);
  filt.frequency.exponentialRampToValueAtTime(120, t + 0.2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  src.connect(filt); filt.connect(g); g.connect(masterGain);
  src.start(t); src.stop(t + 0.25);
}

export function playFlute(): void {
  ensureCtx().resume();
  envTone(440, 0.5, 'sine', 0.22, 660);
  setTimeout(() => envTone(587, 0.4, 'triangle', 0.16), 160);
}

export function playClick(): void {
  ensureCtx().resume();
  envTone(880, 0.08, 'square', 0.12, 440);
  playDrum();
}

export function playSplash(): void {
  ensureCtx().resume();
  playDrum();
  setTimeout(() => envTone(330, 0.6, 'sine', 0.22, 494), 120);
  setTimeout(() => envTone(494, 0.5, 'triangle', 0.16, 660), 420);
}

export function attachClickSound(): void {
  if (clickBound) return;
  clickBound = true;
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (!el) return;
    if (el.closest('input, textarea, [role="slider"], button[data-no-sound]')) return;
    playClick();
  }, true);
}

export function toggleMute(): boolean {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.18;
  if (mp3) mp3.muted = muted;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
