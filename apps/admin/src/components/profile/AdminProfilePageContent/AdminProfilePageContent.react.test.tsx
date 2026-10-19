import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  new URL('./AdminProfilePageContent.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('admin personal information is read-only and shows name plus phone', () => {
  assert.match(
    source,
    /<NameInput[\s\S]*?value=\{user\.name\}[\s\S]*?disabled/
  );

  assert.match(
    source,
    /<PhoneInput[\s\S]*?value=\{user\.phone\}[\s\S]*?disabled/
  );

  assert.doesNotMatch(source, /Save changes/);
  assert.doesNotMatch(source, /EmailInput/);
});

//===================================================================

test('profile picture mutation keeps optimistic revision and refreshes current user', () => {
  assert.match(source, /expectedRevision:\s*user\.revision/);
  assert.match(source, /applyCurrentUser\(response\.user\)/);
  assert.match(source, /pictureUrl:\s*nextPictureUrl/);
  assert.match(source, /profileMutationInFlightRef/);
});

//===================================================================

test('document and comment tab bodies load only when selected', () => {
  assert.doesNotMatch(source, /getMyAdminDocuments/);
  assert.doesNotMatch(source, /getMyAdminPrivateComments/);
  assert.match(source, /label: 'Documents'/);
  assert.match(source, /label: 'Comments'/);

  assert.match(
    source,
    /activeTab === DOCUMENTS_TAB\s*\?\s*\(?\s*<AdminDocuments\s*\/>\s*\)?\s*:\s*null/
  );

  assert.match(
    source,
    /activeTab === COMMENTS_TAB\s*\?\s*\(?\s*<AdminPrivateComments\s*\/>\s*\)?\s*:\s*null/
  );
});

//===================================================================

test('password errors are toast-only and session security mutations end in login lifecycle', () => {
  assert.doesNotMatch(source, /passwordSubmitError/);
  assert.match(source, /toast\.error\(getAdminPasswordChangeErrorMessage/);

  assert.match(
    source,
    /await updateCurrentUserPassword\(values\)[\s\S]*?invalidateSession\('password_changed'\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );

  assert.match(
    source,
    /handleLogoutAllSessions[\s\S]*?await logoutAll\(\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );
});
