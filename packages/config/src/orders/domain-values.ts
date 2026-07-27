import type {
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

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
