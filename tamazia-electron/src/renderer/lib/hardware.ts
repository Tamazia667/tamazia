export interface HardwareProfile {
  gpu: string;
  gpuVendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown';
  vramMb: number;
  cpuCores: number;
  ramMb: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  webgl2: boolean;
}

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface QualitySettings {
  tier: QualityTier;
  shadows: boolean;
  shadowMapSize: number;
  pixelRatioCap: number;
  postProcessing: boolean;
  particleCount: number;
  lodBias: number;
  antialias: boolean;
}

export function detectVendor(gpu: string): HardwareProfile['gpuVendor'] {
  const g = gpu.toLowerCase();
  if (g.includes('nvidia')) return 'nvidia';
  if (g.includes('amd') || g.includes('radeon') || g.includes('rx ')) return 'amd';
  if (g.includes('intel')) return 'intel';
  if (g.includes('apple') || g.includes('m1') || g.includes('m2') || g.includes('m3')) return 'apple';
  return 'unknown';
}

export function detectHardware(): HardwareProfile {
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
  let gpu = 'inconnu';
  let webgl2 = false;
  if (gl) {
    webgl2 = typeof (gl as any).createVertexArray === 'function';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) gpu = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'inconnu');
  }
  const vramMb = estimateVram(gpu);
  return {
    gpu,
    gpuVendor: detectVendor(gpu),
    vramMb,
    cpuCores: navigator.hardwareConcurrency || 4,
    ramMb: (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 1024 : 4096,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    webgl2,
  };
}

function estimateVram(gpu: string): number {
  const g = gpu.toLowerCase();
  if (g.includes('rtx 40') || g.includes('rx 7')) return 16384;
  if (g.includes('rtx 30') || g.includes('rx 6')) return 12288;
  if (g.includes('rtx 20') || g.includes('gtx 16') || g.includes('rx 5')) return 6144;
  if (g.includes('gtx 10') || g.includes('vega') || g.includes('apple')) return 4096;
  if (g.includes('intel') || g.includes('uhd') || g.includes('iris')) return 2048;
  return 2048;
}

export function pickQuality(p: HardwareProfile): QualitySettings {
  let score = 0;
  if (p.webgl2) score += 2;
  if (p.vramMb >= 16384) score += 4;
  else if (p.vramMb >= 12288) score += 3;
  else if (p.vramMb >= 6144) score += 2;
  else if (p.vramMb >= 4096) score += 1;
  if (p.cpuCores >= 12) score += 2;
  else if (p.cpuCores >= 8) score += 1;
  if (p.ramMb >= 16384) score += 1;

  if (score >= 9) return { tier: 'ultra', shadows: true, shadowMapSize: 2048, pixelRatioCap: 2, postProcessing: true, particleCount: 1200, lodBias: 0, antialias: true };
  if (score >= 7) return { tier: 'high', shadows: true, shadowMapSize: 2048, pixelRatioCap: 1.75, postProcessing: true, particleCount: 800, lodBias: 0, antialias: true };
  if (score >= 4) return { tier: 'medium', shadows: true, shadowMapSize: 1024, pixelRatioCap: 1.25, postProcessing: false, particleCount: 400, lodBias: 1, antialias: false };
  return { tier: 'low', shadows: false, shadowMapSize: 512, pixelRatioCap: 1, postProcessing: false, particleCount: 200, lodBias: 2, antialias: false };
}

export interface HardwareAdvice {
  ok: boolean;
  message: string;
  tier: QualityTier;
}

export function advise(p: HardwareProfile, q: QualitySettings): HardwareAdvice {
  if (q.tier === 'low' || p.vramMb < 4096 || !p.webgl2) {
    return {
      ok: false,
      tier: q.tier,
      message: `GPU détecté : ${p.gpu} (${p.vramMb} Mo VRAM). Puissance limitée — qualité "${q.tier}" appliquée. Fermez les apps lourdes pour meilleur FPS.`,
    };
  }
  return {
    ok: true,
    tier: q.tier,
    message: `GPU détecté : ${p.gpu}. Qualité "${q.tier}" automatiquement configurée.`,
  };
}
