import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

const serviceSource = readSource('services/admin-employee-document.service.ts');
const modelSource = readSource('models/adminEmployeeDocument.model.ts');
const routeSource = readSource('routes/admin.routes.ts');
const controllerSource = readSource('controllers/admin-employee.controller.ts');

//===============================================================

test('admin employee documents are a separate self-owned persistence domain', () => {
  assert.match(modelSource, /ownerUserId:[\s\S]*immutable:\s*true/);
  assert.match(modelSource, /content:[\s\S]*select:\s*false/);
  assert.match(modelSource, /model<AdminEmployeeDocumentEntity>/);
  assert.doesNotMatch(modelSource, /PharmacyDocumentFile/);

  assert.match(
    serviceSource,
    /AdminEmployeeDocument\.find\(\{ ownerUserId: userId \}\)/
  );

  assert.match(
    serviceSource,
    /AdminEmployeeDocument\.findOne\(\{[\s\S]*_id: documentId,[\s\S]*ownerUserId: userId,[\s\S]*\}\)\.select\('\+content'\)/
  );

  assert.doesNotMatch(serviceSource, /findById\(documentId\)/);
});

//===============================================================

test('admin document mutations remain Platform Owner only on the backend', () => {
  assert.match(serviceSource, /authorization\.isPlatformOwner/);
  assert.match(
    serviceSource,
    /ADMIN_ACCESS_ERROR_CODES\.PLATFORM_OWNER_REQUIRED/
  );

  for (const mutation of [
    'createMyAdminEmployeeDocumentService',
    'replaceMyAdminEmployeeDocumentService',
    'deleteMyAdminEmployeeDocumentService',
  ]) {
    const start = serviceSource.indexOf(`export async function ${mutation}`);
    assert.notEqual(start, -1, `${mutation} must exist`);

    const nextExport = serviceSource.indexOf(
      'export async function ',
      start + `export async function ${mutation}`.length
    );

    const body = serviceSource.slice(
      start,
      nextExport === -1 ? serviceSource.length : nextExport
    );

    assert.match(
      body,
      /assertDocumentMutationAllowed\(userId, authorization\)/
    );
  }
});

//===============================================================

test('admin document mutations and audit records commit in the same transaction', () => {
  const transactionCount = (
    serviceSource.match(/session\.withTransaction/g) ?? []
  ).length;

  const auditCount = (serviceSource.match(/appendAdminAuditLog\(/g) ?? [])
    .length;

  assert.equal(transactionCount, 3);
  assert.equal(auditCount, 3);
  assert.match(serviceSource, /ADMIN_EMPLOYEE_DOCUMENT_UPLOADED/);
  assert.match(serviceSource, /ADMIN_EMPLOYEE_DOCUMENT_REPLACED/);
  assert.match(serviceSource, /ADMIN_EMPLOYEE_DOCUMENT_DELETED/);
  assert.match(serviceSource, /ADMIN_EMPLOYEE_DOCUMENT/);

  const auditSnapshotStart = serviceSource.indexOf('function auditSnapshot');

  const auditSnapshotEnd = serviceSource.indexOf(
    '//===============================================================',
    auditSnapshotStart + 1
  );

  const auditSnapshotSource = serviceSource.slice(
    auditSnapshotStart,
    auditSnapshotEnd
  );

  assert.match(auditSnapshotSource, /name:/);
  assert.match(auditSnapshotSource, /size:/);
  assert.match(auditSnapshotSource, /type:/);
  assert.doesNotMatch(auditSnapshotSource, /content|dataUrl|sha256/i);
});

//===============================================================

test('admin document self routes expose only the Stage 10.6 contract', () => {
  for (const method of ['get', 'post', 'put', 'delete']) {
    assert.match(routeSource, new RegExp(`adminRoutes\\.${method}\\(`));
  }

  assert.match(routeSource, /'\/employees\/me\/documents'/);
  assert.match(routeSource, /'\/employees\/me\/documents\/:documentId'/);
  assert.doesNotMatch(routeSource, /employees\/:employeeId\/documents/);

  assert.match(controllerSource, /Content-Disposition/);
  assert.match(controllerSource, /private, no-store/);
  assert.match(controllerSource, /res\.locals\.requestId/);
});
