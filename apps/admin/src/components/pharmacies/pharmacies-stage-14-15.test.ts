import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('14.15: only the selected tab mounts its own lazy private resource', async () => {
  const page = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const docs = await read(
    './PharmacyDetailsPageContent/PharmacyDocumentsTab.tsx'
  );

  const notes = await read(
    './PharmacyDetailsPageContent/PharmacyCommentsTab.tsx'
  );

  assert.match(page, /activeTab === 'documents' \?/);

  assert.match(
    page,
    /<PharmacyDocumentsTab key=\{pharmacyId\} pharmacyId=\{pharmacyId\}/
  );

  assert.match(page, /activeTab === 'comments' \?/);

  assert.match(
    page,
    /<PharmacyCommentsTab[\s\S]*?canManage=\{canEditPharmacy\}/
  );

  assert.match(page, /canAdmin\(access, ADMIN_PERMISSIONS\.pharmacies\.edit\)/);

  assert.doesNotMatch(
    page,
    /getAdminPharmacyDocuments\(|getAdminPharmacyComments\(/
  );

  assert.match(
    docs,
    /getAdminPharmacyDocuments\(pharmacyId, \{ signal: controller\.signal \}\)/
  );

  assert.match(notes, /getAdminPharmacyComments\(pharmacyId, \{ signal \}\)/);
  assert.match(docs, /controller\.abort\(\)/);
  assert.match(notes, /controller\.abort\(\)/);
});

//===================================================================

test('14.15: admin documents are read-only; preview is MIME-restricted and private', async () => {
  const docs = await read(
    './PharmacyDetailsPageContent/PharmacyDocumentsTab.tsx'
  );

  const browser = await read(
    '../../lib/api/browser/admin-pharmacy-detail.api.ts'
  );

  const backend = await read(
    '../../../../api/src/services/pharmacies/pharmacy-document.service.ts'
  );

  assert.match(docs, /<DocumentsPanel/);
  assert.match(docs, /editable=\{false\}/);
  assert.match(docs, /readOnlyUploadView=/);

  assert.doesNotMatch(
    docs,
    /onUploadFiles=|onReplaceFile=|onDeleteFile=|onChange=/
  );

  assert.match(docs, /downloadAdminPharmacyDocument\(pharmacyId, documentId/);
  assert.match(docs, /PREVIEW_TYPES/);
  assert.doesNotMatch(docs, /'image\/svg\+xml'|'text\/html'/);
  assert.match(docs, /sandbox="allow-scripts"/);
  assert.match(docs, /URL\.revokeObjectURL/);
  assert.match(browser, /responseType: 'blob'/);
  assert.match(backend, /pharmacyId, \/\/ never trust documentId alone/);
  assert.match(backend, /attachedAt: \{ \$exists: true \}/);
  assert.match(backend, /pendingModeration\?\.documents/);
});

//===================================================================

test('14.15: pharmacy comments reuse shared UI and are scoped, audited, idempotent', async () => {
  const notes = await read(
    './PharmacyDetailsPageContent/PharmacyCommentsTab.tsx'
  );

  const service = await read(
    '../../../../api/src/services/pharmacy-admin-comment.service.ts'
  );

  const routes = await read('../../../../api/src/routes/admin.routes.ts');

  const schema = await read(
    '../../../../api/src/schemas/pharmacy-admin-comment.schema.ts'
  );

  const owner = await read(
    '../../../../api/src/routes/pharmacy-owner.routes.ts'
  );

  for (const component of [
    'CommentComposer',
    'CommentsList',
    'ConfirmationModal',
    'ProfileResourceState',
  ]) {
    assert.match(notes, new RegExp(`<${component}\\b`));
  }

  assert.match(notes, /COMMENT_MAX_LENGTH = 1000/);
  assert.match(notes, /existing\?\.text === text/);
  assert.match(notes, /clientRequestId: createRequestId\(\)/);
  assert.match(notes, /deleteAdminPharmacyComment\(pharmacyId, comment\.id/);
  assert.match(notes, /await reloadComments\(controller\.signal\)/);
  assert.match(schema, /max\(PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH\)/);

  const limit = await read(
    '../../../../api/src/constants/pharmacy-owner-admin-comment.ts'
  );

  assert.match(limit, /= 1000/);
  assert.match(service, /authorNameSnapshot: author\.name/);
  assert.match(service, /Unique idempotency index must exist/);
  assert.match(service, /ADMIN_AUDIT_ACTIONS\.PHARMACY_COMMENT_CREATED/);
  assert.match(service, /ADMIN_AUDIT_ACTIONS\.PHARMACY_COMMENT_DELETED/);
  assert.match(service, /scopeEntityId: pharmacyId/);
  assert.match(service, /Audit deliberately excludes the private body/);
  assert.doesNotMatch(owner, /\/pharmacies\/:pharmacyId\/comments/);
  assert.match(routes, /ADMIN_PERMISSIONS\.pharmacies\.view/);
  assert.match(routes, /ADMIN_PERMISSIONS\.pharmacies\.edit/);
});
