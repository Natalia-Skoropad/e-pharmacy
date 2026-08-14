import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const repositoryRoot = new URL('../../../../', import.meta.url);

//===================================================================

async function readRepositoryFile(path: string): Promise<string> {
  return readFile(new URL(path, repositoryRoot), 'utf8');
}

//===================================================================

test('logout forwards refresh identity and always clears browser cookies', async () => {
  const [clientRoute, pharmacyRoute, backendRoutes, controller] =
    await Promise.all([
      readRepositoryFile('apps/client/src/app/api/auth/logout/route.ts'),
      readRepositoryFile('apps/pharmacy/src/app/api/auth/logout/route.ts'),
      readRepositoryFile('apps/api/src/routes/auth.routes.ts'),
      readRepositoryFile('apps/api/src/controllers/auth.controller.ts'),
    ]);

  for (const route of [clientRoute, pharmacyRoute]) {
    assert.match(route, /authCookieMode: 'refresh-only'/);
    assert.match(route, /markerAction: 'delete'/);
  }

  assert.match(
    backendRoutes,
    /authRoutes\.post\('\/logout', ctrlWrapper\(logoutUser\)\)/
  );

  assert.doesNotMatch(
    backendRoutes,
    /authRoutes\.post\('\/logout', authenticate/
  );

  assert.match(controller, /revokeSessionByRefreshTokenService/);
});

//===================================================================

test('logout-all also uses refresh identity and clears local cookies without a live access token', async () => {
  const [clientRoute, pharmacyRoute, backendRoutes, controller, authService] =
    await Promise.all([
      readRepositoryFile('apps/client/src/app/api/auth/logout-all/route.ts'),
      readRepositoryFile('apps/pharmacy/src/app/api/auth/logout-all/route.ts'),
      readRepositoryFile('apps/api/src/routes/auth.routes.ts'),
      readRepositoryFile('apps/api/src/controllers/auth.controller.ts'),
      readRepositoryFile('apps/api/src/services/auth.service.ts'),
    ]);

  for (const route of [clientRoute, pharmacyRoute]) {
    assert.match(route, /authCookieMode: 'refresh-only'/);
    assert.match(route, /markerAction: 'delete'/);
  }

  assert.match(
    backendRoutes,
    /authRoutes\.post\('\/logout-all', ctrlWrapper\(logoutAllUserSessions\)\)/
  );

  assert.doesNotMatch(
    backendRoutes,
    /authRoutes\.post\([\s\S]{0,80}'\/logout-all'[\s\S]{0,80}authenticate/
  );

  assert.match(controller, /revokeAllUserSessionsByRefreshTokensService/);

  assert.match(
    authService,
    /revokeAllUserSessionsByRefreshTokensService\([\s\S]*?expiresAt:\s*\{\s*\$gt: new Date\(\)\s*\}/
  );
});
