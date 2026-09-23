import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const protectedRoute = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminProtectedRoute.tsx'
);

const adminLayout = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'layout.tsx'
);

const authProvider = await read(
  'apps',
  'admin',
  'src',
  'providers',
  'AuthProvider',
  'AuthProvider.tsx'
);

const adminProviders = await read(
  'apps',
  'admin',
  'src',
  'providers',
  'AdminProviders.tsx'
);

const browserAuthApi = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'browser',
  'auth.api.ts'
);

const apiRoutes = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'routes',
  'admin-api-routes.ts'
);

const routeAccess = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'auth',
  'admin-route-access.ts'
);

const destinations = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'auth',
  'app-destinations.ts'
);

const adminRoutes = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'routes',
  'admin-routes.ts'
);

const meRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'auth',
  'me',
  'route.ts'
);

const logoutRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'auth',
  'logout',
  'route.ts'
);

//===================================================================

assert.match(protectedRoute, /^\s*['"]use client['"];?/);
assert.match(protectedRoute, /RoleProtectedRoute/);
assert.match(protectedRoute, /allowedRoles=\{\['admin'\]\}/);
assert.match(protectedRoute, /authorizeUser=\{canAccessAdminPrivateRoutes\}/);
assert.match(protectedRoute, /loginPath=\{ADMIN_ROUTES\.LOGIN\}/);
assert.match(protectedRoute, /resolveTrustedAdminExternalRedirect/);
assert.match(protectedRoute, /PageLoader/);
assert.match(protectedRoute, /ErrorPage/);
assert.match(protectedRoute, /retryAuthBootstrap/);
assert.match(protectedRoute, /STATUS_PAGE_IMAGE/);

assert.doesNotMatch(
  protectedRoute,
  /document\s*\.\s*cookie|localStorage|sessionStorage|accessToken|refreshToken|jwtDecode/
);

assert.doesNotMatch(
  protectedRoute,
  /\bfetch\s*\(|localApiRequest|API_BASE_URL|Authorization/
);

//===================================================================

assert.doesNotMatch(adminLayout, /['"]use client['"]/);
assert.match(adminLayout, /AdminProtectedRoute/);

assert.match(
  adminLayout,
  /<AdminProtectedRoute>\{children\}<\/AdminProtectedRoute>/
);

assert.match(routeAccess, /user\.role === ['"]admin['"]/);
assert.match(routeAccess, /user\.status === ['"]active['"]/);

//===================================================================

assert.match(authProvider, /^\s*['"]use client['"];?/);
assert.match(authProvider, /AuthProviderCore/);
assert.match(authProvider, /getCurrentUser/);
assert.match(authProvider, /logout:\s*logoutUser/);
assert.match(authProvider, /bootstrapMode=['"]always['"]/);
assert.doesNotMatch(authProvider, /\bregister\s*:/);
assert.doesNotMatch(authProvider, /\blogin\s*:/);

assert.match(adminProviders, /<ToastProvider>/);
assert.match(adminProviders, /<AuthProvider>\{children\}<\/AuthProvider>/);

//===================================================================

assert.match(apiRoutes, /localAuthApiRoutes\.current/);
assert.match(apiRoutes, /localAuthApiRoutes\.logout/);

assert.match(browserAuthApi, /localApiRequest/);
assert.match(browserAuthApi, /parseAuthResponse/);
assert.match(browserAuthApi, /parseApiResponseData/);
assert.match(browserAuthApi, /parseApiEmptyResponse/);
assert.doesNotMatch(browserAuthApi, /API_BASE_URL|NEXT_PUBLIC_API_URL/);
assert.doesNotMatch(browserAuthApi, /accessToken|refreshToken|Authorization/);

assert.match(meRoute, /createPrivateProxyRoute/);
assert.match(meRoute, /backendPath:\s*authRoutes\.current/);
assert.match(meRoute, /method:\s*['"]GET['"]/);
assert.doesNotMatch(meRoute, /export const PATCH/);

assert.match(logoutRoute, /createAuthProxyRoute/);
assert.match(logoutRoute, /backendPath:\s*authRoutes\.logout/);
assert.match(logoutRoute, /cookieCleanup:\s*['"]always['"]/);
assert.match(logoutRoute, /authCookieMode:\s*['"]refresh-only['"]/);

//===================================================================

assert.match(adminRoutes, /LOGIN:\s*['"]\/login['"]/);

assert.match(destinations, /NEXT_PUBLIC_CLIENT_APP_URL/);
assert.match(destinations, /NEXT_PUBLIC_PHARMACY_APP_URL/);
assert.match(destinations, /getTrustedExternalRedirectUrl/);
assert.match(destinations, /INSECURE_PRODUCTION_URL/);
assert.match(destinations, /CREDENTIALS_NOT_ALLOWED/);
assert.match(destinations, /QUERY_OR_HASH_NOT_ALLOWED/);
assert.match(destinations, /\/pharmacy\/dashboard/);

const envExample = await read('apps', 'admin', '.env.example');

assert.match(
  envExample,
  /NEXT_PUBLIC_PHARMACY_APP_URL=http:\/\/localhost:3002/
);

//===================================================================

for (const futurePath of [
  ['login', 'page.tsx'],
  ['password-recovery', 'page.tsx'],
  ['reset-password', 'page.tsx'],
]) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', ...futurePath),
    false,
    `Stage 4 must not create ${futurePath.join('/')}`
  );
}

for (const futureApiPath of [
  ['login', 'route.ts'],
  ['password-reset', 'request', 'route.ts'],
  ['password-reset', 'confirm', 'route.ts'],
]) {
  assert.equal(
    await exists(
      'apps',
      'admin',
      'src',
      'app',
      'api',
      'auth',
      ...futureApiPath
    ),
    false,
    `Stage 4 must not create auth UI BFF ${futureApiPath.join('/')}`
  );
}

//===================================================================

const rootPackage = JSON.parse(await read('package.json'));
const protectedCheck = 'pnpm check:admin-protected-route';

assert.equal(
  rootPackage.scripts['check:admin-protected-route'],
  'node scripts/checks/admin/check-admin-protected-route.mjs'
);

const adminCheck = rootPackage.scripts['check:admin'].split(/\s*&&\s*/);

assert.equal(
  adminCheck.filter((step) => step === protectedCheck).length,
  1,
  'check:admin-protected-route must run exactly once in check:admin'
);

assert.ok(
  adminCheck.indexOf(protectedCheck) >
    adminCheck.indexOf('pnpm check:admin-auth-foundation'),
  'Stage 4 check must follow Stage 3 auth foundation check'
);

assert.ok(
  adminCheck.indexOf(protectedCheck) <
    adminCheck.indexOf('pnpm --filter @e-pharmacy/admin lint'),
  'Stage 4 check must run before lint/type-check/build'
);

const deploy = rootPackage.scripts['check:before-deploy'].split(/\s*&&\s*/);

assert.equal(
  deploy.filter((step) => step === protectedCheck).length,
  1,
  'check:admin-protected-route must run exactly once in check:before-deploy'
);

assert.ok(
  deploy.indexOf(protectedCheck) < deploy.indexOf('pnpm lint'),
  'Stage 4 check must run before workspace lint'
);

assert.ok(
  !deploy.includes('pnpm check:admin'),
  'check:before-deploy must not duplicate the full admin check'
);

console.log('Admin protected-route structural check passed.');
