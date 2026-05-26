import type { Cart, Store } from '@/types';
import type { CheckoutStoreOrderGroup } from '@/types/checkout';

//===================================================================

export function groupCartByStore(cart: Cart): CheckoutStoreOrderGroup[] {
  const groups = new Map<string, CheckoutStoreOrderGroup>();

  for (const item of cart.items) {
    const storeName = item.storeName || item.product.storeName || 'Pharmacy';
    const group = groups.get(item.storeId);

    if (group) {
      group.items.push(item);
      group.totalItems += item.quantity;
      group.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.storeId, {
      storeId: item.storeId,
      storeName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
    });
  }

  return [...groups.values()];
}

//===================================================================

export function getStoreEmail(store?: Store | null): string {
  return store?.email?.trim() ?? '';
}

export function getStorePhone(store?: Store | null): string {
  return store?.phone?.trim() ?? '';
}

export function getStoreWorkingHours(store?: Store | null): string {
  return store?.workingHours?.trim() ?? '';
}

export function getStoreAddress(store?: Store | null): string {
  if (!store) return '';

  return [store.address, store.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export function getStoreBankDetails(
  store?: Store | null
): Store['bankDetails'] | null {
  return store?.bankDetails ?? null;
}

//===================================================================

export function getStockValidationError(
  group: CheckoutStoreOrderGroup
): string {
  const unavailableItems = group.items.filter(
    (item) => item.stockQuantity <= 0 || item.quantity > item.stockQuantity
  );

  if (unavailableItems.length === 0) return '';

  const productNames = unavailableItems
    .map((item) => item.product.name)
    .slice(0, 3)
    .join(', ');

  return `Sorry, we cannot confirm this invoice right now. While you were placing the order, ${productNames} ${
    unavailableItems.length === 1 ? 'was' : 'were'
  } reserved by another customer. Please update the cart and choose the available quantity again.`;
}
