export interface ModelMapping {
  commercialName: string;
  generation: string;
  imageKey: string;
  releaseYear?: number;
}

const PRODUCT_TYPE_MAP: Record<string, ModelMapping> = {
  'iPhone17,1': { commercialName: 'iPhone 16 Pro', generation: '16', imageKey: 'iphone-16-pro' },
  'iPhone17,2': { commercialName: 'iPhone 16 Pro Max', generation: '16', imageKey: 'iphone-16-pro-max' },
  'iPhone17,3': { commercialName: 'iPhone 16', generation: '16', imageKey: 'iphone-16' },
  'iPhone17,4': { commercialName: 'iPhone 16 Plus', generation: '16', imageKey: 'iphone-16-plus' },
  'iPhone16,1': { commercialName: 'iPhone 15 Pro', generation: '15', imageKey: 'iphone-15-pro' },
  'iPhone16,2': { commercialName: 'iPhone 15 Pro Max', generation: '15', imageKey: 'iphone-15-pro-max' },
  'iPhone15,4': { commercialName: 'iPhone 15', generation: '15', imageKey: 'iphone-15' },
  'iPhone15,5': { commercialName: 'iPhone 15 Plus', generation: '15', imageKey: 'iphone-15-plus' },
  'iPhone14,7': { commercialName: 'iPhone 14', generation: '14', imageKey: 'iphone-14' },
  'iPhone14,8': { commercialName: 'iPhone 14 Plus', generation: '14', imageKey: 'iphone-14-plus' },
  'iPhone15,2': { commercialName: 'iPhone 14 Pro', generation: '14', imageKey: 'iphone-14-pro' },
  'iPhone15,3': { commercialName: 'iPhone 14 Pro Max', generation: '14', imageKey: 'iphone-14-pro-max' },
  'iPhone14,4': { commercialName: 'iPhone 13 mini', generation: '13', imageKey: 'iphone-13-mini' },
  'iPhone14,5': { commercialName: 'iPhone 13', generation: '13', imageKey: 'iphone-13' },
  'iPhone14,2': { commercialName: 'iPhone 13 Pro', generation: '13', imageKey: 'iphone-13-pro' },
  'iPhone14,3': { commercialName: 'iPhone 13 Pro Max', generation: '13', imageKey: 'iphone-13-pro-max' },
  'iPhone13,1': { commercialName: 'iPhone 12 mini', generation: '12', imageKey: 'iphone-12-mini' },
  'iPhone13,2': { commercialName: 'iPhone 12', generation: '12', imageKey: 'iphone-12' },
  'iPhone13,3': { commercialName: 'iPhone 12 Pro', generation: '12', imageKey: 'iphone-12-pro' },
  'iPhone13,4': { commercialName: 'iPhone 12 Pro Max', generation: '12', imageKey: 'iphone-12-pro-max' },
  'iPhone12,1': { commercialName: 'iPhone 11', generation: '11', imageKey: 'iphone-11' },
  'iPhone12,3': { commercialName: 'iPhone 11 Pro', generation: '11', imageKey: 'iphone-11-pro' },
  'iPhone12,5': { commercialName: 'iPhone 11 Pro Max', generation: '11', imageKey: 'iphone-11-pro-max' },
  'iPhone14,6': { commercialName: 'iPhone SE (3e gen)', generation: 'se', imageKey: 'iphone-se' },
  'iPhone12,8': { commercialName: 'iPhone SE (2e gen)', generation: 'se', imageKey: 'iphone-se' },
  'iPhone11,2': { commercialName: 'iPhone XS', generation: 'x', imageKey: 'iphone-x' },
  'iPhone11,4': { commercialName: 'iPhone XS Max', generation: 'x', imageKey: 'iphone-xs-max' },
  'iPhone11,6': { commercialName: 'iPhone XS Max', generation: 'x', imageKey: 'iphone-xs-max' },
  'iPhone11,8': { commercialName: 'iPhone XR', generation: 'x', imageKey: 'iphone-xr' },
  'iPhone10,3': { commercialName: 'iPhone X', generation: 'x', imageKey: 'iphone-x' },
  'iPhone10,6': { commercialName: 'iPhone X', generation: 'x', imageKey: 'iphone-x' },
};

const GENERATION_DEFAULTS: Record<string, ModelMapping> = {
  '17': { commercialName: 'iPhone (gen. 16)', generation: '16', imageKey: 'iphone-generic' },
  '16': { commercialName: 'iPhone (gen. 15)', generation: '15', imageKey: 'iphone-generic' },
  '15': { commercialName: 'iPhone (gen. 14)', generation: '14', imageKey: 'iphone-generic' },
  '14': { commercialName: 'iPhone (gen. 13)', generation: '13', imageKey: 'iphone-generic' },
  '13': { commercialName: 'iPhone (gen. 12)', generation: '12', imageKey: 'iphone-generic' },
  '12': { commercialName: 'iPhone (gen. 11)', generation: '11', imageKey: 'iphone-generic' },
  '11': { commercialName: 'iPhone (gen. X)', generation: 'x', imageKey: 'iphone-generic' },
  '10': { commercialName: 'iPhone (gen. X)', generation: 'x', imageKey: 'iphone-generic' },
};

export function mapProductType(productType: string): ModelMapping {
  const exact = PRODUCT_TYPE_MAP[productType];
  if (exact) return exact;

  const match = productType.match(/^iPhone(\d+),/);
  if (match) {
    const prefix = match[1];
    const fallback = GENERATION_DEFAULTS[prefix];
    if (fallback) {
      return {
        ...fallback,
        commercialName: `${fallback.commercialName} (${productType})`,
      };
    }
  }

  return {
    commercialName: productType || 'iPhone inconnu',
    generation: 'unknown',
    imageKey: 'iphone-generic',
  };
}

export function formatStorage(bytesStr: string): string {
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes) || bytes <= 0) return bytesStr || '—';

  const gb = bytes / (1024 ** 3);
  if (gb >= 1000) {
    return `${(gb / 1024).toFixed(1)} To`;
  }
  const rounded = [64, 128, 256, 512, 1024].find((v) => Math.abs(gb - v) < 8);
  return rounded ? `${rounded} Go` : `${Math.round(gb)} Go`;
}

export function formatEcid(raw: string): string {
  if (!raw || raw === '—') return raw;
  if (raw.startsWith('0x')) return raw.toUpperCase();
  try {
    const n = BigInt(raw);
    return `0x${n.toString(16).toUpperCase()}`;
  } catch {
    return raw;
  }
}
