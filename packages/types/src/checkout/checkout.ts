import type { Cart } from '../cart';
import type { OrderDeliveryMethod, OrderPaymentMethod } from '../orders';

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
