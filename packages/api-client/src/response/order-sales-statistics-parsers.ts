import { ApiError } from '../transport/api-error';
import { parseProductCategoryReferencesResponse } from './shared-dto-parsers';

import type {
  OrderSalesStatistics,
  OrderSalesStatisticsGroupBy,
  OrderSalesStatisticsPoint,
  OrderSalesStatisticsValue,
} from '@e-pharmacy/types/orders';

import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

//===================================================================

export type OrderSalesStatisticsQueryParams = Readonly<{
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

// Keep transport validation local to the API client. Reuse the canonical
// category reference parser instead of importing runtime helpers from new
// workspace dependencies that might not have been installed yet.
function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

//===================================================================

function getTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
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
  const number =
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

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
  categories: readonly ProductCategoryReference[]
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
      [category.slug]: normalizeSalesValue(
        rawValues[category.slug],
        `sales statistics point.values.${category.slug}`
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

  if (!Array.isArray(payload.points)) {
    invalidSalesStatisticsContract(
      'sales statistics points must be an array.',
      payload
    );
  }

  // The shared DTO parser already validates the category id, name and slug.
  // It throws an INVALID_RESPONSE ApiError for malformed references.
  const categories = [
    ...parseProductCategoryReferencesResponse(payload.categories),
  ];

  if (
    new Set(categories.map((category) => category.slug)).size !==
    categories.length
  ) {
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
