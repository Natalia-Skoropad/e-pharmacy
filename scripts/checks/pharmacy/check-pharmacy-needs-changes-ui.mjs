import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const read = (file) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

const ownerTable =
  'apps/pharmacy/src/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx';

const adminTable =
  'apps/admin/src/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx';

//===================================================================

test('both list endpoints project the review state and both list parsers validate it', () => {
  const projection = read(
    'apps/api/src/services/pharmacies/registry/pharmacy-registry-query.ts'
  );

  assert.match(projection, /reviewState:\s*\{\s*\$ifNull:/);

  for (const service of [
    'apps/api/src/services/pharmacies/owned-pharmacy-registry-read.service.ts',
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-registry-read.service.ts',
  ])
    assert.match(read(service), /item\.reviewState/);

  for (const parser of [
    'packages/api-client/src/response/owned-pharmacy-registry-parsers.ts',
    'packages/api-client/src/response/admin-pharmacy-registry-parsers.ts',
  ])
    assert.match(read(parser), /changes_requested/);
});

//===================================================================

test('admin and owner pharmacy tables show a neutral badge after On verification', () => {
  for (const file of [ownerTable, adminTable]) {
    const src = read(file);

    assert.match(src, /reviewState === 'changes_requested'/);
    assert.match(src, /<StatusBadge label="Needs changes" tone="neutral" \/>/);
  }
});

//===================================================================

test('owner history shows state-only transitions and their review badges', () => {
  const src = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  assert.match(src, /event\.previousReviewState !== event\.nextReviewState/);
  assert.match(src, /event\.nextReviewState === 'changes_requested'/);
  assert.match(src, /event\.previousReviewState === 'changes_requested'/);
});

//===================================================================

test('owner resubmission header includes neutral Needs changes before the arrow', () => {
  const src = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(
    src,
    /action === 'verification' && pharmacy\.reviewState === 'changes_requested'/
  );

  assert.match(src, /cancelIconLeft={<ShieldCheck/);
  assert.match(src, /confirmIconLeft={<XCircle/);
});

//===================================================================

test('admin reviews do not show the feedback comparison after corrections', () => {
  const src = read(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyReviewSummary.tsx'
  );

  assert.match(
    src,
    /if \(detail\.reviewState === 'changes_requested'\) return null/
  );
});

//===================================================================

test('focus does not reload the admin detail view and close a pending dialog', () => {
  const src = read(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  assert.doesNotMatch(src, /window\.addEventListener\('focus',\s*onFocus\)/);
  assert.match(src, /onRefresh=\{\(\) => setRetry/);
});

//===================================================================

test('owner detail retains four metrics skeletons while loading a tab', () => {
  const src = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  assert.match(src, /<StatsLoadingSkeleton/);
  assert.match(src, /count=\{4\}/);
});

//===================================================================

test('admin disabled moderation options have their own information controls', () => {
  const src = read(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(src, /disabled=\{option\.disabled\}/);
  assert.match(src, /option\.disabled \? \(\s*<InfoTooltip/);
});

//===================================================================

test('corrections audit receives verification tone and review-state badges', () => {
  const presentation = read(
    'apps/admin/src/lib/audit/admin-audit-presentation.ts'
  );

  const details = read(
    'apps/admin/src/components/activity/AuditDetailsModal.tsx'
  );

  assert.match(presentation, /pharmacy\.corrections\.requested/);
  assert.match(details, /item\.field === 'reviewState' && item\.afterStatus/);
  assert.match(details, /label="Needs changes" tone="neutral"/);
});
