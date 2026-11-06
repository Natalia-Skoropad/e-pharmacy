import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ACTOR_TYPES,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_RETENTION_SECONDS,
  ADMIN_AUDIT_SECTIONS,
  CLIENT_COMMENT_AUDIT_EVENTS,
  isAdminAuditAction,
  isAdminAuditSection,
  isAdminAuditEntityType,
  getStoredAdminAuditActionValues,
  isAdminAuditActorType,
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

//===============================================================

test('Stage 13.4 reserves owner audit entities, actions, and actor types', () => {
  assert.equal(
    ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_DOCUMENT,
    'pharmacyOwnerDocument'
  );

  assert.equal(
    ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_COMMENT,
    'pharmacyOwnerComment'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
    'pharmacyOwner.account.created'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED,
    'pharmacy.registrationDocuments.attached'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_REGISTRATION_DOCUMENTS_ATTACHED,
    'pharmacyOwner.registrationDocuments.attached'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
    'pharmacyOwner.profile.updated'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED,
    'pharmacyOwner.photo.updated'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_DOCUMENT_UPLOADED,
    'pharmacyOwner.document.uploaded'
  );

  assert.equal(
    ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_COMMENT_CREATED,
    'pharmacyOwner.comment.created'
  );

  assert.equal(ADMIN_AUDIT_ACTOR_TYPES.EMPLOYEE, 'employee');
  assert.equal(ADMIN_AUDIT_ACTOR_TYPES.PHARMACY_OWNER, 'pharmacyOwner');
  assert.equal(ADMIN_AUDIT_ACTOR_TYPES.PHARMACY_EMPLOYEE, 'pharmacyEmployee');

  assert.equal(isAdminAuditActorType('employee'), true);
  assert.equal(isAdminAuditActorType('pharmacyOwner'), true);
  assert.equal(isAdminAuditActorType('pharmacyEmployee'), true);
  assert.equal(isAdminAuditActorType('pharmacyManager'), false);

  assert.equal(ADMIN_AUDIT_RETENTION_SECONDS, 94_608_000);
});

//===============================================================

test('S14.18.95 client comments have registered action/section/entity triples at runtime', () => {
  for (const event of [
    CLIENT_COMMENT_AUDIT_EVENTS.CREATED,
    CLIENT_COMMENT_AUDIT_EVENTS.DELETED,
  ]) {
    assert.equal(isAdminAuditAction(event.action), true);
    assert.equal(isAdminAuditSection(event.section), true);
    assert.equal(isAdminAuditEntityType(event.entityType), true);
    assert.equal(event.section, ADMIN_AUDIT_SECTIONS.CLIENTS);
    assert.equal(event.entityType, ADMIN_AUDIT_ENTITY_TYPES.CLIENT_COMMENT);
  }

  assert.equal(
    CLIENT_COMMENT_AUDIT_EVENTS.CREATED.action,
    'client.comment.created'
  );

  assert.equal(
    CLIENT_COMMENT_AUDIT_EVENTS.DELETED.action,
    'client.comment.deleted'
  );

  assert.equal(CLIENT_COMMENT_AUDIT_EVENTS.CREATED.section, 'clients');
  assert.equal(CLIENT_COMMENT_AUDIT_EVENTS.DELETED.section, 'clients');
  assert.equal(Object.isFrozen(CLIENT_COMMENT_AUDIT_EVENTS), true);
});
