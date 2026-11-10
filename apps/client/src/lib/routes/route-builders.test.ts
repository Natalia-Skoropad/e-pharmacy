import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductOffer } from '@e-pharmacy/types/products';

import {
  buildProductOffersPath,
  parseProductOffersSegments,
  filterProductOffers,
} from '@/lib/catalog/product-offers-paths';

import {
  buildProductDetailTabPath,
  getProductDetailsBreadcrumbs,
  getProductTabFromSegment,
} from './product-detail-tabs';

import {
  buildCheckoutPath,
  buildProductContextQueryString,
  buildOrderPath,
  buildPharmacyPath,
  buildProductPath,
  getCheckoutPharmacyIdFromPathParam,
  getLegacyCheckoutRedirectPath,
  getLegacyOrderRedirectPath,
  getOrderIdFromPathParam,
} from './route-builders';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

//===================================================================

test('builds short root-level product and pharmacy detail paths with typed IDs', () => {
  assert.equal(buildProductPath('Pain Relief', ID), `/pain-relief-pr${ID}`);
  assert.equal(buildPharmacyPath('Health Hub', ID), `/health-hub-ph${ID}`);
});

//===================================================================

test('uses the backend canonical public slug when it is provided', () => {
  assert.equal(
    buildProductPath('Ignored', ID, `canonical-product-pr${ID}`),
    `/canonical-product-pr${ID}`
  );

  assert.equal(
    buildPharmacyPath('Ignored', ID, `canonical-pharmacy-ph${ID}`),
    `/canonical-pharmacy-ph${ID}`
  );
});

//===================================================================

test('builds a shared product context query string', () => {
  assert.equal(buildProductContextQueryString(), '');

  assert.equal(
    buildProductContextQueryString('pharmacy id/with spaces'),
    '?pharmacyId=pharmacy%20id%2Fwith%20spaces'
  );
});

//===================================================================

test('treats private route labels as advisory while IDs remain authoritative', () => {
  assert.equal(
    getCheckoutPharmacyIdFromPathParam(`wrong-pharmacy-name-ph${ID}`),
    ID
  );

  assert.equal(getOrderIdFromPathParam(`wrong-order-number-ph${ID}`), ID);
});

//===================================================================

test('builds typed checkout pharmacy paths and redirects legacy checkout slugs', () => {
  const canonical = buildCheckoutPath('PharmaPlus Kharkiv 61', ID);

  assert.equal(canonical, `/checkout/pharmaplus-kharkiv-61-ph${ID}`);

  assert.equal(
    getCheckoutPharmacyIdFromPathParam(`pharmaplus-kharkiv-61-ph${ID}`),
    ID
  );

  assert.equal(
    getLegacyCheckoutRedirectPath(`pharmaplus-kharkiv-61-${ID}`),
    canonical
  );

  assert.equal(getLegacyCheckoutRedirectPath(`pharmaplus-pr${ID}`), null);
});

//===================================================================

test('builds and parses a canonical order slug with Unicode order numbers', () => {
  const path = buildOrderPath({ id: ID, orderNumber: 'Замовлення № 42' });

  assert.match(path, new RegExp(`ph${ID}$`));
  assert.equal(getOrderIdFromPathParam(path.split('/').at(-1) ?? ''), ID);
});

//===================================================================

test('redirects legacy order slugs to the canonical ph-prefixed route', () => {
  const legacy = `/profile/orders/ep-20260716-080000-${ID}`;
  const legacySlug = legacy.split('/').at(-1) ?? '';

  assert.equal(
    getLegacyOrderRedirectPath(legacySlug),
    `/profile/orders/ep-20260716-080000-ph${ID}`
  );
});

//===================================================================

test('rejects malformed order route identifiers', () => {
  assert.equal(getOrderIdFromPathParam('order--invalid'), null);
  assert.throws(() => buildOrderPath({ id: 'invalid', orderNumber: '42' }));
});

//===================================================================

test('resolves product detail tab routes and keeps the pharmacy context', () => {
  const base = `/ramipril-5-mg-pr${ID}`;
  const contextId = '507f1f77bcf86cd799439012';

  assert.equal(getProductTabFromSegment('pharmacies'), 'pharmacies');
  assert.equal(getProductTabFromSegment('characteristics'), 'characteristics');
  assert.equal(getProductTabFromSegment('reviews'), 'reviews');
  assert.equal(getProductTabFromSegment('invalid'), null);
  assert.equal(getProductTabFromSegment('details'), null);

  assert.equal(buildProductDetailTabPath(base, 'details'), base);

  assert.equal(
    buildProductDetailTabPath(base, 'pharmacies'),
    `${base}/pharmacies`
  );

  assert.equal(
    buildProductDetailTabPath(base, 'characteristics'),
    `${base}/characteristics`
  );

  assert.equal(
    buildProductDetailTabPath(base, 'reviews', contextId),
    `${base}/reviews?pharmacyId=${contextId}`
  );
});

//===================================================================

test('builds breadcrumb trails for product details and individual tabs', () => {
  const productHref = `/ramipril-5-mg-pr${ID}`;

  assert.deepEqual(
    getProductDetailsBreadcrumbs('Ramipril 5 mg', productHref, 'details'),
    [
      { label: 'Home', href: '/' },
      { label: 'Product catalog', href: '/product-catalog' },
      { label: 'Ramipril 5 mg' },
    ]
  );

  assert.deepEqual(
    getProductDetailsBreadcrumbs('Ramipril 5 mg', productHref, 'reviews'),
    [
      { label: 'Home', href: '/' },
      { label: 'Product catalog', href: '/product-catalog' },
      { label: 'Ramipril 5 mg', href: productHref },
      { label: 'Reviews' },
    ]
  );
});

//===================================================================

test('product offers URL preserves pharmacy, location, sort, page and product context', () => {
  const base = `/ramipril-5-mg-pr${ID}`;

  const params = {
    pharmacyId: ID,
    settlement: 'Одеса',
    region: 'Одеська область',
    sort: 'price-asc' as const,
    page: 2,
  };

  const href = buildProductOffersPath(base, params, ID);

  assert.match(href, /\/pharmacies\/pharmacy-id-/);
  assert.match(href, /\/location-/);
  assert.match(href, /\/region-/);
  assert.match(href, /\/sort-price-asc\/page-2\?pharmacyId=/);

  const pieces = href.split('?')[0]!.split('/').slice(3);
  const parsed = parseProductOffersSegments(pieces);

  assert.equal(parsed?.pharmacyId, params.pharmacyId);
  assert.equal(parsed?.sort, params.sort);
  assert.equal(parsed?.page, params.page);

  assert.equal(
    parsed?.settlement.toLocaleLowerCase('uk-UA'),
    params.settlement.toLocaleLowerCase('uk-UA')
  );

  assert.equal(
    parsed?.region.toLocaleLowerCase('uk-UA'),
    params.region.toLocaleLowerCase('uk-UA')
  );

  const encodedLocation = parseProductOffersSegments([
    `location-${encodeURIComponent('Одеса')}`,
    `region-${encodeURIComponent('Одеська область'.toLowerCase().replace(' ', '-'))}`,
  ]);

  assert.equal(encodedLocation?.settlement.toLocaleLowerCase('uk-UA'), 'одеса');

  assert.equal(
    encodedLocation?.region.toLocaleLowerCase('uk-UA'),
    'одеська область'
  );

  assert.equal(parseProductOffersSegments(['page-0']), null);
  assert.equal(parseProductOffersSegments(['sort-unknown']), null);
  assert.equal(parseProductOffersSegments(['region-odeska']), null);
});

//===================================================================

test('product offers filter uses actual pharmacy and location before pagination', () => {
  const make = (
    id: string,
    settlement: string,
    price: number
  ): ProductOffer => ({
    id,
    pharmacyId: id,
    pharmacyName: `Pharmacy ${id}`,
    price,
    pharmacyLocation: { settlement, region: 'Одеська область' },
    pharmacyRating: 4,
    pharmacyReviewsCount: 10,
    pharmacyIsFavorite: false,
    availableQuantity: 2,
    inStock: true,
    createdAt: '2026-07-16T00:00:00.000Z' as ProductOffer['createdAt'],
    updatedAt: '2026-07-16T00:00:00.000Z' as ProductOffer['updatedAt'],
  });

  const offers = [
    make(ID, 'Одеса', 100),
    make('507f1f77bcf86cd799439012', 'Рені', 50),
  ];

  const query = {
    pharmacyId: '',
    settlement: 'Одеса',
    region: 'Одеська область',
    sort: 'price-asc' as const,
    page: 1,
  };

  assert.deepEqual(
    filterProductOffers(offers, query).map((item) => item.pharmacyId),
    [ID]
  );

  assert.deepEqual(
    filterProductOffers(offers, { ...query, settlement: '', region: '' }).map(
      (item) => item.price
    ),
    [50, 100]
  );
});
