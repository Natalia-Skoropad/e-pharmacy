import type {
  AllProductStatisticsKey,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

//===================================================================

export const OWN_PRODUCT_STATISTICS_LABELS: Record<
  OwnProductStatisticsKey,
  string
> = {
  inStock: 'Products in stock',
  reserved: 'Reserved products',
  available: 'Available products',
  outOfStock: 'Out of stock products',
};

//===================================================================

export const ALL_PRODUCT_STATISTICS_LABELS: Record<
  AllProductStatisticsKey,
  string
> = {
  active: 'Active products',
  blocked: 'Blocked products',
  addedToPharmacy: 'Added to pharmacy',
  notAddedToPharmacy: 'Not added yet',
};
