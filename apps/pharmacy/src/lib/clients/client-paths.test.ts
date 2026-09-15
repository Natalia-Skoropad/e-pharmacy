import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  parseClientsSegments,
  resolveClientsRoute,
} from './client-paths';

//===================================================================

test('client route keeps non-PII filters but never persists private search values', () => {
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
    '/pharmacy/clients/status-blocked/successful-orders-repeat'
  );

  assert.doesNotMatch(path, /Natalia|507f1f77bcf86cd799439011|example/);
});

//===================================================================

test('legacy PII-bearing client URL is recognized but its values are not restored', () => {
  const filters = parseClientsSegments({
    filters: [
      'search-name-natalia-example',
      'client-id-507f1f77bcf86cd799439011',
      'contact-user-example-com',
      'status-active',
    ],
  });

  assert.equal(filters.name, '');
  assert.equal(filters.clientId, '');
  assert.equal(filters.contact, '');
  assert.equal(filters.status, 'active');
  assert.equal(buildClientsPath(filters), '/pharmacy/clients/status-active');
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
