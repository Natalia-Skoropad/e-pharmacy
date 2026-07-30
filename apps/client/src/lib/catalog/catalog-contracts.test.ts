import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePositivePageParam } from './catalog-param-utils';

import {
  normalizeCityKey,
  resolvePharmacyCity,
} from './pharmacies-catalog-filters';

import { parsePharmacySegments } from './pharmacies-catalog-paths';
import { parseProductCatalogSegments } from './product-catalog-paths';

//===================================================================

test('normalizes Ukrainian cities without collapsing distinct values', () => {
  assert.equal(normalizeCityKey('Київ'), 'київ');
  assert.equal(normalizeCityKey('Львів'), 'львів');
  assert.notEqual(normalizeCityKey('Київ'), normalizeCityKey('Львів'));

  assert.equal(
    resolvePharmacyCity('івано-франківськ', ['Івано-Франківськ']),
    'Івано-Франківськ'
  );

  assert.equal(
    resolvePharmacyCity('кам’янець-подільський', ['Кам’янець-Подільський']),
    'Кам’янець-Подільський'
  );
});

//===================================================================

test('accepts only canonical safe positive page values', () => {
  assert.equal(parsePositivePageParam('1'), 1);
  assert.equal(parsePositivePageParam('12'), 12);
  assert.equal(parsePositivePageParam('01'), 1);
  assert.equal(parsePositivePageParam('1.0'), 1);
  assert.equal(parsePositivePageParam('1e3'), 1);
  assert.equal(parsePositivePageParam('9007199254740992'), 1);
});

//===================================================================

test('reports duplicate, malformed and unknown product segments', () => {
  const result = parseProductCatalogSegments({
    segments: [
      'category-medicine',
      'category-vitamins',
      'page-01',
      'unknown-value',
    ],
  });

  assert.equal(result.isCanonical, false);

  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['duplicate', 'malformed', 'unknown']
  );

  assert.equal(result.filters.category, 'medicine');
  assert.equal(result.filters.page, 1);
});

//===================================================================

test('reports duplicate and unknown pharmacy segments', () => {
  const result = parsePharmacySegments({
    segments: ['city-київ', 'city-львів', 'page-1e3', 'other'],
  });

  assert.equal(result.isCanonical, false);

  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['duplicate', 'malformed', 'unknown']
  );

  assert.equal(result.filters.city, 'київ');
});
