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

test('document and comment counts preload while tab bodies remain conditional', () => {
  assert.match(source, /getMyAdminDocuments/);
  assert.match(source, /setDocumentsCount\(response\.documents\.length\)/);
  assert.match(source, /getMyAdminPrivateComments\(1/);
  assert.match(source, /setCommentsCount\(response\.total\)/);
  assert.match(source, /label: `Documents \(\$\{documentsCount\}\)`/);
  assert.match(source, /label: `Comments \(\$\{commentsCount\}\)`/);

  assert.match(
    source,
    /activeTab === DOCUMENTS_TAB\s*\?\s*\(?\s*<AdminDocuments\s*\/>\s*\)?\s*:\s*null/
  );

  assert.match(
    source,
    /activeTab === COMMENTS_TAB\s*\?\s*\(?\s*<AdminPrivateComments\s+onTotalChange=\{setCommentsCount\}\s*\/>\s*\)?\s*:\s*null/
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
