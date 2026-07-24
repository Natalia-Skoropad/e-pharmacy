import type {
  ClientStatisticsKey,
  ClientSuccessfulOrdersFilter,
} from './client-contracts';

//===================================================================

export const CLIENT_STATISTICS_LABELS: Record<ClientStatisticsKey, string> = {
  total: 'Total clients',
  repeat: 'Repeat clients',
  active: 'Active clients',
  blocked: 'Blocked clients',
};

//===================================================================

export const CLIENT_SUCCESSFUL_ORDERS_FILTER_LABELS: Record<
  ClientSuccessfulOrdersFilter,
  string
> = {
  repeat: 'Repeat clients',
  successful: 'Clients with successful orders',
  other: 'Other clients',
};
