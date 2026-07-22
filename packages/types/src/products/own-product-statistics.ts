export const OWN_PRODUCT_STATISTICS_KEYS = [
  'inStock',
  'reserved',
  'available',
  'outOfStock',
] as const;

//===================================================================

export type OwnProductStatisticsKey =
  (typeof OWN_PRODUCT_STATISTICS_KEYS)[number];

//===================================================================

export type OwnProductStatisticsValue = Readonly<{
  quantity: number;
  amount?: number;
}>;

//===================================================================

export type OwnProductStatisticsCounts = Record<
  OwnProductStatisticsKey,
  OwnProductStatisticsValue
>;

//===================================================================

export const DEFAULT_OWN_PRODUCT_STATISTICS: OwnProductStatisticsCounts = {
  inStock: { quantity: 0, amount: 0 },
  reserved: { quantity: 0, amount: 0 },
  available: { quantity: 0, amount: 0 },
  outOfStock: { quantity: 0 },
};
