import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('Stage 13.12 connects documents comments and shared activity history to owner detail', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(detail, /<OwnerDocumentsTab/);
  assert.match(detail, /<OwnerCommentsTab/);
  assert.match(detail, /<OwnerActivityTab\s+ownerId=\{ownerId\}/);
  assert.match(detail, /initialState=\{initialActivityState\}/);
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

test('owner activity reuses global audit UI and fetches only the selected owner history', () => {
  const source = read('./PharmacyOwnerDetailsPageContent/OwnerActivityTab.tsx');
  const history = read('../activity/ActivityHistory.tsx');

  // A single presentation owns the columns, filters, links, and Details modal.
  assert.match(source, /<ProfileSectionHeader/);

  assert.match(
    source,
    /<ActivityHistory scopeOwnerId=\{ownerId\} initialState=\{initialState\} \/>/
  );

  assert.doesNotMatch(
    source,
    /<DataTable|<AuditDetailsModal|<ActivityFiltersDrawer/
  );

  // The same API query is scoped to the owner *entity*, not merely to its actor.
  assert.match(history, /getAdminAuditLogs\(/);
  assert.match(history, /scopeEntityType:\s*'pharmacyOwner'/);

  assert.match(
    history,
    /scopeEntityId:\s*scopeOwnerId \|\| filters\.ownerUserId/
  );

  assert.match(history, /<ActivityFiltersDrawer/);
  assert.match(history, /<AuditDetailsModal/);
  assert.match(history, /<ActivityActorIdentity/);
  assert.match(history, /<ActivitySectionLink item=\{item\} \/>/);
  assert.match(history, /key: 'entity'/);
  assert.match(history, /key: 'fields'/);
  assert.match(history, /key: 'details'/);
  assert.match(history, /key: 'location'/);
});
