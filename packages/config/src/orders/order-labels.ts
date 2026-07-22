import type {
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

//===================================================================

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Pickup from pharmacy',
  postal_delivery: 'Post delivery',
};

//===================================================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash on pickup / delivery',
  bank_transfer: 'Bank transfer',
};

//===================================================================

export const ORDER_CREATED_BY_LABELS: Record<OrderCreatedByType, string> = {
  client: 'Client',
  manager: 'Manager',
};

//===================================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  successful: 'Successful',
  rejected: 'Rejected',
};
