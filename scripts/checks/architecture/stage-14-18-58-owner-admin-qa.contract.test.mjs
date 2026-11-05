import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const source = (name) => readFileSync(path.join(root, name), 'utf8');

//===================================================================

test('Shared identifier confirmation scrolls matched pharmacies per field, not the field list', () => {
  const css = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/DuplicateIdentifierSaveModal.module.css'
  );

  const fieldList = css.split('.list {')[1]?.split('}')[0] ?? '';
  const matches = css.split('.matchesList {')[1]?.split('}')[0] ?? '';
  const outer = css.split('.scrollableDialog {')[1]?.split('}')[0] ?? '';

  assert.doesNotMatch(fieldList, /overflow-y:\s*auto/);
  assert.match(matches, /overflow-y:\s*auto/);
  assert.match(matches, /max-height:/);
  assert.doesNotMatch(outer, /overflow-y:\s*auto/);
});

//===================================================================

test('Saved owner identifiers show persistent warnings without blocking an unchanged save', () => {
  const sourceCode = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
  );

  const checks = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/usePaymentAvailability.ts'
  );

  assert.match(sourceCode, /tab === 'data' \|\| tab === 'payment'/);
  assert.match(checks, /checkedFields\.length > 0/);
  assert.match(checks, /matches\[field\]\?\.length/);
});

//===================================================================

test('Read-only Admin shared details include typed and parsed matches', () => {
  assert.match(
    source('packages/types/src/admin/pharmacy-detail.ts'),
    /sharedIdentifiers/
  );

  assert.match(
    source('packages/api-client/src/response/admin-pharmacy-detail-parsers.ts'),
    /sharedIdentifiers/
  );

  const api = source(
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
  );

  assert.match(api, /ownerId: pharmacy\.ownerId/);
  assert.match(api, /\.select\('_id name phone email bankDetails/);

  const component = source(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/SharedPharmacyIdentifiersNotice.tsx'
  );

  assert.match(component, /The owner uses these published values/);
});

//===================================================================

test('Unsaved changes dialog intercepts both anchor navigation and button tabs', () => {
  const hook = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/useUnsavedPharmacyNavigation.ts'
  );

  const owner = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  const tab = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
  );

  assert.match(hook, /onBeforeUnload/);
  assert.match(hook, /e-pharmacy:owned-pharmacy-tab-navigation/);
  assert.match(owner, /cancelable:\s*true/);
  assert.match(tab, /Leave pharmacy editor\?/);
});

//===================================================================

test('Admin search APIs and UI use page-based lazy loading', () => {
  for (const file of [
    'apps/admin/src/components/pharmacies/PharmacySearch/PharmacySearch.tsx',
    'apps/admin/src/components/pharmacy-owners/PharmacyOwnerSearch/PharmacyOwnerSearch.tsx',
  ]) {
    const code = source(file);
    assert.match(code, /hasMoreOptions=/);
    assert.match(code, /onLoadMore=/);
    assert.match(code, /isLoadingMore=/);
    assert.match(code, /setPage\(\(current\) => current \+ 1\)/);
  }

  for (const file of [
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-registry-read.service.ts',
    'apps/api/src/services/admin/owners/admin-pharmacy-owner-registry.service.ts',
  ])
    assert.match(source(file), /\$skip: \(query\.page - 1\) \* query\.limit/);
});

//===================================================================

test('Audit timeline labels creation as status, hides technical exists and uses matching change-type icons', () => {
  const drawer = source(
    'apps/admin/src/components/activity/ActivityFiltersDrawer.tsx'
  );

  assert.match(drawer, /withIcon\('pharmacies', 'Pharmacy status changed'\)/);
  assert.match(drawer, /withIcon\('pharmacies', 'Pharmacy data changed'\)/);

  const details = source(
    'apps/admin/src/components/activity/AuditDetailsModal.tsx'
  );

  assert.match(details, /field === 'exists'/);
  assert.match(details, /after: 'new'/);

  assert.match(
    source('apps/api/src/services/admin/audit/admin-audit-read.service.ts'),
    /action === 'pharmacy.created'/
  );
});
