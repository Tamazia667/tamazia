import { describe, it, expect } from 'vitest';
import { detectVendor, pickQuality, advise } from './hardware';
import type { HardwareProfile } from './hardware';

describe('detectVendor', () => {
  it('detecte nvidia', () => expect(detectVendor('NVIDIA GeForce RTX 3080')).toBe('nvidia'));
  it('detecte amd', () => expect(detectVendor('AMD Radeon RX 6800')).toBe('amd'));
  it('detecte intel', () => expect(detectVendor('Intel UHD Graphics 630')).toBe('intel'));
  it('detecte apple', () => expect(detectVendor('Apple M2')).toBe('apple'));
  it('inconnu sinon', () => expect(detectVendor('VideoController1')).toBe('unknown'));
});

describe('pickQuality', () => {
  const base: HardwareProfile = {
    gpu: 'x', gpuVendor: 'unknown', vramMb: 2048, cpuCores: 4,
    ramMb: 4096, screenWidth: 1920, screenHeight: 1080, pixelRatio: 1, webgl2: false,
  };

  it('low sur machine faible', () => {
    const q = pickQuality(base);
    expect(q.tier).toBe('low');
    expect(q.shadows).toBe(false);
  });

  it('ultra sur machine puissante', () => {
    const q = pickQuality({ ...base, gpu: 'NVIDIA RTX 4090', vramMb: 16384, cpuCores: 16, ramMb: 32768, webgl2: true });
    expect(q.tier).toBe('ultra');
    expect(q.shadows).toBe(true);
    expect(q.pixelRatioCap).toBe(2);
  });

  it('high avec webgl2 + 8 coeurs + 8Go VRAM', () => {
    const q = pickQuality({ ...base, gpu: 'AMD RX 6700', vramMb: 12288, cpuCores: 8, ramMb: 16384, webgl2: true });
    expect(q.tier).toBe('high');
  });
});

describe('advise', () => {
  it('signale une machine faible', () => {
    const p: HardwareProfile = { gpu: 'Intel UHD', gpuVendor: 'intel', vramMb: 2048, cpuCores: 4, ramMb: 4096, screenWidth: 1, screenHeight: 1, pixelRatio: 1, webgl2: false };
    const a = advise(p, pickQuality(p));
    expect(a.ok).toBe(false);
  });
  it('valide une machine correcte', () => {
    const p: HardwareProfile = { gpu: 'NVIDIA RTX 4070', gpuVendor: 'nvidia', vramMb: 12288, cpuCores: 12, ramMb: 16384, screenWidth: 1, screenHeight: 1, pixelRatio: 1, webgl2: true };
    const a = advise(p, pickQuality(p));
    expect(a.ok).toBe(true);
  });
});
