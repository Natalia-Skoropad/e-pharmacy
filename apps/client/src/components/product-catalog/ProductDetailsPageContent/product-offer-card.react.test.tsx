import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { CART_ITEM_TTL_DAYS } from '@e-pharmacy/config/cart';
import type { ProductOffer } from '@e-pharmacy/types/products';

import { ProductOfferCard } from './ProductOfferCard';

//===================================================================

const offer = {
  id: '507f1f77bcf86cd799439010',
  pharmacyId: '507f1f77bcf86cd799439011',
  pharmacyName: 'Care Pharmacy',
  pharmacyCity: 'Lviv',
  pharmacyAddress: '1 Test Street',
  pharmacyPhone: '+380 44 123 45 67',
  pharmacyRating: 4.8,
  pharmacyReviewsCount: 12,
  pharmacyIsFavorite: true,
  price: 125,
  totalQuantity: 10,
  availableQuantity: 8,
  reservedQuantity: 2,
  inStock: true,
  createdAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:00:00.000Z',
} as unknown as ProductOffer;

//===================================================================

test('renders offer-specific phone, favorite and quantity semantics', () => {
  const markup = renderToStaticMarkup(
    <ProductOfferCard
      productName="Test product"
      offer={offer}
      cartItem={null}
      pendingQuantity={1}
      isPending={false}
      isItemPending={false}
      canUseCart
      canShowStock
      onIncrement={() => undefined}
      onDecrement={() => undefined}
    />
  );

  assert.match(markup, /Favorite pharmacy/);
  assert.match(markup, /href="tel:\+380441234567"/);
  assert.match(markup, /aria-label="Call Care Pharmacy: \+380 44 123 45 67"/);
  assert.match(markup, /Quantity for Test product from Care Pharmacy/);

  const ttlDays: number = CART_ITEM_TTL_DAYS;
  const ttlLabel = `${ttlDays} ${ttlDays === 1 ? 'day' : 'days'}`;

  assert.match(
    markup,
    new RegExp(`The product stays in the cart for ${ttlLabel}`)
  );
});
