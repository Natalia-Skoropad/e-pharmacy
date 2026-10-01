import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminAuditActorsResponse,
  parseAdminAuditDetailsResponse,
  parseAdminAuditListResponse,
} from './admin-audit';

//===================================================================

const item = {
  id: '507f1f77bcf86cd799439011',
  actorUserId: '507f1f77bcf86cd799439012',
  actorNameSnapshot: 'Natalia',
  action: 'pharmacy.status.changed',
  section: 'pharmacies',
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
      earliestCreatedAt: '2026-09-24',
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
        section: 'profile',
        entityType: 'adminEmployee',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.earliestCreatedAt, '2026-09-24');
  assert.equal(parsed.items[0]?.action, 'adminEmployee.profile.updated');
  assert.equal(parsed.items[0]?.section, 'profile');
  assert.equal(parsed.items[0]?.entityType, 'adminEmployee');

  const documentParsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'adminEmployee.document.uploaded',
        section: 'profile',
        entityType: 'adminEmployeeDocument',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
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
        earliestCreatedAt: '2026-09-24',
      }),
    /invalid audit item/i
  );

  assert.throws(
    () =>
      parseAdminAuditListResponse({
        items: [{ ...item, section: 'somewhere' }],
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
        earliestCreatedAt: '2026-09-24',
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

//===================================================================

test('audit list parser validates earliest audit date metadata', () => {
  assert.throws(
    () =>
      parseAdminAuditListResponse({
        items: [item],
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
        earliestCreatedAt: '2026-99-99',
      }),
    /invalid audit pagination response/i
  );

  assert.equal(
    parseAdminAuditListResponse({
      items: [],
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }).earliestCreatedAt,
    null
  );
});

//===================================================================

test('audit actor parser keeps only current employee presentation fields', () => {
  const parsed = parseAdminAuditActorsResponse({
    items: [
      {
        id: '507f1f77bcf86cd799439012',
        name: 'Natalia',
        email: 'natalia@example.com',
        phone: '+380501112233',
        address: 'Kyiv',
        pictureUrl: 'https://example.com/photo.jpg',
        status: 'active',
      },
    ],
  });

  assert.equal(parsed.items[0]?.name, 'Natalia');
  assert.equal(parsed.items[0]?.status, 'active');

  assert.throws(
    () =>
      parseAdminAuditActorsResponse({
        items: [
          {
            id: '507f1f77bcf86cd799439012',
            name: 'Natalia',
            email: 'natalia@example.com',
            phone: '+380501112233',
            status: 'deleted',
          },
        ],
      }),
    /invalid audit actor/i
  );
});

//===================================================================

test('audit list parser renders product-category and position dictionary events', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'productCategory.updated',
        section: 'categories',
        entityType: 'productCategory',
        entityLabelSnapshot: 'Baby care',
        changedFields: ['name', 'slug', 'color'],
      },
      {
        ...item,
        id: '507f1f77bcf86cd799439099',
        action: 'position.deleted',
        section: 'positions',
        entityType: 'position',
        entityLabelSnapshot: 'Manager',
        changedFields: ['exists', 'name'],
      },
    ],
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.items[0]?.action, 'productCategory.updated');
  assert.equal(parsed.items[0]?.section, 'categories');
  assert.equal(parsed.items[0]?.entityType, 'productCategory');
  assert.equal(parsed.items[1]?.action, 'position.deleted');
  assert.equal(parsed.items[1]?.section, 'positions');
  assert.equal(parsed.items[1]?.entityType, 'position');
});
