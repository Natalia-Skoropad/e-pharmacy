import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isDateParam,
  normalizeSlugEnumValue,
  sanitizeTextParam,
} from './url-params';

//===================================================================

test('URL params keep valid English input and reject invalid calendar dates', () => {
  assert.equal(sanitizeTextParam('  Health Pharmacy  '), 'Health Pharmacy');
  assert.equal(sanitizeTextParam('Health Аптека'), 'Health ');
  assert.equal(isDateParam('2024-02-29'), true);
  assert.equal(isDateParam('2026-02-29'), false);
});

//===================================================================

test('URL enum normalization returns only declared values', () => {
  const statuses = ['in_progress', 'approved'] as const;

  assert.equal(normalizeSlugEnumValue('in-progress', statuses), 'in_progress');
  assert.equal(normalizeSlugEnumValue('unknown', statuses), null);
});
