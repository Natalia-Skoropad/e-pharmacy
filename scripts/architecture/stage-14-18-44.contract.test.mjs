import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const root = resolve(import.meta.dirname, '../../..');

//===================================================================

const file = (relativePath) =>
  readFileSync(resolve(root, relativePath), 'utf8');

//===================================================================

// Only audit read semantics and presentation are tested: no database mutation.
test('reactivation badges are present in both navigation systems', () => {
  for (const path of [
    'apps/admin/src/components/layout/PharmacyNavigationBadges/PharmacyNavigationBadges.tsx',
    'apps/pharmacy/src/components/layout/PharmacySidebar/PharmacySidebar.tsx',
    'apps/pharmacy/src/components/layout/PharmacyMobileMenu/PharmacyMobileMenu.tsx',
  ]) {
    assert.match(file(path), /onReactivation/);
  }
});

//===================================================================

test('pharmacy audit has two change types, server pagination and URLs', () => {
  const drawer = file(
    'apps/admin/src/components/activity/ActivityFiltersDrawer.tsx'
  );

  assert.match(drawer, /Pharmacy status changed/);
  assert.match(drawer, /Pharmacy data changed/);

  const service = file(
    'apps/api/src/services/admin/audit/admin-audit-read.service.ts'
  );

  assert.match(service, /query\.changeType === 'status'/);
  assert.match(service, /countDocuments\(filter\)/);

  assert.match(
    file('apps/admin/src/lib/audit/admin-activity-url.ts'),
    /change-group-/
  );
});

//===================================================================

test('no extra reactivation status badge or review modal summary for corrections', () => {
  const owner = file(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  assert.doesNotMatch(owner, /Reactivation requested <\/span>/);

  const admin = file(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(admin, /review_reactivation/);
});

//===================================================================

test('audit photo previews do not expose fingerprint hashes and work with new records', () => {
  const snapshot = file(
    'apps/api/src/services/pharmacies/pharmacy-audit-changes.ts'
  );

  assert.match(snapshot, /photoPreviewUrl/);
  assert.match(snapshot, /changedFields\.includes\('photoFingerprint'\)/);

  const view = file('apps/admin/src/components/activity/AuditDetailsModal.tsx');

  assert.match(view, /<ShimmerImage/);
  assert.match(view, /Historical photo preview unavailable/);
});

//===================================================================

test('admin pharmacy registry has its own timeout on both sides of the BFF', () => {
  assert.match(
    file('apps/admin/src/app/api/admin/pharmacies/route.ts'),
    /timeoutMs:\s*30_000/
  );

  assert.match(
    file('apps/admin/src/lib/api/browser/admin-pharmacy-registry.api.ts'),
    /timeoutMs:\s*35_000/
  );
});
