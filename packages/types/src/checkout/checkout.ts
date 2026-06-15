import type { Cart } from '../cart';
import type { OrderPaymentMethod } from '../orders';

//===================================================================

export type CheckoutPaymentMethod = OrderPaymentMethod;

export type CheckoutPharmacyOrderGroup = {
  pharmacyId: string;
  pharmacyName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
