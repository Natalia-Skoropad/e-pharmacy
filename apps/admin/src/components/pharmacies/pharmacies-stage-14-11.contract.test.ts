import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  ADMIN_PHARMACY_DETAIL_TABS,
  buildAdminPharmacyDetailUrl,
  resolveAdminPharmaciesRoute,
} from '@/lib/pharmacies/admin-pharmacy-url';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const PHARMACY_ID = '507f1f77bcf86cd799439011';

//===================================================================

test('all ten detail tabs have canonical reloadable URLs without ambiguous list matches', () => {
  for (const tab of ADMIN_PHARMACY_DETAIL_TABS) {
    const url = buildAdminPharmacyDetailUrl(PHARMACY_ID, tab);
    const segments = url.slice('/admin/pharmacies/'.length).split('/');

    assert.deepEqual(resolveAdminPharmaciesRoute(segments), {
      kind: 'detail',
      pharmacyId: PHARMACY_ID,
      tab,
    });
  }

  for (const segments of [
    [PHARMACY_ID, 'unknown'],
    [PHARMACY_ID, 'comments', 'another'],
    ['status-active', 'status-blocked'],
    ['not-a-pharmacy-id', 'activity'],
  ]) {
    assert.deepEqual(resolveAdminPharmaciesRoute(segments), {
      kind: 'invalid',
    });
  }
});

//===================================================================

test('catch-all page serves only authorized pharmacy detail routes and preserves list behavior', async () => {
  const page = await read('../../app/admin/pharmacies/[...filters]/page.tsx');

  assert.match(page, /route\.kind === 'invalid'/);
  assert.match(page, /return notFound\(\)/);
  assert.match(page, /route\.kind === 'detail'/);

  assert.match(
    page,
    /buildAdminPharmacyDetailUrl\(\s*route\.pharmacyId,\s*route\.tab\s*\)/
  );

  assert.match(page, /redirect\(canonicalUrl\)/);
  assert.match(page, /<PharmacyDetailsPageContent/);
  assert.match(page, /permission=\{ADMIN_PERMISSIONS\.pharmacies\.view\}/);
  assert.match(page, /<PharmaciesPageContent/);
});

//===================================================================

test('Stage 14.11 shell has the 4 real API metrics, status, owner permission and noninteractive status placeholder', async () => {
  const content = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  assert.match(
    content,
    /getAdminPharmacyDetail\(pharmacyId, \{ signal: controller\.signal \}\)/
  );

  assert.match(content, /controller\.abort\(\)/);
  assert.match(content, /controller\.signal\.aborted/);
  assert.match(content, /isCurrent \? result\?\.detail : null/);
  assert.match(content, /classifyLoadError/);
  assert.match(content, /error === 'not-found'/);
  assert.match(content, /error === 'forbidden'/);
  assert.match(content, /onRetry=\{\(\) => setRetry/);
  assert.match(content, /dispatchAdminBreadcrumbLabel/);
  assert.match(content, /<PageHeader/);
  assert.match(content, /<InfoTooltip/);
  assert.match(content, /<StatusBadge/);
  assert.match(content, /<StatsGrid\s+columns=\{4\}/);
  assert.match(content, /<StatsLoadingSkeleton[\s\S]*?count=\{4\}/);

  assert.deepEqual(
    [...content.matchAll(/<StatsCard\s+title="([^"]+)"/g)].map(
      (match) => match[1]
    ),
    [
      'Active clients',
      'Successful orders',
      'Successful revenue',
      'Rating / reviews',
    ]
  );

  assert.match(content, /formatMoney\(metrics\.successfulRevenue\)/);
  assert.match(content, /metrics\.reviewsCount/);

  assert.match(
    content,
    /canAdmin\(access, ADMIN_PERMISSIONS\.pharmacyOwners\.view\)/
  );

  assert.match(content, /buildAdminPharmacyOwnerDetailUrl\(owner\.id\)/);
  assert.match(content, /Status management is not available yet/);
  assert.doesNotMatch(content, /<Button[^>]*>\s*Manage pharmacy status/);
});

//===================================================================

test('only active tab mounts and future tabs do not fetch unrelated resources', async () => {
  const content = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  assert.match(content, /<Tabs/);
  assert.match(content, /activeValue=\{activeTab\}/);
  assert.match(content, /mobileVisibleCount=\{1\}/);
  assert.match(content, /tabletVisibleCount=\{3\}/);

  assert.match(
    content,
    /router\.replace\(buildAdminPharmacyDetailUrl\(pharmacyId, tab\)/
  );

  assert.match(content, /role="tabpanel"/);
  assert.match(content, /TAB_DESCRIPTIONS\[activeTab\]/);
  assert.match(content, /Section coming soon/);

  assert.doesNotMatch(
    content,
    /getAdminPharmacyDocuments\(|getAdminPharmacyComments\(|getAdminPharmacyActivity\(/
  );

  assert.doesNotMatch(content, /Promise\.all\(/);
  assert.doesNotMatch(content, /TAB_ITEMS\.map\(/);
  assert.doesNotMatch(content, /fetch\(/);
});

//===================================================================

test('detail requests are keyed and state updates stay asynchronous', async () => {
  const content = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  assert.match(
    content,
    /result\?\.pharmacyId === pharmacyId && result\?\.retry === retry/
  );

  assert.match(
    content,
    /setResult\(\{ pharmacyId, retry, detail: response, error: null \}\)/
  );

  assert.match(content, /setResult\(\{\s*pharmacyId,\s*retry,\s*detail: null,/);
  assert.match(content, /\}, \[pharmacyId, retry\]\);/);

  assert.doesNotMatch(
    content,
    /setResult\(\{\s*pharmacyId,\s*detail: null,\s*error: null/
  );

  assert.match(content, /const pharmacyName = detail\?\.current\.name;/);
  assert.match(content, /\}, \[pharmacyName\]\);/);
});
