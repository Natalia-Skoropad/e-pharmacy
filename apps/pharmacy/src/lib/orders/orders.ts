import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import type {
  DeliveryMethod,
  EntityId,
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

export type PharmacyOrderRow = Readonly<{
  id: EntityId;
  orderNumber: string;
  orderDate: string;
  client: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  clientComment: string;
  totalQuantity: number;
  totalAmount: number;
  status: OrderStatus;
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
}>;

export type PharmacyOrdersResponse = Readonly<{
  items: PharmacyOrderRow[];
  total: number;
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

  return {
    id,
    orderNumber,
    orderDate,
    client: getClientName(rawOrder),
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
  };
}

//===================================================================

export function normalizePharmacyOrdersResponse(
  payload: unknown
): PharmacyOrdersResponse {
  return normalizePaginatedResponse(payload, {
    normalizeItem: normalizePharmacyOrder,
  });
}
