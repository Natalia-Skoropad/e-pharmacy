import type { Pharmacy } from '@e-pharmacy/types';
import type { CheckoutPharmacyOrderGroup } from '@e-pharmacy/types/checkout';

//===================================================================

export function getPharmacyEmail(pharmacy?: Pharmacy | null): string {
  return pharmacy?.email?.trim() ?? '';
}

export function getPharmacyPhone(pharmacy?: Pharmacy | null): string {
  return pharmacy?.phone?.trim() ?? '';
}

export function getPharmacyWorkingHours(pharmacy?: Pharmacy | null): string {
  return pharmacy?.workingHours?.trim() ?? '';
}

export function getPharmacyAddress(pharmacy?: Pharmacy | null): string {
  if (!pharmacy) return '';

  return [pharmacy.address, pharmacy.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export function getPharmacyBankDetails(
  pharmacy?: Pharmacy | null
): Pharmacy['bankDetails'] | null {
  return pharmacy?.bankDetails ?? null;
}

//===================================================================

export function getStockValidationError(
  group: CheckoutPharmacyOrderGroup
): string {
  const unavailableItems = group.items.filter(
    (item) => item.stockQuantity <= 0 || item.quantity > item.stockQuantity
  );

  if (unavailableItems.length === 0) return '';

  const productNames = unavailableItems
    .map((item) => item.product.name)
    .slice(0, 3)
    .join(', ');

  return `Sorry, we cannot confirm this order right now. While you were placing the order, ${productNames} ${
    unavailableItems.length === 1 ? 'was' : 'were'
  } reserved by another client. Please update the cart and choose the available quantity again.`;
}
