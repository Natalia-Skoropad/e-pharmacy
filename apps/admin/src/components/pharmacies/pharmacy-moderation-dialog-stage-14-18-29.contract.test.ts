import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

//===================================================================

test('14.18.29: an empty submitted-change summary does not appear in the dialog', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  const summary = read(
    './PharmacyDetailsPageContent/PharmacyReviewSummary.tsx'
  );

  assert.match(actions, /<PharmacySubmittedChangesSummary detail=\{detail\}/);
  assert.match(summary, /if \(!changes\.length\) return null;/);

  assert.doesNotMatch(
    summary,
    /No submitted profile changes are available for this decision\./
  );

  assert.match(summary, /Changes awaiting administrator approval/);
});
