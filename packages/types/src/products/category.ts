import type { ProductCategoryReference } from '../reference-data/product-category';

//===================================================================

/**
 * Dynamic category relation returned with product DTOs.
 *
 * This products-domain alias intentionally points at reference data instead of
 * defining compile-time category values.
 */
export type ProductCategory = ProductCategoryReference;
