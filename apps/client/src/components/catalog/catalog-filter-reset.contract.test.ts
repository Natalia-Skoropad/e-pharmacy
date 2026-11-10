import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProductCatalogPath,
  parseProductCatalogSegments,
} from '../../lib/catalog/product-catalog-paths';

import {
  buildPharmacyPath,
  parsePharmacySegments,
} from '../../lib/catalog/pharmacies-catalog-paths';

//===================================================================

const PRODUCT_ID = '507f1f77bcf86cd799439011';
const PHARMACY_ID = '507f1f77bcf86cd799439012';

//===================================================================

test('catalog reset URLs clear selected entities, categories, sorting and pagination', () => {
  const productHref = buildProductCatalogPath({
    productId: PRODUCT_ID,
    pharmacyId: PHARMACY_ID,
    category: 'medicine',
    sort: 'rating-desc',
    page: 3,
  });

  const productSelection = parseProductCatalogSegments({
    segments: productHref.split('/').slice(2),
  });

  assert.equal(productSelection.filters.productId, PRODUCT_ID);
  assert.equal(productSelection.filters.pharmacyId, PHARMACY_ID);
  assert.equal(productSelection.filters.category, 'medicine');
  assert.equal(productSelection.filters.page, 3);

  const productResetPath = buildProductCatalogPath({
    category: 'all',
    sort: 'newest',
  });

  assert.equal(productResetPath, '/product-catalog');

  const productReset = parseProductCatalogSegments();

  assert.equal(productReset.filters.productId, undefined);
  assert.equal(productReset.filters.pharmacyId, undefined);
  assert.equal(productReset.filters.category, 'all');
  assert.equal(productReset.filters.sort, 'newest');
  assert.equal(productReset.filters.page, 1);
  assert.equal('availability' in productReset.filters, false);

  const pharmacyHref = buildPharmacyPath({
    pharmacyId: PHARMACY_ID,
    settlement: 'Kyiv',
    region: 'Kyiv City',
    sort: 'rating-desc',
    page: 2,
  });

  const pharmacySelection = parsePharmacySegments({
    segments: pharmacyHref.split('/').slice(2),
  });

  assert.equal(pharmacySelection.filters.pharmacyId, PHARMACY_ID);
  assert.equal(pharmacySelection.filters.page, 2);
  assert.equal(pharmacySelection.filters.sort, 'rating-desc');

  assert.equal(
    buildPharmacyPath({
      pharmacyId: '',
      settlement: '',
      region: '',
      sort: 'newest',
    }),
    '/pharmacies'
  );
});
