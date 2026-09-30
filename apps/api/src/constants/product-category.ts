export const PRODUCT_CATEGORY_NAME_MAX_LENGTH = 100;

export const PRODUCT_CATEGORY_NAME_PATTERN = /^[A-Z][A-Za-z ]*$/;
export const PRODUCT_CATEGORY_SLUG_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;

//===============================================================

export const PRODUCT_CATEGORY_STATUSES = ['active', 'hidden'] as const;
export const PRODUCT_CATEGORY_KINDS = ['standard'] as const;

export type ProductCategoryStatus = (typeof PRODUCT_CATEGORY_STATUSES)[number];
export type ProductCategoryKind = (typeof PRODUCT_CATEGORY_KINDS)[number];

//===============================================================

export const PRODUCT_CATEGORY_SEED_DEFINITIONS = [
  {
    name: 'Medicine',
    slug: 'medicine',
    status: 'active',
    kind: 'standard',
    sortOrder: 10,
  },
  {
    name: 'Vitamins',
    slug: 'vitamins',
    status: 'active',
    kind: 'standard',
    sortOrder: 20,
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    status: 'active',
    kind: 'standard',
    sortOrder: 30,
  },
  {
    name: 'Hygiene',
    slug: 'hygiene',
    status: 'active',
    kind: 'standard',
    sortOrder: 40,
  },
  {
    name: 'Medical devices',
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
}[];

//===============================================================

/**
 * Legacy Product Request sentinel only. It must never become a ProductCategory
 * record. Stage 11.3 removes the backend dependency on this value.
 */
export const LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY = 'other' as const;

//===============================================================

export function normalizeProductCategoryName(value: string): string {
  return value.trim();
}

//===============================================================

export function normalizeProductCategoryNameKey(value: string): string {
  return normalizeProductCategoryName(value).replace(/\s+/g, ' ').toLowerCase();
}
