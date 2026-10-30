import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('Stage 14.9 registry routes retain permission guards as Stage 14.11 adds detail routing', async () => {
  const index = await read('../../app/admin/pharmacies/page.tsx');

  const filtered = await read(
    '../../app/admin/pharmacies/[...filters]/page.tsx'
  );

  assert.match(index, /ADMIN_PERMISSIONS\.pharmacies\.view/);
  assert.match(index, /parseAdminPharmaciesListSearchParams/);
  assert.match(filtered, /ADMIN_PERMISSIONS\.pharmacies\.view/);
  assert.match(filtered, /resolveAdminPharmaciesRoute\(filters\)/);
  assert.match(filtered, /route\.kind === 'invalid'\) return notFound\(\)/);
  assert.match(filtered, /route\.kind === 'detail'/);
  assert.match(filtered, /<PharmacyDetailsPageContent/);
  assert.match(filtered, /buildAdminPharmaciesListUrl/);
  assert.match(filtered, /redirect\(canonicalUrl\)/);
});

//===================================================================

test('Stage 14.9 retains six shared clickable status cards without an All card', async () => {
  const content = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  assert.match(content, /<PageHeader/);
  assert.match(content, /<InfoTooltip/);
  assert.match(content, /<Building2/);
  assert.match(content, /<StatsGrid/);
  assert.match(content, /<StatsCard/);
  assert.match(content, /<StatsLoadingSkeleton/);
  assert.match(content, /count=\{6\}/);
  assert.match(content, /columns=\{3\}/);
  assert.match(content, /tabletColumns=\{3\}/);
  assert.match(content, /status: target/);
  assert.match(content, /const target = active \? 'all' : card\.key/);
  assert.match(content, /buildAdminPharmaciesListUrl/);

  const cardKeys = [...content.matchAll(/key: '([^']+)' as StatusKey/g)].map(
    (match) => match[1]
  );

  assert.deepEqual(cardKeys, [
    'new',
    'on_verification',
    'active',
    'on_moderation',
    'on_reactivation',
    'blocked',
  ]);

  assert.doesNotMatch(content, /key: 'all' as StatusKey/);
  assert.match(content, /tone: 'mustard' as const/);
  assert.match(content, /shellCss\.card/);
  assert.match(content, /shellCss\.statisticsError/);
});

//===================================================================

test('Stage 14.9 registry fetch and global statistics are independent', async () => {
  const content = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  assert.match(
    content,
    /getAdminPharmacies\(buildAdminPharmaciesListApiParams\(state\)/
  );

  assert.match(
    content,
    /getAdminPharmacySummary\(\{ signal: controller\.signal \}\)/
  );

  assert.match(content, /setListRetry\(\(retry\) => retry \+ 1\)/);
  assert.match(content, /setStatsRetry\(\(retry\) => retry \+ 1\)/);
  assert.match(content, /<DataTable/);
  assert.match(content, /<PaginationView/);
  assert.match(content, /PHARMACY_STATUS_PRESENTATION\[pharmacy\.status\]/);
  assert.doesNotMatch(content, /fetch\(['"]https?:\/\//);
  assert.doesNotMatch(content, /Create pharmacy|Add pharmacy/);

  const css = await read(
    './PharmaciesPageContent/PharmaciesPageContent.module.css'
  );

  assert.match(css, /\.activeCard/);
  assert.match(content, /shellCss\.statisticsBlock/);
  assert.match(content, /shellCss\.statisticsError/);
  assert.doesNotMatch(css, /\.card\s*\{/);
});
