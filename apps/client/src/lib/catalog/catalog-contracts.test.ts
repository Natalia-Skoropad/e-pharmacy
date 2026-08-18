import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSingleSearchParam,
  hasCatalogSearchParams,
  MAX_CATALOG_SEGMENTS,
  parsePositivePageParam,
} from './catalog-param-utils';

import { getCatalogRedirectPage } from './catalog-resource-state';

import {
  formatPharmacyCityLabel,
  normalizeCityKey,
  resolvePharmacyCity,
  mergePharmacyCatalogFilters,
  parsePharmacySearchParams,
} from './pharmacies-catalog-filters';

import {
  buildPharmacyCanonicalPath,
  isPharmacyCatalogSegment,
  parsePharmacySegments,
} from './pharmacies-catalog-paths';

import {
  buildProductCatalogApiParams,
  mergeProductCatalogFilters,
  parseProductCatalogSearchParams,
} from './product-catalog-filters';

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

  assert.equal(formatPharmacyCityLabel('cherkasy'), 'Cherkasy');

  assert.equal(formatPharmacyCityLabel('ivano-frankivsk'), 'Ivano-Frankivsk');

  assert.equal(
    formatPharmacyCityLabel('кам’янець-подільський'),
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

test('rejects excessive catch-all segment counts before parsing the full URL', () => {
  const segments = Array.from(
    { length: MAX_CATALOG_SEGMENTS + 100 },
    (_, index) => `unknown-${index}`
  );

  const productResult = parseProductCatalogSegments({ segments });
  const pharmacyResult = parsePharmacySegments({ segments });

  for (const result of [productResult, pharmacyResult]) {
    assert.equal(result.isCanonical, false);
    assert.deepEqual(result.issues.map((issue) => issue.code), ['too_many']);
    assert.equal(result.issues[0]?.index, MAX_CATALOG_SEGMENTS);
  }
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

test('keeps availability independent from the selected pharmacy', () => {
  const pharmacyId = '6a5f5244a3defb1d037f06e7';

  const baseFilters = {
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: 'newest',
    page: 1,
    pharmacyId,
  } as const;

  assert.equal(buildProductCatalogApiParams(baseFilters).inStock, undefined);

  assert.equal(
    buildProductCatalogApiParams({
      ...baseFilters,
      availability: 'in-stock',
    }).inStock,
    true
  );

  assert.equal(
    buildProductCatalogApiParams({
      ...baseFilters,
      availability: 'out-of-stock',
    }).inStock,
    false
  );
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

//===================================================================

test('treats known pharmacy catalog prefixes as catalog segments before legacy detail lookup', () => {
  for (const segment of [
    'city-aaaaaaaaaaaaaaaaaaaaaaaa',
    'address-aaaaaaaaaaaaaaaaaaaaaaaa',
    'search-name-aaaaaaaaaaaaaaaaaaaaaaaa',
  ]) {
    assert.equal(isPharmacyCatalogSegment(segment), true);
  }

  assert.equal(
    isPharmacyCatalogSegment('care-pharmacy-aaaaaaaaaaaaaaaaaaaaaaaa'),
    false
  );
});

//===================================================================

test('uses path filters as canonical authority and query filters only as compatibility input', () => {
  const routeProductFilters = parseProductCatalogSegments({
    segments: ['category-medicine'],
  }).filters;

  const queryProductFilters = parseProductCatalogSearchParams({
    category: 'vitamins',
    sort: 'rating-desc',
  });

  const productFilters = mergeProductCatalogFilters(
    routeProductFilters,
    queryProductFilters
  );

  assert.equal(productFilters.category, 'medicine');
  assert.equal(productFilters.sort, 'rating-desc');

  const routePharmacyFilters = parsePharmacySegments({
    segments: ['city-kyiv'],
  }).filters;

  const queryPharmacyFilters = parsePharmacySearchParams({
    city: 'Lviv',
    sort: 'rating-desc',
  });

  const pharmacyFilters = mergePharmacyCatalogFilters(
    routePharmacyFilters,
    queryPharmacyFilters
  );

  assert.equal(pharmacyFilters.city, 'kyiv');
  assert.equal(pharmacyFilters.sort, 'rating-desc');
});

//===================================================================

test('drops duplicate query values and recognizes any query form as compatibility input', () => {
  assert.equal(getSingleSearchParam(['medicine', 'vitamins']), undefined);

  assert.equal(
    parseProductCatalogSearchParams({ category: ['medicine', 'vitamins'] })
      .category,
    'all'
  );

  assert.equal(parsePharmacySearchParams({ city: ['Kyiv', 'Lviv'] }).city, '');
  assert.equal(hasCatalogSearchParams({ foo: 'bar' }), true);
  assert.equal(hasCatalogSearchParams({}), false);
});

//===================================================================

test('pharmacy noindex canonical keeps only the indexed city dimension', () => {
  assert.equal(
    buildPharmacyCanonicalPath({
      name: 'Care',
      address: 'Main Street',
      city: 'Київ',
      sort: 'rating-desc',
      page: 3,
    }),
    '/pharmacies/city-київ'
  );
});
