import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

//===================================================================

// Status names are UI copy, not new MongoDB/domain enum values.
test('pharmacy blocked state has one canonical visible label and unchanged domain key', async () => {
  const presentation = await read(
    '../../../../../packages/config/src/presentation/pharmacies.ts'
  );

  assert.match(
    presentation,
    /blocked:\s*\{ label: 'Blocked', tone: 'danger' \}/
  );

  assert.doesNotMatch(presentation, /label: 'Inactive'/);
});

//===================================================================

test('registry cards and help text use Blocked in both pharmacy cabinets', async () => {
  for (const path of [
    './PharmaciesPageContent/PharmaciesPageContent.tsx',
    '../../../../../apps/pharmacy/src/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx',
  ]) {
    const source = await read(path);

    assert.match(source, /key: 'blocked'/);
    assert.match(source, /title: 'Blocked'/);
    assert.doesNotMatch(source, /title: 'Inactive'|An inactive pharmacy/);
  }
});

//===================================================================

test('dashboard and reactivation actions name the same Blocked state', async () => {
  const dashboard = await read(
    '../../../../../apps/pharmacy/src/components/dashboard/PharmacyDashboardPageContent/PharmacyDashboardPageContent.tsx'
  );

  const actions = await read(
    '../../../../../apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(dashboard, /status === 'blocked'[\s\S]*?label: 'Blocked'/);
  assert.match(dashboard, /Your pharmacy is blocked/);
  assert.match(actions, /pharmacy will return to Blocked/);
});

//===================================================================

test('non-operating Owner count is not mislabeled as Blocked alone', async () => {
  const owners = await read(
    '../pharmacy-owners/PharmacyOwnersTable/PharmacyOwnersTable.tsx'
  );

  assert.match(owners, /parts=\{\['Not operating', 'pharms'\]\}/);
  assert.match(owners, /New, On verification, or Blocked status/);
  assert.doesNotMatch(owners, /parts=\{\['Inactive', 'pharms'\]\}/);
});
