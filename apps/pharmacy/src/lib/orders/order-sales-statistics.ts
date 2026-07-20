import { getNumberValue, getStringValue, isRecord } from '@e-pharmacy/utils/guards';

import {
  DEFAULT_ORDER_SALES_STATISTICS,
  type OrderSalesStatistics,
  type OrderSalesStatisticsGroupBy,
  type OrderSalesStatisticsPoint,
  type OrderSalesStatisticsValue,
} from '@e-pharmacy/types/orders';

import {
  isProductCategory,
  type ProductCategory,
} from '@e-pharmacy/types/products';

//===================================================================

export type PharmacyOrderSalesStatisticsQueryParams = Readonly<{
  dateFrom?: string;
  dateTo?: string;
  groupBy?: OrderSalesStatisticsGroupBy;
  productId?: string;
}>;

//===================================================================

function isOrderSalesGroupBy(value: unknown): value is OrderSalesStatisticsGroupBy {
  return value === 'day' || value === 'month';
}

//===================================================================

function normalizeSalesValue(value: unknown): OrderSalesStatisticsValue {
  if (!isRecord(value)) return { quantity: 0, amount: 0 };

  return {
    quantity: getNumberValue(value.quantity) ?? 0,
    amount: getNumberValue(value.amount) ?? 0,
  };
}

//===================================================================

function normalizeSalesPoint(
  value: unknown,
  categories: ProductCategory[]
): OrderSalesStatisticsPoint | null {
  if (!isRecord(value)) return null;

  const key = getStringValue(value.key);
  const label = getStringValue(value.label);

  if (!key || !label) return null;

  const rawValues = isRecord(value.values) ? value.values : {};
  const values = categories.reduce<OrderSalesStatisticsPoint['values']>(
    (acc, category) => ({
      ...acc,
      [category]: normalizeSalesValue(rawValues[category]),
    }),
    {}
  );

  return { key, label, values };
}

//===================================================================

export function normalizeOrderSalesStatistics(
  payload: unknown
): OrderSalesStatistics {
  if (!isRecord(payload)) return DEFAULT_ORDER_SALES_STATISTICS;

  const categories = Array.isArray(payload.categories)
    ? payload.categories.filter(isProductCategory)
    : [];

  const groupBy = isOrderSalesGroupBy(payload.groupBy)
    ? payload.groupBy
    : DEFAULT_ORDER_SALES_STATISTICS.groupBy;

  const points = Array.isArray(payload.points)
    ? payload.points.flatMap((point) => {
        const normalizedPoint = normalizeSalesPoint(point, categories);
        return normalizedPoint ? [normalizedPoint] : [];
      })
    : [];

  return {
    currency: 'UAH',
    groupBy,
    categories,
    points,
  };
}
