import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = fileURLToPath(new URL('../../../../../', import.meta.url));

const read = (relative: string) =>
  readFileSync(path.join(root, relative), 'utf8');

//===================================================================

const admin =
  'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/';

const owner =
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/';

//===================================================================

test('Stage 14.18.39: owner and admin comparison panels omit duplicate feedback text', () => {
  for (const source of [
    read(`${admin}PharmacyReviewSummary.tsx`),
    read(`${owner}OwnedPharmacySectionReview.tsx`),
  ]) {
    assert.match(source, /title="Verification and administrator feedback"/);
    assert.doesNotMatch(source, /<strong>Administrator feedback<\/strong>/);
    assert.doesNotMatch(source, /reviewFeedback\s*\?/);
    assert.match(source, /Saved \/ published/);
    assert.match(source, /Saved for submission/);
  }
});

//===================================================================

test('Stage 14.18.39: Admin renders comparison only when the section contains changes', () => {
  const summary = read(`${admin}PharmacyReviewSummary.tsx`);

  assert.match(summary, /if \(!changed\.length\) return null/);

  assert.match(
    summary,
    /const isCorrectionRequested = detail\.reviewState === 'changes_requested'/
  );

  assert.match(summary, /current: detail\.current\.description/);
  assert.match(summary, /submitted: pending\.description/);

  assert.match(
    summary,
    /presentation:\s*pending\.documentNames && detail\.publishedDocumentNames/
  );

  for (const [file, section] of [
    ['PharmacyDataTab.tsx', 'data'],
    ['PharmacyAboutTab.tsx', 'about'],
    ['PharmacyPaymentTab.tsx', 'payment'],
    ['PharmacyDocumentsTab.tsx', 'documents'],
  ]) {
    assert.match(
      read(`${admin}${file}`),
      new RegExp(`<PharmacyReviewSummary[^>]*section="${section}"`)
    );
  }
});

//===================================================================

test('Stage 14.18.39: owner removal and lifecycle reason remain available', () => {
  const review = read(`${owner}OwnedPharmacySectionReview.tsx`);
  const info = read(`${owner}OwnedPharmacyInformationTab.tsx`);

  assert.match(review, /<ConfirmationModal/);
  assert.match(review, /discardOwnedPharmacyPendingSection/);
  assert.match(review, /Remove change/);
  assert.match(info, /Pharmacy status activity/);
  assert.match(info, /event\.reason/);
});

//===================================================================

test('Stage 14.18.39: removed feedback-only styles are not left behind', () => {
  assert.doesNotMatch(
    read(`${admin}PharmacyReviewSummary.module.css`),
    /\.feedback\s*\{/
  );

  assert.doesNotMatch(
    read(`${owner}OwnedPharmacyDetailPageContent.module.css`),
    /\.reviewFeedback\s*\{/
  );
});
