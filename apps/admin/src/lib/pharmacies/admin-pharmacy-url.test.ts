import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_PHARMACIES_LIST_URL_DEFAULTS,
  buildAdminPharmaciesListApiParams,
  buildAdminPharmaciesListUrl,
  buildAdminPharmacyDetailUrl,
  parseAdminPharmaciesListSearchParams,
  parseAdminPharmaciesListSegments,
  resolveAdminPharmaciesRoute,
} from './admin-pharmacy-url';

//===================================================================

const PHARMACY_ID = '64b64b64b64b64b64b64b64b';
const OWNER_ID = '64a64a64a64a64a64a64a64a';
const ROOT = '/admin/pharmacies';

//===================================================================

function parseUrl(url: string) {
  assert.ok(url.startsWith(ROOT));

  const segments = url.slice(ROOT.length).split('/').filter(Boolean);
  const route = resolveAdminPharmaciesRoute(segments);

  if (route.kind !== 'list') throw new TypeError('Expected a registry route.');

  return parseAdminPharmaciesListSegments(route.filters);
}

//===================================================================

test('canonical URL round trip preserves combined pharmacy registry filters', () => {
  const selected = {
    pharmacyId: PHARMACY_ID,
    ownerId: OWNER_ID,
    settlement: '',
    region: '',
    status: 'on_verification' as const,
    createdFrom: '2026-09-01',
    createdTo: '2026-10-12',
    rating: '4-5' as const,
    sort: 'created_asc' as const,
    page: 3,
    perPage: 100 as const,
  };

  const url = buildAdminPharmaciesListUrl(selected);

  assert.equal(
    url,
    `${ROOT}/pharmacy-id-${PHARMACY_ID}/owner-id-${OWNER_ID}/status-on-verification/created-from-2026-09-01/created-to-2026-10-12/rating-4-5/sort-created-asc/page-3/per-page-100`
  );

  assert.deepEqual(parseUrl(url), selected);
  assert.equal(buildAdminPharmaciesListUrl(parseUrl(url)), url);

  assert.deepEqual(buildAdminPharmaciesListApiParams(parseUrl(url)), {
    pharmacyId: PHARMACY_ID,
    ownerId: OWNER_ID,
    status: 'on_verification',
    createdFrom: '2026-09-01',
    createdTo: '2026-10-12',
    rating: '4-5',
    sort: 'created_asc',
    page: 3,
    perPage: 100,
  });
});

//===================================================================

test('default and alias states always resolve to the canonical URL', () => {
  assert.deepEqual(parseUrl(ROOT), ADMIN_PHARMACIES_LIST_URL_DEFAULTS);

  assert.equal(
    buildAdminPharmaciesListUrl(ADMIN_PHARMACIES_LIST_URL_DEFAULTS),
    ROOT
  );

  assert.deepEqual(parseAdminPharmaciesListSegments(['status-on_moderation']), {
    ...ADMIN_PHARMACIES_LIST_URL_DEFAULTS,
    status: 'on_moderation',
  });

  assert.equal(
    buildAdminPharmaciesListUrl(parseUrl(`${ROOT}/status-on-moderation`)),
    `${ROOT}/status-on-moderation`
  );

  assert.deepEqual(
    parseAdminPharmaciesListSearchParams({
      status: 'on-verification',
      page: '0',
      perPage: '77',
      createdFrom: '2026-10-12',
      createdTo: '2026-10-01',
      pharmacyId: 'not-an-id',
      ownerId: ['duplicated', 'owner'],
    }),
    { ...ADMIN_PHARMACIES_LIST_URL_DEFAULTS, status: 'on_verification' }
  );
});

//===================================================================

test('detail tabs do not conflict with list filters or collection options', () => {
  assert.deepEqual(resolveAdminPharmaciesRoute([PHARMACY_ID]), {
    kind: 'detail',
    pharmacyId: PHARMACY_ID,
    tab: 'information',
  });

  assert.deepEqual(resolveAdminPharmaciesRoute([PHARMACY_ID, 'activity']), {
    kind: 'detail',
    pharmacyId: PHARMACY_ID,
    tab: 'activity',
  });

  assert.equal(
    buildAdminPharmacyDetailUrl(PHARMACY_ID, 'activity'),
    `${ROOT}/${PHARMACY_ID}/activity`
  );

  assert.equal(
    buildAdminPharmacyDetailUrl(PHARMACY_ID),
    `${ROOT}/${PHARMACY_ID}`
  );

  // Since Stage 14.16, Activity deliberately supports nested URL filters.
  assert.deepEqual(
    resolveAdminPharmaciesRoute([PHARMACY_ID, 'activity', 'page-2']),
    {
      kind: 'detail',
      pharmacyId: PHARMACY_ID,
      tab: 'activity',
      activitySegments: ['page-2'],
    }
  );

  for (const bad of [
    [PHARMACY_ID, 'status-active'],
    [PHARMACY_ID, 'documents', 'page-2'],
    ['unrecognized-filter'],
    ['status-active', 'status-blocked'],
    ['options'],
    ['summary'],
  ]) {
    assert.deepEqual(resolveAdminPharmaciesRoute(bad), { kind: 'invalid' });
  }

  assert.throws(() => buildAdminPharmacyDetailUrl('bad-id'));

  assert.throws(() =>
    buildAdminPharmacyDetailUrl(PHARMACY_ID, 'oops' as 'activity')
  );
});

//===================================================================

test('reload and back/forward reproduce the URL state without mutable shared state', () => {
  const history = [
    ROOT,
    `${ROOT}/status-active`,
    `${ROOT}/status-active/rating-4-5/page-2`,
    `${ROOT}/status-blocked/per-page-50`,
  ];

  const snapshots = history.map(parseUrl);
  const back = [3, 2, 1, 0].map((index) => parseUrl(history[index]));
  const forward = history.map(parseUrl);

  assert.deepEqual(back, [...snapshots].reverse());
  assert.deepEqual(forward, snapshots);
  assert.equal(snapshots[0].status, 'all');
  assert.equal(snapshots[3].status, 'blocked');
});

//===================================================================

test('no free-text search or private owner data gets serialized in list URL', () => {
  const fromSearch = parseAdminPharmaciesListSearchParams({
    pharmacySearch: 'private@example.com',
    ownerSearch: '+380500000000',
    ownerId: OWNER_ID,
  });

  const url = buildAdminPharmaciesListUrl(fromSearch);

  assert.equal(url, `${ROOT}/owner-id-${OWNER_ID}`);
  assert.ok(!url.includes('example.com'));
});

//===================================================================

test('settlement and region survive canonical URL and server query round trips', () => {
  const url = buildAdminPharmaciesListUrl({
    ...ADMIN_PHARMACIES_LIST_URL_DEFAULTS,
    settlement: 'Dnipro',
    region: 'Dnipropetrovsk Oblast',
  });

  const parsed = parseUrl(url);

  assert.equal(parsed.settlement, 'Dnipro');
  assert.equal(parsed.region, 'Dnipropetrovsk Oblast');
  assert.equal(buildAdminPharmaciesListUrl(parsed), url);
  assert.equal(buildAdminPharmaciesListApiParams(parsed).settlement, 'Dnipro');

  assert.equal(
    buildAdminPharmaciesListApiParams(parsed).region,
    'Dnipropetrovsk Oblast'
  );
});
