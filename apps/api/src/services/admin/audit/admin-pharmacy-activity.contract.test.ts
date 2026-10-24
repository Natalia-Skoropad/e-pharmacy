import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFile(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('Stage 14.7 dedicated pharmacy activity uses permission, params and shared Audit, not browser filtering', async () => {
  const [routes, controller, service] = await Promise.all([
    read('routes/admin/admin.routes.ts'),
    read('controllers/admin/admin.controller.ts'),
    read('services/admin/audit/admin-pharmacy-activity.service.ts'),
  ]);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/activity',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view[\s\S]*?adminAuditListQuerySchema[\s\S]*?listPharmacyActivityByAdmin/
  );

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/activity\/:auditLogId',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view[\s\S]*?adminPharmacyAuditLogParamsSchema/
  );

  assert.match(controller, /listAdminPharmacyActivityService\(/);
  assert.match(service, /Pharmacy\.exists/);
  assert.match(service, /listAdminAuditLogsService\(query, \{ pharmacyId \}\)/);
  assert.match(service, /listAdminAuditActorsService\(\{ pharmacyId \}\)/);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/activity\/actors',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(
    service,
    /getAdminAuditLogService\(auditLogId, \{ pharmacyId \}\)/
  );
});

//===============================================================

test('Stage 14.7 exact scope covers legacy owner-scoped moderation and pharmacy-scoped comments without weakening Owner Activity', async () => {
  const [auditScope, auditRead, model, owner] = await Promise.all([
    read('services/admin/audit/admin-audit-filters.ts'),
    read('services/admin/audit/admin-audit-read.service.ts'),
    read('models/audit/adminAuditLog.model.ts'),
    read('services/admin/owners/admin-pharmacy-owner-activity.service.ts'),
  ]);

  assert.match(auditScope, /function buildPharmacyAuditScopeFilter/);
  assert.match(auditScope, /\{ pharmacyId: id \}/);

  assert.match(
    auditScope,
    /entityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY, entityId: id/
  );

  assert.match(
    auditScope,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY,[\s\S]*?scopeEntityId: id/
  );

  assert.match(auditRead, /filter\.\$and = \[exactPharmacyFilter\]/);

  assert.match(
    auditRead,
    /scopeFilter: Record<string, unknown> = exactPharmacyFilter/
  );

  assert.match(auditRead, /findOne\(\{[\s\S]*?buildPharmacyAuditScopeFilter/);
  assert.match(model, /pharmacyId:[\s\S]*?type: String/);
  assert.match(model, /index\(\s*\{ pharmacyId: 1, createdAt: -1/);

  assert.match(
    owner,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER,[\s\S]*?scopeEntityId: ownerId/
  );
});
