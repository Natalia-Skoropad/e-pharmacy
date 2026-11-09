import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProductDetails } from '@e-pharmacy/types/products';
import type { OwnedPharmacyListItem } from '@e-pharmacy/types/pharmacies';

import {
  DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
  buildOwnProductPharmaciesPath,
  parseOwnProductPharmaciesSegments,
  getProductPharmacyLocationKey,
} from './own-product-pharmacies-paths';

import {
  getProductPharmacyRows,
  filterProductPharmacyRows,
} from './own-product-pharmacies-data';

//===================================================================

const productId = '6ac75e1417684f6f914a4d59';
const lvivId = '6ac75e170642845c5d27fd6c';
const odesaId = '6ac75e170642845c5d27fd6d';

//===================================================================

const pharmacy = (id: string, region: string, settlement: string) => ({
  id,
  name: `Pharmacy ${id}`,
  status: 'active',
  membershipRole: 'owner',
  location: { region, settlement, address: '123 Street' },
  createdAt: '2026-06-01T12:00:00.000Z',
  rating: 0,
  reviewsCount: 0,
});

//===================================================================

const offer = (pharmacyId: string) => ({
  id: pharmacyId,
  pharmacyId,
  price: 40,
  availableQuantity: 3,
  totalQuantity: 3,
  reservedQuantity: 0,
  inStock: true,
  createdAt: '2026-07-01T12:00:00Z',
  updatedAt: '2026-07-08T12:00:00Z',
});

//===================================================================

test('region and settlement URL segments round-trip as canonical readable paths', () => {
  const state = {
    ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
    pharmacyId: lvivId,
    region: getProductPharmacyLocationKey('Lviv region'),
    settlement: getProductPharmacyLocationKey('Lviv'),
    status: 'active' as const,
  };

  const path = buildOwnProductPharmaciesPath(productId, state);

  assert.equal(
    path,
    `/pharmacy/products/${productId}/pharmacies/pharmacy-id-${lvivId}/status-active/region-lviv-region/settlement-lviv`
  );

  assert.deepEqual(
    parseOwnProductPharmaciesSegments(path.split('/').slice(5)),
    state
  );

  assert.throws(() => parseOwnProductPharmaciesSegments(['settlement-lviv']));

  assert.throws(() =>
    parseOwnProductPharmaciesSegments(['region-lviv', 'region-odesa'])
  );
});

//===================================================================

test('Cyrillic location names work for encoded and decoded route params', () => {
  const region = getProductPharmacyLocationKey('Львівська область');
  const state = { ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE, region };
  const path = buildOwnProductPharmaciesPath(productId, state);
  const encoded = path.split('/').slice(5);

  assert.deepEqual(parseOwnProductPharmaciesSegments(encoded), state);

  assert.deepEqual(
    parseOwnProductPharmaciesSegments(encoded.map(decodeURIComponent)),
    state
  );
});

//===================================================================

test('location filters select only product offers in the requested owner pharmacy locations', () => {
  // Deliberately partial fixture: the selector only reads status and offers.
  const product = {
    status: 'active',
    offers: [offer(lvivId), offer(odesaId)],
  } as unknown as ProductDetails;

  const rows = getProductPharmacyRows(product, [
    pharmacy(lvivId, 'Lviv region', 'Lviv'),
    pharmacy(odesaId, 'Odesa region', 'Odesa'),
  ] as OwnedPharmacyListItem[]);

  assert.equal(rows.length, 2);

  assert.deepEqual(
    filterProductPharmacyRows(rows, {
      ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
      region: 'lviv-region',
      settlement: 'lviv',
    }).map(({ pharmacy: item }) => item.id),
    [lvivId]
  );
});
