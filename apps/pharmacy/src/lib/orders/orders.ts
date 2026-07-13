import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import {
  DEFAULT_ORDER_STATISTICS,
  type OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import { isProductCategory } from '@e-pharmacy/types/products';

import type {
  DeliveryMethod,
  EntityId,
  PharmacyBankDetails,
  ProductCategory,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

//===================================================================

export const DELIVERY_METHODS = [
  'pickup',
  'postal_delivery',
] as const satisfies readonly DeliveryMethod[];

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
] as const satisfies readonly PaymentMethod[];

export const ORDER_STATUSES = [
  'new',
  'in_progress',
  'successful',
  'rejected',
] as const satisfies readonly OrderStatus[];

//===================================================================

export type PharmacyOrderItem = Readonly<{
  id: EntityId;
  productId: EntityId;
  productOfferId: EntityId;
  name: string;
  article: string;
  category?: ProductCategory;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableQuantity?: number;
  currentPrice?: number;
}>;

export type PharmacyOrderRow = Readonly<{
  id: EntityId;
  orderNumber: string;
  orderDate: string;
  client: string;
  clientId: EntityId | null;
  clientPhotoUrl: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  clientComment: string;
  totalQuantity: number;
  totalAmount: number;
  status: OrderStatus;
  items: PharmacyOrderItem[];
}>;

export type PharmacyOrderStatusHistoryItem = Readonly<{
  status: OrderStatus;
  changedAt: string;
  changedBy: EntityId;
  comment?: string;
}>;

export type PharmacyOrderManagerComment = Readonly<{
  id: EntityId;
  text: string;
  createdAt: string;
  createdBy: EntityId;
}>;

export type PharmacyOrderDetails = PharmacyOrderRow &
  Readonly<{
    currency: 'UAH';
    deliveryAddress?: string;
    recipientName?: string;
    recipientPhone?: string;
    pharmacyComment?: string;
    managerComment?: string;
    rejectionReason?: string;
    statusHistory: PharmacyOrderStatusHistoryItem[];
    pharmacyId: EntityId;
    pharmacyPhone?: string;
    pharmacyAddress?: string;
    pharmacyEmail?: string;
    bankDetails?: PharmacyBankDetails;
  }>;

export type PharmacyOrderManagerCommentsResponse = Readonly<{
  items: PharmacyOrderManagerComment[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}>;

export type PharmacyOrdersQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  orderNumber?: string;
  deliveryMethod?: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  status?: OrderStatus;
  productId?: EntityId;
  comment?: string;
}>;

export type PharmacyOrdersResponse = Readonly<{
  items: PharmacyOrderRow[];
  total: number;
  statistics: OrderStatisticsCounts;
}>;

//===================================================================

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Pickup from pharmacy',
  postal_delivery: 'Post delivery',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash on pickup / delivery',
  bank_transfer: 'Bank transfer',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  successful: 'Successful',
  rejected: 'Rejected',
};

//===================================================================

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return DELIVERY_METHODS.includes(value as DeliveryMethod);
}

//===================================================================

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

//===================================================================

function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
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

function getClientId(order: Record<string, unknown>): string | null {
  const client = getNestedRecord(order, 'client');
  const customer = getNestedRecord(order, 'customer');
  const user = getNestedRecord(order, 'user');

  return (
    getStringValue(order.clientId) ??
    getStringValue(order.customerId) ??
    getStringValue(order.userId) ??
    (client ? getStringValue(client.id) : undefined) ??
    (client ? getStringValue(client.clientId) : undefined) ??
    (client ? getStringValue(client._id) : undefined) ??
    (customer ? getStringValue(customer.id) : undefined) ??
    (user ? getStringValue(user.id) : undefined) ??
    null
  );
}

//===================================================================

function getClientPhotoUrl(order: Record<string, unknown>): string | null {
  const client = getNestedRecord(order, 'client');
  const customer = getNestedRecord(order, 'customer');
  const user = getNestedRecord(order, 'user');
  const profile = client ? getNestedRecord(client, 'profile') : undefined;

  return (
    getStringValue(order.clientPhotoUrl) ??
    getStringValue(order.clientAvatarUrl) ??
    getStringValue(order.photoUrl) ??
    (client ? getStringValue(client.photoUrl) : undefined) ??
    (client ? getStringValue(client.pictureUrl) : undefined) ??
    (client ? getStringValue(client.avatarUrl) : undefined) ??
    (customer ? getStringValue(customer.photoUrl) : undefined) ??
    (user ? getStringValue(user.photoUrl) : undefined) ??
    (profile ? getStringValue(profile.photoUrl) : undefined) ??
    (profile ? getStringValue(profile.pictureUrl) : undefined) ??
    null
  );
}

//===================================================================

function getDeliveryMethod(order: Record<string, unknown>): DeliveryMethod {
  if (isDeliveryMethod(order.deliveryMethod)) return order.deliveryMethod;

  const delivery = order.delivery;
  if (isRecord(delivery) && isDeliveryMethod(delivery.method)) {
    return delivery.method;
  }

  return 'pickup';
}

//===================================================================

function getClientName(order: Record<string, unknown>): string {
  const directClientName = getStringValue(order.clientName);
  if (directClientName) return directClientName;

  const directClient = getStringValue(order.client);
  if (directClient) return directClient;

  const client = order.client;
  if (isRecord(client)) {
    const fullName = getStringValue(client.name);
    if (fullName) return fullName;
  }

  const delivery = order.delivery;
  if (isRecord(delivery) && isRecord(delivery.details)) {
    const recipientName = getStringValue(delivery.details.recipientName);
    if (recipientName) return recipientName;
  }

  return '—';
}

//===================================================================

function normalizePharmacyOrderItem(
  rawItem: unknown
): PharmacyOrderItem | null {
  if (!isRecord(rawItem)) return null;

  const id = getStringValue(rawItem.id) ?? getStringValue(rawItem._id);
  const productId = getStringValue(rawItem.productId);
  const productOfferId = getStringValue(rawItem.productOfferId);
  const name = getStringValue(rawItem.name) ?? 'Product';
  const article = getStringValue(rawItem.article) ?? '—';
  const category = rawItem.category;

  if (!id || !productId || !productOfferId) return null;

  return {
    id,
    productId,
    productOfferId,
    name,
    article,
    ...(isProductCategory(category) ? { category } : {}),
    ...(getStringValue(rawItem.imageUrl)
      ? { imageUrl: getStringValue(rawItem.imageUrl) }
      : {}),
    ...(typeof getNumberValue(rawItem.rating) === 'number'
      ? { rating: getNumberValue(rawItem.rating) }
      : {}),
    ...(typeof getNumberValue(rawItem.reviewsCount) === 'number'
      ? { reviewsCount: getNumberValue(rawItem.reviewsCount) }
      : {}),
    quantity: getNumberValue(rawItem.quantity) ?? 0,
    unitPrice: getNumberValue(rawItem.unitPrice) ?? 0,
    totalPrice: getNumberValue(rawItem.totalPrice) ?? 0,
    ...(typeof getNumberValue(rawItem.availableQuantity) === 'number'
      ? { availableQuantity: getNumberValue(rawItem.availableQuantity) }
      : {}),
    ...(typeof getNumberValue(rawItem.currentPrice) === 'number'
      ? { currentPrice: getNumberValue(rawItem.currentPrice) }
      : {}),
  };
}

//===================================================================

export function normalizePharmacyOrder(
  rawOrder: unknown
): PharmacyOrderRow | null {
  if (!isRecord(rawOrder)) return null;

  const id = getStringValue(rawOrder.id);
  const orderNumber = getStringValue(rawOrder.orderNumber) ?? id;
  const orderDate =
    getStringValue(rawOrder.orderDate) ?? getStringValue(rawOrder.createdAt);

  if (!id || !orderNumber || !orderDate) return null;

  const paymentMethod = isPaymentMethod(rawOrder.paymentMethod)
    ? rawOrder.paymentMethod
    : 'cash';
  const status = isOrderStatus(rawOrder.status) ? rawOrder.status : 'new';
  const items = Array.isArray(rawOrder.items)
    ? rawOrder.items
        .map(normalizePharmacyOrderItem)
        .filter((item): item is PharmacyOrderItem => Boolean(item))
    : [];

  return {
    id,
    orderNumber,
    orderDate,
    client: getClientName(rawOrder),
    clientId: getClientId(rawOrder),
    clientPhotoUrl: getClientPhotoUrl(rawOrder),
    deliveryMethod: getDeliveryMethod(rawOrder),
    paymentMethod,
    clientComment:
      getStringValue(rawOrder.clientComment) ??
      getStringValue(rawOrder.comment) ??
      '',
    totalQuantity:
      getNumberValue(rawOrder.totalQuantity) ??
      getNumberValue(rawOrder.totalItems) ??
      0,
    totalAmount:
      getNumberValue(rawOrder.totalAmount) ??
      getNumberValue(rawOrder.totalPrice) ??
      0,
    status,
    items,
  };
}

//===================================================================

function normalizeStatusHistory(
  payload: unknown
): PharmacyOrderStatusHistoryItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const status = isOrderStatus(entry.status) ? entry.status : null;
      const changedAt = getStringValue(entry.changedAt);
      const changedBy = getStringValue(entry.changedBy);

      if (!status || !changedAt || !changedBy) return null;

      return {
        status,
        changedAt,
        changedBy,
        ...(getStringValue(entry.comment)
          ? { comment: getStringValue(entry.comment) }
          : {}),
      };
    })
    .filter((entry): entry is PharmacyOrderStatusHistoryItem => Boolean(entry));
}

//===================================================================

export function normalizePharmacyOrderManagerComment(
  payload: unknown
): PharmacyOrderManagerComment | null {
  if (!isRecord(payload)) return null;

  const id = getStringValue(payload.id) ?? getStringValue(payload._id);
  const text = getStringValue(payload.text);
  const createdAt = getStringValue(payload.createdAt);
  const createdBy = getStringValue(payload.createdBy);

  if (!id || !text || !createdAt || !createdBy) return null;

  return { id, text, createdAt, createdBy };
}

export function normalizePharmacyOrderManagerCommentsResponse(
  payload: unknown
): PharmacyOrderManagerCommentsResponse {
  if (!isRecord(payload)) {
    return { items: [], page: 1, perPage: 5, total: 0, totalPages: 1 };
  }

  const items = Array.isArray(payload.items)
    ? payload.items
        .map(normalizePharmacyOrderManagerComment)
        .filter((item): item is PharmacyOrderManagerComment => Boolean(item))
    : [];

  return {
    items,
    page: Math.max(1, getNumberValue(payload.page) ?? 1),
    perPage: Math.max(1, getNumberValue(payload.perPage) ?? 5),
    total: Math.max(0, getNumberValue(payload.total) ?? items.length),
    totalPages: Math.max(1, getNumberValue(payload.totalPages) ?? 1),
  };
}

//===================================================================

function normalizeBankDetails(payload: unknown): PharmacyBankDetails | null {
  if (!isRecord(payload)) return null;

  const recipientName = getStringValue(payload.recipientName);
  const taxId = getStringValue(payload.taxId);
  const iban = getStringValue(payload.iban);
  const bankName = getStringValue(payload.bankName);
  const paymentPurpose = getStringValue(payload.paymentPurpose);

  if (!recipientName || !taxId || !iban || !bankName || !paymentPurpose) {
    return null;
  }

  return {
    recipientName,
    taxId,
    iban,
    bankName,
    paymentPurpose,
    ...(getStringValue(payload.receiptEmail)
      ? { receiptEmail: getStringValue(payload.receiptEmail) }
      : {}),
  };
}

//===================================================================

export function normalizePharmacyOrderDetails(
  payload: unknown
): PharmacyOrderDetails | null {
  if (!isRecord(payload)) return null;

  const row = normalizePharmacyOrder(payload);
  if (!row) return null;

  const delivery = isRecord(payload.delivery) ? payload.delivery : undefined;
  const deliveryDetails =
    delivery && isRecord(delivery.details) ? delivery.details : undefined;
  const bankDetails = normalizeBankDetails(payload.bankDetails);

  return {
    ...row,
    currency: 'UAH',
    pharmacyId: getStringValue(payload.pharmacyId) ?? '',
    statusHistory: normalizeStatusHistory(payload.statusHistory),
    ...(getStringValue(payload.pharmacyPhone)
      ? { pharmacyPhone: getStringValue(payload.pharmacyPhone) }
      : {}),
    ...(getStringValue(payload.pharmacyAddress)
      ? { pharmacyAddress: getStringValue(payload.pharmacyAddress) }
      : {}),
    ...(getStringValue(payload.pharmacyEmail)
      ? { pharmacyEmail: getStringValue(payload.pharmacyEmail) }
      : {}),
    ...(bankDetails ? { bankDetails } : {}),
    ...(getStringValue(deliveryDetails?.address)
      ? { deliveryAddress: getStringValue(deliveryDetails?.address) }
      : {}),
    ...(getStringValue(deliveryDetails?.recipientName)
      ? { recipientName: getStringValue(deliveryDetails?.recipientName) }
      : {}),
    ...(getStringValue(deliveryDetails?.recipientPhone)
      ? { recipientPhone: getStringValue(deliveryDetails?.recipientPhone) }
      : {}),
    ...(getStringValue(payload.pharmacyComment)
      ? { pharmacyComment: getStringValue(payload.pharmacyComment) }
      : {}),
    ...(getStringValue(payload.managerComment)
      ? { managerComment: getStringValue(payload.managerComment) }
      : {}),
    ...(getStringValue(payload.rejectionReason)
      ? { rejectionReason: getStringValue(payload.rejectionReason) }
      : {}),
  };
}

//===================================================================

function normalizeOrderStatistics(payload: unknown): OrderStatisticsCounts {
  if (!isRecord(payload)) return DEFAULT_ORDER_STATISTICS;

  return ORDER_STATUSES.reduce<OrderStatisticsCounts>((acc, status) => {
    const value = payload[status];

    if (!isRecord(value)) return acc;

    return {
      ...acc,
      [status]: {
        count: getNumberValue(value.count) ?? 0,
        amount: getNumberValue(value.amount) ?? 0,
      },
    };
  }, DEFAULT_ORDER_STATISTICS);
}

//===================================================================

export function normalizePharmacyOrdersResponse(
  payload: unknown
): PharmacyOrdersResponse {
  const response = normalizePaginatedResponse(payload, {
    normalizeItem: normalizePharmacyOrder,
  });

  return {
    ...response,
    statistics: isRecord(payload)
      ? normalizeOrderStatistics(payload.statistics)
      : DEFAULT_ORDER_STATISTICS,
  };
}
