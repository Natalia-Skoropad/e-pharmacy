import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('Stage 14.6: admin-only document routes are GET-only and require view permission', () => {
  const admin = read('src/routes/admin.routes.ts');
  const pharmacy = read('src/routes/pharmacy.routes.ts');
  const service = read('src/services/pharmacy-document.service.ts');

  assert.match(
    admin,
    /'\/pharmacies\/:pharmacyId\/documents'[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.view\)/
  );

  assert.match(
    admin,
    /'\/pharmacies\/:pharmacyId\/documents\/:documentId'[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.view\)/
  );

  assert.doesNotMatch(
    admin,
    /adminRoutes\.(?:post|put|patch|delete)\(\s*'\/pharmacies\/:pharmacyId\/documents/
  );

  assert.doesNotMatch(pharmacy, /PharmacyAdminComment/);
  assert.match(service, /getPharmacyDocumentReferences\(pharmacyId\)/);
  assert.match(service, /pharmacyId, \/\/ never trust documentId alone/);
  assert.match(service, /attachedAt:\s*\{\s*\$exists:\s*true\s*\}/);
  assert.match(service, /pendingModeration\?\.documents/);

  assert.doesNotMatch(
    service.slice(
      service.indexOf('export async function listAdminPharmacyDocumentsService')
    ),
    /PharmacyOwnerDocument/
  );
});

//===================================================================

test('Stage 14.6: comment APIs are scoped to admin role and permissions, never owner routes', () => {
  const admin = read('src/routes/admin.routes.ts');
  const owner = read('src/routes/pharmacy-owner.routes.ts');
  const pharmacy = read('src/routes/pharmacy.routes.ts');
  const notes = read('src/services/pharmacy-note.service.ts');

  assert.match(
    admin,
    /adminRoutes\.use\([\s\S]*?authorizeRoles\(USER_ROLES\.ADMIN\)/
  );

  assert.match(
    admin,
    /'\/pharmacies\/:pharmacyId\/comments'[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(
    admin,
    /adminRoutes\.post\(\s*'\/pharmacies\/:pharmacyId\/comments'[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.edit/
  );

  assert.match(
    admin,
    /adminRoutes\.delete\(\s*'\/pharmacies\/:pharmacyId\/comments\/:commentId'[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.edit/
  );

  assert.doesNotMatch(owner, /PharmacyAdminComment/);
  assert.doesNotMatch(pharmacy, /PharmacyAdminComment/);
  assert.doesNotMatch(notes, /PharmacyAdminComment/);
});

//===================================================================

test('Stage 14.6: independent comment collection uses unique idempotency and body-free pharmacy audit', () => {
  const model = read('src/models/pharmacyAdminComment.model.ts');
  const service = read('src/services/pharmacy-admin-comment.service.ts');
  const schema = read('src/schemas/pharmacy-admin-comment.schema.ts');

  assert.match(
    model,
    /model<PharmacyAdminCommentEntity>\('PharmacyAdminComment'/
  );

  assert.match(
    model,
    /createdByAdminUserId:\s*1,\s*clientRequestId:\s*1\s*\},\s*\{\s*unique:\s*true/
  );

  assert.match(schema, /clientRequestId: z\.string\(\)\.trim\(\)\.uuid\(\)/);
  assert.match(service, /assertReplayMatches\(existing, pharmacyId, text\)/);

  assert.match(
    service,
    /findOneAndDelete\(\s*\{ _id: commentId, pharmacyId \}/
  );

  assert.match(
    service,
    /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY/
  );

  const audit = service.slice(
    service.indexOf('function auditMetadata('),
    service.indexOf('const auditFields')
  );

  assert.doesNotMatch(audit, /text:\s*comment\.text/);

  assert.doesNotMatch(
    service,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );
});
