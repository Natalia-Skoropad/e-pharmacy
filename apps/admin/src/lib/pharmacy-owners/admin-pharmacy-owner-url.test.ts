import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSalesChartPath,
  parseSalesChartSegments,
} from './owner-sales-chart-paths';

import {
  buildProductRequestsPath,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
} from '../product-requests/admin-product-request-paths';

import {
  buildAdminPharmacyOwnerDetailUrl,
  buildAdminPharmacyOwnerPharmaciesUrl,
  parseAdminPharmacyOwnerPharmaciesSegments,
  buildAdminPharmacyOwnersListUrl,
  parseAdminPharmacyOwnerDetailSearchParams,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
  parseAdminPharmacyOwnersListSearchParams,
  parseAdminPharmacyOwnersListSegments,
  resolveAdminPharmacyOwnersRoute,
} from './admin-pharmacy-owner-url';

//===================================================================

const OWNER_ID = '64b64b64b64b64b64b64b64b';

//===================================================================

test('normalizes invalid owner list query values safely', () => {
  assert.deepEqual(
    parseAdminPharmacyOwnersListSearchParams({
      search: ['first', 'second'],
      status: 'pending',
      registeredFrom: '2026-10-30',
      registeredTo: '2026-10-01',
      page: '-2',
      perPage: '25',
    }),
    {
      search: '',
      status: 'all',
      registeredFrom: '',
      registeredTo: '',
      page: 1,
      perPage: 20,
    }
  );
});

//===================================================================

test('builds canonical owner list paths without query noise or search PII', () => {
  assert.equal(
    buildAdminPharmacyOwnersListUrl({
      search: 'nata@example.com',
      status: 'new',
      registeredFrom: '2026-09-01',
      registeredTo: '2026-10-02',
      page: 2,
      perPage: 50,
    }),
    '/admin/pharmacy-owners/status-new/registered-from-2026-09-01/registered-to-2026-10-02/page-2/per-page-50'
  );

  assert.equal(
    buildAdminPharmacyOwnersListUrl({
      search: 'nata@example.com',
      status: 'all',
      registeredFrom: '',
      registeredTo: '',
      page: 1,
      perPage: 20,
    }),
    '/admin/pharmacy-owners'
  );

  assert.equal(
    buildAdminPharmacyOwnersListUrl({
      search: OWNER_ID,
      status: 'active',
      registeredFrom: '',
      registeredTo: '',
      page: 1,
      perPage: 20,
    }),
    `/admin/pharmacy-owners/owner-id-${OWNER_ID}/status-active`
  );
});

//===================================================================

test('resolves and parses canonical owner filter path segments', () => {
  const filters = [
    `owner-id-${OWNER_ID}`,
    'status-active',
    'registered-from-2026-09-01',
    'registered-to-2026-10-02',
    'page-3',
    'per-page-100',
  ];

  assert.deepEqual(resolveAdminPharmacyOwnersRoute(filters), {
    kind: 'filters',
    filters,
  });

  assert.deepEqual(parseAdminPharmacyOwnersListSegments({ filters }), {
    search: OWNER_ID,
    status: 'active',
    registeredFrom: '2026-09-01',
    registeredTo: '2026-10-02',
    page: 3,
    perPage: 100,
  });

  assert.deepEqual(resolveAdminPharmacyOwnersRoute([OWNER_ID]), {
    kind: 'detail',
    ownerId: OWNER_ID,
  });

  assert.deepEqual(resolveAdminPharmacyOwnersRoute(['unknown-segment']), {
    kind: 'invalid',
  });
});

//===================================================================

test('normalizes detail tabs and validates owner ids in builders', () => {
  assert.deepEqual(parseAdminPharmacyOwnerDetailSearchParams({ tab: 'wat' }), {
    tab: 'personal',
  });

  assert.equal(
    buildAdminPharmacyOwnerDetailUrl(OWNER_ID, { tab: 'comments' }),
    `/admin/pharmacy-owners/${OWNER_ID}/comments`
  );

  assert.throws(() => buildAdminPharmacyOwnerDetailUrl('bad-id'));
});

//===================================================================

test('parses and builds namespaced pharmacy-tab filters', () => {
  const state = parseAdminPharmacyOwnerPharmaciesSearchParams({
    pharmacySearch: 'Bolhrad Medical Lane',
    pharmacyStatus: 'active',
    pharmacyCreatedFrom: '2026-09-01',
    pharmacyCreatedTo: '2026-10-02',
    pharmacyRating: '4-5',
    pharmacyPage: '2',
    pharmacyPerPage: '100',
  });

  assert.equal(state.rating, '4-5');

  const url = buildAdminPharmacyOwnerPharmaciesUrl(OWNER_ID, state);

  assert.equal(
    url,
    `/admin/pharmacy-owners/${OWNER_ID}/pharmacies/status-active/created-from-2026-09-01/created-to-2026-10-02/rating-4-5/page-2/per-page-100`
  );

  assert.ok(!url.includes('Bolhrad'));

  const exactState = { ...state, search: '507f1f77bcf86cd799439011' };
  const exactUrl = buildAdminPharmacyOwnerPharmaciesUrl(OWNER_ID, exactState);

  assert.equal(
    exactUrl,
    `/admin/pharmacy-owners/${OWNER_ID}/pharmacies/pharmacy-id-507f1f77bcf86cd799439011/status-active/created-from-2026-09-01/created-to-2026-10-02/rating-4-5/page-2/per-page-100`
  );

  assert.deepEqual(
    parseAdminPharmacyOwnerPharmaciesSegments(exactUrl.split('/').slice(5)),
    exactState
  );
});

//===================================================================

test('linked-pharmacy location filters round-trip in the owner URL', () => {
  const original = parseAdminPharmacyOwnerPharmaciesSearchParams({
    settlement: 'Dnipro',
    region: 'Dnipropetrovsk Oblast',
  });

  const url = buildAdminPharmacyOwnerPharmaciesUrl(OWNER_ID, original);

  const restored = parseAdminPharmacyOwnerPharmaciesSegments(
    url.split('/').slice(5)
  );

  assert.equal(restored.settlement, original.settlement.toLowerCase());
  assert.equal(restored.region, original.region.toLowerCase());
});

//===================================================================

test('owner tabs and sales period paths keep the owner identity', () => {
  const base = `/admin/pharmacy-owners/${OWNER_ID}`;

  assert.equal(
    buildAdminPharmacyOwnerDetailUrl(OWNER_ID, { tab: 'products' }),
    `${base}/products`
  );

  assert.equal(
    buildAdminPharmacyOwnerDetailUrl(OWNER_ID, { tab: 'product-requests' }),
    `${base}/product-requests`
  );

  const period = parseSalesChartSegments(['year-2025', 'month-02']);

  assert.equal(buildSalesChartPath(base, period), `${base}/year-2025/month-02`);
  assert.equal(buildSalesChartPath(base, parseSalesChartSegments([])), base);
  assert.throws(() => parseSalesChartSegments(['month-13']));
  assert.throws(() => parseSalesChartSegments(['year-2025', 'year-2026']));
});

//===================================================================

test('scoped request filter URL excludes any separately supplied owner ID', () => {
  const segments = [
    'owner-id-507f1f77bcf86cd799439011',
    'request-id-507f1f77bcf86cd799439012',
    'category-medicine',
    'status-on-moderation',
    'date-from-2026-11-01',
    'date-to-2026-11-26',
    'page-2',
    'per-page-50',
  ];

  const filters = parseProductRequestsSegments({ filters: segments });

  const pagination = parseProductRequestsPaginationSegments({
    filters: segments,
  });

  const base = `/admin/pharmacy-owners/${OWNER_ID}/product-requests`;

  assert.equal(
    buildProductRequestsPath(filters, pagination, OWNER_ID),
    `${base}/${segments.slice(1).join('/')}`
  );

  assert.equal(
    buildProductRequestsPath(
      parseProductRequestsSegments(),
      undefined,
      OWNER_ID
    ),
    base
  );
});

//===================================================================

test('owner statistics supports owner-only pharmacy and date segments, without allowing a pharmacy filter in single-pharmacy charts', () => {
  const base = buildAdminPharmacyOwnerDetailUrl(OWNER_ID, {
    tab: 'statistics',
  });

  const segments = [`pharmacy-id-${OWNER_ID}`, 'year-2025', 'month-01'];
  const period = parseSalesChartSegments(segments, { allowPharmacy: true });

  assert.equal(period.pharmacyId, OWNER_ID);

  assert.equal(
    buildSalesChartPath(base, period, { allowPharmacy: true }),
    `${base}/${segments.join('/')}`
  );

  assert.equal(
    buildSalesChartPath(base, parseSalesChartSegments([]), {
      allowPharmacy: true,
    }),
    base
  );

  assert.throws(() => parseSalesChartSegments(segments));

  assert.throws(() =>
    parseSalesChartSegments([segments[0], segments[0]], { allowPharmacy: true })
  );

  assert.throws(() =>
    parseSalesChartSegments(['pharmacy-id-invalid'], { allowPharmacy: true })
  );
});
