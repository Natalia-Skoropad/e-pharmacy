import type { OrderStatus } from './order';

//===================================================================

export type OrderStatisticsValue = Readonly<{
  count: number;
  amount: number;
}>;

//===================================================================

export type OrderStatisticsCounts = Record<OrderStatus, OrderStatisticsValue>;

//===================================================================

export const DEFAULT_ORDER_STATISTICS: OrderStatisticsCounts = {
  new: { count: 0, amount: 0 },
  in_progress: { count: 0, amount: 0 },
  successful: { count: 0, amount: 0 },
  rejected: { count: 0, amount: 0 },
};
