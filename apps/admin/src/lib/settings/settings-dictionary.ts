import type { CalendarDateString } from '@e-pharmacy/types/primitives';

import type {
  PositionListItem,
  PositionListResponse,
  ProductCategoryListItem,
  ProductCategoryListResponse,
  ReferenceDataListQueryParams,
} from '@e-pharmacy/types/reference-data';

import {
  isProductCategoryColor,
  isProductCategorySlug,
} from '@e-pharmacy/validation/reference-data';

import {
  isCalendarDateString,
  isISODateTimeString,
} from '@e-pharmacy/validation/dates';

//===================================================================

export type SettingsDictionaryListQuery = ReferenceDataListQueryParams;

export type ProductCategoryMutationResponse = Readonly<{
  category: ProductCategoryListItem;
}>;

export type PositionMutationResponse = Readonly<{
  position: PositionListItem;
}>;

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

//===================================================================

function parseNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as number;
}

//===================================================================

function parsePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as number;
}

//===================================================================

function parseEarliestCreatedAt(value: unknown): CalendarDateString | null {
  if (value === null) return null;
  if (!isCalendarDateString(value)) {
    throw new TypeError('Invalid earliestCreatedAt.');
  }

  return value;
}

//===================================================================

function parseProductCategoryUsage(value: unknown) {
  if (!isRecord(value)) throw new TypeError('Invalid category usage.');

  const productsCount = parseNonNegativeInteger(
    value.productsCount,
    'productsCount'
  );

  const productRequestsCount = parseNonNegativeInteger(
    value.productRequestsCount,
    'productRequestsCount'
  );

  const total = parseNonNegativeInteger(value.total, 'category usage total');

  if (total !== productsCount + productRequestsCount) {
    throw new TypeError('Invalid category usage total.');
  }

  return { productsCount, productRequestsCount, total } as const;
}

//===================================================================

function parsePositionUsage(value: unknown) {
  if (!isRecord(value)) throw new TypeError('Invalid position usage.');

  const employeesCount = parseNonNegativeInteger(
    value.employeesCount,
    'employeesCount'
  );

  const total = parseNonNegativeInteger(value.total, 'position usage total');

  if (total !== employeesCount) {
    throw new TypeError('Invalid position usage total.');
  }

  return { employeesCount, total } as const;
}

//===================================================================

export function parseProductCategoryListItem(
  value: unknown
): ProductCategoryListItem {
  if (!isRecord(value)) throw new TypeError('Invalid product category.');

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isProductCategorySlug(value.slug) ||
    (value.status !== 'active' && value.status !== 'hidden') ||
    value.kind !== 'standard' ||
    !Number.isInteger(value.sortOrder) ||
    (value.sortOrder as number) < 0 ||
    !isProductCategoryColor(value.color) ||
    !isISODateTimeString(value.createdAt)
  ) {
    throw new TypeError('Invalid product category.');
  }

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    status: value.status,
    kind: value.kind,
    sortOrder: value.sortOrder as number,
    color: value.color.toUpperCase(),
    usage: parseProductCategoryUsage(value.usage),
    createdAt: value.createdAt,
  };
}

//===================================================================

export function parsePositionListItem(value: unknown): PositionListItem {
  if (!isRecord(value)) throw new TypeError('Invalid position.');

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isISODateTimeString(value.createdAt)
  ) {
    throw new TypeError('Invalid position.');
  }

  return {
    id: value.id,
    name: value.name,
    usage: parsePositionUsage(value.usage),
    createdAt: value.createdAt,
  };
}

//===================================================================

function parseListEnvelope<TItem>(
  value: unknown,
  parseItem: (item: unknown) => TItem
) {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Invalid Settings list response.');
  }

  const page = parsePositiveInteger(value.page, 'page');
  const perPage = parsePositiveInteger(value.perPage, 'perPage');
  const total = parseNonNegativeInteger(value.total, 'total');
  const totalPages = parseNonNegativeInteger(value.totalPages, 'totalPages');

  const expectedTotalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  if (totalPages !== expectedTotalPages) {
    throw new TypeError('Invalid Settings pagination totals.');
  }

  return {
    items: value.items.map(parseItem),
    page,
    perPage,
    total,
    totalPages,
    earliestCreatedAt: parseEarliestCreatedAt(value.earliestCreatedAt),
  } as const;
}

//===================================================================

export function parseProductCategoryListResponse(
  value: unknown
): ProductCategoryListResponse {
  return parseListEnvelope(value, parseProductCategoryListItem);
}

//===================================================================

export function parsePositionListResponse(
  value: unknown
): PositionListResponse {
  return parseListEnvelope(value, parsePositionListItem);
}

//===================================================================

export function parseProductCategoryMutationResponse(
  value: unknown
): ProductCategoryMutationResponse {
  if (!isRecord(value)) {
    throw new TypeError('Invalid product-category mutation response.');
  }

  return { category: parseProductCategoryListItem(value.category) };
}

//===================================================================

export function parsePositionMutationResponse(
  value: unknown
): PositionMutationResponse {
  if (!isRecord(value)) {
    throw new TypeError('Invalid position mutation response.');
  }

  return { position: parsePositionListItem(value.position) };
}
