import type { Cart } from '../cart';

//===================================================================

export type CheckoutPharmacyOrderGroup = {
  pharmacyId: string;
  pharmacyName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
