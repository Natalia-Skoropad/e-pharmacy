import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const root = process.cwd();

//===================================================================

const read = (name) => readFileSync(path.join(root, name), 'utf8');

//===================================================================

const adminModeration = read(
  'apps/api/src/services/admin/pharmacies/admin.service.ts'
);

const publicCatalog = read(
  'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
);

const publicStatus = read(
  'apps/api/src/services/pharmacies/pharmacy-public-status.ts'
);

const serverReader = read('apps/client/src/lib/api/server/pharmacies.api.ts');

const select = read(
  'packages/ui/src/forms/SearchableSelect/SearchableSelect.tsx'
);

const selectStyles = read(
  'packages/ui/src/forms/SearchableSelect/SearchableSelect.module.css'
);

const resource = read(
  'apps/client/src/components/catalog/CatalogResourceState/CatalogResourceState.tsx'
);

const diagnostic = read(
  'apps/api/src/scripts/diagnostics/diagnose-pharmacy-reactivation.ts'
);

const integration = read(
  'apps/api/src/services/pharmacies/pharmacy-moderation-decisions.mongo.integration.test.ts'
);

const reactivate = adminModeration
  .split("case 'review_reactivation':")[1]
  .split('// Strict CAS')[0];

//===================================================================

test('approval only activates a submitted pending reactivation, and publishes the reviewed patch', () => {
  assert.match(
    reactivate,
    /isReactivation && pharmacy\.reviewState === 'pending'/
  );

  assert.match(reactivate, /assertPharmacyOwnerCanOperate/);
  assert.match(reactivate, /missingRequiredModerationFields/);
  assert.match(reactivate, /PharmacyOwnerDocument\.exists/);
  assert.match(reactivate, /nextStatus = PHARMACY_STATUSES\.ACTIVE/);

  assert.match(
    reactivate,
    /normalizePendingModeration\(pharmacy\.pendingModeration\)/
  );

  assert.match(reactivate, /unsetFields\.pendingModeration = ''/);
  assert.match(reactivate, /unsetFields\.reviewState = ''/);
  assert.match(reactivate, /unsetFields\.statusReason = ''/);
  assert.match(reactivate, /unsetFields\.blockSource = ''/);
});

//===================================================================

test('public read includes activated pharmacy but never blocked / reactivation states', () => {
  assert.match(publicStatus, /PHARMACY_STATUSES\.ACTIVE/);
  assert.match(publicStatus, /PHARMACY_STATUSES\.ON_MODERATION/);
  assert.doesNotMatch(publicStatus, /PHARMACY_STATUSES\.BLOCKED/);
  assert.doesNotMatch(publicStatus, /PHARMACY_STATUSES\.ON_REACTIVATION/);

  const occurrences =
    publicCatalog.match(/status: PUBLIC_PHARMACY_STATUS_FILTER/g) ?? [];

  assert.ok(occurrences.length >= 4);
  assert.match(integration, /publicList = await getPharmaciesService/);
  assert.match(integration, /publicDetail = await getPharmacyDetailsService/);

  assert.match(
    integration,
    /publishedAfterReactivation\?\.blockSource, undefined/
  );
});

//===================================================================

test('only public pharmacy catalog and full details have a longer read budget', () => {
  assert.match(serverReader, /PHARMACY_CONTENT_READ_TIMEOUT_MS = 18_000/);

  assert.match(
    serverReader,
    /publicPharmaciesReader\.getPharmacies\(params, \{/
  );

  assert.match(serverReader, /publicPharmaciesReader\.getDetails\(id, \{/);

  assert.match(
    serverReader,
    /getPharmacySearchOptions = publicPharmaciesReader\.getSearchOptions/
  );

  assert.match(publicCatalog, /slow public catalog listing/);
  assert.match(publicCatalog, /slow public pharmacy detail/);

  assert.match(
    publicCatalog,
    /Public reads never load private owner, moderation or document fields/
  );

  assert.match(
    publicCatalog,
    /description: 1,[\s\S]*?shortDescription: 1,[\s\S]*?reviewsCount: 1,[\s\S]*?updatedAt: 1/
  );

  assert.match(publicCatalog, /imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION/);
});

//===================================================================

test('filter retry and catalog recovery both use refresh icons and styled pill actions', () => {
  assert.match(select, /<RotateCcw size=\{16\}/);
  assert.match(resource, /<RotateCcw size=\{16\}/);

  assert.match(
    selectStyles,
    /\.retryButton\s*\{[\s\S]*?border-radius: var\(--radius-pill\)/
  );

  assert.match(
    selectStyles,
    /\.retryButton\s*\{[\s\S]*?background-color: var\(--color-accent\)/
  );
});

//===================================================================

test('diagnostic is read-only and does not expose private data', () => {
  assert.match(diagnostic, /autoIndex: false/);
  assert.match(diagnostic, /autoCreate: false/);
  assert.match(diagnostic, /activationLooksConsistent/);
  assert.match(diagnostic, /getPharmaciesService/);
  assert.match(diagnostic, /getPharmacyDetailsService/);
  assert.doesNotMatch(diagnostic, /\.updateOne\(|\.deleteMany\(|\.create\(/);
});
