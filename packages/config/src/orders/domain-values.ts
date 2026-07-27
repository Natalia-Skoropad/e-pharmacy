import type {
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

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

type _DeliveryMethodsAreExhaustive = Assert<
  IsExactValueSet<DeliveryMethod, typeof DELIVERY_METHODS>
>;

//===================================================================

type _PaymentMethodsAreExhaustive = Assert<
  IsExactValueSet<PaymentMethod, typeof PAYMENT_METHODS>
>;

//===================================================================

type _OrderCreatedByTypesAreExhaustive = Assert<
  IsExactValueSet<OrderCreatedByType, typeof ORDER_CREATED_BY_TYPES>
>;

//===================================================================

type _OrderStatusesAreExhaustive = Assert<
  IsExactValueSet<OrderStatus, typeof ORDER_STATUSES>
>;
