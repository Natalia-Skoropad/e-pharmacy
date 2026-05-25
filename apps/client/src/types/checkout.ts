import type { Cart } from './cart';

//===================================================================

export type CheckoutPaymentMethod = 'cash' | 'bank-transfer';
export type CheckoutDeliveryMethod = 'pickup' | 'post';

export type CheckoutStoreOrderGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
