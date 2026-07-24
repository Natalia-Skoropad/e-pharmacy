export const CLIENT_STATISTICS_KEYS = [
  'total',
  'repeat',
  'active',
  'blocked',
] as const;

//===================================================================

export type ClientStatisticsKey = (typeof CLIENT_STATISTICS_KEYS)[number];
export type ClientStatisticsCounts = Record<ClientStatisticsKey, number>;

//===================================================================

export const CLIENT_SUCCESSFUL_ORDERS_FILTERS = [
  'repeat',
  'successful',
  'other',
] as const;

//===================================================================

export type ClientSuccessfulOrdersFilter =
  (typeof CLIENT_SUCCESSFUL_ORDERS_FILTERS)[number];
