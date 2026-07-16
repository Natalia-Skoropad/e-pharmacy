import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import type {
  EntityId,
  ProductCategory,
  ProductStatus,
  UserStatus,
} from '@e-pharmacy/types';

import { isProductCategory } from '@e-pharmacy/types/products';

//===================================================================

export const CLIENT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly UserStatus[];

//===================================================================

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type ClientSuccessfulOrdersFilter = 'repeat' | 'successful' | 'other';

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
  successfulOrders?: ClientSuccessfulOrdersFilter;
}>;

export type PharmacyClientsResponse = Readonly<{
  items: PharmacyClientRow[];
  total: number;
  earliestCreatedAt: string | null;
}>;

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

export type PharmacyClientProductsResponse = Readonly<{
  items: PharmacyClientPurchasedProduct[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  earliestCreatedAt: string | null;
}>;

//===================================================================

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
};

//===================================================================

function isClientStatus(value: unknown): value is ClientStatus {
  return CLIENT_STATUSES.includes(value as ClientStatus);
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
    getStringValue(client.id) ??
    getStringValue(client.clientId) ??
    getStringValue(client._id)
  );
}

//===================================================================

function getClientName(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.name) ??
    getStringValue(client.fullName) ??
    (nestedClient ? getStringValue(nestedClient.name) : undefined) ??
    (nestedClient ? getStringValue(nestedClient.fullName) : undefined) ??
    (profile ? getStringValue(profile.name) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientEmail(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.email) ??
    (nestedClient ? getStringValue(nestedClient.email) : undefined) ??
    (profile ? getStringValue(profile.email) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhone(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.phone) ??
    (nestedClient ? getStringValue(nestedClient.phone) : undefined) ??
    (profile ? getStringValue(profile.phone) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientAddress(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.address) ??
    (nestedClient ? getStringValue(nestedClient.address) : undefined) ??
    (profile ? getStringValue(profile.address) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhoto(client: Record<string, unknown>): string | null {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.photoUrl) ??
    getStringValue(client.pictureUrl) ??
    getStringValue(client.avatarUrl) ??
    (nestedClient ? getStringValue(nestedClient.photoUrl) : undefined) ??
    (nestedClient ? getStringValue(nestedClient.pictureUrl) : undefined) ??
    (profile ? getStringValue(profile.photoUrl) : undefined) ??
    (profile ? getStringValue(profile.pictureUrl) : undefined) ??
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
    getNumberValue(client.successfulOrdersCount) ??
    getNumberValue(client.successfulOrders) ??
    (statistics
      ? getNumberValue(statistics.successfulOrdersCount)
      : undefined) ??
    (successful ? getNumberValue(successful.count) : undefined) ??
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
    getNumberValue(client.successfulOrdersAmount) ??
    getNumberValue(client.successfulOrdersTotal) ??
    (statistics
      ? getNumberValue(statistics.successfulOrdersAmount)
      : undefined) ??
    (successful ? getNumberValue(successful.amount) : undefined) ??
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

  return {
    id,
    photoUrl: getClientPhoto(rawClient),
    firstOrderAt:
      getStringValue(rawClient.firstOrderAt) ??
      getStringValue(rawClient.firstOrderDate) ??
      getStringValue(rawClient.createdAt) ??
      '',
    name: getClientName(rawClient),
    email: getClientEmail(rawClient),
    phone: getClientPhone(rawClient),
    address: getClientAddress(rawClient),
    successfulOrdersCount: getSuccessfulOrdersCount(rawClient),
    successfulOrdersAmount: getSuccessfulOrdersAmount(rawClient),
    status: isClientStatus(rawClient.status) ? rawClient.status : 'active',
    ...(getStringValue(rawClient.statusReason)
      ? { statusReason: getStringValue(rawClient.statusReason) }
      : {}),
  };
}

//===================================================================

export function normalizePharmacyClientsResponse(
  payload: unknown
): PharmacyClientsResponse {
  const response = normalizePaginatedResponse(payload, {
    itemKeys: ['items', 'clients'],
    normalizeItem: normalizePharmacyClient,
  });

  return {
    ...response,
    earliestCreatedAt: isRecord(payload)
      ? (getStringValue(payload.earliestCreatedAt) ?? null)
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

  const id = getStringValue(payload.id);
  const orderId = getStringValue(payload.orderId);
  const orderDate = getStringValue(payload.orderDate);
  const productId = getStringValue(payload.productId);
  const article = getStringValue(payload.article);
  const name = getStringValue(payload.name);
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
    photoUrl: getStringValue(payload.photoUrl) ?? null,
    article,
    name,
    category,
    quantity: getNumberValue(payload.quantity) ?? 0,
    totalAmount: getNumberValue(payload.totalAmount) ?? 0,
    status,
  };
}

//===================================================================

export function normalizePharmacyClientProductsResponse(
  payload: unknown
): PharmacyClientProductsResponse {
  const response = normalizePaginatedResponse(payload, {
    itemKeys: ['items', 'products'],
    normalizeItem: normalizePharmacyClientPurchasedProduct,
  });

  const record = isRecord(payload) ? payload : {};

  return {
    items: response.items,
    page: Math.max(1, getNumberValue(record.page) ?? 1),
    perPage: Math.max(1, getNumberValue(record.perPage) ?? 20),
    total: response.total,
    totalPages: Math.max(0, getNumberValue(record.totalPages) ?? 0),
    earliestCreatedAt: getStringValue(record.earliestCreatedAt) ?? null,
  };
}
