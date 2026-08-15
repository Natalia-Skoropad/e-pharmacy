import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readProfileSource(): Promise<string> {
  return readFile(
    new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
    'utf8'
  );
}

//===================================================================

test('owner profile PATCH responses update AuthUser directly without a follow-up current-user GET', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /const response = await updateCurrentUser\(\{[\s\S]*?expectedRevision: user\.revision[\s\S]*?\}\);[\s\S]*?applyCurrentUser\(response\.user\)/
  );

  assert.doesNotMatch(source, /reloadCurrentUser/);
});

//===================================================================

test('active pharmacy moderation uses one atomic browser command and supports already-saved pending changes', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /hasExistingPendingModeration[\s\S]*?pharmacy\?\.pendingModeration[\s\S]*?moderationFormHasChanges[\s\S]*?hasExistingPendingModeration/
  );

  assert.match(
    source,
    /const payload = await buildModerationPayload\(\);[\s\S]*?submitMyPharmacyModeration\(\{[\s\S]*?changes: payload,[\s\S]*?expectedRevision: pharmacy\.updatedAt/
  );

  assert.doesNotMatch(
    source,
    /handleSendForModeration[\s\S]*?await updateMyPharmacyProfile\([\s\S]*?await sendMyPharmacyForVerification\(/
  );
});

//===================================================================

test('pharmacy profile mutations use scoped synchronous mutex refs', async () => {
  const source = await readProfileSource();

  assert.match(source, /const ownerMutationInFlightRef = useRef\(false\)/);
  assert.match(source, /const passwordMutationInFlightRef = useRef\(false\)/);
  assert.match(source, /const pharmacyMutationInFlightRef = useRef\(false\)/);
  assert.match(source, /const sessionMutationInFlightRef = useRef\(false\)/);

  assert.match(
    source,
    /handleDocumentsSubmit[\s\S]*?pharmacyMutationInFlightRef\.current = true[\s\S]*?await buildDocumentsPayload/
  );

  assert.match(
    source,
    /handleSendForModeration[\s\S]*?pharmacyMutationInFlightRef\.current = true[\s\S]*?await buildModerationPayload/
  );

  assert.match(
    source,
    /handleRevokeSession[\s\S]*?if \(sessionMutationInFlightRef\.current\) return;/
  );

  assert.match(
    source,
    /handleLogoutAllSessions[\s\S]*?sessionMutationInFlightRef\.current/
  );
});
