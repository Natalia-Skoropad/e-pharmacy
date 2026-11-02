import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = fileURLToPath(new URL('../../../../../', import.meta.url));

const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

const base = 'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/';

//===================================================================

test('Stage 14.18.38: Admin review remains visible after corrections request', () => {
  const summary = read(`${base}PharmacyReviewSummary.tsx`);

  assert.doesNotMatch(
    summary,
    /if\s*\(detail\.reviewState === 'changes_requested'\)\s*return null/
  );

  assert.match(
    summary,
    /const isCorrectionRequested = detail\.reviewState === 'changes_requested'/
  );

  assert.match(summary, /!isCorrectionRequested\s*&&/);
  assert.match(summary, /if \(!changed\.length\) return null/);

  assert.match(
    summary,
    /isCorrectionRequested\s*\? 'These changes were returned to the owner for corrections/
  );

  assert.doesNotMatch(summary, /<strong>Administrator feedback<\/strong>/);
  assert.match(summary, /'Saved for submission'/);
});

//===================================================================

test('Stage 14.18.38: Data, About, Payment and Documents share the Admin review component', () => {
  for (const [file, section] of [
    ['PharmacyDataTab.tsx', 'data'],
    ['PharmacyAboutTab.tsx', 'about'],
    ['PharmacyPaymentTab.tsx', 'payment'],
    ['PharmacyDocumentsTab.tsx', 'documents'],
  ]) {
    assert.match(
      read(`${base}${file}`),
      new RegExp(`<PharmacyReviewSummary[^>]*section="${section}"`)
    );
  }
});

//===================================================================

test('Stage 14.18.38: Admin comparisons preserve published data and saved proposals', () => {
  const summary = read(`${base}PharmacyReviewSummary.tsx`);

  const api = read(
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
  );

  assert.match(summary, /const pending = detail\.pendingChanges/);
  assert.match(summary, /current: detail\.current\.description/);
  assert.match(summary, /submitted: pending\.description/);

  assert.match(
    api,
    /pharmacy\.pendingModeration\s*\? \{ pendingChanges: submittedChanges\(pharmacy\.pendingModeration\) \}/
  );

  assert.match(api, /pharmacy\.reviewFeedback/);

  assert.doesNotMatch(
    summary,
    /Remove change|discardOwnedPharmacyPendingSection/
  );
});
