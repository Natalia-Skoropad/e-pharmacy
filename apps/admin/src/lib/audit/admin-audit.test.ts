import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminAuditActorsResponse,
  parseAdminAuditDetailsResponse,
  parseAdminAuditListResponse,
} from './admin-audit';

import {
  getAdminAuditActionLabel,
  getAdminAuditChangeTone,
  getAdminAuditStatusTransitionLabel,
} from './admin-audit-presentation';

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

test('audit list parser keeps status transition metadata and reason text', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        statusBefore: 'active',
        statusAfter: 'blocked',
        reason: 'Verification documents expired.',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.items[0]?.statusBefore, 'active');
  assert.equal(parsed.items[0]?.statusAfter, 'blocked');
  assert.equal(parsed.items[0]?.reason, 'Verification documents expired.');
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

test('audit parser accepts pharmacy owner lifecycle events', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'pharmacyOwner.status.changed',
        section: 'pharmacyOwners',
        entityType: 'pharmacyOwner',
        entityId: '507f1f77bcf86cd799439088',
        entityLabelSnapshot: 'Owner Example',
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: '507f1f77bcf86cd799439088',
        statusBefore: 'new',
        statusAfter: 'active',
        changedFields: ['status'],
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.items[0]?.action, 'pharmacyOwner.status.changed');
  assert.equal(parsed.items[0]?.section, 'pharmacyOwners');
  assert.equal(parsed.items[0]?.entityType, 'pharmacyOwner');
  assert.equal(parsed.items[0]?.scopeEntityType, 'pharmacyOwner');
  assert.equal(parsed.items[0]?.scopeEntityId, '507f1f77bcf86cd799439088');

  assert.equal(
    getAdminAuditActionLabel(parsed.items[0]!.action),
    'Pharmacy owner status changed'
  );
});

//===================================================================

test('audit parser accepts owner account creation and registration document events', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'pharmacyOwner.account.created',
        section: 'pharmacyOwners',
        entityType: 'pharmacyOwner',
        entityId: '507f1f77bcf86cd799439088',
        entityLabelSnapshot: 'Owner Example',
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: '507f1f77bcf86cd799439088',
        statusAfter: 'new',
        changedFields: ['email', 'name', 'phone', 'status'],
      },
      {
        ...item,
        id: '507f1f77bcf86cd799439089',
        action: 'pharmacy.registrationDocuments.attached',
        section: 'pharmacies',
        entityType: 'pharmacy',
        entityId: '507f1f77bcf86cd799439090',
        entityLabelSnapshot: 'owner@example.com',
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: '507f1f77bcf86cd799439088',
        changedFields: ['documentCount', 'registrationDocuments'],
      },
    ],
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.items[0]?.action, 'pharmacyOwner.account.created');

  assert.equal(
    getAdminAuditActionLabel(parsed.items[0]!.action),
    'Pharmacy owner account created'
  );

  assert.equal(
    parsed.items[1]?.action,
    'pharmacy.registrationDocuments.attached'
  );

  assert.equal(
    getAdminAuditActionLabel(parsed.items[1]!.action),
    'Registration documents attached'
  );
});

//===================================================================

test('audit parser accepts reserved owner document and comment actions', () => {
  const parsed = parseAdminAuditListResponse({
    items: [
      {
        ...item,
        action: 'pharmacyOwner.document.uploaded',
        section: 'pharmacyOwners',
        entityType: 'pharmacyOwnerDocument',
        entityId: '507f1f77bcf86cd799439081',
        entityLabelSnapshot: 'License.pdf',
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: '507f1f77bcf86cd799439088',
        changedFields: ['name', 'size', 'type'],
      },
      {
        ...item,
        id: '507f1f77bcf86cd799439082',
        action: 'pharmacyOwner.comment.created',
        section: 'pharmacyOwners',
        entityType: 'pharmacyOwnerComment',
        entityId: '507f1f77bcf86cd799439083',
        entityLabelSnapshot: 'Admin comment',
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: '507f1f77bcf86cd799439088',
        changedFields: ['text'],
      },
    ],
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    earliestCreatedAt: '2026-09-24',
  });

  assert.equal(parsed.items[0]?.entityType, 'pharmacyOwnerDocument');
  assert.equal(parsed.items[1]?.entityType, 'pharmacyOwnerComment');
});

//===================================================================

test('audit parser rejects a partial owner scope', () => {
  assert.throws(
    () =>
      parseAdminAuditListResponse({
        items: [
          {
            ...item,
            scopeEntityType: 'pharmacyOwner',
          },
        ],
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
        earliestCreatedAt: '2026-09-24',
      }),
    /invalid audit item/i
  );
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

test('audit actor parser accepts admin, pharmacy-owner, and pharmacy-employee actors without private address data', () => {
  const parsed = parseAdminAuditActorsResponse({
    items: [
      {
        id: '507f1f77bcf86cd799439012',
        name: 'Natalia',
        email: 'natalia@example.com',
        phone: '+380501112233',
        pictureUrl: 'https://example.com/photo.jpg',
        role: 'admin',
        actorType: 'employee',
        status: 'active',
      },
      {
        id: '507f1f77bcf86cd799439088',
        name: 'Owner Example',
        email: 'owner@example.com',
        phone: '+380501112244',
        role: 'pharmacy',
        actorType: 'pharmacyOwner',
        status: 'new',
      },
      {
        id: '507f1f77bcf86cd799439089',
        name: 'Pharmacy Employee',
        email: 'pharmacy.employee@example.com',
        phone: '+380501112255',
        role: 'pharmacy',
        actorType: 'pharmacyEmployee',
        status: 'active',
      },
    ],
  });

  assert.equal(parsed.items[0]?.name, 'Natalia');
  assert.equal(parsed.items[0]?.status, 'active');
  assert.equal(parsed.items[0]?.actorType, 'employee');
  assert.equal(parsed.items[1]?.actorType, 'pharmacyOwner');
  assert.equal(parsed.items[1]?.status, 'new');
  assert.equal(parsed.items[2]?.actorType, 'pharmacyEmployee');
  assert.equal(parsed.items[2]?.status, 'active');

  assert.throws(
    () =>
      parseAdminAuditActorsResponse({
        items: [
          {
            id: '507f1f77bcf86cd799439012',
            name: 'Natalia',
            email: 'natalia@example.com',
            phone: '+380501112233',
            address: 'Private address',
            role: 'admin',
            actorType: 'employee',
            status: 'active',
          },
        ],
      }),
    /invalid audit actor/i
  );

  assert.throws(
    () =>
      parseAdminAuditActorsResponse({
        items: [
          {
            id: '507f1f77bcf86cd799439012',
            name: 'Natalia',
            email: 'natalia@example.com',
            phone: '+380501112233',
            role: 'admin',
            actorType: 'employee',
            status: 'deleted',
          },
        ],
      }),
    /invalid audit actor/i
  );

  assert.throws(
    () =>
      parseAdminAuditActorsResponse({
        items: [
          {
            id: '507f1f77bcf86cd799439012',
            name: 'Natalia',
            email: 'natalia@example.com',
            phone: '+380501112233',
            role: 'admin',
            actorType: 'pharmacyOwner',
            status: 'active',
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

//===================================================================

test('audit change presentation uses CRUD colors and target status colors', () => {
  assert.equal(
    getAdminAuditChangeTone({ action: 'position.created' }),
    'success'
  );

  assert.equal(
    getAdminAuditChangeTone({ action: 'position.updated' }),
    'pending'
  );

  assert.equal(
    getAdminAuditChangeTone({ action: 'position.deleted' }),
    'danger'
  );

  assert.equal(
    getAdminAuditChangeTone({
      action: 'pharmacy.status.changed',
      statusAfter: 'blocked',
    }),
    'danger'
  );

  assert.equal(
    getAdminAuditChangeTone({
      action: 'pharmacy.status.changed',
      statusAfter: 'active',
    }),
    'success'
  );

  assert.equal(
    getAdminAuditStatusTransitionLabel({
      statusBefore: 'active',
      statusAfter: 'blocked',
    }),
    'Active → Blocked'
  );
});
