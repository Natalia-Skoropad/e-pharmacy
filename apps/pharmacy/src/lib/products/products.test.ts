import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { normalizePharmacyProductsResponse } from './products';

//===================================================================

const PHARMACY_ID = '507f1f77bcf86cd799439014';

//===================================================================

function isInvalidResponse(error: unknown): boolean {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
}
//===================================================================

function validProduct() {
  return {
    id: '507f1f77bcf86cd799439013',
    name: 'Aspirin',
    publicSlugId: 'aspirin-pr507f1f77bcf86cd799439013',
    article: 'ASP-100',
    category: 'medicine',
    status: 'active',
    price: 100,
    foundInPharmaciesCount: 1,
    availableInPharmaciesCount: 1,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    isFavorite: false,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    offers: [
      {
        id: '507f1f77bcf86cd799439012',
        pharmacyId: PHARMACY_ID,
        pharmacyName: 'Health Pharmacy',
        pharmacyRating: 0,
        pharmacyReviewsCount: 0,
        pharmacyIsFavorite: false,
        price: 100,
        totalQuantity: 10,
        availableQuantity: 8,
        reservedQuantity: 2,
        inStock: true,
        hasRelatedOrders: true,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-12T10:00:00.000Z',
      },
    ],
  };
}

//===================================================================

function validResponse() {
  return {
    items: [validProduct()],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-08-10',
    ownProductStatistics: {
      inStock: { quantity: 10, amount: 1000 },
      reserved: { quantity: 2, amount: 200 },
      available: { quantity: 8, amount: 800 },
      outOfStock: { quantity: 0 },
    },
  };
}

//===================================================================

test('own product response preserves canonical stock and price values', () => {
  const response = normalizePharmacyProductsResponse(
    validResponse(),
    PHARMACY_ID
  );

  assert.equal(response.items[0]?.stockQuantity, 10);
  assert.equal(response.items[0]?.reservedQuantity, 2);
  assert.equal(response.items[0]?.availableQuantity, 8);
  assert.equal(response.items[0]?.currentPrice, 100);
});

//===================================================================

test('own product response rejects malformed authoritative fields', () => {
  const base = validResponse();
  const product = validProduct();
  const offer = product.offers[0];

  for (const invalid of [
    { ...base, items: [{ ...product, name: '' }] },
    { ...base, items: [{ ...product, status: 'new' }] },
    {
      ...base,
      items: [
        {
          ...product,
          offers: [{ ...offer, price: undefined }],
        },
      ],
    },
    {
      ...base,
      items: [
        {
          ...product,
          offers: [
            {
              ...offer,
              availableQuantity: 7,
              reservedQuantity: 2,
              totalQuantity: 10,
            },
          ],
        },
      ],
    },
    {
      ...base,
      items: [
        {
          ...product,
          offers: [{ ...offer, createdAt: '2026-08-10' }],
        },
      ],
    },
    { ...base, ownProductStatistics: undefined },
    {
      ...base,
      ownProductStatistics: {
        ...base.ownProductStatistics,
        available: { quantity: 8 },
      },
    },
  ]) {
    assert.throws(
      () => normalizePharmacyProductsResponse(invalid, PHARMACY_ID),
      isInvalidResponse
    );
  }
});
