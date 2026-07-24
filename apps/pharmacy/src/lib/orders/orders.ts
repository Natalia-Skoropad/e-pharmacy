import { isProductCategory } from '@e-pharmacy/validation/products';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import { type OrderStatisticsCounts } from '@e-pharmacy/types/orders';

import type {
  ApiPaginationResponse,
  DeliveryMethod,
  EntityId,
  OrderActivityType,
  OrderCreatedByType,
  OrderStatus,
  CompletePharmacyBankDetails,
  ProductCategory,
  PaymentMethod,
} from '@e-pharmacy/types';

import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

//===================================================================

export const DELIVERY_METHODS = [
  'pickup',
  'postal_delivery',
] as const satisfies readonly DeliveryMethod[];

//===================================================================

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
] as const satisfies readonly PaymentMethod[];

//===================================================================

export const ORDER_CREATED_BY_TYPES = [
  'client',
  'manager',
] as const satisfies readonly OrderCreatedByType[];

//===================================================================

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

  return 'pickup';
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

function normalizePharmacyOrderItem(
  rawItem: unknown
): PharmacyOrderItem | null {
  if (!isRecord(rawItem)) return null;

  const id = getTrimmedString(rawItem.id) ?? getTrimmedString(rawItem._id);
  const productId = getTrimmedString(rawItem.productId);
  const productOfferId = getTrimmedString(rawItem.productOfferId);
  const name = getTrimmedString(rawItem.name) ?? 'Product';
  const article = getTrimmedString(rawItem.article) ?? '—';
  const category = rawItem.category;

  if (!id || !productId || !productOfferId) return null;

  return {
    id,
    productId,
    productOfferId,
    name,
    article,
    ...(isProductCategory(category) ? { category } : {}),
    ...(getTrimmedString(rawItem.imageUrl)
      ? { imageUrl: getTrimmedString(rawItem.imageUrl) }
      : {}),
    ...(typeof getFiniteNumber(rawItem.rating) === 'number'
      ? { rating: getFiniteNumber(rawItem.rating) }
      : {}),
    ...(typeof getFiniteNumber(rawItem.reviewsCount) === 'number'
      ? { reviewsCount: getFiniteNumber(rawItem.reviewsCount) }
      : {}),
    quantity: getFiniteNumber(rawItem.quantity) ?? 0,
    unitPrice: getFiniteNumber(rawItem.unitPrice) ?? 0,
    totalPrice: getFiniteNumber(rawItem.totalPrice) ?? 0,
    ...(typeof getFiniteNumber(rawItem.availableQuantity) === 'number'
      ? { availableQuantity: getFiniteNumber(rawItem.availableQuantity) }
      : {}),
    ...(typeof getFiniteNumber(rawItem.currentPrice) === 'number'
      ? { currentPrice: getFiniteNumber(rawItem.currentPrice) }
      : {}),
  };
}

//===================================================================

export function normalizePharmacyOrder(
  rawOrder: unknown
): PharmacyOrderRow | null {
  if (!isRecord(rawOrder)) return null;

  const id = getTrimmedString(rawOrder.id);
  const orderNumber = getTrimmedString(rawOrder.orderNumber) ?? id;
  const orderDate =
    getTrimmedString(rawOrder.orderDate) ??
    getTrimmedString(rawOrder.createdAt);

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
    pharmacyName: getTrimmedString(rawOrder.pharmacyName) ?? 'Pharmacy',
    client: getClientName(rawOrder),
    clientId: getClientId(rawOrder),
    clientPhotoUrl: getClientPhotoUrl(rawOrder),
    deliveryMethod: getDeliveryMethod(rawOrder),
    paymentMethod,
    clientComment:
      getTrimmedString(rawOrder.clientComment) ??
      getTrimmedString(rawOrder.comment) ??
      '',
    totalQuantity:
      getFiniteNumber(rawOrder.totalQuantity) ??
      getFiniteNumber(rawOrder.totalItems) ??
      0,
    totalAmount:
      getFiniteNumber(rawOrder.totalAmount) ??
      getFiniteNumber(rawOrder.totalPrice) ??
      0,
    status,
    createdByType: isOrderCreatedByType(rawOrder.createdByType)
      ? rawOrder.createdByType
      : 'client',
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
      const changedAt = getTrimmedString(entry.changedAt);
      const changedBy = getTrimmedString(entry.changedBy);

      if (!status || !changedAt || !changedBy) return null;

      return {
        status,
        changedAt,
        changedBy,
        ...(getTrimmedString(entry.comment)
          ? { comment: getTrimmedString(entry.comment) }
          : {}),
      };
    })
    .filter((entry): entry is PharmacyOrderStatusHistoryItem => Boolean(entry));
}

//===================================================================

function normalizeActivityHistory(
  payload: unknown
): PharmacyOrderActivityHistoryItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((entry) => {
      if (!isRecord(entry) || !isOrderActivityType(entry.type)) return null;

      const occurredAt = getTrimmedString(entry.occurredAt);
      const changedBy = getTrimmedString(entry.changedBy);
      const productId = getTrimmedString(entry.productId);
      const productOfferId = getTrimmedString(entry.productOfferId);
      const productName = getTrimmedString(entry.productName);
      const previousQuantity = getFiniteNumber(entry.previousQuantity);
      const quantity = getFiniteNumber(entry.quantity);
      const quantityDelta = getFiniteNumber(entry.quantityDelta);
      const previousUnitPrice = getFiniteNumber(entry.previousUnitPrice);
      const unitPrice = getFiniteNumber(entry.unitPrice);

      if (
        !occurredAt ||
        !changedBy ||
        !productId ||
        !productOfferId ||
        !productName ||
        previousQuantity === undefined ||
        quantity === undefined ||
        quantityDelta === undefined ||
        previousUnitPrice === undefined ||
        unitPrice === undefined
      ) {
        return null;
      }

      return {
        type: entry.type,
        occurredAt,
        changedBy,
        productId,
        productOfferId,
        productName,
        previousQuantity,
        quantity,
        quantityDelta,
        previousUnitPrice,
        unitPrice,
      };
    })
    .filter((entry): entry is PharmacyOrderActivityHistoryItem =>
      Boolean(entry)
    );
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

  if (!id || !text || !createdAt || !createdBy) return null;

  return { id, text, createdAt, createdBy };
}

export function normalizePharmacyOrderManagerCommentsResponse(
  payload: unknown
): PharmacyOrderManagerCommentsResponse {
  return requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      normalizeItem: normalizePharmacyOrderManagerComment,
    }),
    'pharmacy order comments response'
  );
}

//===================================================================

function normalizeBankDetails(
  payload: unknown
): CompletePharmacyBankDetails | null {
  if (!isRecord(payload)) return null;

  const recipientName = getTrimmedString(payload.recipientName);
  const taxId = getTrimmedString(payload.taxId);
  const iban = getTrimmedString(payload.iban);
  const bankName = getTrimmedString(payload.bankName);
  const receiptEmail = getTrimmedString(payload.receiptEmail);
  const paymentPurpose = getTrimmedString(payload.paymentPurpose);

  if (
    !recipientName ||
    !taxId ||
    !iban ||
    !bankName ||
    !receiptEmail ||
    !paymentPurpose
  ) {
    return null;
  }

  return {
    recipientName,
    taxId,
    iban,
    bankName,
    receiptEmail,
    paymentPurpose,
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
    pharmacyId: getTrimmedString(payload.pharmacyId) ?? '',
    statusHistory: normalizeStatusHistory(payload.statusHistory),
    activityHistory: normalizeActivityHistory(payload.activityHistory),
    managerCommentsCount:
      getFiniteNumber(payload.managerCommentsCount) ??
      (Array.isArray(payload.managerComments)
        ? payload.managerComments.length
        : getTrimmedString(payload.managerComment)
          ? 1
          : 0),
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
    'pharmacy orders response'
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
