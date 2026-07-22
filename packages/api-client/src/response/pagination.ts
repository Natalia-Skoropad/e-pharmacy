import type { ApiPaginationResponse } from '@e-pharmacy/types/api';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';

import { ApiError } from '../core/api-error';

//===================================================================

export type PaginationNormalizationIssueCode =
  | 'invalid-payload'
  | 'missing-items'
  | 'invalid-item'
  | 'item-normalizer-error'
  | 'invalid-page'
  | 'invalid-per-page'
  | 'invalid-total'
  | 'invalid-total-pages'
  | 'inconsistent-total-pages'
  | 'page-out-of-range'
  | 'items-exceed-per-page'
  | 'items-exceed-total';

//===================================================================

export type PaginationNormalizationIssue = Readonly<{
  code: PaginationNormalizationIssueCode;
  path: string;
  message: string;
  index?: number;
}>;

//===================================================================

export type PaginationNormalizationResult<TItem> =
  | Readonly<{
      success: true;
      data: ApiPaginationResponse<TItem>;
      issues: readonly [];
    }>
  | Readonly<{
      success: false;
      data: null;
      issues: readonly PaginationNormalizationIssue[];
    }>;

//===================================================================

export type NormalizePaginationOptions<TItem> = Readonly<{
  itemKeys?: readonly string[];
  normalizeItem: (item: unknown, index: number) => TItem | null;
}>;

//===================================================================

function getInteger(value: unknown, minimum: number): number | undefined {
  const numberValue = getFiniteNumber(value);

  return numberValue !== undefined &&
    Number.isSafeInteger(numberValue) &&
    numberValue >= minimum
    ? numberValue
    : undefined;
}

//===================================================================

function getRawItems(
  payload: Record<string, unknown>,
  itemKeys: readonly string[]
): { items: unknown[]; key: string } | null {
  for (const key of itemKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return { items: value, key };
    }
  }

  return null;
}

//===================================================================

export function normalizePaginatedResponse<TItem>(
  payload: unknown,
  { itemKeys = ['items'], normalizeItem }: NormalizePaginationOptions<TItem>
): PaginationNormalizationResult<TItem> {
  if (!isRecord(payload)) {
    return {
      success: false,
      data: null,
      issues: [
        {
          code: 'invalid-payload',
          path: '$',
          message: 'Expected a pagination response object',
        },
      ],
    };
  }

  const issues: PaginationNormalizationIssue[] = [];
  const rawItemsResult = getRawItems(payload, itemKeys);

  if (!rawItemsResult) {
    return {
      success: false,
      data: null,
      issues: [
        {
          code: 'missing-items',
          path: '$',
          message: `Expected an array in one of: ${itemKeys.join(', ')}`,
        },
      ],
    };
  }

  const items: TItem[] = [];

  rawItemsResult.items.forEach((item, index) => {
    try {
      const normalizedItem = normalizeItem(item, index);

      if (normalizedItem === null) {
        issues.push({
          code: 'invalid-item',
          path: `${rawItemsResult.key}[${index}]`,
          index,
          message: 'Item did not match the expected API contract',
        });
        return;
      }

      items.push(normalizedItem);
    } catch (error) {
      issues.push({
        code: 'item-normalizer-error',
        path: `${rawItemsResult.key}[${index}]`,
        index,
        message:
          error instanceof Error && error.message
            ? error.message
            : 'Item normalizer failed',
      });
    }
  });

  const page = getInteger(payload.page, 1);
  const perPage = getInteger(payload.perPage, 1);
  const total = getInteger(payload.total, 0);
  const totalPages = getInteger(payload.totalPages, 0);

  if (page === undefined) {
    issues.push({
      code: 'invalid-page',
      path: 'page',
      message: 'Page must be a positive integer',
    });
  }

  if (perPage === undefined) {
    issues.push({
      code: 'invalid-per-page',
      path: 'perPage',
      message: 'perPage must be a positive integer',
    });
  }

  if (total === undefined) {
    issues.push({
      code: 'invalid-total',
      path: 'total',
      message: 'Total must be a non-negative integer',
    });
  }

  if (totalPages === undefined) {
    issues.push({
      code: 'invalid-total-pages',
      path: 'totalPages',
      message: 'totalPages must be a non-negative integer',
    });
  }

  if (
    perPage !== undefined &&
    total !== undefined &&
    totalPages !== undefined
  ) {
    const expectedTotalPages = Math.ceil(total / perPage);
    const allowsSingleEmptyPage = total === 0 && totalPages === 1;

    if (totalPages !== expectedTotalPages && !allowsSingleEmptyPage) {
      issues.push({
        code: 'inconsistent-total-pages',
        path: 'totalPages',
        message: `Expected ${expectedTotalPages} pages for total=${total} and perPage=${perPage}`,
      });
    }
  }

  if (
    page !== undefined &&
    totalPages !== undefined &&
    totalPages > 0 &&
    page > totalPages
  ) {
    issues.push({
      code: 'page-out-of-range',
      path: 'page',
      message: 'Page cannot be greater than totalPages',
    });
  }

  if (perPage !== undefined && items.length > perPage) {
    issues.push({
      code: 'items-exceed-per-page',
      path: rawItemsResult.key,
      message: 'The response contains more items than perPage allows',
    });
  }

  if (total !== undefined && items.length > total) {
    issues.push({
      code: 'items-exceed-total',
      path: rawItemsResult.key,
      message: 'The response contains more items than total',
    });
  }

  if (
    issues.length > 0 ||
    page === undefined ||
    perPage === undefined ||
    total === undefined ||
    totalPages === undefined
  ) {
    return { success: false, data: null, issues };
  }

  return {
    success: true,
    data: { items, page, perPage, total, totalPages },
    issues: [],
  };
}

//===================================================================

export function requirePaginatedResponse<TItem>(
  result: PaginationNormalizationResult<TItem>,
  context = 'pagination response'
): ApiPaginationResponse<TItem> {
  if (result.success) return result.data;

  throw new ApiError(
    `Invalid ${context}`,
    502,
    { issues: result.issues },
    { code: 'INVALID_RESPONSE' }
  );
}
