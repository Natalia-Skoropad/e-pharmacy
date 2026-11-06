import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  parseClientsSegments,
  parseClientsPaginationSegments,
  resolveClientsRoute,
} from './client-paths';

//===================================================================

test('client route preserves selected IDs but never persists private text searches', () => {
  const path = buildClientsPath({
    ...DEFAULT_CLIENTS_FILTERS,

    name: 'Natalia Example',
    clientId: '507f1f77bcf86cd799439011',
    contact: 'user@example.com',
    status: 'blocked',
    successfulOrders: 'repeat',
  });

  assert.equal(
    path,
    '/pharmacy/clients/client-id-507f1f77bcf86cd799439011/status-blocked/successful-orders-repeat'
  );

  assert.doesNotMatch(path, /Natalia|example/);
});

//===================================================================

test('legacy PII-bearing client URL is discarded while an exact selected ID is restored', () => {
  const filters = parseClientsSegments({
    filters: [
      'search-name-natalia-example',
      'client-id-507f1f77bcf86cd799439011',
      'contact-user-example-com',
      'status-active',
    ],
  });

  assert.equal(filters.name, '');
  assert.equal(filters.clientId, '507f1f77bcf86cd799439011');
  assert.equal(filters.contact, '');
  assert.equal(filters.status, 'active');

  assert.equal(
    buildClientsPath(filters),
    '/pharmacy/clients/client-id-507f1f77bcf86cd799439011/status-active'
  );
});

//===================================================================

test('client routes distinguish canonical filters, entity IDs and malformed segments', () => {
  assert.deepEqual(resolveClientsRoute(undefined), {
    kind: 'filters',
    filters: [],
  });

  assert.deepEqual(
    resolveClientsRoute(['status-active', 'successful-orders-repeat']),
    {
      kind: 'filters',
      filters: ['status-active', 'successful-orders-repeat'],
    }
  );

  assert.deepEqual(resolveClientsRoute(['507f1f77bcf86cd799439011']), {
    kind: 'detail',
    clientId: '507f1f77bcf86cd799439011',
  });

  assert.deepEqual(resolveClientsRoute(['not-an-object-id']), {
    kind: 'invalid',
  });

  assert.deepEqual(resolveClientsRoute(['11']), {
    kind: 'invalid',
  });

  assert.deepEqual(resolveClientsRoute(['foo', 'bar']), { kind: 'invalid' });

  assert.deepEqual(
    resolveClientsRoute(['507f1f77bcf86cd799439011', 'status-active']),
    { kind: 'invalid' }
  );
});

//===================================================================

test('duplicate and invalid client filters canonicalize deterministically', () => {
  const duplicate = parseClientsSegments({
    filters: [
      'status-active',
      'status-blocked',
      'successful-orders-successful',
      'successful-orders-repeat',
    ],
  });

  assert.equal(duplicate.status, 'blocked');
  assert.equal(duplicate.successfulOrders, 'repeat');

  assert.equal(
    buildClientsPath(duplicate),
    '/pharmacy/clients/status-blocked/successful-orders-repeat'
  );

  const invalidKnownSegments = ['status-unknown', 'date-from-not-a-date'];

  assert.deepEqual(resolveClientsRoute(invalidKnownSegments), {
    kind: 'filters',
    filters: invalidKnownSegments,
  });

  const normalized = parseClientsSegments({ filters: invalidKnownSegments });

  assert.equal(buildClientsPath(normalized), '/pharmacy/clients');
});

//===================================================================

test('legacy pharmacy URL segment canonicalizes away in the owner-wide client registry', () => {
  const id = '507f1f77bcf86cd799439011';

  assert.equal(
    buildClientsPath({ ...DEFAULT_CLIENTS_FILTERS, pharmacyId: id }),
    '/pharmacy/clients'
  );

  assert.equal(
    buildClientsPath(parseClientsSegments({ filters: [`pharmacy-${id}`] })),
    '/pharmacy/clients'
  );
});

//===================================================================

test('embedded pharmacy Clients route preserves filters, pagination and leaves PII out of URL', () => {
  const base = '/pharmacy/pharmacies/507f1f77bcf86cd799439011/clients';

  const filters = {
    ...DEFAULT_CLIENTS_FILTERS,

    clientId: '507f1f77bcf86cd799439012',
    name: 'Sensitive Name',
    contact: 'secret@example.com',
    status: 'active' as const,
  };

  const url = buildClientsPath(filters, base, { page: 3, perPage: 50 });

  assert.equal(
    url,
    `${base}/client-id-507f1f77bcf86cd799439012/status-active/per-page-50/page-3`
  );

  assert.doesNotMatch(url, /Sensitive|example|secret/);

  const segments = url.slice(base.length + 1).split('/');
  const roundTrip = parseClientsSegments({ filters: segments });

  assert.equal(
    buildClientsPath(roundTrip, base, parseClientsPaginationSegments(segments)),
    url
  );

  assert.deepEqual(parseClientsPaginationSegments(['per-page-100', 'page-2']), {
    page: 2,
    perPage: 100,
  });

  assert.equal(
    buildClientsPath(DEFAULT_CLIENTS_FILTERS, base, { page: 1, perPage: 20 }),
    base
  );
});

//===================================================================

test('both client statuses combine with every successful orders option in the owner registry', () => {
  for (const status of ['active', 'blocked'] as const) {
    for (const successfulOrders of ['repeat', 'successful', 'other'] as const) {
      const segments = [
        `status-${status}`,
        `successful-orders-${successfulOrders}`,
      ];

      assert.deepEqual(resolveClientsRoute(segments), {
        kind: 'filters',
        filters: segments,
      });

      const filters = parseClientsSegments({ filters: segments });

      assert.equal(filters.status, status);
      assert.equal(filters.successfulOrders, successfulOrders);

      assert.equal(
        buildClientsPath(filters),
        `/pharmacy/clients/${segments.join('/')}`
      );
    }
  }
});
