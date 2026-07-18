import { describe, it, expect } from 'vitest';
import { normalizeBrand, tierFromModel, buildDeviceMeta } from './deviceInfo';

describe('normalizeBrand', () => {
  it('samsung', () => expect(normalizeBrand('Samsung')).toBe('samsung'));
  it('apple depuis iphone', () => expect(normalizeBrand('apple')).toBe('apple'));
  it('xiaomi/redmi/poco', () => {
    expect(normalizeBrand('Xiaomi')).toBe('xiaomi');
    expect(normalizeBrand('Redmi')).toBe('xiaomi');
    expect(normalizeBrand('POCO')).toBe('xiaomi');
  });
  it('google pixel', () => expect(normalizeBrand('Google')).toBe('google'));
  it('autre', () => expect(normalizeBrand('Inconnu')).toBe('other'));
});

describe('tierFromModel', () => {
  it('high pour ultra/pro', () => {
    expect(tierFromModel('SM-X905 Ultra')).toBe('high');
    expect(tierFromModel('Pixel 9 Pro')).toBe('high');
  });
  it('low pour entree', () => {
    expect(tierFromModel('Redmi A3')).toBe('low');
    expect(tierFromModel('Moto G Play')).toBe('low');
  });
  it('mid pour pro/plus', () => {
    expect(tierFromModel('Galaxy S23 Plus')).toBe('mid');
  });
});

describe('buildDeviceMeta', () => {
  it('Samsung high -> prix 749', () => {
    const m = buildDeviceMeta('Samsung', 'SM-X905 Ultra', 'samsung-x905');
    expect(m.brandKey).toBe('samsung');
    expect(m.estimatedPriceEur).toBe(749);
    expect(m.priceTier).toBe('high');
    expect(m.logoUrl).toContain('Samsung');
  });
  it('Redmi -> low 149', () => {
    const m = buildDeviceMeta('Xiaomi', 'Redmi A3', 'redmi-a3');
    expect(m.estimatedPriceEur).toBe(149);
  });
  it('modele inconnu -> prix null', () => {
    const m = buildDeviceMeta('Thing', 'Weird', '');
    expect(m.estimatedPriceEur).toBeNull();
  });
});
