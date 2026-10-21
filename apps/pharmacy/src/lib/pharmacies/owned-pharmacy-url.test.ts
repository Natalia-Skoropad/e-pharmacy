import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OWNED_PHARMACIES_LIST_URL_DEFAULTS,
  buildOwnedPharmaciesListApiParams,
  buildOwnedPharmaciesListUrl,
  buildOwnedPharmacyDetailUrl,
  parseOwnedPharmaciesListSegments,
  resolveOwnedPharmaciesRoute,
} from './owned-pharmacy-url';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

//===================================================================

test('Pharmacy registry URL round trips filters and excludes owner selectors', () => {
  const state = {
    ...OWNED_PHARMACIES_LIST_URL_DEFAULTS,

    pharmacyId: ID,
    status: 'on_verification' as const,
    region: 'Odesa Oblast',
    settlement: 'Odesa',
    rating: '4-5' as const,
    createdFrom: '2026-10-01',
    createdTo: '2026-10-21',
    sort: 'created_asc' as const,
    perPage: 50 as const,
    page: 2,
  };

  const url = buildOwnedPharmaciesListUrl(state);

  assert.equal(url.includes('owner-id-'), false);
  assert.equal(url.includes('/status-on-verification'), true);

  const segments = url.replace('/pharmacy/pharmacies/', '').split('/');

  assert.equal(
    buildOwnedPharmaciesListUrl(parseOwnedPharmaciesListSegments(segments)),
    url
  );

  const params = buildOwnedPharmaciesListApiParams(state);

  assert.equal('ownerId' in params, false);
  assert.equal(params.pharmacyId, ID);
});

//===================================================================

test('Pharmacy registry disambiguates ObjectId detail routes from filters', () => {
  assert.equal(buildOwnedPharmacyDetailUrl(ID), `/pharmacy/pharmacies/${ID}`);

  assert.deepEqual(resolveOwnedPharmaciesRoute([ID]), {
    kind: 'detail',
    pharmacyId: ID,
    tab: 'information',
  });

  assert.deepEqual(resolveOwnedPharmaciesRoute([ID, 'orders']), {
    kind: 'detail',
    pharmacyId: ID,
    tab: 'orders',
  });

  assert.equal(
    buildOwnedPharmacyDetailUrl(ID, 'payment'),
    `/pharmacy/pharmacies/${ID}/payment`
  );

  assert.deepEqual(resolveOwnedPharmaciesRoute([ID, 'unsupported-tab']), {
    kind: 'invalid',
  });

  assert.deepEqual(resolveOwnedPharmaciesRoute(['owner-id-' + ID]), {
    kind: 'invalid',
  });

  assert.deepEqual(resolveOwnedPharmaciesRoute(['status-active']), {
    kind: 'list',
    filters: ['status-active'],
  });

  assert.throws(() => buildOwnedPharmacyDetailUrl('bad-id'), TypeError);
});
