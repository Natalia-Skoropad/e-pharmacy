import type { ProductCategory } from '../products';
import type { Currency } from './status';

//=============================================================================

export type OrderSalesStatisticsGroupBy = 'day' | 'month';

//=============================================================================

export type OrderSalesStatisticsValue = Readonly<{
  quantity: number;
  amount: number;
}>;

export type OrderSalesStatisticsPoint = Readonly<{
  key: string;
  label: string;
  values: Readonly<
    Partial<Record<ProductCategory, OrderSalesStatisticsValue>>
  >;
}>;

export type OrderSalesStatistics = Readonly<{
  currency: Currency;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: readonly ProductCategory[];
  points: readonly OrderSalesStatisticsPoint[];
}>;
