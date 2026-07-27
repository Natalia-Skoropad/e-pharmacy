import { isProductCategory } from '@e-pharmacy/validation/products';

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
  successfulOrders?: import('./config').ClientSuccessfulOrdersValue;
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

function isClientStatus(value: unknown): value is ClientStatus {
  return USER_STATUSES.includes(value as UserStatus);
}

//===================================================================

function getNestedRecord(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = source[key];

  return isRecord(value) ? value : undefined;
}

//===================================================================

function getClientId(client: Record<string, unknown>): string | undefined {
  return (
    getTrimmedString(client.id) ??
    getTrimmedString(client.clientId) ??
    getTrimmedString(client._id)
  );
}

//===================================================================

function getClientName(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getTrimmedString(client.name) ??
    getTrimmedString(client.fullName) ??
    (nestedClient ? getTrimmedString(nestedClient.name) : undefined) ??
    (nestedClient ? getTrimmedString(nestedClient.fullName) : undefined) ??
    (profile ? getTrimmedString(profile.name) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientEmail(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getTrimmedString(client.email) ??
    (nestedClient ? getTrimmedString(nestedClient.email) : undefined) ??
    (profile ? getTrimmedString(profile.email) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhone(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getTrimmedString(client.phone) ??
    (nestedClient ? getTrimmedString(nestedClient.phone) : undefined) ??
    (profile ? getTrimmedString(profile.phone) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientAddress(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getTrimmedString(client.address) ??
    (nestedClient ? getTrimmedString(nestedClient.address) : undefined) ??
    (profile ? getTrimmedString(profile.address) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhoto(client: Record<string, unknown>): string | null {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getTrimmedString(client.photoUrl) ??
    getTrimmedString(client.pictureUrl) ??
    getTrimmedString(client.avatarUrl) ??
    (nestedClient ? getTrimmedString(nestedClient.photoUrl) : undefined) ??
    (nestedClient ? getTrimmedString(nestedClient.pictureUrl) : undefined) ??
    (profile ? getTrimmedString(profile.photoUrl) : undefined) ??
    (profile ? getTrimmedString(profile.pictureUrl) : undefined) ??
    null
  );
}

//===================================================================

function getSuccessfulOrdersCount(client: Record<string, unknown>): number {
  const statistics = getNestedRecord(client, 'statistics');
  const successful = statistics
    ? getNestedRecord(statistics, 'successful')
    : undefined;

  return (
    getFiniteNumber(client.successfulOrdersCount) ??
    getFiniteNumber(client.successfulOrders) ??
    (statistics
      ? getFiniteNumber(statistics.successfulOrdersCount)
      : undefined) ??
    (successful ? getFiniteNumber(successful.count) : undefined) ??
    0
  );
}

//===================================================================

function getSuccessfulOrdersAmount(client: Record<string, unknown>): number {
  const statistics = getNestedRecord(client, 'statistics');
  const successful = statistics
    ? getNestedRecord(statistics, 'successful')
    : undefined;

  return (
    getFiniteNumber(client.successfulOrdersAmount) ??
    getFiniteNumber(client.successfulOrdersTotal) ??
    (statistics
      ? getFiniteNumber(statistics.successfulOrdersAmount)
      : undefined) ??
    (successful ? getFiniteNumber(successful.amount) : undefined) ??
    0
  );
}

//===================================================================

export function normalizePharmacyClient(
  rawClient: unknown
): PharmacyClientRow | null {
  if (!isRecord(rawClient)) return null;

  const id = getClientId(rawClient);
  if (!id) return null;

  const isDefault = rawClient.isDefault === true;

  return {
    id,
    photoUrl: getClientPhoto(rawClient),
    firstOrderAt:
      getTrimmedString(rawClient.firstOrderAt) ??
      getTrimmedString(rawClient.firstOrderDate) ??
      getTrimmedString(rawClient.createdAt) ??
      '',
    name: getClientName(rawClient),
    email: isDefault ? '' : getClientEmail(rawClient),
    phone: isDefault ? '' : getClientPhone(rawClient),
    address: isDefault ? '' : getClientAddress(rawClient),
    successfulOrdersCount: getSuccessfulOrdersCount(rawClient),
    successfulOrdersAmount: getSuccessfulOrdersAmount(rawClient),
    status: isDefault
      ? 'active'
      : isClientStatus(rawClient.status)
        ? rawClient.status
        : 'active',
    ...(getTrimmedString(rawClient.statusReason)
      ? { statusReason: getTrimmedString(rawClient.statusReason) }
      : {}),
    isDefault,
  };
}

//===================================================================

export function normalizePharmacyClientsResponse(
  payload: unknown
): PharmacyClientsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      itemKeys: ['items', 'clients'],
      normalizeItem: normalizePharmacyClient,
    }),
    'pharmacy clients response'
  );

  return {
    ...response,
    earliestCreatedAt: isRecord(payload)
      ? (getTrimmedString(payload.earliestCreatedAt) ?? null)
      : null,
  };
}

//===================================================================

function isProductStatus(value: unknown): value is ProductStatus {
  return value === 'new' || value === 'active' || value === 'blocked';
}

//===================================================================

function normalizePharmacyClientPurchasedProduct(
  payload: unknown
): PharmacyClientPurchasedProduct | null {
  if (!isRecord(payload)) return null;

  const id = getTrimmedString(payload.id);
  const orderId = getTrimmedString(payload.orderId);
  const orderDate = getTrimmedString(payload.orderDate);
  const productId = getTrimmedString(payload.productId);
  const article = getTrimmedString(payload.article);
  const name = getTrimmedString(payload.name);
  const category = payload.category;
  const status = payload.status;

  if (
    !id ||
    !orderId ||
    !orderDate ||
    !productId ||
    !article ||
    !name ||
    !isProductCategory(category) ||
    !isProductStatus(status)
  ) {
    return null;
  }

  return {
    id,
    orderId,
    orderDate,
    productId,
    photoUrl: getTrimmedString(payload.photoUrl) ?? null,
    article,
    name,
    category,
    quantity: getFiniteNumber(payload.quantity) ?? 0,
    totalAmount: getFiniteNumber(payload.totalAmount) ?? 0,
    status,
  };
}

//===================================================================

export function normalizePharmacyClientProductsResponse(
  payload: unknown
): PharmacyClientProductsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      itemKeys: ['items', 'products'],
      normalizeItem: normalizePharmacyClientPurchasedProduct,
    }),
    'pharmacy client products response'
  );

  return {
    ...response,
    earliestCreatedAt: isRecord(payload)
      ? (getTrimmedString(payload.earliestCreatedAt) ?? null)
      : null,
  };
}
