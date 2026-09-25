import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('admin profile exposes the complete Stage 10.7 self-service tabs', async () => {
  const source = await read('./AdminProfilePageContent.tsx');

  assert.match(source, /ChangePasswordForm/);
  assert.match(source, /ActiveSessionsPanel/);
  assert.match(source, /label: 'Personal information'/);
  assert.match(source, /label: 'Documents'/);
  assert.match(source, /label: 'Comments'/);
  assert.match(source, /label: 'Active sessions'/);
  assert.match(source, /<AdminDocuments isPlatformOwner=\{isPlatformOwner\}/);

  assert.match(
    source,
    /activeTab === COMMENTS_TAB \? <AdminPrivateComments \/> : null/
  );
});

//===================================================================

test('password change uses the existing auth lifecycle and returns to login', async () => {
  const source = await read('./AdminProfilePageContent.tsx');

  assert.match(
    source,
    /await updateCurrentUserPassword\(values\)[\s\S]*?invalidateSession\('password_changed'\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );

  assert.match(
    source,
    /getAdminPasswordChangeErrorMessage\([\s\S]*?getAuthErrorCode\(error\)/
  );
});

//===================================================================

test('active sessions load lazily and keep load errors distinct from an empty list', async () => {
  const source = await read('./AdminProfilePageContent.tsx');

  assert.match(source, /if \(activeTab !== SESSIONS_TAB \|\| !user\) return;/);

  assert.match(source, /setSessionsStatus\('error'\)/);

  assert.match(
    source,
    /setSessionsError\('Could not load active sessions\. Please try again\.'\)/
  );

  assert.doesNotMatch(
    source,
    /catch\([^)]*\)[\s\S]{0,400}?setSessions\(\[\]\)/
  );

  assert.match(
    source,
    /<ActiveSessionsPanel[\s\S]*?status=\{sessionsStatus\}[\s\S]*?error=\{sessionsError\}[\s\S]*?onRetry=/
  );
});

//===================================================================

test('session mutations are single-flight and refresh the list after revoke', async () => {
  const source = await read('./AdminProfilePageContent.tsx');

  assert.match(source, /const sessionMutationInFlightRef = useRef\(false\)/);

  assert.match(
    source,
    /handleRevokeSession[\s\S]*?sessionMutationInFlightRef\.current[\s\S]*?await revokeActiveSession\(sessionId\)[\s\S]*?setSessionsReloadKey/
  );

  assert.match(
    source,
    /handleLogoutAllSessions[\s\S]*?await logoutAll\(\)[\s\S]*?window\.location\.replace\(ADMIN_ROUTES\.LOGIN\)/
  );
});

//===================================================================

test('admin auth BFF routes proxy canonical password and session endpoints safely', async () => {
  const [passwordRoute, sessionsRoute, sessionRoute, logoutAllRoute] =
    await Promise.all([
      read('../../../app/api/auth/password/route.ts'),
      read('../../../app/api/auth/sessions/route.ts'),
      read('../../../app/api/auth/sessions/[sessionId]/route.ts'),
      read('../../../app/api/auth/logout-all/route.ts'),
    ]);

  assert.match(passwordRoute, /backendPath: authRoutes\.password/);
  assert.match(passwordRoute, /clearAuthCookiesOnSuccess: true/);

  assert.match(sessionsRoute, /backendPath: authRoutes\.sessions/);
  assert.match(sessionRoute, /authRoutes\.session\(sessionId\)/);

  assert.match(logoutAllRoute, /backendPath: authRoutes\.logoutAll/);
  assert.match(logoutAllRoute, /cookieCleanup: 'always'/);
  assert.match(logoutAllRoute, /authCookieMode: 'refresh-only'/);
});

//===================================================================

test('admin AuthProvider exposes logoutAll through the shared auth core', async () => {
  const provider = await read(
    '../../../providers/AuthProvider/AuthProvider.tsx'
  );

  assert.match(provider, /logoutAllUser/);
  assert.match(provider, /logoutAll: logoutAllUser/);
});
