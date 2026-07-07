export const ALL_PRODUCT_STATISTICS_KEYS = [
  'active',
  'blocked',
  'addedToPharmacy',
  'notAddedToPharmacy',
] as const;

//===================================================================

export type AllProductStatisticsKey =
  (typeof ALL_PRODUCT_STATISTICS_KEYS)[number];

//===================================================================

export type AllProductStatisticsCounts = Record<AllProductStatisticsKey, number>;

//===================================================================

export const DEFAULT_ALL_PRODUCT_STATISTICS: AllProductStatisticsCounts = {
  active: 0,
  blocked: 0,
  addedToPharmacy: 0,
  notAddedToPharmacy: 0,
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
