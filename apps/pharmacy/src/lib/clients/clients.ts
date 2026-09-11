import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  isISODateTimeString,
  isCalendarDateString,
} from '@e-pharmacy/validation/dates';

import { isProductCategory } from '@e-pharmacy/validation/products';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import type { ApiPaginationResponse } from '@e-pharmacy/types/api';
import { USER_STATUSES } from '@e-pharmacy/config/users';
import type { UserStatus } from '@e-pharmacy/types/auth';
import type { EntityId } from '@e-pharmacy/types/primitives';

import type {
  ProductCategory,
  ProductStatus,
} from '@e-pharmacy/types/products';

//===================================================================

export type ClientStatus = UserStatus;

//===================================================================

export type PharmacyClientRow = Readonly<{
  id: EntityId;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: ClientStatus;
  statusReason?: string;
  isDefault: boolean;
}>;

export type PharmacyClientsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  firstOrderFrom?: string;
  firstOrderTo?: string;
  name?: string;
  clientId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  successfulOrders?: import('./client-filter-contracts').ClientSuccessfulOrdersFilter;
}>;

export type PharmacyClientsResponse = Readonly<
  ApiPaginationResponse<PharmacyClientRow> & {
    earliestCreatedAt: string | null;
  }
>;

export type PharmacyClientPurchasedProduct = Readonly<{
  id: string;
  orderId: EntityId;
  orderDate: string;
  productId: EntityId;
  photoUrl: string | null;
  article: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  totalAmount: number;
  status: ProductStatus;
}>;

export type PharmacyClientProductsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  article?: string;
  name?: string;
  category?: ProductCategory;
  status?: ProductStatus;
}>;

export type PharmacyClientProductsResponse = Readonly<
  ApiPaginationResponse<PharmacyClientPurchasedProduct> & {
    earliestCreatedAt: string | null;
  }
>;

//===================================================================

function invalidClientContract(message: string, payload: unknown): never {
  throw new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function isClientStatus(value: unknown): value is ClientStatus {
  return USER_STATUSES.includes(value as UserStatus);
}

//===================================================================

function isProductStatus(value: unknown): value is ProductStatus {
  return value === 'new' || value === 'active' || value === 'blocked';
}

//===================================================================

function requireObjectId(
  value: unknown,
  label: string,
  payload: unknown
): EntityId {
  const id = getTrimmedString(value);

  if (!id || !isValidObjectId(id)) {
    invalidClientContract(`${label} must be a valid entity ID.`, payload);
  }

  return id;
}

//===================================================================

function requireText(value: unknown, label: string, payload: unknown): string {
  const text = getTrimmedString(value);

  if (!text) {
    invalidClientContract(`${label} must be a non-empty string.`, payload);
  }

  return text;
}

//===================================================================

function requireString(
  value: unknown,
  label: string,
  payload: unknown
): string {
  if (typeof value !== 'string') {
    invalidClientContract(`${label} must be a string.`, payload);
  }

  return value.trim();
}

//===================================================================

function requireNullableString(
  value: unknown,
  label: string,
  payload: unknown
): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    invalidClientContract(`${label} must be a string or null.`, payload);
  }

  return value.trim() || null;
}

//===================================================================

function requireNonNegativeNumber(
  value: unknown,
  label: string,
  payload: unknown
): number {
  const number = getFiniteNumber(value);

  if (number === undefined || number < 0) {
    invalidClientContract(
      `${label} must be a finite non-negative number.`,
      payload
    );
  }

  return number;
}

//===================================================================

function requireNonNegativeInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    invalidClientContract(
      `${label} must be a safe non-negative integer.`,
      payload
    );
  }

  return value;
}

//===================================================================

function requirePositiveInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    invalidClientContract(`${label} must be a safe positive integer.`, payload);
  }

  return value;
}

//===================================================================

function parseEarliestCreatedAt(
  payload: unknown,
  label: string
): string | null {
  if (!isRecord(payload)) {
    invalidClientContract(`${label} must be an object.`, payload);
  }

  if (payload.earliestCreatedAt === null) return null;

  if (!isCalendarDateString(payload.earliestCreatedAt)) {
    invalidClientContract(
      `${label}.earliestCreatedAt must be a calendar date or null.`,
      payload
    );
  }

  return payload.earliestCreatedAt;
}

//===================================================================

export function normalizePharmacyClient(rawClient: unknown): PharmacyClientRow {
  if (!isRecord(rawClient)) {
    invalidClientContract('pharmacy client must be an object.', rawClient);
  }

  const id = requireObjectId(rawClient.id, 'pharmacy client.id', rawClient);
  const firstOrderAt = rawClient.firstOrderAt;
  const status = rawClient.status;

  if (!isISODateTimeString(firstOrderAt)) {
    invalidClientContract(
      'pharmacy client.firstOrderAt must be a canonical ISO datetime.',
      rawClient
    );
  }

  if (!isClientStatus(status)) {
    invalidClientContract('pharmacy client.status is invalid.', rawClient);
  }

  if (typeof rawClient.isDefault !== 'boolean') {
    invalidClientContract(
      'pharmacy client.isDefault must be boolean.',
      rawClient
    );
  }

  if (rawClient.isDefault && status !== 'active') {
    invalidClientContract(
      'default pharmacy client must have active status.',
      rawClient
    );
  }

  const statusReason =
    rawClient.statusReason === undefined
      ? undefined
      : requireText(
          rawClient.statusReason,
          'pharmacy client.statusReason',
          rawClient
        );

  return {
    id,
    photoUrl: requireNullableString(
      rawClient.photoUrl,
      'pharmacy client.photoUrl',
      rawClient
    ),
    firstOrderAt,
    name: requireText(rawClient.name, 'pharmacy client.name', rawClient),
    email: requireString(rawClient.email, 'pharmacy client.email', rawClient),
    phone: requireString(rawClient.phone, 'pharmacy client.phone', rawClient),

    address: requireString(
      rawClient.address,
      'pharmacy client.address',
      rawClient
    ),

    successfulOrdersCount: requireNonNegativeInteger(
      rawClient.successfulOrdersCount,
      'pharmacy client.successfulOrdersCount',
      rawClient
    ),

    successfulOrdersAmount: requireNonNegativeNumber(
      rawClient.successfulOrdersAmount,
      'pharmacy client.successfulOrdersAmount',
      rawClient
    ),

    status,
    ...(statusReason ? { statusReason } : {}),
    isDefault: rawClient.isDefault,
  };
}

//===================================================================

export function normalizePharmacyClientsResponse(
  payload: unknown
): PharmacyClientsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      legacyItemKeys: ['clients'],
      normalizeItem: normalizePharmacyClient,
    }),
    { label: 'pharmacy clients response' }
  );

  return {
    ...response,
    earliestCreatedAt: parseEarliestCreatedAt(
      payload,
      'pharmacy clients response'
    ),
  };
}

//===================================================================

function normalizePharmacyClientPurchasedProduct(
  payload: unknown
): PharmacyClientPurchasedProduct {
  if (!isRecord(payload)) {
    invalidClientContract(
      'pharmacy client purchased product must be an object.',
      payload
    );
  }

  const orderDate = payload.orderDate;
  const category = payload.category;
  const status = payload.status;

  if (!isISODateTimeString(orderDate)) {
    invalidClientContract(
      'pharmacy client purchased product.orderDate must be a canonical ISO datetime.',
      payload
    );
  }

  if (!isProductCategory(category)) {
    invalidClientContract(
      'pharmacy client purchased product.category is invalid.',
      payload
    );
  }

  if (!isProductStatus(status)) {
    invalidClientContract(
      'pharmacy client purchased product.status is invalid.',
      payload
    );
  }

  return {
    id: requireText(
      payload.id,
      'pharmacy client purchased product.id',
      payload
    ),

    orderId: requireObjectId(
      payload.orderId,
      'pharmacy client purchased product.orderId',
      payload
    ),

    orderDate,
    productId: requireObjectId(
      payload.productId,
      'pharmacy client purchased product.productId',
      payload
    ),

    photoUrl: requireNullableString(
      payload.photoUrl,
      'pharmacy client purchased product.photoUrl',
      payload
    ),

    article: requireText(
      payload.article,
      'pharmacy client purchased product.article',
      payload
    ),

    name: requireText(
      payload.name,
      'pharmacy client purchased product.name',
      payload
    ),

    category,
    quantity: requirePositiveInteger(
      payload.quantity,
      'pharmacy client purchased product.quantity',
      payload
    ),

    totalAmount: requireNonNegativeNumber(
      payload.totalAmount,
      'pharmacy client purchased product.totalAmount',
      payload
    ),
    status,
  };
}

//===================================================================

export function normalizePharmacyClientProductsResponse(
  payload: unknown
): PharmacyClientProductsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      legacyItemKeys: ['products'],
      normalizeItem: normalizePharmacyClientPurchasedProduct,
    }),
    { label: 'pharmacy client products response' }
  );

  return {
    ...response,
    earliestCreatedAt: parseEarliestCreatedAt(
      payload,
      'pharmacy client products response'
    ),
  };
}
