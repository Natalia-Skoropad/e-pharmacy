import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminAuditDetailsResponse,
  parseAdminAuditListResponse,
} from './admin-audit';

//===================================================================

const item = {
  id: '507f1f77bcf86cd799439011',
  actorUserId: '507f1f77bcf86cd799439012',
  actorNameSnapshot: 'Natalia',
  action: 'pharmacy.status.changed',
  entityType: 'pharmacy',
  entityId: '507f1f77bcf86cd799439013',
  entityLabelSnapshot: 'Pharmacy ABC',
  changedFields: ['status'],
  requestId: 'req-1',
  createdAt: '2026-09-24T10:00:00.000Z',
};

//===================================================================

test('audit list parser accepts the canonical paginated contract', () => {
  assert.equal(
    parseAdminAuditListResponse({
      items: [item],
      page: 1,
      perPage: 20,
      total: 1,
      totalPages: 1,
    }).items[0]?.action,
    'pharmacy.status.changed'
  );
});

//===================================================================

test('audit list parser accepts canonical Stage 10 profile and document actions', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'adminEmployee.profile.updated',
        entityType: 'adminEmployee',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
  });

  assert.equal(parsed.items[0]?.action, 'adminEmployee.profile.updated');
  assert.equal(parsed.items[0]?.entityType, 'adminEmployee');

  const documentParsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'adminEmployee.document.uploaded',
        entityType: 'adminEmployeeDocument',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
  });

  assert.equal(
    documentParsed.items[0]?.action,
    'adminEmployee.document.uploaded'
  );

  assert.equal(documentParsed.items[0]?.entityType, 'adminEmployeeDocument');
});

//===================================================================

test('audit parsers fail closed for unknown actions and unsafe snapshot values', () => {
  assert.throws(
    () =>
      parseAdminAuditListResponse({
        items: [{ ...item, action: 'everything.destroyed' }],
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      }),
    /invalid audit item/i
  );

  assert.throws(
    () =>
      parseAdminAuditDetailsResponse({
        auditLog: {
          ...item,
          before: { status: { nested: true } },
          after: { status: 'active' },
        },
      }),
    /invalid audit snapshot value/i
  );
});
