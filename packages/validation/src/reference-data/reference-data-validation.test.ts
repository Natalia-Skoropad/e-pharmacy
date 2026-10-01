import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRODUCT_CATEGORY_COLOR_PATTERN,
  REFERENCE_DATA_NAME_MAX_LENGTH,
  buildReferenceDataNameError,
  isProductCategoryColor,
  isProductCategorySlug,
  isReferenceDataNameValid,
  normalizeProductCategoryColor,
  normalizeReferenceDataName,
  normalizeReferenceDataNameKey,
} from './index';

//===================================================================

test('reference-data names use one shared category/position contract', () => {
  assert.equal(isReferenceDataNameValid('Medicine'), true);
  assert.equal(isReferenceDataNameValid('Medical devices'), true);
  assert.equal(isReferenceDataNameValid('Content manager'), true);
  assert.equal(isReferenceDataNameValid('CEO'), true);

  assert.equal(isReferenceDataNameValid('medicine'), false);
  assert.equal(isReferenceDataNameValid('Медицина'), false);
  assert.equal(isReferenceDataNameValid('Medical devices 2'), false);
  assert.equal(isReferenceDataNameValid('Medical-devices'), false);

  assert.equal(
    isReferenceDataNameValid('M'.repeat(REFERENCE_DATA_NAME_MAX_LENGTH + 1)),
    false
  );
});

//===================================================================

test('reference-data persistence trims edge whitespace without rewriting display text', () => {
  assert.equal(
    normalizeReferenceDataName('  Medical  devices  '),
    'Medical  devices'
  );

  assert.equal(buildReferenceDataNameError('  Medical devices  '), '');
});

//===================================================================

test('reference-data uniqueness keys are case-insensitive and whitespace-stable', () => {
  assert.equal(
    normalizeReferenceDataNameKey('  Medical   Devices  '),
    'medical devices'
  );

  assert.equal(
    normalizeReferenceDataNameKey('Medical devices'),
    normalizeReferenceDataNameKey(' medical   DEVICES ')
  );
});

//===================================================================

test('dynamic product-category slugs preserve the existing snake_case key format', () => {
  assert.equal(isProductCategorySlug('medicine'), true);
  assert.equal(isProductCategorySlug('medical_devices'), true);
  assert.equal(isProductCategorySlug('baby_care'), true);

  assert.equal(isProductCategorySlug('Medical_devices'), false);
  assert.equal(isProductCategorySlug('medical-devices'), false);
  assert.equal(isProductCategorySlug('medical__devices'), false);
  assert.equal(isProductCategorySlug(''), false);
});

//===================================================================

test('product-category color uses a canonical six-digit hex contract', () => {
  assert.equal(PRODUCT_CATEGORY_COLOR_PATTERN.test('#3B82F6'), true);
  assert.equal(isProductCategoryColor('#abcdef'), true);
  assert.equal(isProductCategoryColor('#ABCDEF'), true);
  assert.equal(isProductCategoryColor('#FFF'), false);
  assert.equal(isProductCategoryColor('3B82F6'), false);
  assert.equal(isProductCategoryColor('#GG82F6'), false);
  assert.equal(normalizeProductCategoryColor('  #abcdef  '), '#ABCDEF');
});
