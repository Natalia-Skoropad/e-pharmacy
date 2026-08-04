import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePositivePageParam } from './catalog-param-utils';
import { getCatalogRedirectPage } from './catalog-resource-state';

import {
  normalizeCityKey,
  resolvePharmacyCity,
} from './pharmacies-catalog-filters';

import { parsePharmacySegments } from './pharmacies-catalog-paths';

import {
  buildProductCatalogPath,
  parseProductCatalogSegments,
} from './product-catalog-paths';

import { getPharmaciesSeoContent } from './pharmacies-catalog-seo';
import { getProductCatalogSeoContent } from './product-catalog-seo';

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

//===================================================================

test('builds typed canonical pharmacy filter paths and recognizes legacy paths', () => {
  const pharmacyId = '6a5f5244a3defb1d037f06e7';

  const pharmacies = [
    {
      id: pharmacyId,
      name: 'Care Pharmacy Lviv',
    },
  ] as const;

  assert.equal(
    buildProductCatalogPath({ pharmacyId }, pharmacies),
    `/product-catalog/pharmacy-care-pharmacy-lviv-ph${pharmacyId}`
  );

  const legacyResult = parseProductCatalogSegments({
    segments: [`pharmacy-care-pharmacy-lviv-${pharmacyId}`],
  });

  assert.equal(legacyResult.filters.pharmacyId, pharmacyId);
  assert.equal(legacyResult.isCanonical, false);

  assert.deepEqual(
    legacyResult.issues.map((issue) => issue.code),
    ['legacy']
  );

  const canonicalResult = parseProductCatalogSegments({
    segments: [`pharmacy-care-pharmacy-lviv-ph${pharmacyId}`],
  });

  assert.equal(canonicalResult.filters.pharmacyId, pharmacyId);
  assert.equal(canonicalResult.isCanonical, true);
  assert.deepEqual(canonicalResult.issues, []);
});

//===================================================================

test('redirects stale catalog pages to the last available page', () => {
  assert.equal(getCatalogRedirectPage(8, 3, { status: 'success' }), 3);

  assert.equal(
    getCatalogRedirectPage(8, 0, {
      status: 'empty',
      reason: 'catalog-empty',
    }),
    null
  );

  assert.equal(getCatalogRedirectPage(8, 3, { status: 'unavailable' }), null);
});

//===================================================================

test('uses semantic, neutral catalog SEO content', () => {
  const productContent = getProductCatalogSeoContent({
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: 'newest',
    page: 1,
  });

  const pharmacyContent = getPharmaciesSeoContent({
    name: '',
    address: '',
    city: '',
    sort: 'newest',
    page: 1,
  });

  for (const content of [productContent, pharmacyContent]) {
    assert.equal(typeof content.intro, 'string');
    assert.equal(typeof content.comparison, 'string');
    assert.equal(typeof content.ordering, 'string');

    const text = Object.values(content).join(' ');
    assert.doesNotMatch(text, /tiny assistant|white coat|22:59/i);
  }
});
