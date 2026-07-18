let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let mp3: HTMLAudioElement | null = null;
let synthNodes: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode }[] = [];
let started = false;
let muted = false;

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

  const scale = [0, 2, 3, 5, 7, 8, 10];
  const root = 220;
  const make = (semitone: number, detune: number, type: OscillatorType, baseGain: number, lfoRate: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = root * Math.pow(2, semitone / 12);
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

  const ney = make(0, 4, 'sine', 0.25, 0.18);
  const ney2 = make(7, -6, 'triangle', 0.16, 0.12);
  const drone = make(-12, 2, 'sawtooth', 0.08, 0.05);
  const bendir = make(12, 0, 'square', 0.04, 2.4);
  synthNodes = [ney, ney2, drone, bendir];
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

export function toggleMute(): boolean {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.18;
  if (mp3) mp3.muted = muted;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
