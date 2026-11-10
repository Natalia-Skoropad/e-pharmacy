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
  formatPharmacyLocationLabel,
  mergePharmacyCatalogFilters,
  normalizeLocationKey,
  parsePharmacySearchParams,
  resolvePharmacyLocation,
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

import {
  getProductCatalogSeoContent,
  getProductCatalogSeoParts,
  getProductCatalogTitle,
} from './product-catalog-seo';

//===================================================================

test('normalizes settlements and resolves same-name locations by region', () => {
  assert.equal(normalizeLocationKey('Київ'), 'київ');
  assert.equal(normalizeLocationKey('Львів'), 'львів');
  assert.notEqual(normalizeLocationKey('Київ'), normalizeLocationKey('Львів'));

  const locations = [
    { settlement: 'Cherkasy', label: 'Cherkasy' },
    {
      settlement: 'Nova Ivanivka',
      region: 'Odesa region',
      label: 'Nova Ivanivka (Odesa region)',
    },
    {
      settlement: 'Nova Ivanivka',
      region: 'Kharkiv region',
      label: 'Nova Ivanivka (Kharkiv region)',
    },
  ] as const;

  assert.deepEqual(resolvePharmacyLocation('cherkasy', '', locations), {
    settlement: 'Cherkasy',
    region: '',
  });

  assert.deepEqual(
    resolvePharmacyLocation('nova ivanivka', 'odesa region', locations),
    { settlement: 'Nova Ivanivka', region: 'Odesa region' }
  );

  assert.deepEqual(resolvePharmacyLocation('nova ivanivka', '', locations), {
    settlement: 'Nova Ivanivka',
    region: '',
  });

  assert.deepEqual(
    resolvePharmacyLocation('Ivano Frankivsk', 'Ivano Frankivsk region', [
      {
        settlement: 'Ivano-Frankivsk',
        region: 'Ivano-Frankivsk region',
        label: 'Ivano-Frankivsk (Ivano-Frankivsk region)',
      },
    ]),
    {
      settlement: 'Ivano-Frankivsk',
      region: 'Ivano-Frankivsk region',
    }
  );

  assert.equal(
    formatPharmacyLocationLabel('nova ivanivka', 'odesa region'),
    'nova ivanivka (odesa region)'
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

    assert.deepEqual(
      result.issues.map((issue) => issue.code),
      ['too_many']
    );

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

test('accepts a future database category slug without compile-time membership', () => {
  const result = parseProductCatalogSegments({
    segments: ['category-veterinary_care'],
  });

  assert.equal(result.isCanonical, true);
  assert.equal(result.filters.category, 'veterinary_care');

  assert.equal(
    buildProductCatalogPath(result.filters),
    '/product-catalog/category-veterinary_care'
  );
});

//===================================================================

test('reports duplicate and unknown pharmacy segments', () => {
  const result = parsePharmacySegments({
    segments: ['location-київ', 'location-львів', 'page-1e3', 'other'],
  });

  assert.equal(result.isCanonical, false);

  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['duplicate', 'malformed', 'unknown']
  );

  assert.equal(result.filters.settlement, 'київ');
});

//===================================================================

test('parses canonical pharmacy location plus region paths', () => {
  const canonicalResult = parsePharmacySegments({
    segments: ['location-nova-ivanivka', 'region-odesa-region'],
  });

  assert.equal(canonicalResult.isCanonical, true);

  assert.deepEqual(canonicalResult.filters, {
    name: '',
    address: '',
    pharmacyId: '',
    settlement: 'nova ivanivka',
    region: 'odesa region',
    sort: 'newest',
    page: 1,
  });
});

//===================================================================

test('builds typed canonical pharmacy filter paths and recognizes legacy product pharmacy paths', () => {
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

//===================================================================

test('product catalog keeps selected product, category and pharmacy in one canonical URL', () => {
  const productId = '6ac75e1417684f6f914a4d59';
  const pharmacyId = '6ac75e170642845c5d27fd6c';
  const pharmacies = [{ id: pharmacyId, name: 'Care Pharmacy Lviv' }];

  const href = buildProductCatalogPath(
    {
      productId,
      pharmacyId,
      category: 'medicine',
      sort: 'rating-desc',
      page: 2,
    },
    pharmacies
  );

  const segments = href.split('/').slice(2);
  const parsed = parseProductCatalogSegments({ segments });

  assert.equal(parsed.isCanonical, true);
  assert.equal(parsed.filters.productId, productId);
  assert.equal(parsed.filters.pharmacyId, pharmacyId);
  assert.equal(parsed.filters.category, 'medicine');
  assert.equal(parsed.filters.sort, 'rating-desc');
  assert.equal(parsed.filters.page, 2);
  assert.equal(buildProductCatalogPath(parsed.filters, pharmacies), href);

  const apiParams = buildProductCatalogApiParams(parsed.filters);

  assert.equal(apiParams.productId, productId);
  assert.equal(apiParams.pharmacyId, pharmacyId);
  assert.equal(apiParams.category, 'medicine');
  assert.equal(apiParams.inStock, undefined);
});

//===================================================================

test('product catalog rejects malformed IDs and removes legacy availability filters', () => {
  const invalidId = parseProductCatalogSegments({
    segments: ['product-id-invalid'],
  });

  assert.deepEqual(
    invalidId.issues.map((issue) => issue.code),
    ['malformed']
  );

  const legacyAvailability = parseProductCatalogSegments({
    segments: ['availability-in-stock'],
  });

  assert.deepEqual(
    legacyAvailability.issues.map((issue) => issue.code),
    ['unknown']
  );

  assert.equal(
    buildProductCatalogPath(legacyAvailability.filters),
    '/product-catalog'
  );

  const duplicate = parseProductCatalogSegments({
    segments: [
      'product-id-6ac75e1417684f6f914a4d59',
      'product-id-6ac75e1417684f6f914a4d59',
    ],
  });

  assert.deepEqual(
    duplicate.issues.map((issue) => issue.code),
    ['duplicate']
  );
});

//===================================================================

test('product catalog SEO highlights selected entities for combined filters and uses an en dash', () => {
  const filters = {
    productId: '6ac75e1417684f6f914a4db5',
    category: 'medicine',
    pharmacyId: '6ac75e0f17684f6f914a4579',
    name: '',
    article: '',
    sort: 'newest',
    page: 1,
  } as const;

  const context = {
    productName: 'Ramipril 5 mg Square',
    categoryLabel: 'Medicine',
    pharmacyName: 'Apteka Zdorovia Dnipro 18',
  };

  const title = getProductCatalogTitle(filters, context);

  assert.match(title, /Ramipril 5 mg Square – Medicine/);
  assert.doesNotMatch(title, /—/);

  const intro = getProductCatalogSeoContent(filters, context).intro;

  assert.deepEqual(
    getProductCatalogSeoParts(intro, filters, context)
      .filter((part) => part.highlighted)
      .map((part) => part.text),
    ['Ramipril 5 mg Square', 'Medicine', 'Apteka Zdorovia Dnipro 18']
  );

  assert.equal(
    getProductCatalogSeoParts(
      'Browse medicine from Apteka Zdorovia Dnipro 18.',
      { ...filters, productId: undefined },
      context
    ).filter((part) => part.highlighted).length,
    2
  );

  assert.deepEqual(
    getProductCatalogSeoParts(
      'An (Aspirin 500 mg) offer',
      {
        ...filters,
        productId: '6ac75e1417684f6f914a4db5',
        category: 'all',
        pharmacyId: undefined,
      },
      { productName: '(Aspirin 500 mg)' }
    )
      .filter((part) => part.highlighted)
      .map((part) => part.text),
    ['(Aspirin 500 mg)']
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
    sort: 'newest',
    page: 1,
  });

  const pharmacyContent = getPharmaciesSeoContent({
    name: '',
    address: '',
    settlement: '',
    region: '',
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

test('treats only canonical pharmacy catalog prefixes as catalog segments before detail lookup', () => {
  for (const segment of [
    'location-aaaaaaaaaaaaaaaaaaaaaaaa',
    'region-aaaaaaaaaaaaaaaaaaaaaaaa',
    'address-aaaaaaaaaaaaaaaaaaaaaaaa',
    'search-name-aaaaaaaaaaaaaaaaaaaaaaaa',
  ]) {
    assert.equal(isPharmacyCatalogSegment(segment), true);
  }

  assert.equal(
    isPharmacyCatalogSegment('city-aaaaaaaaaaaaaaaaaaaaaaaa'),
    false
  );

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
    segments: ['location-kyiv'],
  }).filters;

  const queryPharmacyFilters = parsePharmacySearchParams({
    settlement: 'Lviv',
    sort: 'rating-desc',
  });

  const pharmacyFilters = mergePharmacyCatalogFilters(
    routePharmacyFilters,
    queryPharmacyFilters
  );

  assert.equal(pharmacyFilters.settlement, 'kyiv');
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

  assert.equal(
    parsePharmacySearchParams({ settlement: ['Kyiv', 'Lviv'] }).settlement,
    ''
  );

  assert.equal(hasCatalogSearchParams({ foo: 'bar' }), true);
  assert.equal(hasCatalogSearchParams({}), false);
});

//===================================================================

test('pharmacy noindex canonical keeps only the indexed location dimension', () => {
  assert.equal(
    buildPharmacyCanonicalPath({
      name: 'Care',
      address: 'Main Street',
      settlement: 'Nova Ivanivka',
      region: 'Odesa region',
      sort: 'rating-desc',
      page: 3,
    }),
    '/pharmacies/location-nova-ivanivka/region-odesa-region'
  );
});
