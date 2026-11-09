import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPharmacyIdFromDetailPath,
  isLegacyOperationalPharmacyPath,
  isOwnerClientsListPath,
  isOwnerClientDetailPath,
  isOwnerProductDetailPath,
  isOperationalPharmacyPath,
  readExplicitPharmacySelection,
  setAuthorizedPharmacySelection,
  getAuthorizedPharmacySelection,
  withSelectedPharmacyQuery,
  resolveSelectedPharmacyId,
} from './selected-pharmacy-scope';

//===================================================================

const A = '507f1f77bcf86cd799439011';
const B = '507f191e810c19729de860ea';

//===================================================================

// An exact pharmacy ID in the detail URL is authoritative even when another
// pharmacy is selected in a stale legacy query string.
test('detail tabs use the exact pharmacy from their canonical URL', () => {
  const pathname = `/pharmacy/pharmacies/${B}/orders`;

  assert.equal(getPharmacyIdFromDetailPath(pathname), B);

  assert.deepEqual(readExplicitPharmacySelection(pathname, `pharmacyId=${A}`), {
    id: B,
    invalid: false,
  });

  for (const tab of ['orders', 'clients', 'products']) {
    assert.equal(
      isOperationalPharmacyPath(`/pharmacy/pharmacies/${B}/${tab}`),
      true
    );
  }

  assert.equal(
    isOperationalPharmacyPath(`/pharmacy/pharmacies/${B}/payment`),
    false
  );

  assert.equal(
    isOperationalPharmacyPath(`/pharmacy/pharmacies/${B}/product-requests`),
    false
  );
});

//===================================================================

test('legacy operational routes retain explicit pharmacy selection in the query', () => {
  for (const page of [
    'dashboard',
    'orders',
    'all-products',
    'product-requests',
  ]) {
    assert.equal(isLegacyOperationalPharmacyPath(`/pharmacy/${page}`), true);
  }

  assert.equal(isLegacyOperationalPharmacyPath('/pharmacy/products'), false);

  assert.equal(
    isLegacyOperationalPharmacyPath('/pharmacy/products/per-page-50'),
    false
  );

  assert.equal(
    isLegacyOperationalPharmacyPath('/pharmacy/products/page-2'),
    false
  );

  assert.equal(isLegacyOperationalPharmacyPath('/pharmacy/profile'), false);
  assert.equal(isLegacyOperationalPharmacyPath('/pharmacy/pharmacies'), false);

  assert.equal(
    withSelectedPharmacyQuery('/pharmacy/orders', 'page=2&status=new', B),
    `/pharmacy/orders?page=2&status=new&pharmacyId=${B}`
  );
});

//===================================================================

test('invalid, duplicate and missing URL selections are distinct', () => {
  assert.deepEqual(readExplicitPharmacySelection('/pharmacy/orders', ''), {
    id: null,
    invalid: false,
  });

  assert.deepEqual(
    readExplicitPharmacySelection('/pharmacy/orders', `pharmacyId=${A}`),
    {
      id: A,
      invalid: false,
    }
  );

  assert.deepEqual(
    readExplicitPharmacySelection('/pharmacy/orders', 'pharmacyId=bad'),
    {
      id: null,
      invalid: true,
    }
  );

  assert.deepEqual(
    readExplicitPharmacySelection(
      '/pharmacy/orders',
      `pharmacyId=${A}&pharmacyId=${B}`
    ),
    {
      id: null,
      invalid: true,
    }
  );

  assert.throws(() => withSelectedPharmacyQuery('/pharmacy/orders', '', 'bad'));
});

//===================================================================

test('operational header selection is normalized and cannot retain an invalid ID', () => {
  setAuthorizedPharmacySelection(A.toUpperCase());
  assert.equal(getAuthorizedPharmacySelection(), A);
  setAuthorizedPharmacySelection('not-an-object-id');
  assert.equal(getAuthorizedPharmacySelection(), null);
  setAuthorizedPharmacySelection(B);
  assert.equal(getAuthorizedPharmacySelection(), B);
  setAuthorizedPharmacySelection(null);
  assert.equal(getAuthorizedPharmacySelection(), null);
});

//===================================================================

test('one membership defaults safely, two require a choice, and an explicit denial cannot fall back', () => {
  const members = [{ id: A }, { id: B }];
  const absent = { id: null, invalid: false };

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: absent,
      preferredId: null,
      memberships: [members[0]!],
    }),
    A
  );

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: absent,
      preferredId: null,
      memberships: members,
    }),
    null
  );

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: absent,
      preferredId: B,
      memberships: members,
    }),
    B
  );

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: { id: A, invalid: false },
      preferredId: B,
      memberships: members,
    }),
    A
  );

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', invalid: false },
      preferredId: B,
      memberships: members,
    }),
    null
  );

  assert.equal(
    resolveSelectedPharmacyId({
      explicit: { id: null, invalid: true },
      preferredId: B,
      memberships: members,
    }),
    null
  );
});

//===================================================================

// Owner registry URLs do not carry the selected pharmacy; detail URLs do.
test('owner Clients list is not a selected-pharmacy operational route', () => {
  assert.equal(isOwnerClientsListPath('/pharmacy/clients'), true);
  assert.equal(isOwnerClientsListPath(`/pharmacy/clients/pharmacy-${A}`), true);
  assert.equal(isLegacyOperationalPharmacyPath('/pharmacy/clients'), false);

  assert.equal(
    isOperationalPharmacyPath(`/pharmacy/clients/pharmacy-${A}`),
    false
  );

  assert.equal(isOwnerClientsListPath(`/pharmacy/clients/${A}`), false);
  assert.equal(isLegacyOperationalPharmacyPath(`/pharmacy/clients/${A}`), true);
});

//===================================================================

test('client pharmacy path filters remain account-wide and do not trigger pharmacy selection', () => {
  const base = `/pharmacy/clients/${A}/pharmacies`;

  for (const path of [
    base,
    `${base}/pharmacy-id-${B}`,
    `${base}/status-new`,
    `${base}/per-page-50`,
    `${base}/page-2`,
    `${base}/date-from-2026-11-03/date-to-2026-11-06`,
    `${base}/region-odesa/status-active/per-page-50`,
  ]) {
    assert.equal(isOwnerClientDetailPath(path), true, path);
    assert.equal(isLegacyOperationalPharmacyPath(path), false, path);
    assert.equal(isOperationalPharmacyPath(path), false, path);
  }

  for (const path of [
    `${base}/unknown-path`,
    `${base}/status-new/status-active`,
    `${base}/pharmacy-id-not-an-id`,
    `/pharmacy/clients/not-a-client/pharmacies/status-new`,
  ]) {
    assert.equal(isOwnerClientDetailPath(path), false, path);
    assert.equal(isLegacyOperationalPharmacyPath(path), true, path);
  }
});

//===================================================================

test('sales chart filters remain owner-scoped without selected pharmacy', () => {
  const client =
    '/pharmacy/clients/6a311d5386d9f5e0be7d19ba/details/year-2026/month-06';

  const product =
    '/pharmacy/products/6ac75e1417684f6f914a4d59/statistics/pharmacy-id-6ac75e170642845c5d27fd6c/year-2026/month-06';

  assert.equal(isOwnerClientDetailPath(client), true);
  assert.equal(isLegacyOperationalPharmacyPath(client), false);
  assert.equal(isOwnerProductDetailPath(product), true);
  assert.equal(isLegacyOperationalPharmacyPath(product), false);

  assert.equal(
    isOwnerClientDetailPath(client.replace('month-06', 'month-99')),
    false
  );

  assert.equal(isOwnerProductDetailPath(`${product}/unknown-filter`), false);
});

//===================================================================

test('canonical stock-movement URL filters remain owner-scoped without global pharmacy selection', () => {
  const product = '6ac75e1417684f6f914a4d59';
  const pharmacy = '6ac75e170642845c5d27fd6c';
  const base = `/pharmacy/products/${product}/stock-movement`;

  for (const path of [
    base,
    `${base}/pharmacy-id-${pharmacy}`,
    `${base}/pharmacy-id-${pharmacy}/order-id-${A}`,
    `${base}/pharmacy-id-${pharmacy}/event-reserve/status-successful/per-page-50/page-2`,
    `${base}/pharmacy-id-${pharmacy}/date-from-2026-11-01/date-to-2026-11-09`,
  ]) {
    assert.equal(isOwnerProductDetailPath(path), true, path);
    assert.equal(isLegacyOperationalPharmacyPath(path), false, path);
    assert.equal(isOperationalPharmacyPath(path), false, path);
  }

  for (const path of [
    `${base}/event-reserve`, // Filters require the pharmacy segment.
    `${base}/pharmacy-id-${pharmacy}/event-invalid`,
    `${base}/pharmacy-id-${pharmacy}/event-reserve/event-release`,
    `${base}/pharmacy-id-${pharmacy}/page-0`,
    `${base}/pharmacy-id-${pharmacy}/unknown-filter`,
    `${base}/per-page-50/pharmacy-id-${pharmacy}`, // Wrong canonical order.
  ]) {
    assert.equal(isOwnerProductDetailPath(path), false, path);
    assert.equal(isLegacyOperationalPharmacyPath(path), true, path);
  }
});
