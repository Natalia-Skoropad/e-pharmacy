import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminPharmacyOwnerDetailUrl,
  buildAdminPharmacyOwnerPharmaciesUrl,
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

  assert.equal(
    buildAdminPharmacyOwnerPharmaciesUrl(OWNER_ID, state),
    `/admin/pharmacy-owners/${OWNER_ID}/pharmacies?pharmacySearch=Bolhrad+Medical+Lane&pharmacyStatus=active&pharmacyCreatedFrom=2026-09-01&pharmacyCreatedTo=2026-10-02&pharmacyRating=4-5&pharmacyPage=2&pharmacyPerPage=100`
  );
});
