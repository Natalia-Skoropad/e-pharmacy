import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REFERENCE_DATA_NAME_MAX_LENGTH,
  buildReferenceDataNameError,
  isProductCategorySlug,
  isReferenceDataNameValid,
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
