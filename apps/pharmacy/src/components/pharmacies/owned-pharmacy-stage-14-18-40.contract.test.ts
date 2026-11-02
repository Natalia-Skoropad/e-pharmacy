import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd().endsWith('apps/pharmacy')
  ? path.resolve(process.cwd(), '../..')
  : process.cwd();

const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), 'utf8');

//===================================================================

test('moderation resubmission modal shows Needs changes before the arrow', () => {
  const source = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  const header = source.split('headerDetails={')[1]?.split('details={')[0];

  assert.ok(header, 'Review transition header must be present');
  assert.match(header, /action === 'moderation'/);
  assert.match(header, /pharmacy\.reviewState === 'changes_requested'/);
  assert.match(header, /StatusBadge label="Needs changes" tone="neutral"/);

  assert.ok(
    header.indexOf('label="Needs changes"') <
      header.indexOf('<span aria-hidden="true">→</span>'),
    'Needs changes belongs to the previous status, not the submitted status'
  );

  assert.match(header, /'on_moderation'/);
});

//===================================================================

test('owner status overview and full activity history render review-state badges', () => {
  for (const file of [
    'OwnedPharmacyInformationTab.tsx',
    'OwnedPharmacyActivityTab.tsx',
  ]) {
    const source = read(
      `apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/${file}`
    );

    assert.match(source, /previousReviewState === 'changes_requested'/);
    assert.match(source, /nextReviewState === 'changes_requested'/);
    assert.match(source, /StatusBadge label="Needs changes" tone="neutral"/);
  }
});

//===================================================================

test('owner lifecycle API preserves both review states and status context', () => {
  const source = read(
    'apps/api/src/services/pharmacies/pharmacy-lifecycle-history.service.ts'
  );

  assert.match(source, /previousStatus: statusContext\.previousStatus/);
  assert.match(source, /nextStatus: statusContext\.nextStatus/);
  assert.match(source, /previousReviewState: entry\.before\?\.reviewState/);
  assert.match(source, /entry\.after\?\.reviewState/);
});

//===================================================================

test('Admin audit details renders one business status transition with Needs changes', () => {
  const source = read(
    'apps/admin/src/components/activity/AuditDetailsModal.tsx'
  );

  assert.match(source, /field === 'reviewState' && item\.beforeStatus/);
  assert.match(source, /field === 'reviewState' && item\.afterStatus/);
  assert.match(source, /item\.before === 'changes_requested'/);
  assert.match(source, /item\.after === 'changes_requested'/);
  assert.match(source, /reviewFields\.includes\('reviewState'\)/);
});
