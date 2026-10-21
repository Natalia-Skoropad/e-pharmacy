import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const profile = readFileSync(
  new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('profile photo mutation applies canonical user and revision concurrency', () => {
  assert.match(
    profile,
    /updateCurrentUser\(\{[\s\S]*?expectedRevision: user\.revision/
  );

  assert.match(profile, /applyCurrentUser\(response\.user\)/);
  assert.doesNotMatch(profile, /reloadCurrentUser/);
  assert.match(profile, /const mutationRef = useRef\(false\)/);
  assert.match(profile, /const passwordRef = useRef\(false\)/);
});

//===================================================================

test('owner password and sessions stay account-scoped', () => {
  assert.match(profile, /updateCurrentUserPassword\(values\)/);
  assert.match(profile, /invalidateSession\('password_changed'\)/);
  assert.match(profile, /<ActiveSessionsPanel/);

  assert.match(
    profile,
    /getActiveSessions\(\{ signal: controller\.signal \}\)/
  );

  assert.match(profile, /revokeActiveSession\(sessionId\)/);
  assert.match(profile, /onRetry=\{reloadSessions\}/);

  assert.doesNotMatch(
    profile,
    /getMyPharmacyProfile|submitMyPharmacyModeration|sendMyPharmacyForVerification/
  );
});

//===================================================================

test('owner personal information is read-only and managed from Employees', () => {
  assert.match(
    profile,
    /<NameInput[\s\S]*?value=\{user\.name\}[\s\S]*?disabled/
  );

  assert.match(
    profile,
    /<PhoneInput[\s\S]*?value=\{user\.phone \?\? ''\}[\s\S]*?disabled/
  );

  assert.doesNotMatch(profile, /<EmailInput|handleSave|Save my data/);

  assert.match(
    profile,
    /Employee identity is managed from the Employees section/
  );
});
