/** Canonical six-digit hex color used by admin-managed product categories. */
export const PRODUCT_CATEGORY_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const PRODUCT_CATEGORY_COLOR_MESSAGE =
  'Choose a valid color in #RRGGBB format';

//===================================================================

export function normalizeProductCategoryColor(value: string): string {
  return value.trim().toUpperCase();
}

//===================================================================

export function isProductCategoryColor(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    PRODUCT_CATEGORY_COLOR_PATTERN.test(value.trim())
  );
}
