import assert from 'node:assert/strict';
import test from 'node:test';

import { adminAuditListQuerySchema } from './admin-audit.schema';

//===============================================================

test('admin audit list query accepts owner actor and owner scope filters', () => {
  const parsed = adminAuditListQuerySchema.parse({
    actorType: 'pharmacyOwner',
    scopeEntityType: 'pharmacyOwner',
    scopeEntityId: '507f1f77bcf86cd799439011',
  });

  assert.equal(parsed.page, 1);
  assert.equal(parsed.perPage, 20);
  assert.equal(parsed.actorType, 'pharmacyOwner');
  assert.equal(parsed.scopeEntityType, 'pharmacyOwner');
  assert.equal(parsed.scopeEntityId, '507f1f77bcf86cd799439011');
});

//===============================================================

test('admin audit list query rejects partial owner scope filters', () => {
  assert.equal(
    adminAuditListQuerySchema.safeParse({
      scopeEntityType: 'pharmacyOwner',
    }).success,
    false
  );

  assert.equal(
    adminAuditListQuerySchema.safeParse({
      scopeEntityId: '507f1f77bcf86cd799439011',
    }).success,
    false
  );
});

//===============================================================

test('admin audit list query rejects unknown actor types', () => {
  assert.equal(
    adminAuditListQuerySchema.safeParse({ actorType: 'pharmacyManager' })
      .success,
    false
  );
});
