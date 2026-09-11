import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  parseClientsSegments,
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
