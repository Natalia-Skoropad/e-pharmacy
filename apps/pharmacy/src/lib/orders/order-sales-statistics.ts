import { ApiError } from '@e-pharmacy/api-client/transport';
import { isProductCategory } from '@e-pharmacy/validation/products';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';

import type {
  OrderSalesStatistics,
  OrderSalesStatisticsGroupBy,
  OrderSalesStatisticsPoint,
  OrderSalesStatisticsValue,
} from '@e-pharmacy/types/orders';

import type { ProductCategory } from '@e-pharmacy/types/products';

//===================================================================

export type PharmacyOrderSalesStatisticsQueryParams = Readonly<{
  dateFrom?: string;
  dateTo?: string;
  groupBy?: OrderSalesStatisticsGroupBy;
  productId?: string;
}>;

//===================================================================

function invalidSalesStatisticsContract(
  message: string,
  payload: unknown
): never {
  throw new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function isOrderSalesGroupBy(
  value: unknown
): value is OrderSalesStatisticsGroupBy {
  return value === 'day' || value === 'month';
}

//===================================================================

function requireNonNegativeInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    invalidSalesStatisticsContract(
      `${label} must be a safe non-negative integer.`,
      payload
    );
  }

  return value;
}

//===================================================================

function requireNonNegativeNumber(
  value: unknown,
  label: string,
  payload: unknown
): number {
  const number = getFiniteNumber(value);

  if (number === undefined || number < 0) {
    invalidSalesStatisticsContract(
      `${label} must be a finite non-negative number.`,
      payload
    );
  }

  return number;
}

//===================================================================

function normalizeSalesValue(
  value: unknown,
  label: string
): OrderSalesStatisticsValue {
  if (!isRecord(value)) {
    invalidSalesStatisticsContract(`${label} must be an object.`, value);
  }

  return {
    quantity: requireNonNegativeInteger(
      value.quantity,
      `${label}.quantity`,
      value
    ),
    amount: requireNonNegativeNumber(value.amount, `${label}.amount`, value),
  };
}

//===================================================================

function normalizeSalesPoint(
  value: unknown,
  categories: ProductCategory[]
): OrderSalesStatisticsPoint {
  if (!isRecord(value)) {
    invalidSalesStatisticsContract(
      'sales statistics point must be an object.',
      value
    );
  }

  const key = getTrimmedString(value.key);
  const label = getTrimmedString(value.label);
  const rawValues = value.values;

  if (!key || !label || !isRecord(rawValues)) {
    invalidSalesStatisticsContract(
      'sales statistics point key, label, and values are required.',
      value
    );
  }

  const values = categories.reduce<OrderSalesStatisticsPoint['values']>(
    (acc, category) => ({
      ...acc,
      [category]: normalizeSalesValue(
        rawValues[category],
        `sales statistics point.values.${category}`
      ),
    }),
    {}
  );

  return { key, label, values };
}

//===================================================================

export function normalizeOrderSalesStatistics(
  payload: unknown
): OrderSalesStatistics {
  if (!isRecord(payload)) {
    invalidSalesStatisticsContract(
      'sales statistics response must be an object.',
      payload
    );
  }

  if (payload.currency !== '₴') {
    invalidSalesStatisticsContract(
      'sales statistics currency is invalid.',
      payload
    );
  }

  if (!isOrderSalesGroupBy(payload.groupBy)) {
    invalidSalesStatisticsContract(
      'sales statistics groupBy is invalid.',
      payload
    );
  }

  if (
    !Array.isArray(payload.categories) ||
    !payload.categories.every(isProductCategory)
  ) {
    invalidSalesStatisticsContract(
      'sales statistics categories are invalid.',
      payload
    );
  }

  if (!Array.isArray(payload.points)) {
    invalidSalesStatisticsContract(
      'sales statistics points must be an array.',
      payload
    );
  }

  const categories = [...payload.categories];

  if (new Set(categories).size !== categories.length) {
    invalidSalesStatisticsContract(
      'sales statistics categories must be unique.',
      payload
    );
  }

  return {
    currency: '₴',
    groupBy: payload.groupBy,
    categories,
    points: payload.points.map((point) =>
      normalizeSalesPoint(point, categories)
    ),
  };
}
