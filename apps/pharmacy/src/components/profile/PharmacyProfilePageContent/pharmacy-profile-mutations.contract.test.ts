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
    /hasExistingPendingModeration[\s\S]*?pharmacy\.pendingModeration[\s\S]*?moderationFormHasChanges[\s\S]*?hasExistingPendingModeration/
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

//===================================================================

test('profile comments count is owned by EntityComments without an eager duplicate request', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /const \[commentsTotal, setCommentsTotal\] = useState<number \| null>\(null\)/
  );

  assert.doesNotMatch(source, /async function loadCommentsTotal/);

  assert.match(
    source,
    /commentsTotal === null \? 'Comments' : `Comments \(\$\{commentsTotal\}\)`/
  );

  assert.match(source, /initialTotal=\{commentsTotal \?\? undefined\}/);
  assert.match(source, /onTotalChange=\{setCommentsTotal\}/);
});

//===================================================================

test('active sessions distinguish load errors from a real empty result and expose retry', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /type SessionsStatus = 'loading' \| 'success' \| 'error'/
  );

  assert.match(
    source,
    /const \[sessionsError, setSessionsError\] = useState\(''\)/
  );

  assert.match(source, /setSessionsStatus\('error'\)/);
  assert.match(source, /Could not load active sessions\. Please try again\./);

  assert.doesNotMatch(
    source,
    /catch \(error\)[\s\S]{0,500}?setSessions\(\[\]\)/
  );

  assert.match(
    source,
    /sessionsStatus === 'error'[\s\S]*?onClick=\{\(\) => void loadSessions\(\)\}[\s\S]*?>\s*Retry\s*</
  );

  assert.match(
    source,
    /sessionsStatus === 'success'[\s\S]*?No active sessions found/
  );
});

//===================================================================

test('profile tabs use the shared TabPanel contract without eagerly mounting tab resources', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /import \{ TabPanel, Tabs \} from '@e-pharmacy\/ui\/navigation'/
  );

  assert.match(source, /const PROFILE_TABS_ID_BASE = 'pharmacy-profile-tabs'/);
  assert.match(source, /<Tabs[\s\S]*?idBase=\{PROFILE_TABS_ID_BASE\}/);

  assert.match(
    source,
    /<TabPanel[\s\S]*?value="comments"[\s\S]*?activeValue=\{activeTab\}[\s\S]*?\{activeTab === 'comments' \? \(/
  );

  assert.doesNotMatch(source, /className=\{css\.tabPanel\} role="tabpanel"/);
});

//===================================================================

test('profile save sections use native form submission and current-account copy', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /<form[\s\S]*?aria-labelledby="account-data-title"[\s\S]*?onSubmit=\{\(event\) => \{[\s\S]*?handleOwnerSubmit\(\)[\s\S]*?<Button[\s\S]*?type="submit"[\s\S]*?Save my data/
  );

  assert.match(
    source,
    /<form[\s\S]*?aria-labelledby="password-title"[\s\S]*?onSubmit=\{\(event\) => \{[\s\S]*?handlePasswordSubmit\(\)[\s\S]*?<Button[\s\S]*?type="submit"[\s\S]*?Change password/
  );

  for (const handler of [
    'handlePharmacySubmit',
    'handleAboutSubmit',
    'handlePaymentSubmit',
    'handleDocumentsSubmit',
  ]) {
    assert.match(
      source,
      new RegExp(
        `<form[\\s\\S]*?onSubmit=\\{\\(event\\) => \\{[\\s\\S]*?void ${handler}\\(\\);[\\s\\S]*?<Button[\\s\\S]*?type="submit"`
      )
    );
  }

  assert.doesNotMatch(source, />\s*Owner data\s*</);
  assert.doesNotMatch(source, />\s*Save owner data\s*</);
  assert.doesNotMatch(source, /owner\s+login password/i);
  assert.match(source, />\s*My data\s*</);
  assert.match(source, />\s*Save my data\s*</);
});
