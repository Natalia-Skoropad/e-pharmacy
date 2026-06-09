import type { Cart } from '../cart';
import type { OrderPaymentMethod } from '../orders';

//===================================================================

export type CheckoutPaymentMethod = OrderPaymentMethod;

export type CheckoutStoreOrderGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
