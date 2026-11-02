import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('Admin moderation uses a distinct response parser from owner profile', () => {
  const api = read('../../lib/api/browser/admin-pharmacy-detail.api.ts');

  assert.match(api, /parseAdminPharmacyModerationResponse/);
  assert.doesNotMatch(api, /parsePharmacyProfileResponse/);
});

//===================================================================

test('Corrections stay visible as disabled actions, emergency block stays enabled', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(actions, /detail\.reviewState === 'changes_requested'/);
  assert.match(actions, /label: 'Request re-verification'/);
  assert.match(actions, /disabled=\{option\.disabled\}/);
  assert.match(actions, /if \(!option\.disabled\) selectAction\(option\)/);
  assert.match(actions, /\.\.\.options\.map\(\(option\) =>/);
});

//===================================================================

test('Both status cards display the neutral Needs changes badge', () => {
  const admin = read('./PharmacyDetailsPageContent/PharmacyInformationTab.tsx');

  const owner = read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  assert.match(admin, /<StatusBadge label="Needs changes" tone="neutral" \/>/);
  assert.match(owner, /<StatusBadge label="Needs changes" tone="neutral" \/>/);
});

//===================================================================

test('Ambiguous moderation failures verify persisted state before showing error', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(
    actions,
    /const fresh = await getAdminPharmacyDetail\(detail\.id\)/
  );

  assert.match(actions, /fresh\.reviewState === 'changes_requested'/);
  assert.match(actions, /fresh\.reviewFeedback === action\.reason\.trim\(\)/);
  assert.match(actions, /toast\.success\(/);
});
