import type { OrderStatus } from './status';

//=============================================================================

export type OrderStatisticsValue = Readonly<{
  count: number;
  amount: number;
}>;

export type OrderStatisticsCounts = Record<OrderStatus, OrderStatisticsValue>;
