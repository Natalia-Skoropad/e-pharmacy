import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminPharmacyOwnerDetailUrl,
  buildAdminPharmacyOwnerPharmaciesUrl,
  buildAdminPharmacyOwnersListUrl,
  parseAdminPharmacyOwnerDetailSearchParams,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
  parseAdminPharmacyOwnersListSearchParams,
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

test('builds canonical owner list URLs without default noise', () => {
  assert.equal(
    buildAdminPharmacyOwnersListUrl({
      search: 'nata@example.com',
      status: 'new',
      registeredFrom: '2026-09-01',
      registeredTo: '2026-10-02',
      page: 2,
      perPage: 50,
    }),
    '/admin/pharmacy-owners?search=nata%40example.com&status=new&registeredFrom=2026-09-01&registeredTo=2026-10-02&page=2&perPage=50'
  );
});

//===================================================================

test('normalizes detail tabs and validates owner ids in builders', () => {
  assert.deepEqual(parseAdminPharmacyOwnerDetailSearchParams({ tab: 'wat' }), {
    tab: 'personal',
  });

  assert.equal(
    buildAdminPharmacyOwnerDetailUrl(OWNER_ID, { tab: 'comments' }),
    `/admin/pharmacy-owners/${OWNER_ID}?tab=comments`
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
    `/admin/pharmacy-owners/${OWNER_ID}?tab=pharmacies&pharmacySearch=Bolhrad+Medical+Lane&pharmacyStatus=active&pharmacyCreatedFrom=2026-09-01&pharmacyCreatedTo=2026-10-02&pharmacyRating=4-5&pharmacyPage=2&pharmacyPerPage=100`
  );
});
