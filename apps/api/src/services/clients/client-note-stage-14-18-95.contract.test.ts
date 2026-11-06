import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  CLIENT_COMMENT_AUDIT_EVENTS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  isAdminAuditAction,
  isAdminAuditSection,
  isAdminAuditEntityType,
} from '../../constants/admin/audit/admin-audit';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('S14.18.95 real runtime validators recognize both owner-scoped client comment events', () => {
  for (const event of Object.values(CLIENT_COMMENT_AUDIT_EVENTS)) {
    assert.equal(isAdminAuditAction(event.action), true);
    assert.equal(isAdminAuditSection(event.section), true);
    assert.equal(isAdminAuditEntityType(event.entityType), true);
    assert.equal(event.section, ADMIN_AUDIT_SECTIONS.CLIENTS);
    assert.equal(event.entityType, ADMIN_AUDIT_ENTITY_TYPES.CLIENT_COMMENT);
  }
});

//===============================================================

test('S14.18.95 append uses canonical audit event and owner scope without client text or pharmacy ID', () => {
  const service = read('services/clients/client-note.service.ts');

  const activity = service.slice(
    service.indexOf('async function appendClientCommentActivity'),
    service.indexOf('async function supportsClientNoteTransactions')
  );

  assert.match(activity, /CLIENT_COMMENT_AUDIT_EVENTS\.CREATED/);
  assert.match(activity, /CLIENT_COMMENT_AUDIT_EVENTS\.DELETED/);
  assert.match(activity, /\.\.\.auditEvent/);

  assert.match(
    activity,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(activity, /scopeEntityId: input\.ownerId/);
  assert.doesNotMatch(activity, /input\.text|note\.text|^\s*pharmacyId\s*:/m);
});

//===============================================================

test('S14.18.95 writer retains strict validation with specific, private-data-safe errors', () => {
  const writer = read('services/admin/audit/admin-audit-write.service.ts');
  const auditModel = read('models/audit/adminAuditLog.model.ts');

  assert.match(writer, /!isAdminAuditAction\(action\)/);
  assert.match(writer, /!isAdminAuditSection\(section\)/);
  assert.match(writer, /!isAdminAuditEntityType\(entityType\)/);
  assert.match(writer, /Audit action is invalid/);
  assert.match(writer, /Audit section is invalid/);
  assert.match(writer, /Audit entity type is invalid/);
  assert.match(auditModel, /enum: ADMIN_AUDIT_ACTION_VALUES/);
  assert.match(auditModel, /enum: ADMIN_AUDIT_SECTION_VALUES/);
  assert.match(auditModel, /enum: ADMIN_AUDIT_ENTITY_TYPE_VALUES/);
});
