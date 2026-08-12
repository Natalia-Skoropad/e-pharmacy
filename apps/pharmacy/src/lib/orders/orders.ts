import { isISODateTimeString } from '@e-pharmacy/validation/dates';
import { isProductCategory } from '@e-pharmacy/validation/products';

import {
  DELIVERY_METHODS,
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';
import type { ApiPaginationResponse } from '@e-pharmacy/types/api';

import type {
  DeliveryMethod,
  OrderActivityType,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { CompletePharmacyBankDetails } from '@e-pharmacy/types/pharmacies';
import type { EntityId, ISODateTimeString } from '@e-pharmacy/types/primitives';
import type { ProductCategory } from '@e-pharmacy/types/products';

import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

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
  pharmacyName: string;
  client: string;
  clientId: EntityId | null;
  clientPhotoUrl: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  clientComment: string;
  totalQuantity: number;
  totalAmount: number;
  status: OrderStatus;
  createdByType: OrderCreatedByType;
  items: PharmacyOrderItem[];
}>;

export type PharmacyOrderStatusHistoryItem = Readonly<{
  status: OrderStatus;
  changedAt: string;
  changedBy: EntityId;
  comment?: string;
}>;

export type PharmacyOrderActivityHistoryItem = Readonly<{
  type: OrderActivityType;
  occurredAt: string;
  changedBy: EntityId;
  productId: EntityId;
  productOfferId: EntityId;
  productName: string;
  previousQuantity: number;
  quantity: number;
  quantityDelta: number;
  previousUnitPrice: number;
  unitPrice: number;
}>;

export type PharmacyOrderManagerComment = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;
  createdBy: EntityId;
}>;

export type PharmacyOrderDetails = PharmacyOrderRow &
  Readonly<{
    currency: '₴';
    deliveryAddress?: string;
    recipientName?: string;
    recipientPhone?: string;
    pharmacyComment?: string;
    managerComment?: string;
    rejectionReason?: string;
    statusHistory: PharmacyOrderStatusHistoryItem[];
    activityHistory: PharmacyOrderActivityHistoryItem[];
    pharmacyId: EntityId;
    clientPhone?: string;
    clientAddress?: string;
    pharmacyPhone?: string;
    pharmacyAddress?: string;
    pharmacyWorkingHours?: string;
    pharmacyEmail?: string;
    bankDetails?: CompletePharmacyBankDetails;
    managerCommentsCount: number;
  }>;

export type PharmacyOrderManagerCommentsResponse = Readonly<
  ApiPaginationResponse<PharmacyOrderManagerComment>
>;

export type PharmacyOrdersQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  clientId?: EntityId;
  orderNumber?: string;
  deliveryMethod?: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  status?: OrderStatus;
  createdByType?: OrderCreatedByType;
  productId?: EntityId;
  comment?: string;
  clientComment?: string;
  clientCommentPresence?: 'with' | 'without';
}>;

export type PharmacyOrdersResponse = Readonly<
  ApiPaginationResponse<PharmacyOrderRow> & {
    statistics: OrderStatisticsCounts;
    earliestCreatedAt: string | null;
  }
>;

//===================================================================

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return DELIVERY_METHODS.includes(value as DeliveryMethod);
}

//===================================================================

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

//===================================================================

function isOrderCreatedByType(value: unknown): value is OrderCreatedByType {
  return ORDER_CREATED_BY_TYPES.includes(value as OrderCreatedByType);
}

//===================================================================

function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

//===================================================================

const ORDER_ACTIVITY_TYPES = [
  'product_added',
  'product_removed',
  'quantity_increased',
  'quantity_decreased',
] as const satisfies readonly OrderActivityType[];

//===================================================================

function isOrderActivityType(value: unknown): value is OrderActivityType {
  return ORDER_ACTIVITY_TYPES.includes(value as OrderActivityType);
}

//===================================================================

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

//===================================================================

function invalidOrderContract(message: string, payload: unknown): never {
  throw new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function requireObjectId(value: unknown, label: string, payload: unknown): EntityId {
  const id = getTrimmedString(value);
  if (!id || !OBJECT_ID_PATTERN.test(id)) {
    invalidOrderContract(`${label} must be a Mongo ObjectId string.`, payload);
  }

  return id;
}

//===================================================================

function requireIsoDateTime(
  value: unknown,
  label: string,
  payload: unknown
): ISODateTimeString {
  if (!isISODateTimeString(value)) {
    invalidOrderContract(`${label} must be a canonical ISO datetime string.`, payload);
  }

  return value;
}

//===================================================================

function requireText(value: unknown, label: string, payload: unknown): string {
  const text = getTrimmedString(value);
  if (!text) invalidOrderContract(`${label} must be a non-empty string.`, payload);
  return text;
}

//===================================================================

function requirePositiveInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    invalidOrderContract(`${label} must be a safe positive integer.`, payload);
  }

  return value;
}

//===================================================================

function requireNonNegativeInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    invalidOrderContract(`${label} must be a safe non-negative integer.`, payload);
  }

  return value;
}

//===================================================================

function requireNonNegativeNumber(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    invalidOrderContract(`${label} must be a finite non-negative number.`, payload);
  }

  return value;
}

//===================================================================

function assertMoneyEqual(
  actual: number,
  expected: number,
  label: string,
  payload: unknown
): void {
  if (Math.abs(actual - expected) > 1e-9) {
    invalidOrderContract(`${label} is inconsistent with order item totals.`, payload);
  }
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
    getTrimmedString(order.clientId) ??
    getTrimmedString(order.customerId) ??
    getTrimmedString(order.userId) ??
    (client ? getTrimmedString(client.id) : undefined) ??
    (client ? getTrimmedString(client.clientId) : undefined) ??
    (client ? getTrimmedString(client._id) : undefined) ??
    (customer ? getTrimmedString(customer.id) : undefined) ??
    (user ? getTrimmedString(user.id) : undefined) ??
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
    getTrimmedString(order.clientPhotoUrl) ??
    getTrimmedString(order.clientAvatarUrl) ??
    getTrimmedString(order.photoUrl) ??
    (client ? getTrimmedString(client.photoUrl) : undefined) ??
    (client ? getTrimmedString(client.pictureUrl) : undefined) ??
    (client ? getTrimmedString(client.avatarUrl) : undefined) ??
    (customer ? getTrimmedString(customer.photoUrl) : undefined) ??
    (user ? getTrimmedString(user.photoUrl) : undefined) ??
    (profile ? getTrimmedString(profile.photoUrl) : undefined) ??
    (profile ? getTrimmedString(profile.pictureUrl) : undefined) ??
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

  return invalidOrderContract('order.delivery.method is invalid.', order);
}

//===================================================================

function getClientName(order: Record<string, unknown>): string {
  const directClientName = getTrimmedString(order.clientName);
  if (directClientName) return directClientName;

  const directClient = getTrimmedString(order.client);
  if (directClient) return directClient;

  const client = order.client;
  if (isRecord(client)) {
    const fullName = getTrimmedString(client.name);
    if (fullName) return fullName;
  }

  const delivery = order.delivery;
  if (isRecord(delivery) && isRecord(delivery.details)) {
    const recipientName = getTrimmedString(delivery.details.recipientName);
    if (recipientName) return recipientName;
  }

  return '—';
}

//===================================================================

function normalizePharmacyOrderItem(rawItem: unknown): PharmacyOrderItem {
  if (!isRecord(rawItem)) {
    return invalidOrderContract('order item must be an object.', rawItem);
  }

  const id = requireObjectId(rawItem.id, 'order item.id', rawItem);
  const productId = requireObjectId(
    rawItem.productId,
    'order item.productId',
    rawItem
  );
  const productOfferId = requireObjectId(
    rawItem.productOfferId,
    'order item.productOfferId',
    rawItem
  );
  const name = requireText(rawItem.name, 'order item.name', rawItem);
  const article = requireText(rawItem.article, 'order item.article', rawItem);
  const quantity = requirePositiveInteger(
    rawItem.quantity,
    'order item.quantity',
    rawItem
  );
  const unitPrice = requireNonNegativeNumber(
    rawItem.unitPrice,
    'order item.unitPrice',
    rawItem
  );
  const totalPrice = requireNonNegativeNumber(
    rawItem.totalPrice,
    'order item.totalPrice',
    rawItem
  );

  assertMoneyEqual(
    totalPrice,
    quantity * unitPrice,
    'order item.totalPrice',
    rawItem
  );

  const category =
    rawItem.category === undefined
      ? undefined
      : isProductCategory(rawItem.category)
        ? rawItem.category
        : invalidOrderContract('order item.category is invalid.', rawItem);

  const rating =
    rawItem.rating === undefined
      ? undefined
      : requireNonNegativeNumber(rawItem.rating, 'order item.rating', rawItem);
  const reviewsCount =
    rawItem.reviewsCount === undefined
      ? undefined
      : requireNonNegativeInteger(
          rawItem.reviewsCount,
          'order item.reviewsCount',
          rawItem
        );
  const availableQuantity =
    rawItem.availableQuantity === undefined
      ? undefined
      : requireNonNegativeInteger(
          rawItem.availableQuantity,
          'order item.availableQuantity',
          rawItem
        );
  const currentPrice =
    rawItem.currentPrice === undefined
      ? undefined
      : requireNonNegativeNumber(
          rawItem.currentPrice,
          'order item.currentPrice',
          rawItem
        );

  return {
    id,
    productId,
    productOfferId,
    name,
    article,
    ...(category !== undefined ? { category } : {}),
    ...(getTrimmedString(rawItem.imageUrl)
      ? { imageUrl: getTrimmedString(rawItem.imageUrl) }
      : {}),
    ...(rating !== undefined ? { rating } : {}),
    ...(reviewsCount !== undefined ? { reviewsCount } : {}),
    quantity,
    unitPrice,
    totalPrice,
    ...(availableQuantity !== undefined ? { availableQuantity } : {}),
    ...(currentPrice !== undefined ? { currentPrice } : {}),
  };
}

//===================================================================

export function normalizePharmacyOrder(rawOrder: unknown): PharmacyOrderRow {
  if (!isRecord(rawOrder)) {
    return invalidOrderContract('order must be an object.', rawOrder);
  }

  const id = requireObjectId(rawOrder.id, 'order.id', rawOrder);
  const orderNumber = requireText(
    rawOrder.orderNumber,
    'order.orderNumber',
    rawOrder
  );
  const orderDate = requireIsoDateTime(
    rawOrder.orderDate ?? rawOrder.createdAt,
    'order.createdAt',
    rawOrder
  );

  if (!isPaymentMethod(rawOrder.paymentMethod)) {
    invalidOrderContract('order.paymentMethod is invalid.', rawOrder);
  }
  if (!isOrderStatus(rawOrder.status)) {
    invalidOrderContract('order.status is invalid.', rawOrder);
  }
  if (!isOrderCreatedByType(rawOrder.createdByType)) {
    invalidOrderContract('order.createdByType is invalid.', rawOrder);
  }
  if (!Array.isArray(rawOrder.items)) {
    invalidOrderContract('order.items must be an array.', rawOrder);
  }

  const items = rawOrder.items.map(normalizePharmacyOrderItem);
  const totalQuantity = requireNonNegativeInteger(
    rawOrder.totalItems,
    'order.totalItems',
    rawOrder
  );
  const totalAmount = requireNonNegativeNumber(
    rawOrder.totalPrice,
    'order.totalPrice',
    rawOrder
  );
  const expectedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const expectedAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (totalQuantity !== expectedQuantity) {
    invalidOrderContract(
      'order.totalItems must equal the sum of item quantities.',
      rawOrder
    );
  }
  assertMoneyEqual(totalAmount, expectedAmount, 'order.totalPrice', rawOrder);

  const clientId = getClientId(rawOrder);
  if (clientId && !OBJECT_ID_PATTERN.test(clientId)) {
    invalidOrderContract('order.clientId is invalid.', rawOrder);
  }

  return {
    id,
    orderNumber,
    orderDate,
    pharmacyName: requireText(
      rawOrder.pharmacyName,
      'order.pharmacyName',
      rawOrder
    ),
    client: getClientName(rawOrder),
    clientId,
    clientPhotoUrl: getClientPhotoUrl(rawOrder),
    deliveryMethod: getDeliveryMethod(rawOrder),
    paymentMethod: rawOrder.paymentMethod,
    clientComment:
      getTrimmedString(rawOrder.clientComment) ??
      getTrimmedString(rawOrder.comment) ??
      '',
    totalQuantity,
    totalAmount,
    status: rawOrder.status,
    createdByType: rawOrder.createdByType,
    items,
  };
}

//===================================================================

function normalizeStatusHistory(
  payload: unknown
): PharmacyOrderStatusHistoryItem[] {
  if (!Array.isArray(payload)) {
    return invalidOrderContract('order.statusHistory must be an array.', payload);
  }

  return payload.map((entry) => {
    if (!isRecord(entry) || !isOrderStatus(entry.status)) {
      return invalidOrderContract('order.statusHistory entry is invalid.', entry);
    }

    return {
      status: entry.status,
      changedAt: requireIsoDateTime(
        entry.changedAt,
        'order.statusHistory.changedAt',
        entry
      ),
      changedBy: requireObjectId(
        entry.changedBy,
        'order.statusHistory.changedBy',
        entry
      ),
      ...(getTrimmedString(entry.comment)
        ? { comment: getTrimmedString(entry.comment) }
        : {}),
    };
  });
}

//===================================================================

function normalizeActivityHistory(
  payload: unknown
): PharmacyOrderActivityHistoryItem[] {
  if (!Array.isArray(payload)) {
    return invalidOrderContract('order.activityHistory must be an array.', payload);
  }

  return payload.map((entry) => {
    if (!isRecord(entry) || !isOrderActivityType(entry.type)) {
      return invalidOrderContract('order.activityHistory entry is invalid.', entry);
    }

    const previousQuantity = requireNonNegativeInteger(
      entry.previousQuantity,
      'order.activityHistory.previousQuantity',
      entry
    );
    const quantity = requireNonNegativeInteger(
      entry.quantity,
      'order.activityHistory.quantity',
      entry
    );
    const quantityDelta = entry.quantityDelta;
    if (typeof quantityDelta !== 'number' || !Number.isSafeInteger(quantityDelta)) {
      invalidOrderContract(
        'order.activityHistory.quantityDelta must be a safe integer.',
        entry
      );
    }

    return {
      type: entry.type,
      occurredAt: requireIsoDateTime(
        entry.occurredAt,
        'order.activityHistory.occurredAt',
        entry
      ),
      changedBy: requireObjectId(
        entry.changedBy,
        'order.activityHistory.changedBy',
        entry
      ),
      productId: requireObjectId(
        entry.productId,
        'order.activityHistory.productId',
        entry
      ),
      productOfferId: requireObjectId(
        entry.productOfferId,
        'order.activityHistory.productOfferId',
        entry
      ),
      productName: requireText(
        entry.productName,
        'order.activityHistory.productName',
        entry
      ),
      previousQuantity,
      quantity,
      quantityDelta,
      previousUnitPrice: requireNonNegativeNumber(
        entry.previousUnitPrice,
        'order.activityHistory.previousUnitPrice',
        entry
      ),
      unitPrice: requireNonNegativeNumber(
        entry.unitPrice,
        'order.activityHistory.unitPrice',
        entry
      ),
    };
  });
}

//===================================================================

export function normalizePharmacyOrderManagerComment(
  payload: unknown
): PharmacyOrderManagerComment | null {
  if (!isRecord(payload)) return null;

  const id = getTrimmedString(payload.id) ?? getTrimmedString(payload._id);
  const text = getTrimmedString(payload.text);
  const createdAt = getTrimmedString(payload.createdAt);
  const createdBy = getTrimmedString(payload.createdBy);

  if (!id || !text || !isISODateTimeString(createdAt) || !createdBy) {
    return null;
  }

  return { id, text, createdAt, createdBy };
}

export function normalizePharmacyOrderManagerCommentsResponse(
  payload: unknown
): PharmacyOrderManagerCommentsResponse {
  return requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      legacyEmptyPage: 'normalize-to-zero',
      normalizeItem: normalizePharmacyOrderManagerComment,
    }),
    { label: 'pharmacy order comments response' }
  );
}

//===================================================================

function normalizeBankDetails(
  payload: unknown
): CompletePharmacyBankDetails | null {
  if (payload === undefined || payload === null) return null;
  if (!isRecord(payload)) {
    return invalidOrderContract('order.bankDetails must be an object.', payload);
  }

  return {
    recipientName: requireText(
      payload.recipientName,
      'order.bankDetails.recipientName',
      payload
    ),
    taxId: requireText(payload.taxId, 'order.bankDetails.taxId', payload),
    iban: requireText(payload.iban, 'order.bankDetails.iban', payload),
    bankName: requireText(
      payload.bankName,
      'order.bankDetails.bankName',
      payload
    ),
    receiptEmail: requireText(
      payload.receiptEmail,
      'order.bankDetails.receiptEmail',
      payload
    ),
    paymentPurpose: requireText(
      payload.paymentPurpose,
      'order.bankDetails.paymentPurpose',
      payload
    ),
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
    currency: '₴',
    pharmacyId: requireObjectId(payload.pharmacyId, 'order.pharmacyId', payload),
    statusHistory: normalizeStatusHistory(payload.statusHistory),
    activityHistory: normalizeActivityHistory(payload.activityHistory),
    managerCommentsCount: requireNonNegativeInteger(
      payload.managerCommentsCount,
      'order.managerCommentsCount',
      payload
    ),
    ...(getTrimmedString(payload.clientPhone)
      ? { clientPhone: getTrimmedString(payload.clientPhone) }
      : {}),
    ...(getTrimmedString(payload.clientAddress)
      ? { clientAddress: getTrimmedString(payload.clientAddress) }
      : {}),
    ...(getTrimmedString(payload.pharmacyPhone)
      ? { pharmacyPhone: getTrimmedString(payload.pharmacyPhone) }
      : {}),
    ...(getTrimmedString(payload.pharmacyAddress)
      ? { pharmacyAddress: getTrimmedString(payload.pharmacyAddress) }
      : {}),
    ...(getTrimmedString(payload.pharmacyWorkingHours)
      ? {
          pharmacyWorkingHours: getTrimmedString(payload.pharmacyWorkingHours),
        }
      : {}),
    ...(getTrimmedString(payload.pharmacyEmail)
      ? { pharmacyEmail: getTrimmedString(payload.pharmacyEmail) }
      : {}),
    ...(bankDetails ? { bankDetails } : {}),
    ...(getTrimmedString(deliveryDetails?.address)
      ? { deliveryAddress: getTrimmedString(deliveryDetails?.address) }
      : {}),
    ...(getTrimmedString(deliveryDetails?.recipientName)
      ? { recipientName: getTrimmedString(deliveryDetails?.recipientName) }
      : {}),
    ...(getTrimmedString(deliveryDetails?.recipientPhone)
      ? { recipientPhone: getTrimmedString(deliveryDetails?.recipientPhone) }
      : {}),
    ...(getTrimmedString(payload.pharmacyComment)
      ? { pharmacyComment: getTrimmedString(payload.pharmacyComment) }
      : {}),
    ...(getTrimmedString(payload.managerComment)
      ? { managerComment: getTrimmedString(payload.managerComment) }
      : {}),
    ...(getTrimmedString(payload.rejectionReason)
      ? { rejectionReason: getTrimmedString(payload.rejectionReason) }
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
        count: getFiniteNumber(value.count) ?? 0,
        amount: getFiniteNumber(value.amount) ?? 0,
      },
    };
  }, DEFAULT_ORDER_STATISTICS);
}

//===================================================================

export function normalizePharmacyOrdersResponse(
  payload: unknown
): PharmacyOrdersResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      normalizeItem: normalizePharmacyOrder,
    }),
    { label: 'pharmacy orders response' }
  );

  return {
    ...response,
    statistics: isRecord(payload)
      ? normalizeOrderStatistics(payload.statistics)
      : DEFAULT_ORDER_STATISTICS,
    earliestCreatedAt: isRecord(payload)
      ? (getTrimmedString(payload.earliestCreatedAt) ?? null)
      : null,
  };
}
