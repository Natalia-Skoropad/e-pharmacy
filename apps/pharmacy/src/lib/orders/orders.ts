import type {
  DeliveryMethod,
  EntityId,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

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

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return value === 'pickup' || value === 'postal_delivery';
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'cash' || value === 'bank_transfer';
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'new' ||
    value === 'in_progress' ||
    value === 'successful' ||
    value === 'rejected'
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
  if (!isRecord(payload)) return { items: [], total: 0 };

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items = rawItems.flatMap((item) => {
    const order = normalizePharmacyOrder(item);
    return order ? [order] : [];
  });

  return {
    items,
    total: getNumberValue(payload.total) ?? items.length,
  };
}
