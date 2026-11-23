import assert from 'node:assert/strict';
import test from 'node:test';

import { productCategorySlugSchema } from './product-category.schema';

import {
  PRODUCT_CATEGORY_NAME_MAX_LENGTH,
  PRODUCT_CATEGORY_SLUG_MAX_LENGTH,
} from '../../constants/catalog/product-category';

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

//===============================================================

test('product category name and slug limits are both 100 characters', () => {
  assert.equal(PRODUCT_CATEGORY_NAME_MAX_LENGTH, 100);
  assert.equal(PRODUCT_CATEGORY_SLUG_MAX_LENGTH, 100);

  assert.equal(
    productCategorySlugSchema.safeParse('a'.repeat(100)).success,
    true
  );

  assert.equal(
    productCategorySlugSchema.safeParse('a'.repeat(101)).success,
    false
  );
});
