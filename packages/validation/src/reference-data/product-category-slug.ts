/**
 * Dynamic category persistence slugs stay snake_case during Stage 11 so the
 * seeded records can preserve existing category keys such as medical_devices.
 */
export const PRODUCT_CATEGORY_SLUG_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;

//===================================================================

export function isProductCategorySlug(value: unknown): value is string {
  return typeof value === 'string' && PRODUCT_CATEGORY_SLUG_PATTERN.test(value);
}
