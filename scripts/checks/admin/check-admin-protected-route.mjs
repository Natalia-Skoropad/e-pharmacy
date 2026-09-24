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

const guestRoute = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminGuestOnlyRoute.tsx'
);

const loginForm = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminLoginForm.tsx'
);

const recoveryForm = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminPasswordRecoveryForm.tsx'
);

const resetForm = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminResetPasswordForm.tsx'
);

const loginDestination = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'auth',
  'resolve-login-destination.ts'
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

const loginRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'auth',
  'login',
  'route.ts'
);

const recoveryRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'auth',
  'password-reset',
  'request',
  'route.ts'
);

const resetRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'auth',
  'password-reset',
  'confirm',
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

assert.match(guestRoute, /^\s*['"]use client['"];?/);
assert.match(guestRoute, /GuestOnlyRoute/);
assert.match(guestRoute, /resolveAdminLoginDestination/);
assert.match(guestRoute, /allowGuestContentWhenUnavailable/);
assert.match(guestRoute, /Checking admin session/);

assert.match(loginDestination, /getSafeApplicationRedirectPath/);

assert.match(
  loginDestination,
  /allowedPrefixes:\s*ADMIN_ALLOWED_REDIRECT_PREFIXES/
);

assert.match(loginDestination, /fallbackPath:\s*ADMIN_ROUTES\.PROFILE/);
assert.match(loginDestination, /\['\/admin'\]/);

//===================================================================

assert.doesNotMatch(adminLayout, /['"]use client['"]/);
assert.match(adminLayout, /AdminProtectedRoute/);
assert.match(adminLayout, /AdminShell/);

assert.match(
  adminLayout,
  /<AdminProtectedRoute>[\s\S]*<AdminShell>\{children\}<\/AdminShell>[\s\S]*<\/AdminProtectedRoute>/
);

assert.match(routeAccess, /user\.role === ['"]admin['"]/);
assert.match(routeAccess, /user\.status === ['"]active['"]/);

//===================================================================

assert.match(authProvider, /^\s*['"]use client['"];?/);
assert.match(authProvider, /AuthProviderCore/);
assert.match(authProvider, /getCurrentUser/);
assert.match(authProvider, /login:\s*loginUser/);
assert.match(authProvider, /logout:\s*logoutUser/);
assert.match(authProvider, /bootstrapMode=['"]always['"]/);
assert.doesNotMatch(authProvider, /\bregister\s*:/);

assert.match(adminProviders, /<ToastProvider>/);
assert.match(adminProviders, /<AuthProvider>\{children\}<\/AuthProvider>/);

//===================================================================

for (const localRoute of [
  'current',
  'login',
  'logout',
  'passwordResetRequest',
  'passwordResetConfirm',
]) {
  assert.match(apiRoutes, new RegExp(`localAuthApiRoutes\\.${localRoute}`));
}

for (const browserMethod of [
  'loginUser',
  'requestPasswordReset',
  'resetPassword',
  'getCurrentUser',
  'logoutUser',
]) {
  assert.match(browserAuthApi, new RegExp(`function\\s+${browserMethod}`));
}

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

assert.match(loginRoute, /createAuthProxyRoute/);
assert.match(loginRoute, /backendPath:\s*authRoutes\.login/);
assert.match(loginRoute, /markerAction:\s*['"]set['"]/);

assert.match(recoveryRoute, /createAuthProxyRoute/);
assert.match(recoveryRoute, /backendPath:\s*authRoutes\.passwordResetRequest/);

assert.match(resetRoute, /createAuthProxyRoute/);
assert.match(resetRoute, /backendPath:\s*authRoutes\.passwordResetConfirm/);
assert.match(resetRoute, /cookieCleanup:\s*['"]on-success['"]/);

//===================================================================

for (const [name, route] of [
  ['LOGIN', '/login'],
  ['PASSWORD_RECOVERY', '/password-recovery'],
  ['RESET_PASSWORD', '/reset-password'],
  ['PROFILE', '/admin/profile'],
]) {
  assert.match(adminRoutes, new RegExp(`${name}:\\s*['"]${route}['"]`));
}

assert.match(loginForm, /application:\s*['"]admin['"]/);
assert.match(loginForm, /resolveAdminLoginDestination/);
assert.match(loginForm, /ADMIN_ROUTES\.PASSWORD_RECOVERY/);
assert.doesNotMatch(loginForm, /RadioOption|REGISTER|\/register/);

assert.match(recoveryForm, /application:\s*['"]admin['"]/);

assert.match(
  recoveryForm,
  /If an account with that email exists, you will receive password reset instructions/
);

assert.doesNotMatch(recoveryForm, /RadioOption|REGISTER|\/register/);

assert.match(resetForm, /captureResetPasswordToken/);
assert.match(resetForm, /clearResetPasswordTokenFromHistoryState/);

assert.doesNotMatch(
  resetForm,
  /localStorage|sessionStorage|document\s*\.\s*cookie/
);

for (const pagePath of [
  ['(auth)', '(guest)', 'login', 'page.tsx'],
  ['(auth)', '(guest)', 'password-recovery', 'page.tsx'],
  ['(auth)', 'reset-password', 'page.tsx'],
]) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', ...pagePath),
    true,
    `Stage 10.2 auth page must exist: ${pagePath.join('/')}`
  );
}

assert.equal(
  await exists('apps', 'admin', 'src', 'app', 'register', 'page.tsx'),
  false,
  'Admin public registration page must not exist'
);

assert.equal(
  await exists(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'auth',
    'register',
    'route.ts'
  ),
  false,
  'Admin public registration BFF route must not exist'
);

//===================================================================

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
  'Admin protected/auth UI check must follow the auth foundation check'
);

assert.ok(
  adminCheck.indexOf(protectedCheck) <
    adminCheck.indexOf('pnpm --filter @e-pharmacy/admin lint'),
  'Admin protected/auth UI check must run before lint/type-check/build'
);

const deploy = rootPackage.scripts['check:before-deploy'].split(/\s*&&\s*/);

assert.equal(
  deploy.filter((step) => step === protectedCheck).length,
  1,
  'check:admin-protected-route must run exactly once in check:before-deploy'
);

assert.ok(
  deploy.indexOf(protectedCheck) < deploy.indexOf('pnpm lint'),
  'Admin protected/auth UI check must run before workspace lint'
);

assert.ok(
  !deploy.includes('pnpm check:admin'),
  'check:before-deploy must not duplicate the full admin check'
);

console.log(
  'Admin protected-route and Stage 10.2 auth UI structural check passed.'
);
