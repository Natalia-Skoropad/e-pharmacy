export type ClientStatisticsKey = 'total' | 'repeat' | 'active' | 'blocked';

//===================================================================

export type ClientStatisticsCounts = Record<ClientStatisticsKey, number>;

//===================================================================

export const DEFAULT_CLIENT_STATISTICS: ClientStatisticsCounts = {
  total: 0,
  repeat: 0,
  active: 0,
  blocked: 0,
};

//===================================================================

export const CLIENT_STATISTICS_LABELS: Record<ClientStatisticsKey, string> = {
  total: 'Total clients',
  repeat: 'Repeat clients',
  active: 'Active clients',
  blocked: 'Blocked clients',
};

//===================================================================

export const CLIENT_SUCCESSFUL_ORDERS_FILTERS = [
  'repeat',
  'successful',
  'other',
] as const;

//===================================================================

export type ClientSuccessfulOrdersFilter =
  (typeof CLIENT_SUCCESSFUL_ORDERS_FILTERS)[number];


//===================================================================

export const CLIENT_SUCCESSFUL_ORDERS_FILTER_LABELS: Record<
  ClientSuccessfulOrdersFilter,
  string
> = {
  repeat: 'Repeat clients',
  successful: 'Clients with successful orders',
  other: 'Other clients',
};
