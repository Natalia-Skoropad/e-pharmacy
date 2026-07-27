import type {
  AllProductStatisticsKey,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

//===================================================================

export const OWN_PRODUCT_STATISTICS_LABELS = {
  inStock: 'Products in stock',
  reserved: 'Reserved products',
  available: 'Available products',
  outOfStock: 'Out of stock products',
} as const satisfies Readonly<Record<OwnProductStatisticsKey, string>>;

//===================================================================

export const ALL_PRODUCT_STATISTICS_LABELS = {
  active: 'Active products',
  blocked: 'Blocked products',
  addedToPharmacy: 'Added to pharmacy',
  notAddedToPharmacy: 'Not added yet',
} as const satisfies Readonly<Record<AllProductStatisticsKey, string>>;
