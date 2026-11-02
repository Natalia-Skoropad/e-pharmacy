import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('the Admin activity table and scoped pharmacy activity are one component', () => {
  const history = source('./ActivityHistory.tsx');

  assert.match(
    history,
    /scopePharmacyId\s*\?\s*getAdminPharmacyActivityActors/
  );

  assert.match(history, /getAdminPharmacyActivity\(scopePharmacyId/);
  assert.match(history, /getAdminPharmacyActivityDetail\(scopePharmacyId/);
  assert.match(history, /getAdminAuditLogs\(listParams/);
  assert.match(history, /<AuditDetailsModal/);
});

//===================================================================

test('audit details render rich text, working hours and comment text', () => {
  const details = source('./AuditDetailsModal.tsx');

  const comments = source(
    '../../../../api/src/services/admin/pharmacies/pharmacy-admin-comment.service.ts'
  );

  assert.match(details, /<WorkingHours value=\{value\}/);
  assert.match(details, /<MarkdownContent value=\{value\}/);
  assert.match(details, /Show more/);
  assert.match(details, /Show less/);
  assert.match(details, /getAdminPharmacyComments\(pharmacyId/);
  assert.match(comments, /text: comment\.text/);
});

//===================================================================

test('activity identity does not fabricate Historical account status', () => {
  const identity = source('./ActivityActorIdentity.tsx');

  assert.doesNotMatch(identity, />Historical account</);
  assert.match(identity, /showStatus && actor/);
});

//===================================================================

test('owner pharmacy detail keeps one persistent heading and separate loader', () => {
  const detail = source(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  const editor = source(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
  );

  assert.match(detail, /result\?\.tab === activeTab/);
  assert.match(detail, /visibleTab === activeTab/);
  assert.match(detail, /<ProfileSectionHeader/);
  assert.match(detail, /<ProfileResourceState/);

  // The header stays mounted while only the statistics content can skeletonize.
  assert.match(
    detail,
    /<StatsLoadingSkeleton[\s\S]*?label="Loading pharmacy performance summary"/
  );

  assert.match(detail, /headerActionTarget=\{headerActionTarget\}/);
  assert.match(editor, /createPortal\(headerAction, headerActionTarget\)/);
  assert.match(editor, /suppressSectionHeading/);
});

//===================================================================

test('admin pharmacy documents match the common read-only documents panel', () => {
  const docs = source(
    '../pharmacies/PharmacyDetailsPageContent/PharmacyDocumentsTab.tsx'
  );

  assert.match(docs, /<DocumentsPanel/);
  assert.match(docs, /editable=\{false\}/);
  assert.match(docs, /required/);
  assert.doesNotMatch(docs, /onPreviewFile|PREVIEW_TYPES/);
});

//===================================================================

test('verification transition is beside modal heading, with Needs changes badge', () => {
  const actions = source(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  const reason = source(
    '../../../../../packages/ui/src/overlays/ReasonModal/ReasonModal.tsx'
  );

  assert.match(actions, /headerDetails=/);
  assert.match(actions, /label="Needs changes"/);
  assert.doesNotMatch(actions, /Possible decisions:/);

  assert.match(
    reason,
    /headerDetails \? \(\s*<div className=\{css\.headerDetails\}>/
  );
});
