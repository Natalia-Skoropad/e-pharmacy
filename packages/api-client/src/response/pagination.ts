import type { ApiPaginationResponse } from '@e-pharmacy/types/api';
import { ApiError } from '../core/api-error';

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

//===================================================================

function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

//===================================================================

export type PaginationNormalizationIssueCode =
  | 'invalid-payload'
  | 'missing-items'
  | 'duplicate-items-key'
  | 'invalid-item'
  | 'item-normalizer-error'
  | 'invalid-page'
  | 'invalid-empty-page'
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

export type PaginationLegacyMetadata = Readonly<{
  sourceItemKey: string;
  usedLegacyItemKey: boolean;
  normalizedLegacyEmptyPage: boolean;
}>;

//===================================================================

export type PaginationNormalizationResult<TItem> =
  | Readonly<{
      success: true;
      data: ApiPaginationResponse<TItem>;
      issues: readonly [];
      metadata: PaginationLegacyMetadata;
    }>
  | Readonly<{
      success: false;
      data: null;
      issues: readonly PaginationNormalizationIssue[];
      metadata: null;
    }>;

//===================================================================

export type NormalizePaginationOptions<TItem> = Readonly<{
  /**
   * Canonical payloads must use `items`. Add only documented legacy aliases.
   */
  legacyItemKeys?: readonly string[];
  /**
   * Explicit rolling-migration support for old APIs returning one empty page.
   * The output is normalized to the canonical `totalPages: 0` contract.
   */
  legacyEmptyPage?: 'normalize-to-zero';
  normalizeItem: (item: unknown, index: number) => TItem | null;
}>;

export type RequirePaginationContext = Readonly<{
  label?: string;
  url?: string;
  method?: string;
  requestId?: string;
  onLegacyContract?: (metadata: PaginationLegacyMetadata) => void;
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

function validateLegacyItemKeys(keys: readonly string[]): readonly string[] {
  const seen = new Set<string>();

  for (const key of keys) {
    if (!key.trim() || key === 'items' || seen.has(key)) {
      throw new TypeError(
        'legacyItemKeys must contain unique, non-empty aliases other than "items".'
      );
    }

    seen.add(key);
  }

  return keys;
}

//===================================================================

function getRawItems(
  payload: Record<string, unknown>,
  legacyItemKeys: readonly string[]
):
  | { success: true; items: unknown[]; key: string }
  | { success: false; issue: PaginationNormalizationIssue } {
  const candidateKeys = ['items', ...legacyItemKeys];
  const matches = candidateKeys.filter((key) => Array.isArray(payload[key]));

  if (matches.length === 0) {
    return {
      success: false,
      issue: {
        code: 'missing-items',
        path: '$',
        message:
          legacyItemKeys.length === 0
            ? 'Expected the canonical items array'
            : `Expected the canonical items array or one explicit legacy alias: ${legacyItemKeys.join(', ')}`,
      },
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      issue: {
        code: 'duplicate-items-key',
        path: '$',
        message: `Pagination payload contains multiple item arrays: ${matches.join(', ')}`,
      },
    };
  }

  const key = matches[0]!;
  return { success: true, items: payload[key] as unknown[], key };
}

//===================================================================

export function normalizePaginatedResponse<TItem>(
  payload: unknown,
  {
    legacyItemKeys = [],
    legacyEmptyPage,
    normalizeItem,
  }: NormalizePaginationOptions<TItem>
): PaginationNormalizationResult<TItem> {
  const validatedLegacyItemKeys = validateLegacyItemKeys(legacyItemKeys);

  if (!isRecord(payload)) {
    return {
      success: false,
      data: null,
      metadata: null,
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
  const rawItemsResult = getRawItems(payload, validatedLegacyItemKeys);

  if (!rawItemsResult.success) {
    return {
      success: false,
      data: null,
      metadata: null,
      issues: [rawItemsResult.issue],
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

  const rawPage = getInteger(payload.page, 1);
  const perPage = getInteger(payload.perPage, 1);
  const total = getInteger(payload.total, 0);
  const rawTotalPages = getInteger(payload.totalPages, 0);

  if (rawPage === undefined) {
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

  if (rawTotalPages === undefined) {
    issues.push({
      code: 'invalid-total-pages',
      path: 'totalPages',
      message: 'totalPages must be a non-negative integer',
    });
  }

  const normalizedLegacyEmptyPage =
    total === 0 &&
    rawTotalPages === 1 &&
    legacyEmptyPage === 'normalize-to-zero';

  const totalPages = normalizedLegacyEmptyPage ? 0 : rawTotalPages;
  const page = normalizedLegacyEmptyPage ? 1 : rawPage;

  if (total === 0 && totalPages === 0 && page !== undefined && page !== 1) {
    issues.push({
      code: 'invalid-empty-page',
      path: 'page',
      message: 'An empty pagination response must use page=1',
    });
  }

  if (
    perPage !== undefined &&
    total !== undefined &&
    totalPages !== undefined
  ) {
    const expectedTotalPages = Math.ceil(total / perPage);

    if (totalPages !== expectedTotalPages) {
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
    return { success: false, data: null, issues, metadata: null };
  }

  return {
    success: true,
    data: { items, page, perPage, total, totalPages },
    issues: [],
    metadata: {
      sourceItemKey: rawItemsResult.key,
      usedLegacyItemKey: rawItemsResult.key !== 'items',
      normalizedLegacyEmptyPage,
    },
  };
}

//===================================================================

export function requirePaginatedResponse<TItem>(
  result: PaginationNormalizationResult<TItem>,
  {
    label = 'pagination response',
    url,
    method,
    requestId,
    onLegacyContract,
  }: RequirePaginationContext = {}
): ApiPaginationResponse<TItem> {
  if (result.success) {
    if (
      result.metadata.usedLegacyItemKey ||
      result.metadata.normalizedLegacyEmptyPage
    ) {
      onLegacyContract?.(result.metadata);
    }

    return result.data;
  }

  throw new ApiError(`Invalid ${label}`, {
    transportCode: 'INVALID_RESPONSE',
    requestId,
    details: { issues: result.issues },
    payload: { issues: result.issues },
    url,
    method,
  });
}
