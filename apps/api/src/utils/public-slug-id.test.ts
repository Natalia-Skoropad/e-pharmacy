import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPublicEntitySlugId } from './public-slug-id';

//===============================================================

const PRODUCT_ID = '6a5f5242d9c46211621ad70a';
const PHARMACY_ID = '6a5f5244a3defb1d037f06e7';

//===============================================================

test('backend serializes the same typed public slug contract as the client', () => {
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
