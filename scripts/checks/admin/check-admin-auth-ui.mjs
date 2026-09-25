import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

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

const adminAuthPages = [
  ['(auth)', '(guest)', 'login', 'page.tsx'],
  ['(auth)', '(guest)', 'password-recovery', 'page.tsx'],
  ['(auth)', 'reset-password', 'page.tsx'],
];

for (const pagePath of adminAuthPages) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', ...pagePath),
    true,
    `Stage 10 admin auth page must exist: ${pagePath.join('/')}`
  );
}

for (const routePath of [
  ['login', 'route.ts'],
  ['password-reset', 'request', 'route.ts'],
  ['password-reset', 'confirm', 'route.ts'],
]) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', 'api', 'auth', ...routePath),
    true,
    `Stage 10 admin auth BFF route must exist: ${routePath.join('/')}`
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
  'Admin public registration BFF must not exist'
);

//===================================================================

const [
  loginPage,
  recoveryPage,
  resetPage,
  loginForm,
  recoveryForm,
  resetForm,
  guestRoute,
  authProvider,
  loginDestination,
  loginBff,
  recoveryBff,
  resetBff,
  clientLoginPage,
  clientRecoveryPage,
  clientResetPage,
] = await Promise.all([
  read('apps', 'admin', 'src', 'app', '(auth)', '(guest)', 'login', 'page.tsx'),

  read(
    'apps',
    'admin',
    'src',
    'app',
    '(auth)',
    '(guest)',
    'password-recovery',
    'page.tsx'
  ),

  read('apps', 'admin', 'src', 'app', '(auth)', 'reset-password', 'page.tsx'),
  read('apps', 'admin', 'src', 'components', 'auth', 'AdminLoginForm.tsx'),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'auth',
    'AdminPasswordRecoveryForm.tsx'
  ),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'auth',
    'AdminResetPasswordForm.tsx'
  ),

  read('apps', 'admin', 'src', 'components', 'auth', 'AdminGuestOnlyRoute.tsx'),
  read('apps', 'admin', 'src', 'providers', 'AuthProvider', 'AuthProvider.tsx'),
  read('apps', 'admin', 'src', 'lib', 'auth', 'resolve-login-destination.ts'),
  read('apps', 'admin', 'src', 'app', 'api', 'auth', 'login', 'route.ts'),

  read(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'auth',
    'password-reset',
    'request',
    'route.ts'
  ),

  read(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'auth',
    'password-reset',
    'confirm',
    'route.ts'
  ),

  read(
    'apps',
    'client',
    'src',
    'app',
    '(public)',
    '(auth)',
    '(guest)',
    'login',
    'page.tsx'
  ),

  read(
    'apps',
    'client',
    'src',
    'app',
    '(public)',
    '(auth)',
    '(guest)',
    'password-recovery',
    'page.tsx'
  ),

  read(
    'apps',
    'client',
    'src',
    'app',
    '(public)',
    '(auth)',
    'reset-password',
    'page.tsx'
  ),
]);

for (const page of [loginPage, recoveryPage, resetPage]) {
  assert.match(page, /AuthPageShell/);
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
}

for (const clientPage of [
  clientLoginPage,
  clientRecoveryPage,
  clientResetPage,
]) {
  assert.match(clientPage, /AuthPageShell/);
}

assert.match(loginForm, /AuthFormLayout/);
assert.match(loginForm, /application:\s*['"]admin['"]/);
assert.match(loginForm, /ADMIN_ROUTES\.PASSWORD_RECOVERY/);
assert.match(loginForm, /resolveAdminLoginDestination/);
assert.doesNotMatch(loginForm, /REGISTER|\/register|RadioOption/);

assert.match(recoveryForm, /AuthFormLayout/);
assert.match(recoveryForm, /application:\s*['"]admin['"]/);

assert.match(
  recoveryForm,
  /If an account with that email exists, you will receive password reset instructions/
);

assert.match(recoveryForm, /submitInFlightRef/);
assert.doesNotMatch(recoveryForm, /REGISTER|\/register|RadioOption/);

assert.match(resetForm, /AuthFormLayout/);
assert.match(resetForm, /captureResetPasswordToken/);
assert.match(resetForm, /clearResetPasswordTokenFromHistoryState/);
assert.match(resetForm, /submitInFlightRef/);
assert.match(resetForm, /invalidateSession\('password_reset'\)/);

assert.doesNotMatch(
  resetForm,
  /localStorage|sessionStorage|document\s*\.\s*cookie/
);

assert.match(guestRoute, /GuestOnlyRoute/);
assert.match(authProvider, /login:\s*loginUser/);
assert.match(authProvider, /logoutAll:\s*logoutAllUser/);
assert.doesNotMatch(authProvider, /\bregister\s*:/);

assert.match(loginDestination, /getSafeApplicationRedirectPath/);
assert.match(loginDestination, /fallbackPath:\s*ADMIN_ROUTES\.PROFILE/);

assert.match(
  loginDestination,
  /allowedPrefixes:\s*ADMIN_ALLOWED_REDIRECT_PREFIXES/
);

assert.match(loginBff, /backendPath:\s*authRoutes\.login/);
assert.match(loginBff, /markerAction:\s*['"]set['"]/);
assert.match(recoveryBff, /backendPath:\s*authRoutes\.passwordResetRequest/);
assert.match(resetBff, /backendPath:\s*authRoutes\.passwordResetConfirm/);
assert.match(resetBff, /cookieCleanup:\s*['"]on-success['"]/);

//===================================================================

const rootPackage = JSON.parse(await read('package.json'));
const authUiCheck = 'pnpm check:admin-auth-ui';

assert.equal(
  rootPackage.scripts['check:admin-auth-ui'],
  'node scripts/checks/admin/check-admin-auth-ui.mjs'
);

for (const scriptName of ['check:admin', 'check:before-deploy']) {
  const steps = rootPackage.scripts[scriptName].split(/\s*&&\s*/);

  assert.equal(
    steps.filter((step) => step === authUiCheck).length,
    1,
    `${authUiCheck} must run exactly once in ${scriptName}`
  );
}

console.log('Admin Stage 10 auth UI structural checks passed.');
