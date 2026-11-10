import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('14.18.24: Admin pharmacy data has the owner data blocks and read-only controls', () => {
  const admin = read('./PharmacyDetailsPageContent/PharmacyDataTab.tsx');

  const owner = read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditorTabContent.tsx'
  );

  const detail = read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const styles = read(
    './PharmacyDetailsPageContent/PharmacyDataTab.module.css'
  );

  for (const section of [
    'Pharmacy photo',
    'Pharmacy information',
    'Working hours',
  ]) {
    assert.match(admin, new RegExp(`aria-label="${section}"`));
    assert.match(owner, new RegExp(`aria-label="${section}"`));
  }

  for (const control of [
    'PictureCard',
    'CommentInput',
    'WorkingHoursInput',
    'PhoneInput',
    'EmailInput',
    'NameInput',
  ]) {
    assert.match(admin, new RegExp(`<${control}\\b`));
  }

  assert.match(
    admin,
    /<PharmacyReviewSummary detail=\{detail\} section="data"/
  );

  assert.match(admin, /maxLength=\{PHARMACY_NAME_MAX_LENGTH\}/);
  assert.match(admin, /maxLength=\{PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH\}/);
  assert.match(admin, /disabled/);

  assert.doesNotMatch(
    admin,
    /uploadOwnedPharmacy|updateOwnedPharmacy|onSubmit=/
  );

  assert.match(detail, /activeTab !== 'data' \|\| isLoading/);
  assert.match(styles, /\.profileBlock \+ \.profileBlock/);
});

//===================================================================

test('14.18.24: Admin data breadcrumbs use the same detail/subtab hierarchy', () => {
  const crumbs = read('../../lib/layout/breadcrumbs.ts');

  assert.match(crumbs, /data: 'Pharmacy data'/);
  assert.match(crumbs, /subTabLabel \? \[\{ label: subTabLabel \}\]/);
});

//===================================================================

test('14.18.24: delete audit presentation changes only the deleted pharmacy record row', () => {
  const modal = read('../activity/AuditDetailsModal.tsx');

  assert.match(
    modal,
    /details\.action === 'pharmacy\.deleted' && field === 'exists'/
  );

  assert.match(
    modal,
    /StatusBadge \{\.\.\.getAdminAuditStatusPresentation\('new'\)!\}/
  );

  assert.match(modal, />Pharmacy delete<\/span>/);
  assert.match(modal, /value=\{item.before\}/);
  assert.match(modal, /value=\{item.after\}/);
});

//===================================================================

test('14.18.24: documents are a distinct, typed section in the moderation summary', () => {
  const review = read('./PharmacyDetailsPageContent/PharmacyReviewSummary.tsx');

  assert.match(review, /id: Section \| 'documents';/);
  assert.match(review, /title: string;/);

  assert.match(
    review,
    /changes\.push\(\{\s*id: 'documents',\s*title: 'Documents'/
  );

  assert.doesNotMatch(
    review,
    /changes\.push\(\{ id: 'data', title: 'Documents'/
  );
});
