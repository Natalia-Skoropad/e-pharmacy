import type {
  ProductCategoryReference,
  ProductCategorySlug,
} from '../reference-data';

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
    Partial<Record<ProductCategorySlug, OrderSalesStatisticsValue>>
  >;
}>;

export type OrderSalesStatistics = Readonly<{
  currency: Currency;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: readonly ProductCategoryReference[];
  points: readonly OrderSalesStatisticsPoint[];
}>;
