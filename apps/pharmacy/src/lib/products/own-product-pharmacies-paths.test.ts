import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOwnProductPharmaciesPath,
  parseOwnProductPharmaciesSegments,
  DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
} from './own-product-pharmacies-paths';

//===================================================================

const productId = '6ac75e1417684f6f914a4d59';
const pharmacyId = '6ac75e170642845c5d27fd6c';

//===================================================================

test('product pharmacy filters build a stable canonical URL and round-trip', () => {
  const state = {
    ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
    pharmacyId,
    status: 'on_moderation' as const,
    stock: 'reserved' as const,
    date: { from: '2026-06-01', to: '2026-11-09' },
    perPage: 50 as const,
    page: 2,
  };

  const path = buildOwnProductPharmaciesPath(productId, state);

  assert.equal(
    path,
    `/pharmacy/products/${productId}/pharmacies/pharmacy-id-${pharmacyId}/status-on-moderation/stock-reserved/date-from-2026-06-01/date-to-2026-11-09/per-page-50/page-2`
  );

  assert.deepEqual(
    parseOwnProductPharmaciesSegments(path.split('/').slice(5)),
    state
  );
});

//===================================================================

test('product pharmacy filters reject malformed, duplicate and inverted URL filters', () => {
  const invalid = [
    ['unknown-anything'],
    ['status-active', 'status-blocked'],
    ['pharmacy-id-not-an-id'],
    ['stock-unknown'],
    ['per-page-15'],
    ['date-from-2026-11-09', 'date-to-2026-11-01'],
  ];

  for (const segments of invalid) {
    assert.throws(() => parseOwnProductPharmaciesSegments(segments));
  }
});
