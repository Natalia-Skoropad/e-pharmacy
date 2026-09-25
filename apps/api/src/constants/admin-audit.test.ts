import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getStoredAdminAuditActionValues,
  normalizeStoredAdminAuditAction,
} from './admin-audit';

//===============================================================

test('legacy Stage 10.6 document actions normalize to the canonical audit contract', () => {
  assert.equal(
    normalizeStoredAdminAuditAction('admin.employeeDocument.uploaded'),
    'adminEmployee.document.uploaded'
  );

  assert.equal(
    normalizeStoredAdminAuditAction('admin.employeeDocument.replaced'),
    'adminEmployee.document.replaced'
  );

  assert.equal(
    normalizeStoredAdminAuditAction('admin.employeeDocument.deleted'),
    'adminEmployee.document.deleted'
  );

  assert.equal(normalizeStoredAdminAuditAction('unknown.action'), null);

  assert.deepEqual(
    getStoredAdminAuditActionValues('adminEmployee.document.uploaded'),
    ['adminEmployee.document.uploaded', 'admin.employeeDocument.uploaded']
  );
});
