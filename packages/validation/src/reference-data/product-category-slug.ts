/**
 * Persisted product-category slugs use lowercase snake_case. URL presentation
 * may transform the slug without changing the stored reference-data identity.
 */
export const PRODUCT_CATEGORY_SLUG_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;

//===================================================================

export function isProductCategorySlug(value: unknown): value is string {
  return typeof value === 'string' && PRODUCT_CATEGORY_SLUG_PATTERN.test(value);
}
