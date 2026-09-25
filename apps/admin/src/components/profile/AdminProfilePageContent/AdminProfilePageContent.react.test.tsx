import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  new URL('./AdminProfilePageContent.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('regular admins keep identity fields read-only while Platform Owner gets Save', () => {
  assert.match(source, /const isPlatformOwner = access\.isPlatformOwner/);

  assert.match(
    source,
    /\{isPlatformOwner \? \([\s\S]*?Save changes[\s\S]*?\) : null\}/
  );

  assert.equal(
    (
      source.match(
        /disabled=\{\s*!isPlatformOwner \|\| isSavingIdentity \|\| isSavingPicture\s*\}/g
      ) ?? []
    ).length,
    2,
    'Name and email must both be read-only for a regular admin employee'
  );
});

//===================================================================

test('profile and picture mutations carry optimistic revision and refresh current user', () => {
  assert.equal(
    (source.match(/expectedRevision:\s*user\.revision/g) ?? []).length,
    2
  );

  assert.equal(
    (source.match(/applyCurrentUser\(response\.user\)/g) ?? []).length,
    2
  );

  assert.match(source, /pictureUrl:\s*nextPictureUrl/);
  assert.match(source, /profileMutationInFlightRef/);
});

//===================================================================

test('profile tab resources stay lazy instead of mounting on initial personal view', () => {
  assert.match(
    source,
    /activeTab === DOCUMENTS_TAB \? \([\s\S]*?<AdminDocuments isPlatformOwner=\{isPlatformOwner\}/
  );

  assert.match(
    source,
    /activeTab === COMMENTS_TAB \? <AdminPrivateComments \/> : null/
  );

  assert.match(source, /if \(activeTab !== SESSIONS_TAB \|\| !user\) return;/);
});

//===================================================================

test('password and session security mutations end in the login lifecycle', () => {
  assert.match(
    source,
    /await updateCurrentUserPassword\(values\)[\s\S]*?invalidateSession\('password_changed'\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );

  assert.match(
    source,
    /handleLogoutAllSessions[\s\S]*?await logoutAll\(\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );
});
