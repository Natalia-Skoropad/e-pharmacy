import type {
  AllProductStatisticsKey,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

//===================================================================

export const ALL_PRODUCT_STATISTICS_KEYS = [
  'active',
  'blocked',
  'addedToPharmacy',
  'notAddedToPharmacy',
] as const satisfies readonly AllProductStatisticsKey[];

//===================================================================

export const OWN_PRODUCT_STATISTICS_KEYS = [
  'inStock',
  'reserved',
  'available',
  'outOfStock',
] as const satisfies readonly OwnProductStatisticsKey[];
