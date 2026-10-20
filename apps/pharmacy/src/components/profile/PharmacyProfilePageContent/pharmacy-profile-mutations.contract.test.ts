import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const profile = readFileSync(
  new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('owner PATCH and picture mutation both apply canonical auth user and use revision concurrency', () => {
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

test('the personal form exposes editable name/phone and read-only email', () => {
  assert.match(profile, /<NameInput/);
  assert.match(profile, /<PhoneInput/);

  assert.match(
    profile,
    /<EmailInput[\s\S]*?value=\{user\.email\}[\s\S]*?disabled/
  );

  assert.match(
    profile,
    /onSubmit=\{\(event\) => \{ event\.preventDefault\(\); void handleSave\(\); \}\}/
  );
});
