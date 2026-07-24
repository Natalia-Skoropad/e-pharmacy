import type {
  ProductDetails,
  ProductCategory,
} from '@e-pharmacy/types/products';

import { PRODUCT_CATEGORY_LABELS } from './category-labels';

//===================================================================

export type ProductCategoryOption = Readonly<{
  value: ProductCategory;
  label: string;
}>;

//===================================================================

export function getProductCategoryOptions(
  products: readonly Pick<ProductDetails, 'category'>[]
): ProductCategoryOption[] {
  const categories = new Set(products.map((product) => product.category));

  return [...categories]
    .map((category) => ({
      value: category,
      label: PRODUCT_CATEGORY_LABELS[category],
    }))
    .sort((first, second) => first.label.localeCompare(second.label, 'en-GB'));
}
