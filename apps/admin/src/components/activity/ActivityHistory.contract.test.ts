import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('activity history employee search excludes private address data', async () => {
  const [source, employeeDetailsSource, serviceSource] = await Promise.all([
    read('./ActivityHistory.tsx'),
    read('./ActivityEmployeeDetails/ActivityEmployeeDetails.tsx'),
    read('../../../../api/src/services/admin-audit.service.ts'),
  ]);

  assert.match(source, /label="Search by employee"/);

  assert.match(
    source,
    /searchText:[\s\S]*?actor\.id[\s\S]*?actor\.email[\s\S]*?actor\.phone/
  );

  assert.doesNotMatch(source, /actor\.address/);
  assert.doesNotMatch(source, /phone number, or address|phone, or address/);
  assert.doesNotMatch(employeeDetailsSource, /employee\.address/);
  assert.doesNotMatch(employeeDetailsSource, /label: 'Address'/);

  assert.match(source, /title="Employee search"/);
  assert.doesNotMatch(serviceSource, /\.select\([^)]*address[^)]*\)/);

  assert.doesNotMatch(
    source,
    /Employee name search|Employee ID search|Employee contact search/
  );
});

//===================================================================

test('activity history has a separate pharmacy-owner search and actor-type filter', async () => {
  const [historySource, drawerSource] = await Promise.all([
    read('./ActivityHistory.tsx'),
    read('./ActivityFiltersDrawer.tsx'),
  ]);

  assert.match(historySource, /label="Search by pharmacy owner"/);
  assert.match(historySource, /title="Pharmacy owner search"/);

  assert.match(
    historySource,
    /createOwnerOptions[\s\S]*?actor\.email[\s\S]*?actor\.phone/
  );

  assert.match(drawerSource, /label="Changed by"/);
  assert.match(drawerSource, /employee: 'Employee'/);
  assert.match(drawerSource, /pharmacyOwner: 'Pharmacy owner'/);

  assert.match(historySource, /title: 'Changed by'/);
  assert.match(historySource, /getAdminAuditActorTypeLabel/);
  assert.doesNotMatch(historySource, /title: 'Employee'/);

  const employeeUpdater = historySource.match(
    /const updateEmployee = \(employeeUserId: string\) => \{[\s\S]*?\n  \};/
  )?.[0];

  const ownerUpdater = historySource.match(
    /const updateOwner = \(ownerUserId: string\) => \{[\s\S]*?\n  \};/
  )?.[0];

  assert.ok(employeeUpdater);
  assert.ok(ownerUpdater);
  assert.doesNotMatch(employeeUpdater, /actorType:\s*'employee'/);
  assert.doesNotMatch(ownerUpdater, /actorType:\s*'pharmacyOwner'/);
});

//===================================================================

test('activity date filter is bounded by the first audit log and the shared calendar handles today as the upper bound', async () => {
  const [historySource, drawerSource, serviceSource] = await Promise.all([
    read('./ActivityHistory.tsx'),
    read('./ActivityFiltersDrawer.tsx'),
    read('../../../../api/src/services/admin-audit.service.ts'),
  ]);

  assert.match(
    historySource,
    /minDate=\{data\?\.earliestCreatedAt \?\? undefined\}/
  );

  assert.match(drawerSource, /minDate=\{minDate\}/);
  assert.match(drawerSource, /disabled=\{!minDate\}/);

  assert.match(
    serviceSource,
    /AdminAuditLog\.findOne\(\{\}\)[\s\S]*?sort\(\{ createdAt: 1, _id: 1 \}\)[\s\S]*?earliestCreatedAt/
  );
});

//===================================================================

test('activity count label is centered on mobile', async () => {
  const styles = await read('./ActivityHistory.module.css');

  assert.match(
    styles,
    /\.countLabel \{[\s\S]*?justify-content: center;[\s\S]*?text-align: center;/
  );
});
