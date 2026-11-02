import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

//===================================================================

test('14.18.29: all moderation transitions live beneath the dialog title', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  const headerStart = actions.indexOf('headerDetails={');
  const descriptionStart = actions.indexOf('description={', headerStart);
  const detailsStart = actions.indexOf('details={', descriptionStart);

  assert.ok(headerStart >= 0 && descriptionStart > headerStart);
  assert.ok(detailsStart > descriptionStart);

  const header = actions.slice(headerStart, descriptionStart);
  const description = actions.slice(descriptionStart, detailsStart);

  assert.match(header, /PHARMACY_STATUS_PRESENTATION\[detail\.status\]/);

  assert.match(
    header,
    /PHARMACY_STATUS_PRESENTATION\[action\.option\.targetStatus\]/
  );

  assert.match(header, /action\.option\.action === 'request_corrections'/);
  assert.match(header, /<StatusBadge label="Needs changes" tone="neutral"/);

  assert.doesNotMatch(description, /statusTransition/);

  assert.doesNotMatch(
    description,
    /status unchanged; a new review decision is audited/
  );

  assert.match(description, /action\.option\.description/);
  assert.match(description, /Request ID:/);
});

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
