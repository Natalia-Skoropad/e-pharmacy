import {
  SETTINGS_DICTIONARY_NAME_MAX_LENGTH,
  SETTINGS_DICTIONARY_NAME_PATTERN,
  normalizeSettingsDictionaryName,
  normalizeSettingsDictionaryNameKey,
} from './settings-dictionary';

//===============================================================

export const PRODUCT_CATEGORY_NAME_MAX_LENGTH =
  SETTINGS_DICTIONARY_NAME_MAX_LENGTH;

export const PRODUCT_CATEGORY_NAME_PATTERN = SETTINGS_DICTIONARY_NAME_PATTERN;
export const PRODUCT_CATEGORY_SLUG_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;
export const PRODUCT_CATEGORY_SLUG_MAX_LENGTH = 100;
export const PRODUCT_CATEGORY_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
export const PRODUCT_CATEGORY_DEFAULT_COLOR = '#64748B';

//===============================================================

export const PRODUCT_CATEGORY_STATUSES = ['active', 'hidden'] as const;
export const PRODUCT_CATEGORY_KINDS = ['standard'] as const;

export type ProductCategoryStatus = (typeof PRODUCT_CATEGORY_STATUSES)[number];
export type ProductCategoryKind = (typeof PRODUCT_CATEGORY_KINDS)[number];

//===============================================================

export const PRODUCT_CATEGORY_SEED_DEFINITIONS = [
  {
    name: 'Medicine',
    color: '#3B82F6',
    slug: 'medicine',
    status: 'active',
    kind: 'standard',
    sortOrder: 10,
  },
  {
    name: 'Vitamins',
    color: '#22C55E',
    slug: 'vitamins',
    status: 'active',
    kind: 'standard',
    sortOrder: 20,
  },
  {
    name: 'Beauty',
    color: '#EC4899',
    slug: 'beauty',
    status: 'active',
    kind: 'standard',
    sortOrder: 30,
  },
  {
    name: 'Hygiene',
    color: '#14B8A6',
    slug: 'hygiene',
    status: 'active',
    kind: 'standard',
    sortOrder: 40,
  },
  {
    name: 'Medical devices',
    color: '#8B5CF6',
    slug: 'medical_devices',
    status: 'active',
    kind: 'standard',
    sortOrder: 50,
  },
] as const satisfies readonly {
  name: string;
  slug: string;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  color: string;
}[];

//===============================================================

/**
 * Legacy Product Request sentinel only. It must never become a ProductCategory
 * record. Stage 11.3 removes the backend dependency on this value.
 */
export const LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY = 'other' as const;

//===============================================================

export function normalizeProductCategoryName(value: string): string {
  return normalizeSettingsDictionaryName(value);
}

//===============================================================

export function normalizeProductCategoryNameKey(value: string): string {
  return normalizeSettingsDictionaryNameKey(value);
}

//===============================================================

export function normalizeProductCategoryColor(value: string): string {
  return value.trim().toUpperCase();
}

//===============================================================

export function createProductCategorySlugFromName(value: string): string {
  return normalizeProductCategoryNameKey(value).replaceAll(' ', '_');
}
