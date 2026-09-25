import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAdminAuditSnapshot } from './admin-audit.service';

//===============================================================

test('admin audit snapshots accept only small explicit scalar values', () => {
  assert.deepEqual(
    normalizeAdminAuditSnapshot(
      {
        status: 'active',
        isPlatformOwner: true,
        productId: null,
        permissions: ['products.view', 'orders.view'],
      },
      'Snapshot'
    ),
    {
      status: 'active',
      isPlatformOwner: true,
      productId: null,
      permissions: ['products.view', 'orders.view'],
    }
  );
});

//===============================================================

test('admin audit snapshots fail closed for secrets and sensitive business data', () => {
  for (const key of [
    'password',
    'passwordHash',
    'accessToken',
    'refreshToken',
    'cookie',
    'authorization',
    'bankDetails',
    'iban',
    'taxId',
    'picture',
    'pictureUrl',
    'binary',
    'buffer',
  ]) {
    assert.throws(
      () => normalizeAdminAuditSnapshot({ [key]: 'secret' }, 'Snapshot'),
      /forbidden audit field/i,
      key
    );
  }
});

//===============================================================

test('admin audit snapshots reject object and binary-shaped values at runtime', () => {
  assert.throws(
    () =>
      normalizeAdminAuditSnapshot(
        { payload: { nested: true } } as never,
        'Snapshot'
      ),
    /unsafe value/i
  );

  assert.throws(
    () =>
      normalizeAdminAuditSnapshot(
        { payload: Buffer.from('secret') } as never,
        'Snapshot'
      ),
    /unsafe array value|unsafe value/i
  );
});
