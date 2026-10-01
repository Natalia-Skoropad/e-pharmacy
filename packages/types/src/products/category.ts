import type { ProductCategoryReference } from '../reference-data/product-category';

//===================================================================

/**
 * Dynamic category relation returned with product DTOs.
 *
 * Kept as a products-domain alias during Stage 11 so existing explicit
 * `@e-pharmacy/types/products` imports can migrate without reintroducing a
 * compile-time category value set.
 */
export type ProductCategory = ProductCategoryReference;
