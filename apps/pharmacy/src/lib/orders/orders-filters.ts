import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { OrderCreatedByType } from '@e-pharmacy/types/orders';

//===================================================================

export type DeliveryMethodFilter = 'all' | DeliveryMethod;
export type PaymentMethodFilter = 'all' | PaymentMethod;
export type OrderStatusFilter = 'all' | OrderStatus;
export type OrderCreatedByFilter = 'all' | OrderCreatedByType;

//===================================================================

export type OrdersFilterState = Readonly<{
  date: {
    from: string;
    to: string;
  };
  client: string;
  orderNumber: string;
  deliveryMethod: DeliveryMethodFilter;
  paymentMethod: PaymentMethodFilter;
  status: OrderStatusFilter;
  createdByType: OrderCreatedByFilter;
}>;

//===================================================================

export const DEFAULT_ORDERS_FILTERS: OrdersFilterState = {
  date: {
    from: '',
    to: '',
  },
  client: '',
  orderNumber: '',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  status: 'all',
  createdByType: 'all',
};
