import type {
  ProductCategory,
  ProductStatus,
} from '@e-pharmacy/types/products';

//===================================================================

export const PRODUCT_CATEGORY_LABELS = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
} as const satisfies Readonly<Record<ProductCategory, string>>;

//===================================================================

export const PRODUCT_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
} as const satisfies Readonly<
  Record<ProductStatus, Readonly<{ label: string; tone: string }>>
>;

//===================================================================

export function getProductStatusPresentation(status: ProductStatus) {
  return PRODUCT_STATUS_PRESENTATION[status];
}
