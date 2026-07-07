export const OWN_PRODUCT_STATISTICS_KEYS = [
  'total',
  'active',
  'blocked',
  'inStock',
  'outOfStock',
  'reserved',
] as const;

//===================================================================

export type OwnProductStatisticsKey =
  (typeof OWN_PRODUCT_STATISTICS_KEYS)[number];

//===================================================================

export type OwnProductStatisticsCounts = Record<
  OwnProductStatisticsKey,
  number
>;

//===================================================================

export const DEFAULT_OWN_PRODUCT_STATISTICS: OwnProductStatisticsCounts = {
  total: 0,
  active: 0,
  blocked: 0,
  inStock: 0,
  outOfStock: 0,
  reserved: 0,
};

//===================================================================

export const OWN_PRODUCT_STATISTICS_LABELS: Record<
  OwnProductStatisticsKey,
  string
> = {
  total: 'Total products',
  active: 'Active products',
  blocked: 'Blocked products',
  inStock: 'Products in stock',
  outOfStock: 'Out of stock',
  reserved: 'Reserved products',
};
