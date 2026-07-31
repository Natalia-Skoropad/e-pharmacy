import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPublicEntitySlugId,
  getPharmacyIdFromPublicSlugId,
  getProductIdFromPublicSlugId,
  parsePublicEntitySlugId,
} from './slug-id';

//===================================================================

const PRODUCT_ID = '6a5f5242d9c46211621ad70a';
const PHARMACY_ID = '6a5f5244a3defb1d037f06e7';

//===================================================================

test('builds SEO-friendly typed product and pharmacy slug IDs', () => {
  assert.equal(
    buildPublicEntitySlugId('product', 'Amlodipine 5 mg Acme', PRODUCT_ID),
    `amlodipine-5-mg-acme-pr${PRODUCT_ID}`
  );

  assert.equal(
    buildPublicEntitySlugId(
      'pharmacy',
      'Pharmacy Care Pharmacy Lviv',
      PHARMACY_ID
    ),

    `pharmacy-care-pharmacy-lviv-ph${PHARMACY_ID}`
  );
});

//===================================================================

test('parses the entity type before any backend lookup', () => {
  assert.deepEqual(parsePublicEntitySlugId(`medicine-pr${PRODUCT_ID}`), {
    entityType: 'product',
    id: PRODUCT_ID,
  });

  assert.deepEqual(parsePublicEntitySlugId(`care-ph${PHARMACY_ID}`), {
    entityType: 'pharmacy',
    id: PHARMACY_ID,
  });

  assert.equal(getProductIdFromPublicSlugId(`care-ph${PHARMACY_ID}`), null);
  assert.equal(getPharmacyIdFromPublicSlugId(`medicine-pr${PRODUCT_ID}`), null);
});

//===================================================================

test('rejects untyped or malformed public slug IDs', () => {
  assert.equal(parsePublicEntitySlugId(`medicine-${PRODUCT_ID}`), null);
  assert.equal(parsePublicEntitySlugId('medicine-prinvalid'), null);
});
