import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';

import type {
  ProductCategory,
  ProductDetails,
} from '@e-pharmacy/types/products';

//===================================================================

export type ProductCategoryOption = Readonly<{
  value: ProductCategory;
  label: string;
}>;

//===================================================================

export function getProductCategoryOptions(
  products: readonly Pick<ProductDetails, 'category'>[],
  locale = 'en-GB'
): ProductCategoryOption[] {
  const categories = new Set(products.map((product) => product.category));

  return [...categories]
    .map((category) => ({
      value: category,
      label: PRODUCT_CATEGORY_LABELS[category],
    }))
    .sort((first, second) => first.label.localeCompare(second.label, locale));
}
