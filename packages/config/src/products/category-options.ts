import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from '@e-pharmacy/types/products';

//===================================================================

export type ProductCategoryOption = Readonly<{
  value: ProductCategory;
  label: string;
}>;

//===================================================================

export function getProductCategoryOptions(
  products: readonly Pick<Product, 'category'>[]
): ProductCategoryOption[] {
  const categories = new Set(products.map((product) => product.category));

  return [...categories]
    .map((category) => ({
      value: category,
      label: PRODUCT_CATEGORY_LABELS[category],
    }))
    .sort((first, second) => first.label.localeCompare(second.label, 'en'));
}
