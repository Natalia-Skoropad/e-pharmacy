import type { Currency } from './order';
import type { ProductCategory } from '../products/categories';

//===================================================================

export type OrderSalesStatisticsGroupBy = 'day' | 'month';

//===================================================================

export type OrderSalesStatisticsValue = Readonly<{
  quantity: number;
  amount: number;
}>;

//===================================================================

export type OrderSalesStatisticsPoint = Readonly<{
  key: string;
  label: string;
  values: Partial<Record<ProductCategory, OrderSalesStatisticsValue>>;
}>;

//===================================================================

export type OrderSalesStatistics = Readonly<{
  currency: Currency;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: ProductCategory[];
  points: OrderSalesStatisticsPoint[];
}>;

//===================================================================

export const DEFAULT_ORDER_SALES_STATISTICS: OrderSalesStatistics = {
  currency: 'UAH',
  groupBy: 'month',
  categories: [],
  points: [],
};
