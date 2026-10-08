import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('Stage 13.11 connects documents comments and activity tabs to owner detail', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(detail, /<OwnerDocumentsTab/);
  assert.match(detail, /<OwnerCommentsTab/);
  assert.match(detail, /<OwnerActivityTab ownerId=\{ownerId\}/);
  assert.match(detail, /onCountChange=\{updateDocumentsCount\}/);
  assert.match(detail, /onCountChange=\{updateCommentsCount\}/);
  assert.match(detail, /canManage=\{canEditOwner\}/);
  assert.doesNotMatch(detail, /reserved in the owner detail layout/);
});

//===================================================================

test('owner documents are read-only in Admin and support download', () => {
  const source = read(
    './PharmacyOwnerDetailsPageContent/OwnerDocumentsTab.tsx'
  );

  assert.match(source, /getAdminPharmacyOwnerDocuments/);
  assert.match(source, /downloadAdminPharmacyOwnerDocument/);
  assert.match(source, /editable=\{false\}/);
  assert.match(source, /readOnlyUploadView=\{effectiveStatus === 'success'\}/);
  assert.match(source, /onDownloadFile=\{handleDownload\}/);
  assert.doesNotMatch(source, /onUploadFiles|onDeleteFile|canUpload|canDelete/);
});

//===================================================================

test('owner admin comments show author data and update tab count after create and delete', () => {
  const source = read('./PharmacyOwnerDetailsPageContent/OwnerCommentsTab.tsx');

  assert.match(source, /getAdminPharmacyOwnerComments/);
  assert.match(source, /createAdminPharmacyOwnerComment/);
  assert.match(source, /deleteAdminPharmacyOwnerComment/);
  assert.match(source, /onCountChange\?\.\(nextComments\.length\)/);
  assert.match(source, /<CommentsList/);
  assert.match(source, /items=\{comments\}/);

  assert.match(
    source,
    /onDelete=\{canManage \? setCommentToDelete : undefined\}/
  );

  assert.match(source, /The owner cannot see these notes/);
  assert.match(source, /confirmIconLeft=\{<Trash2/);
  assert.match(source, /cancelIconLeft=\{<X/);
});

//===================================================================

test('owner activity uses the scoped owner endpoint and mirrors global audit presentation without Section page column', () => {
  const source = read('./PharmacyOwnerDetailsPageContent/OwnerActivityTab.tsx');

  assert.match(source, /getAdminPharmacyOwnerActivity/);
  assert.match(source, /getAdminAuditChangeTone/);
  assert.match(source, /getAdminAuditStatusTransitionLabel/);
  assert.match(source, /<ActivityActorIdentity/);
  assert.match(source, /<AuditDetailsModal/);
  assert.match(source, /<ProfileSectionHeader/);
  assert.match(source, /<SearchableSelect/);
  assert.match(source, /<ActivityFiltersDrawer/);
  assert.match(source, /label="Search by employee"/);
  assert.match(source, /label="Search by pharmacy owner"/);
  assert.match(source, /fullWidthOnMobile/);
  assert.match(source, /key: 'entity'/);
  assert.match(source, /key: 'fields'/);
  assert.match(source, /key: 'details'/);
  assert.doesNotMatch(source, /key: 'location'/);
  assert.doesNotMatch(source, /Section \/ page/);
});
