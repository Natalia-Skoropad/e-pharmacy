import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

//===================================================================

test('Admin Block pharmacy shows Needs changes for verification and moderation', async () => {
  const actions = await read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(actions, /detail\.reviewState === 'changes_requested'/);
  assert.match(actions, /detail\.status === 'on_verification'/);
  assert.match(actions, /detail\.status === 'on_moderation'/);
  assert.match(actions, /<StatusBadge label="Needs changes" tone="neutral"/);
});

//===================================================================

test('Admin audit does not show the same blocking reason twice', async () => {
  const modal = await read('../activity/AuditDetailsModal.tsx');

  assert.match(modal, /field === 'statusReason'/);

  assert.match(
    modal,
    /details\.after\.statusReason\.trim\(\) === details\.reason\.trim\(\)/
  );

  assert.match(modal, /<strong>Reason \/ description<\/strong>/);
});

//===================================================================

test('Pharmacy registry has one public Blocked status label', async () => {
  const list = await read('./PharmaciesPageContent/PharmaciesPageContent.tsx');

  assert.doesNotMatch(list, /title: 'Inactive'/);
  assert.match(list, /title: 'Blocked'/);
});
