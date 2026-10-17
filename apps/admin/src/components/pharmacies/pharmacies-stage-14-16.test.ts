import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('14.16: Activity is mounted only on the pharmacy tab with exact pharmacy-scoped API calls', async () => {
  const [shell, panel, activity, api, backend] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyActivityTab.tsx'),
    read('../activity/ActivityHistory.tsx'),
    read('../../lib/api/browser/admin-pharmacy-detail.api.ts'),
    read('../../../../api/src/services/admin-pharmacy-activity.service.ts'),
  ]);

  assert.match(shell, /activeTab === 'activity' \?/);
  assert.match(shell, /<PharmacyActivityTab\s+key=\{pharmacyId\}/);
  assert.match(panel, /<ActivityHistory\s+scopePharmacyId=\{pharmacyId\}/);

  assert.match(
    activity,
    /getAdminPharmacyActivity\(scopePharmacyId, listParams/
  );

  assert.match(activity, /getAdminPharmacyActivityActors\(scopePharmacyId/);

  assert.match(
    activity,
    /getAdminPharmacyActivityDetail\(scopePharmacyId, selectedAuditId/
  );

  assert.match(activity, /scopePharmacyId \|\| !page/);

  assert.match(
    api,
    /ROUTES\.pharmacyActivity\.list\(pharmacyId\(rawPharmacyId\)\)/
  );

  assert.match(
    api,
    /ROUTES\.pharmacyActivity\.actors\(pharmacyId\(rawPharmacyId\)\)/
  );

  assert.match(api, /ROUTES\.pharmacyActivity\.details\(/);
  assert.match(backend, /listAdminAuditLogsService\(query, \{ pharmacyId \}\)/);
  assert.match(backend, /listAdminAuditActorsService\(\{ pharmacyId \}\)/);

  assert.match(
    backend,
    /getAdminAuditLogService\(auditLogId, \{ pharmacyId \}\)/
  );
});

//===================================================================

test('14.16: pharmacy deep-links reuse the canonical activity filters without extra pages', async () => {
  const [routing, page, activity] = await Promise.all([
    read('../../lib/pharmacies/admin-pharmacy-url.ts'),
    read('../../app/admin/pharmacies/[...filters]/page.tsx'),
    read('../activity/ActivityHistory.tsx'),
  ]);

  assert.match(routing, /tab !== 'activity'/);
  assert.match(routing, /activitySegments: segments\.slice\(2\)/);
  assert.match(page, /parseAdminActivityUrl\(route\.activitySegments\)/);
  assert.match(page, /buildAdminActivityUrl\(initialActivityState\)/);
  assert.match(page, /redirect\(canonicalUrl\)/);
  assert.match(page, /initialActivityState=\{initialActivityState\}/);

  assert.match(
    activity,
    /buildAdminPharmacyDetailUrl\(scopePharmacyId, 'activity'\)/
  );

  assert.match(activity, /router\.replace\(/);
  assert.match(activity, /getAdminAuditLogs\(listParams/);
  assert.match(activity, /scopeOwnerId \|\| filters\.ownerUserId/);
});

//===================================================================

test('14.16: five deferred sections are informational and do not issue resource requests', async () => {
  const [shell, url, bffPaths] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
    read('../../lib/pharmacies/admin-pharmacy-url.ts'),
    read('../../lib/api/routes/admin-api-routes.ts'),
  ]);

  for (const tab of [
    'reviews',
    'orders',
    'clients',
    'products',
    'product-requests',
  ]) {
    assert.match(shell, new RegExp(`\\b['"]?${tab}['"]?: \\{`));
    assert.match(url, new RegExp(`'${tab}'`));
  }

  assert.match(shell, /const deferredTab = DEFERRED_TABS\[activeTab\]/);
  assert.match(shell, /variant="empty"\s+icon=\{deferredTab\.icon\}/);
  assert.match(shell, /mobileVisibleCount=\{1\}/);
  assert.match(shell, /tabletVisibleCount=\{3\}/);

  assert.doesNotMatch(
    shell,
    /getAdminPharmacyReviews|getAdminPharmacyOrders|getAdminPharmacyClients|getAdminPharmacyProducts|getAdminPharmacyProductRequests/
  );

  assert.doesNotMatch(
    bffPaths,
    /pharmacyReviews:|pharmacyOrders:|pharmacyClients:|pharmacyProducts:|pharmacyProductRequests:/
  );
});
