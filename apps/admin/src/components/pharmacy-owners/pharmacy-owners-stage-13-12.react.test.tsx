import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const adminLayoutSource = read('../../app/admin/layout.tsx');

const listSource = read(
  './PharmacyOwnersPageContent/PharmacyOwnersPageContent.tsx'
);

const detailSource = read(
  './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
);

const linkedSource = read(
  './PharmacyOwnerDetailsPageContent/LinkedPharmaciesTab.tsx'
);

const documentsSource = read(
  './PharmacyOwnerDetailsPageContent/OwnerDocumentsTab.tsx'
);

const commentsSource = read(
  './PharmacyOwnerDetailsPageContent/OwnerCommentsTab.tsx'
);

const activitySource = read(
  './PharmacyOwnerDetailsPageContent/OwnerActivityTab.tsx'
);

const sharedActivitySource = read('../activity/ActivityHistory.tsx');

const providerSource = read(
  '../../providers/AdminPharmacyOwnerNavigationBadgeProvider/AdminPharmacyOwnerNavigationBadgeProvider.tsx'
);

const sidebarSource = read('../layout/AdminSidebar/AdminSidebar.tsx');
const mobileMenuSource = read('../layout/AdminMobileMenu/AdminMobileMenu.tsx');

//===================================================================

test('Stage 13.12 keeps Owners analytics, URL filters, search and pagination wired to canonical list state', () => {
  assert.match(listSource, /getAdminPharmacyOwnerSummary/);
  assert.match(listSource, /<StatsGrid/);
  assert.match(listSource, /<StatsCard/);
  assert.match(listSource, /<PharmacyOwnerSearch/);
  assert.match(listSource, /<PharmacyOwnersFiltersDrawer/);
  assert.match(listSource, /buildAdminPharmacyOwnersListUrl/);
  assert.match(listSource, /router\.replace/);
  assert.match(listSource, /<PaginationView/);
  assert.match(listSource, /page: 1/);

  assert.match(listSource, /const controller = new AbortController\(\)/);
  assert.match(listSource, /requestKey/);
  assert.match(listSource, /data: null/);
});

//===================================================================

test('Stage 13.12 keeps owner lifecycle modal, tab counters and resource tabs connected', () => {
  assert.match(detailSource, /<ReasonModal/);
  assert.match(detailSource, /updateAdminPharmacyOwnerStatus/);
  assert.match(detailSource, /Pharmacies \(\$\{tabCounts\.pharmacies\}\)/);
  assert.match(detailSource, /Documents \(\$\{tabCounts\.documents\}\)/);
  assert.match(detailSource, /Comments \(\$\{tabCounts\.comments\}\)/);
  assert.match(detailSource, /<LinkedPharmaciesTab/);
  assert.match(detailSource, /<OwnerDocumentsTab/);
  assert.match(detailSource, /<OwnerCommentsTab/);
  assert.match(detailSource, /<OwnerActivityTab/);
  assert.match(detailSource, /requestPharmacyOwnerNavigationBadgeRefresh\(\)/);

  assert.match(linkedSource, /<LinkedPharmacySearch/);
  assert.match(linkedSource, /<LinkedPharmaciesFiltersDrawer/);
  assert.match(linkedSource, /<PaginationView/);
  assert.match(linkedSource, /const controller = new AbortController\(\)/);
  assert.match(linkedSource, /requestKey/);
  assert.match(linkedSource, /data: null/);

  assert.match(documentsSource, /editable=\{false\}/);
  assert.match(commentsSource, /The owner cannot see these notes/);

  // Owner activity intentionally reuses the global audit UI with an owner scope.
  assert.match(
    activitySource,
    /<ActivityHistory\s+scopeOwnerId=\{ownerId\}\s+initialState=\{initialState\}\s*\/>/
  );

  assert.match(sharedActivitySource, /scopeEntityType:\s*'pharmacyOwner'/);

  assert.match(
    sharedActivitySource,
    /scopeEntityId:\s*scopeOwnerId\s*\|\|\s*filters\.ownerUserId/
  );

  assert.doesNotMatch(activitySource, /getAdminPharmacyOwnerActivity/);
});

//===================================================================

test('Stage 13.12 navigation badge is permission-gated, summary-backed and never turns an error into zero', () => {
  assert.match(
    adminLayoutSource,
    /<AdminPharmacyOwnerNavigationBadgeProvider>/
  );

  assert.match(providerSource, /ADMIN_PERMISSIONS\.pharmacyOwners\.view/);
  assert.match(providerSource, /getAdminPharmacyOwnerSummary/);
  assert.match(providerSource, /newOwnerCount: summary\.new/);
  assert.match(providerSource, /newOwnerCount: null/);
  assert.doesNotMatch(providerSource, /catch[\s\S]{0,500}?newOwnerCount:\s*0/);

  assert.match(sidebarSource, /useAdminPharmacyOwnerNavigationBadge/);
  assert.match(sidebarSource, /ADMIN_ROUTES\.PHARMACY_OWNERS/);
  assert.match(sidebarSource, /newOwnerCount > 99 \? '99\+' : newOwnerCount/);

  assert.match(mobileMenuSource, /useAdminPharmacyOwnerNavigationBadge/);
  assert.match(mobileMenuSource, /ADMIN_ROUTES\.PHARMACY_OWNERS/);

  assert.match(
    mobileMenuSource,
    /newOwnerCount > 99 \? '99\+' : newOwnerCount/
  );
});
