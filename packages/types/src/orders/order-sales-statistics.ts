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
  values: Partial<Record<ProductCategory, OrderSalesStatisticsValue>>;
}>;

export type OrderSalesStatistics = Readonly<{
  currency: Currency;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: ProductCategory[];
  points: OrderSalesStatisticsPoint[];
}>;
