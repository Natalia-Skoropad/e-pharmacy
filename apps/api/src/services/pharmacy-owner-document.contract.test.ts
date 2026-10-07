import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const serviceSource = read('src/services/pharmacy-owner-document.service.ts');
const modelSource = read('src/models/pharmacyOwnerDocument.model.ts');
const ownerRouteSource = read('src/routes/pharmacy-owner.routes.ts');
const adminRouteSource = read('src/routes/admin.routes.ts');

const controllerSource = read(
  'src/controllers/pharmacy-owner-document.controller.ts'
);

//===============================================================

test('owner documents are a separate owner-level private persistence domain', () => {
  assert.match(modelSource, /ownerUserId:[\s\S]*immutable:\s*true/);
  assert.match(modelSource, /content:[\s\S]*select:\s*false/);
  assert.match(modelSource, /model<PharmacyOwnerDocumentEntity>/);
  assert.doesNotMatch(modelSource, /PharmacyDocumentFile/);

  assert.match(
    serviceSource,
    /PharmacyOwnerDocument\.find\(\{ ownerUserId \}\)/
  );

  assert.match(
    serviceSource,
    /PharmacyOwnerDocument\.findOne\(\{[\s\S]*_id: documentId,[\s\S]*ownerUserId,[\s\S]*\}\)\.select\('\+content'\)/
  );

  assert.doesNotMatch(serviceSource, /findById\(documentId\)/);
});

//===============================================================

test('owner API mutates only the authenticated owner document collection', () => {
  assert.match(
    ownerRouteSource,
    /pharmacyOwnerRoutes\.use\(authenticate, authorizeRoles\(USER_ROLES\.PHARMACY\)\)/
  );

  assert.match(ownerRouteSource, /'\/me\/documents'/);
  assert.match(ownerRouteSource, /'\/me\/documents\/:documentId'/);
  assert.doesNotMatch(ownerRouteSource, /:ownerId/);

  assert.match(
    serviceSource,
    /findOneAndDelete\([\s\S]*_id: documentId,[\s\S]*ownerUserId,[\s\S]*\{ session \}/
  );

  assert.match(serviceSource, /Pharmacy\.exists\(\{ ownerId: ownerUserId \}\)/);
});

//===============================================================

test('admin owner document API is read/download only and permission guarded', () => {
  assert.match(
    adminRouteSource,
    /adminRoutes\.get\(\s*'\/pharmacy-owners\/:ownerId\/documents'[\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.view/
  );

  assert.match(
    adminRouteSource,
    /adminRoutes\.get\(\s*'\/pharmacy-owners\/:ownerId\/documents\/:documentId'[\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.view/
  );

  assert.doesNotMatch(
    adminRouteSource,
    /adminRoutes\.(?:post|put|patch|delete)\(\s*'\/pharmacy-owners\/:ownerId\/documents/
  );
});

//===============================================================

test('owner document quota and MIME validation happen before persistence', () => {
  assert.match(serviceSource, /decodeAndVerifyDocumentUpload\(/);
  assert.match(serviceSource, /PHARMACY_OWNER_DOCUMENT_RULES/);
  assert.match(serviceSource, /maxFiles/);
  assert.match(serviceSource, /maxTotalSizeBytes/);

  assert.match(
    serviceSource,
    /assertUploadQuota\(existingDocuments, verified\.size\)/
  );
});

//===============================================================

test('owner document upload/delete and audit commit atomically without file secrets', () => {
  assert.equal(
    (serviceSource.match(/session\.withTransaction/g) ?? []).length,
    2
  );

  assert.equal((serviceSource.match(/appendAdminAuditLog\(/g) ?? []).length, 2);
  assert.match(serviceSource, /PHARMACY_OWNER_DOCUMENT_UPLOADED/);
  assert.match(serviceSource, /PHARMACY_OWNER_DOCUMENT_DELETED/);

  assert.match(
    serviceSource,
    /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(serviceSource, /scopeEntityId:\s*ownerUserId/);

  const start = serviceSource.indexOf('function auditSnapshot');

  const end = serviceSource.indexOf(
    '//===============================================================',
    start + 1
  );

  const auditSnapshotSource = serviceSource.slice(start, end);

  assert.match(auditSnapshotSource, /name:/);
  assert.match(auditSnapshotSource, /size:/);
  assert.match(auditSnapshotSource, /type:/);

  assert.doesNotMatch(
    auditSnapshotSource,
    /content|dataUrl|base64|sha256|binary/i
  );
});

//===============================================================

test('document content responses remain private and are streamed only through protected routes', () => {
  assert.match(controllerSource, /Cache-Control', 'private, no-store'/);
  assert.match(controllerSource, /Content-Disposition/);

  assert.match(
    controllerSource,
    /res\.status\(HTTP_STATUS\.OK\)\.send\(content\)/
  );
});
