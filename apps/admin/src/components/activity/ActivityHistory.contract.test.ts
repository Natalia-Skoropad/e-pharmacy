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
  assert.doesNotMatch(employeeDetailsSource, /actor\.address/);
  assert.doesNotMatch(employeeDetailsSource, /label: 'Address'/);

  assert.match(source, /title="Employee search"/);
  assert.match(serviceSource, /AdminAuditLog\.aggregate/);
  assert.match(serviceSource, /\$group:\s*\{ _id:\s*'\$actorUserId'/);
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
    /pharmacy owner name, ID, email, or phone number/
  );

  assert.match(
    historySource,
    /createOwnerOptions[\s\S]*?actor\.id[\s\S]*?actor\.email[\s\S]*?actor\.phone/
  );

  assert.match(drawerSource, /label="Changed by"/);
  assert.match(drawerSource, /employee: 'Employee'/);
  assert.match(drawerSource, /pharmacyOwner: 'Pharmacy owner'/);
  assert.match(drawerSource, /pharmacyEmployee: 'Pharmacy employee'/);

  assert.match(historySource, /title: 'Changed by'/);
  assert.match(historySource, /<ActivityActorIdentity/);
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

test('activity actor identity links employees and pharmacy owners to their canonical detail routes', async () => {
  const [
    identitySource,
    presentationSource,
    actorDetailsSource,
    ownerPageSource,
  ] = await Promise.all([
    read('./ActivityActorIdentity.tsx'),
    read('../../lib/audit/admin-audit-presentation.ts'),
    read('./ActivityEmployeeDetails/ActivityEmployeeDetails.tsx'),
    read('../../app/admin/pharmacy-owners/[ownerId]/page.tsx'),
  ]);

  assert.match(identitySource, /getAdminAuditActorHref/);

  assert.match(
    identitySource,
    /<TextActionButton[\s\S]*?className=\{css\.actorIdentityNameLink\}[\s\S]*?href=\{href\}/
  );

  assert.match(
    presentationSource,
    /actor\.actorType === 'employee'[\s\S]*?SETTINGS_EMPLOYEES/
  );

  assert.match(
    presentationSource,
    /actor\.actorType === 'pharmacyOwner'[\s\S]*?PHARMACY_OWNERS/
  );

  assert.match(actorDetailsSource, /function ActivityActorDetails/);
  assert.match(actorDetailsSource, /export function ActivityEmployeeDetails/);

  assert.match(ownerPageSource, /ADMIN_PERMISSIONS\.pharmacyOwners\.view/);
  assert.match(ownerPageSource, /PharmacyOwnerDetailsPageContent/);
  assert.doesNotMatch(ownerPageSource, /ActivityPharmacyOwnerDetails/);
});

//===================================================================

test('activity table keeps reasons out of rows while details modal preserves them', async () => {
  const [historySource, modalSource] = await Promise.all([
    read('./ActivityHistory.tsx'),
    read('./AuditDetailsModal.tsx'),
  ]);

  assert.doesNotMatch(historySource, /Reason:\s*\{item\.reason\}/);
  assert.doesNotMatch(historySource, /changeReason/);
  assert.match(modalSource, /details\.reason/);
  assert.match(modalSource, /Reason/);
});

//===================================================================

test('audit details reuse actor identity with photo and profile link', async () => {
  const [modalSource, identitySource, styles] = await Promise.all([
    read('./AuditDetailsModal.tsx'),
    read('./ActivityActorIdentity.tsx'),
    read('./ActivityHistory.module.css'),
  ]);

  assert.match(
    modalSource,
    /<ActivityActorIdentity[\s\S]*?actor=\{actor\}[\s\S]*?showPhoto/
  );

  assert.match(identitySource, /<TableImagePreview/);
  assert.match(identitySource, /className=\{css\.actorIdentityPhoto\}/);

  assert.match(
    identitySource,
    /<TextActionButton[\s\S]*?className=\{css\.actorIdentityNameLink\}[\s\S]*?href=\{href\}/
  );

  assert.match(modalSource, /statusPlacement="inline"/);
  assert.match(identitySource, /css\.actorIdentityNameRowInline/);

  assert.match(
    styles,
    /\.actorIdentityNameRowInline \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;/
  );
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
    /AdminAuditLog\.findOne\(scopeFilter\)[\s\S]*?sort\(\{ createdAt: 1, _id: 1 \}\)[\s\S]*?earliestCreatedAt/
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

//===================================================================

test('activity history removes duplicated entity-type UI and renders section icons', async () => {
  const [historySource, drawerSource, modalSource, sectionLinkSource] =
    await Promise.all([
      read('./ActivityHistory.tsx'),
      read('./ActivityFiltersDrawer.tsx'),
      read('./AuditDetailsModal.tsx'),
      read('./ActivitySectionLink.tsx'),
    ]);

  assert.doesNotMatch(drawerSource, /label="Entity type"/);
  assert.doesNotMatch(drawerSource, /admin-audit-entity-filter/);
  assert.doesNotMatch(historySource, /filters\.entityType/);

  assert.match(
    historySource,
    /key: 'entity'[\s\S]*?render: \(item\) => <span>\{item\.entityLabelSnapshot\}<\/span>/
  );

  assert.doesNotMatch(historySource, /getAdminAuditEntityLabel/);
  assert.match(modalSource, /<dd>\{details\.entityLabelSnapshot\}<\/dd>/);
  assert.doesNotMatch(modalSource, /getAdminAuditEntityLabel/);

  assert.match(historySource, /<ActivitySectionLink item=\{item\} \/>/);
  assert.match(modalSource, /<ActivitySectionLink item=\{details\} \/>/);
  assert.match(sectionLinkSource, /function SectionIcon/);
  assert.match(sectionLinkSource, /case 'categories'/);
  assert.match(sectionLinkSource, /case 'pharmacyOwners'/);
});
