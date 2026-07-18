export type BrandKey = 'samsung' | 'apple' | 'xiaomi' | 'google' | 'huawei' | 'oppo' | 'realme' | 'oneplus' | 'motorola' | 'sony' | 'lg' | 'other';

export interface DeviceMeta {
  brandKey: BrandKey;
  brandLabel: string;
  logoUrl: string;
  reference: string;
  estimatedPriceEur: number | null;
  priceTier: 'low' | 'mid' | 'high' | 'unknown';
}

const BRAND_LOGOS: Record<BrandKey, string> = {
  samsung: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
  apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
  xiaomi: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Xiaomi_logo.svg',
  google: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Google_Pixel_logo.svg',
  huawei: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Huawei_Standard_logo.svg',
  oppo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/OPPO_Logo.svg',
  realme: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Realme_logo.svg',
  oneplus: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/OnePlus_logo.svg',
  motorola: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Motorola_logo.svg',
  sony: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
  lg: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/LG_logo.svg',
  other: '',
};

const BRAND_LABELS: Record<BrandKey, string> = {
  samsung: 'Samsung',
  apple: 'Apple',
  xiaomi: 'Xiaomi',
  google: 'Google',
  huawei: 'Huawei',
  oppo: 'OPPO',
  realme: 'Realme',
  oneplus: 'OnePlus',
  motorola: 'Motorola',
  sony: 'Sony',
  lg: 'LG',
  other: 'Autre',
};

const TIER_PRICES: Record<'low' | 'mid' | 'high', number> = {
  low: 149,
  mid: 349,
  high: 749,
};

export function normalizeBrand(brand: string): BrandKey {
  const b = brand.toLowerCase();
  if (b.includes('samsung')) return 'samsung';
  if (b.includes('apple') || b.includes('iphone')) return 'apple';
  if (b.includes('xiaomi') || b.includes('redmi') || b.includes('poco')) return 'xiaomi';
  if (b.includes('google') || b.includes('pixel')) return 'google';
  if (b.includes('huawei')) return 'huawei';
  if (b.includes('oppo')) return 'oppo';
  if (b.includes('realme')) return 'realme';
  if (b.includes('oneplus')) return 'oneplus';
  if (b.includes('motorola')) return 'motorola';
  if (b.includes('sony')) return 'sony';
  if (b.includes('lg')) return 'lg';
  return 'other';
}

export function tierFromModel(model: string): 'low' | 'mid' | 'high' | 'unknown' {
  const m = model.toLowerCase();
  const high = /(ultra|fold|z fold|note|pixel.*pro|find x|magic.*pro|mate [2-9]0 pro)/;
  const low = /(a[0-9]{1,2}|c[0-9]{1,2}|redmi|poco|moto (g|e)|play|lite|go|galaxy a|galaxy m)/;
  if (high.test(m)) return 'high';
  if (low.test(m)) return 'low';
  if (/pro|plus|fe|edge/.test(m)) return 'mid';
  return 'unknown';
}

export function buildDeviceMeta(brand: string, model: string, product: string): DeviceMeta {
  const brandKey = normalizeBrand(brand);
  const tier = tierFromModel(model);
  const price = tier === 'unknown' ? null : TIER_PRICES[tier];
  const reference = (product || model || 'inconnu').trim();
  return {
    brandKey,
    brandLabel: BRAND_LABELS[brandKey],
    logoUrl: BRAND_LOGOS[brandKey],
    reference,
    estimatedPriceEur: price,
    priceTier: tier,
  };
}
