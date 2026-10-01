import assert from 'node:assert/strict';
import test from 'node:test';

import { productCategorySlugSchema } from './product-category.schema';

//===============================================================

test('dynamic product-category slug validation accepts canonical snake_case', () => {
  assert.equal(productCategorySlugSchema.parse('baby_care'), 'baby_care');
  assert.equal(
    productCategorySlugSchema.parse('medical_devices'),
    'medical_devices'
  );
});

//===============================================================

test('dynamic product-category slug validation rejects malformed values', () => {
  for (const value of [
    'Baby Care',
    'baby-care',
    'baby care',
    'baby__care',
    'baby_care!',
    'інше',
    '',
  ]) {
    assert.throws(() => productCategorySlugSchema.parse(value));
  }
});
