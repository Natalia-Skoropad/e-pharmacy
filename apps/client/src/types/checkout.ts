import type { Cart } from './cart';

import type {
  OrderDeliveryMethod,
  OrderPaymentMethod,
} from '@e-pharmacy/types';

//===================================================================

export type CheckoutPaymentMethod = OrderPaymentMethod;
export type CheckoutDeliveryMethod = OrderDeliveryMethod;

export type CheckoutStoreOrderGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
