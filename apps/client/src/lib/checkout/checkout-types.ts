import type { Cart } from '@e-pharmacy/types';

//===================================================================

export type CheckoutPharmacyOrderGroup = {
  pharmacyId: string;
  pharmacyName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};
