import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const root = process.cwd();

//===================================================================

const source = (p) => readFileSync(path.join(root, p), 'utf8');

//===================================================================

test('pharmacy registry metrics join by indexed pharmacyId for all account roles', () => {
  const code = source(
    'apps/api/src/services/pharmacies/registry/pharmacy-registry-query.ts'
  );

  assert.match(
    code,
    /localField:\s*'_id',[\s\S]*?foreignField:\s*'pharmacyId'/
  );

  assert.equal((code.match(/foreignField:\s*'pharmacyId'/g) ?? []).length, 2);
  assert.doesNotMatch(code, /\$eq:\s*\['\$pharmacyId',\s*'\$\$pharmacyId'\]/);
});

//===================================================================

test('public card directory projects fields and counts active products without full product documents', () => {
  const code = source(
    'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
  );

  assert.match(
    code,
    /from:\s*Product\.collection\.name,[\s\S]*?\$project:\s*\{\s*_id:\s*1\s*\}/
  );

  assert.match(code, /PUBLIC_PHARMACY_IMAGE_PROJECTION/);
});

//===================================================================

test('owner pharmacy grouping uses indexed ownerId equality lookup', () => {
  const code = source(
    'apps/api/src/services/admin/owners/admin-pharmacy-owner-registry.service.ts'
  );

  assert.match(code, /foreignField:\s*'ownerId'/);
});

//===================================================================

test('admin pharmacy location choices come from a separate permission protected and canonical route', () => {
  const routes = source('apps/api/src/routes/admin/admin.routes.ts');

  assert.match(routes, /'\/pharmacies\/locations'/);
  assert.match(routes, /listPharmacyRegistryLocationsByAdmin/);

  const endpoint = source(
    'apps/admin/src/app/api/admin/pharmacies/locations/route.ts'
  );

  assert.match(endpoint, /createPrivateProxyRoute/);
  assert.match(endpoint, /API_ROUTES\.admin\.pharmacyRegistry\.locations/);

  assert.match(
    source('packages/api-client/src/contracts/backend-resource-routes.ts'),
    /locations:\s*'\/admin\/pharmacies\/locations'/
  );
});

//===================================================================

test('admin registry location options do not cause a second bulk pharmacy list request', () => {
  const code = source(
    'apps/admin/src/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  assert.match(code, /getAdminPharmacyLocationRows/);
  assert.doesNotMatch(code, /loadCompletePharmacyLocations/);
});

//===================================================================

test('activity actors read minimal profile fields and do not expand all owned pharmacies', () => {
  const code = source(
    'apps/api/src/services/admin/audit/admin-audit-actors.service.ts'
  );

  assert.match(code, /\$project:\s*\{\s*name:\s*1/);
  assert.match(code, /\$limit:\s*1\s*\}/);
});

//===================================================================

test('owner editor checks changed unique fields for blocking and all fields for warnings', () => {
  const editor = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
  );

  const validation = source(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/usePaymentAvailability.ts'
  );

  assert.match(editor, /tab === 'data' \|\| tab === 'payment'/);
  assert.match(editor, /usePaymentAvailability\([\s\S]*?uniqueFields\s*\)/);

  assert.match(
    validation,
    /checkedFields\?:\s*readonly PharmacyUniqueField\[\]/
  );
});

//===================================================================

test('reactivation transition services remain untouched by performance patch', () => {
  const code = source(
    'apps/api/src/services/pharmacies/pharmacy-owner-reactivation.service.ts'
  );

  assert.match(code, /ON_REACTIVATION/);
});

//===================================================================

test('an isolated audit details failure cannot take down the entire history page', () => {
  const boundary = source(
    'apps/admin/src/components/activity/AuditDetailsRenderBoundary.tsx'
  );

  const history = source(
    'apps/admin/src/components/activity/ActivityHistory.tsx'
  );

  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(boundary, /componentDidCatch/);
  assert.match(boundary, /Retry details/);
  assert.match(history, /<AuditDetailsRenderBoundary/);
});
