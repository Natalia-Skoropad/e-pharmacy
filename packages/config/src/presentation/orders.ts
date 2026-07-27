import type {
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { StatusPresentation } from './types';

//===================================================================

export const DELIVERY_METHOD_LABELS = {
  pickup: 'Pickup from pharmacy',
  postal_delivery: 'Postal delivery',
} as const satisfies Readonly<Record<DeliveryMethod, string>>;

//===================================================================

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash on pickup / delivery',
  bank_transfer: 'Bank transfer',
} as const satisfies Readonly<Record<PaymentMethod, string>>;

//===================================================================

export const ORDER_CREATED_BY_LABELS = {
  client: 'Client',
  manager: 'Manager',
} as const satisfies Readonly<Record<OrderCreatedByType, string>>;

//===================================================================

export const ORDER_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'pending' },
  successful: { label: 'Successful', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
} as const satisfies Readonly<
  Record<OrderStatus, StatusPresentation>
>;
