import type { OrderStatus } from './status';

//=============================================================================

type OrderStatisticsValue = Readonly<{
  count: number;
  amount: number;
}>;

export type OrderStatisticsCounts = Record<OrderStatus, OrderStatisticsValue>;
