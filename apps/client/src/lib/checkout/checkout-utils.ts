import type {
  PublicPharmacy,
  PublicPaymentBankDetails,
  PharmacyCheckoutDetails,
} from '@e-pharmacy/types/pharmacies';

import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';
import { hasCartGroupStockConflict } from '@/lib/cart/cart-stock';

//===================================================================

export function getPharmacyEmail(
  pharmacy?: Partial<PublicPharmacy> | null
): string {
  return pharmacy?.email?.trim() ?? '';
}

//===================================================================

export function getPharmacyPhone(
  pharmacy?: Partial<PublicPharmacy> | null
): string {
  return pharmacy?.phone?.trim() ?? '';
}

//===================================================================

export function getPharmacyWorkingHours(
  pharmacy?: Partial<PublicPharmacy> | null
): string {
  return pharmacy?.workingHours?.trim() ?? '';
}

//===================================================================

export function getPharmacyAddress(
  pharmacy?: Partial<PublicPharmacy> | null
): string {
  if (!pharmacy) return '';

  return [pharmacy.address, pharmacy.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

//===================================================================

export function getPharmacyBankDetails(
  pharmacy?: (Partial<PublicPharmacy> & PharmacyCheckoutDetails) | null
): PublicPaymentBankDetails | null {
  return pharmacy?.bankDetails ?? null;
}

//===================================================================

export function getStockValidationError(group: CartPharmacyGroup): string {
  if (!hasCartGroupStockConflict(group)) return '';

  const unavailableItems = group.items.filter(
    (item) => item.quantity > item.stockQuantity
  );

  const productNames = unavailableItems
    .map((item) => item.product.name)
    .slice(0, 3)
    .join(', ');

  return `Available quantity has changed for ${productNames}. Please update the cart quantity to the currently available amount before confirming the order.`;
}
