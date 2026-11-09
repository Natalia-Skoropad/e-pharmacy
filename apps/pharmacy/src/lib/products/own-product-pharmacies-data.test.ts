import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { OwnedPharmacyListItem } from '@e-pharmacy/types/pharmacies';

import {
  getProductPharmacyRows,
  getProductPharmacyStatistics,
  filterProductPharmacyRows,
  productPharmacyAddedDates,
} from './own-product-pharmacies-data';

import { DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE } from './own-product-pharmacies-paths';

//===================================================================

const a = '6ac75e170642845c5d27fd6c';
const b = '6ac75e170642845c5d27fd6d';
const foreign = '6ac75e170642845c5d27fd6e';

//===================================================================

const offer = (
  pharmacyId: string,
  availableQuantity: number,
  createdAt: string
) => ({
  id: pharmacyId,
  pharmacyId,
  pharmacyName: pharmacyId,
  pharmacyRating: 0,
  pharmacyReviewsCount: 0,
  pharmacyIsFavorite: false,
  price: 100,
  totalQuantity: availableQuantity,
  availableQuantity,
  reservedQuantity: 0,
  inStock: availableQuantity > 0,
  createdAt,
  updatedAt: createdAt,
});

//===================================================================

const pharmacy = (id: string, status: OwnedPharmacyListItem['status']) => ({
  id,
  name: id,
  status,
  membershipRole: 'owner' as const,
  createdAt: '2026-05-01T12:00:00Z',
  rating: 0,
  reviewsCount: 0,
});

//===================================================================

test('one row per owned pharmacy, including blocked stock; never includes foreign pharmacies', () => {
  // This test deliberately supplies only the fields used by the row selector.
  const product = {
    status: 'active',
    offers: [
      offer(a, 9, '2026-07-01T12:00:00Z'),
      offer(b, 0, '2026-07-02T12:00:00Z'),
      offer(foreign, 6, '2026-07-03T12:00:00Z'),
    ],
  } as unknown as ProductDetails;

  const rows = getProductPharmacyRows(product, [
    pharmacy(a, 'active'),
    pharmacy(b, 'blocked'),
  ] as OwnedPharmacyListItem[]);

  assert.equal(rows.length, 2);

  assert.equal(
    rows.find((row) => row.pharmacy.id === a)?.availability,
    'available'
  );

  assert.equal(
    rows.find((row) => row.pharmacy.id === b)?.availability,
    'unavailable'
  );

  assert.deepEqual(getProductPharmacyStatistics(rows), {
    total: 2,
    available: 1,
    unavailable: 1,
  });

  assert.equal(
    filterProductPharmacyRows(rows, {
      ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
      status: 'active',
    }).length,
    1
  );

  assert.deepEqual(productPharmacyAddedDates(rows), [
    '2026-07-01',
    '2026-07-02',
  ]);
});
