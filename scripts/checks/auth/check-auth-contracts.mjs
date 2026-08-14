import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

//===================================================================

function extractQuotedValues(source, declarationName) {
  const match = source.match(
    new RegExp(`${declarationName}\\s*=\\s*\\[([\\s\\S]*?)\\]`)
  );

  assert.ok(match, `Could not find ${declarationName}`);
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

//===================================================================

function extractObjectStringValues(source, declarationName) {
  const match = source.match(
    new RegExp(`${declarationName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as const`)
  );

  assert.ok(match, `Could not find ${declarationName}`);
  return [...match[1].matchAll(/:\s*['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

//===================================================================

function extractZodObjectFields(source, declarationName) {
  const declarationIndex = source.indexOf(`export const ${declarationName}`);
  assert.notEqual(declarationIndex, -1, `Could not find ${declarationName}`);

  const objectIndex = source.indexOf('.object({', declarationIndex);
  assert.notEqual(objectIndex, -1, `Could not find ${declarationName} object`);

  const openingBraceIndex = source.indexOf('{', objectIndex);
  let depth = 0;
  let closingBraceIndex = -1;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) {
      closingBraceIndex = index;
      break;
    }
  }

  assert.notEqual(
    closingBraceIndex,
    -1,
    `Could not parse ${declarationName} object`
  );

  const body = source.slice(openingBraceIndex + 1, closingBraceIndex);

  return [...body.matchAll(/^\s{2,4}([A-Za-z][A-Za-z0-9]*):/gm)]
    .map((item) => item[1])
    .sort();
}

//===================================================================

function extractTypeFields(source, typeName) {
  const match = source.match(
    new RegExp(
      String.raw`type\s+${typeName}\s*=\s*(?:Readonly<)?\{([\s\S]*?)\}(?:>)?;`
    )
  );

  assert.ok(match, `Could not find type ${typeName}`);

  return [...match[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)(?:\?)?:/gm)]
    .map((item) => item[1])
    .sort();
}

//===================================================================

function extractFunctionCalls(source, functionName) {
  const calls = [];
  const marker = `${functionName}(`;
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const startIndex = source.indexOf(marker, searchIndex);
    if (startIndex === -1) break;

    let depth = 1;
    let quote = null;
    let escaped = false;
    let index = startIndex + marker.length;

    for (; index < source.length && depth > 0; index += 1) {
      const character = source[index];

      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === quote) quote = null;
        continue;
      }

      if (character === "'" || character === '"' || character === '`') {
        quote = character;
      } else if (character === '(') {
        depth += 1;
      } else if (character === ')') {
        depth -= 1;
      }
    }

    assert.equal(depth, 0, `Could not parse ${functionName} call`);
    calls.push(source.slice(startIndex, index));
    searchIndex = index;
  }

  return calls;
}

//===================================================================

const frontendAuthValues = await read(
  'packages',
  'config',
  'src',
  'auth',
  'domain-values.ts'
);

const frontendUserValues = await read(
  'packages',
  'config',
  'src',
  'users',
  'domain-values.ts'
);

const backendConstants = await read(
  'apps',
  'api',
  'src',
  'constants',
  'auth.ts'
);

assert.deepEqual(
  extractQuotedValues(frontendAuthValues, 'AUTH_APPLICATIONS').sort(),
  extractObjectStringValues(backendConstants, 'AUTH_APPLICATIONS').sort()
);

assert.deepEqual(
  extractQuotedValues(frontendAuthValues, 'USER_ROLES').sort(),
  extractObjectStringValues(backendConstants, 'USER_ROLES').sort()
);

assert.deepEqual(
  extractQuotedValues(frontendUserValues, 'USER_STATUSES').sort(),
  extractObjectStringValues(backendConstants, 'USER_STATUSES').sort()
);

const frontendCookies = await read(
  'packages',
  'config',
  'src',
  'auth',
  'cookie-names.ts'
);
for (const value of [
  'e_pharmacy_access_token',
  'e_pharmacy_refresh_token',
  'e_pharmacy_auth_token',
]) {
  assert.match(frontendCookies, new RegExp(value));
  assert.match(backendConstants, new RegExp(value));
}

assert.match(frontendCookies, /e_pharmacy_auth_ready/);

const nextApiCookies = await read(
  'packages',
  'next-api',
  'src',
  'internal',
  'auth-cookies.ts'
);

assert.match(nextApiCookies, /AUTH_READY_COOKIE_NAME/);

const frontendPayloads = await read(
  'packages',
  'types',
  'src',
  'auth',
  'payloads.ts'
);

const backendAuthSchema = await read(
  'apps',
  'api',
  'src',
  'schemas',
  'auth.schema.ts'
);

for (const [frontendType, backendSchema] of [
  ['RegisterPayload', 'registerSchema'],
  ['LoginPayload', 'loginSchema'],
  ['ForgotPasswordPayload', 'forgotPasswordSchema'],
  ['ResetPasswordPayload', 'resetPasswordSchema'],
  ['UpdateProfilePayload', 'updateProfileSchema'],
  ['UpdatePasswordPayload', 'updatePasswordSchema'],
]) {
  assert.deepEqual(
    extractTypeFields(frontendPayloads, frontendType),
    extractZodObjectFields(backendAuthSchema, backendSchema),
    `${frontendType} and ${backendSchema} fields differ`
  );
}

assert.match(frontendPayloads, /application:\s*Extract<AuthApplication/);

const loginSchemaBlock = backendAuthSchema.match(
  /export const loginSchema = z\.object\(\{([\s\S]*?)\n\}\);/
)?.[1];
assert.ok(loginSchemaBlock, 'Could not parse loginSchema');
assert.match(loginSchemaBlock, /application:\s*z\.enum/);
assert.doesNotMatch(loginSchemaBlock, /application:[\s\S]*?\.optional\(\)/);

const forgotPasswordSchemaBlock = backendAuthSchema.match(
  /export const forgotPasswordSchema = z\.object\(\{([\s\S]*?)\n\}\);/
)?.[1];
assert.ok(forgotPasswordSchemaBlock, 'Could not parse forgotPasswordSchema');
assert.doesNotMatch(forgotPasswordSchemaBlock, /AUTH_APPLICATIONS\.ADMIN/);

assert.match(frontendPayloads, /role\?:\s*Extract<UserRole/);

assert.match(
  backendAuthSchema,
  /registerSchema[\s\S]*?role:[\s\S]*?\.default\(/
);

const frontendAuthTypes = await read(
  'packages',
  'types',
  'src',
  'auth',
  'user.ts'
);

const frontendResponses = await read(
  'packages',
  'types',
  'src',
  'auth',
  'responses.ts'
);

const backendAuthTypes = await read('apps', 'api', 'src', 'types', 'auth.ts');

assert.deepEqual(
  extractTypeFields(frontendAuthTypes, 'AuthUser'),
  extractTypeFields(backendAuthTypes, 'AuthUserResponse')
);

assert.match(frontendResponses, /user:\s*AuthUser/);
assert.match(backendAuthTypes, /user:\s*AuthUserResponse/);

const frontendSessions = await read(
  'packages',
  'types',
  'src',
  'auth',
  'session.ts'
);

const backendSessions = await read('apps', 'api', 'src', 'types', 'session.ts');

assert.deepEqual(
  extractTypeFields(frontendSessions, 'ActiveSession'),
  extractTypeFields(backendSessions, 'SessionResponseDto')
);

const authErrorSource = await read(
  'packages',
  'auth',
  'src',
  'errors',
  'get-auth-error-code.ts'
);

for (const code of extractObjectStringValues(
  backendConstants,
  'AUTH_ERROR_CODES'
)) {
  assert.match(
    authErrorSource,
    new RegExp(code),
    `Missing frontend auth mapping for ${code}`
  );
}

assert.doesNotMatch(
  authErrorSource,
  /LEGACY_MESSAGE_MAP|getLegacyMessage|status === 401|status === 404|status === 409/,
  'Auth error mapping must not infer business semantics from legacy messages/statuses'
);

const nextApiTokens = await read(
  'packages',
  'next-api',
  'src',
  'internal',
  'auth-tokens.ts'
);

assert.match(nextApiTokens, /accessTokenExpiresIn/);
assert.match(nextApiTokens, /refreshTokenExpiresIn/);

const authService = await read(
  'apps',
  'api',
  'src',
  'services',
  'auth.service.ts'
);

const authController = await read(
  'apps',
  'api',
  'src',
  'controllers',
  'auth.controller.ts'
);

const authMiddleware = await read(
  'apps',
  'api',
  'src',
  'middlewares',
  'auth.middleware.ts'
);

const originMiddleware = await read(
  'apps',
  'api',
  'src',
  'middlewares',
  'origin.middleware.ts'
);

for (const [label, source] of [
  ['auth service', authService],
  ['auth controller', authController],
  ['auth middleware', authMiddleware],
  ['origin middleware', originMiddleware],
]) {
  const authHttpErrors = extractFunctionCalls(source, 'httpError');
  assert.ok(authHttpErrors.length > 0, `No httpError calls found in ${label}`);

  for (const call of authHttpErrors) {
    assert.match(
      call,
      /AUTH_ERROR_CODES\./,
      `${label} httpError must expose a stable AUTH_ERROR_CODES code: ${call}`
    );
  }
}

assert.match(authService, /password_changed/);

assert.ok(
  (authService.match(/revokeAllUserSessionsService\(/g) ?? []).length >= 3,
  'Password change and reset flows must revoke existing sessions'
);

const clientPasswordRoute = await read(
  'apps',
  'client',
  'src',
  'app',
  'api',
  'auth',
  'password',
  'route.ts'
);

const clientResetRoute = await read(
  'apps',
  'client',
  'src',
  'app',
  'api',
  'auth',
  'password-reset',
  'confirm',
  'route.ts'
);

assert.match(clientPasswordRoute, /clearAuthCookiesOnSuccess:\s*true/);
assert.match(clientResetRoute, /markerAction:\s*'delete'/);

const clientLoginForm = await read(
  'apps',
  'client',
  'src',
  'components',
  'auth',
  'LoginForm',
  'LoginForm.tsx'
);

assert.doesNotMatch(
  clientLoginForm,
  /error\.message(?:\.toLowerCase\(\))?\.includes\(/,
  'Login business behavior must use stable auth codes instead of backend copy'
);

const authResponseParser = await read(
  'packages',
  'validation',
  'src',
  'auth',
  'auth-response.ts'
);

assert.match(authResponseParser, /OBJECT_ID_PATTERN/);
assert.match(authResponseParser, /buildEmailError\(email\)/);
assert.match(authResponseParser, /buildPhoneError\(phone,/);
assert.match(authResponseParser, /buildPictureUrlError\(pictureUrl\)/);

const sharedDtoParsers = await read(
  'packages',
  'api-client',
  'src',
  'response',
  'shared-dto-parsers.ts'
);

assert.match(
  sharedDtoParsers,
  /requireObjectId\(record, 'id', 'active session'/
);

assert.match(sharedDtoParsers, /USER_ROLES\.has\(roleAtLogin\)/);

assert.match(
  sharedDtoParsers,
  /requireCanonicalIsoDateTime\([\s\S]*?'lastUsedAt'/
);

assert.match(
  sharedDtoParsers,
  /requireCanonicalIsoDateTime\([\s\S]*?'expiresAt'/
);

const authProviderCore = await read(
  'packages',
  'auth',
  'src',
  'core',
  'AuthProviderCore.tsx'
);

const interactiveSingleFlight = await read(
  'packages',
  'auth',
  'src',
  'core',
  'auth-interactive-single-flight.ts'
);

assert.match(interactiveSingleFlight, /class AuthInteractiveSingleFlight/);

assert.match(
  authProviderCore,
  /interactiveSingleFlightRef\.current\.run\(\s*['"]login['"]/
);

assert.match(
  authProviderCore,
  /interactiveSingleFlightRef\.current\.run\(\s*['"]register['"]/
);

const clientLogoutAllRoute = await read(
  'apps',
  'client',
  'src',
  'app',
  'api',
  'auth',
  'logout-all',
  'route.ts'
);

const pharmacyLogoutAllRoute = await read(
  'apps',
  'pharmacy',
  'src',
  'app',
  'api',
  'auth',
  'logout-all',
  'route.ts'
);

for (const routeSource of [clientLogoutAllRoute, pharmacyLogoutAllRoute]) {
  assert.match(routeSource, /authCookieMode:\s*['"]refresh-only['"]/);
  assert.match(routeSource, /markerAction:\s*['"]delete['"]/);
}

const clientBrowserAuth = await read(
  'apps',
  'client',
  'src',
  'lib',
  'api',
  'browser',
  'auth.api.ts'
);

const pharmacyBrowserAuth = await read(
  'apps',
  'pharmacy',
  'src',
  'lib',
  'api',
  'browser',
  'auth.api.ts'
);

assert.match(clientBrowserAuth, /export async function logoutAllUser\(/);
assert.match(pharmacyBrowserAuth, /export async function logoutAllUser\(/);

const clientAuthProvider = await read(
  'apps',
  'client',
  'src',
  'providers',
  'AuthProvider',
  'AuthProvider.tsx'
);

const pharmacyAuthProvider = await read(
  'apps',
  'pharmacy',
  'src',
  'providers',
  'AuthProvider',
  'AuthProvider.tsx'
);

assert.match(clientAuthProvider, /logoutAll:\s*logoutAllUser/);
assert.match(pharmacyAuthProvider, /logoutAll:\s*logoutAllUser/);
assert.match(authProviderCore, /clearAuthState\(['"]logout_all['"]\)/);
assert.match(authProviderCore, /manager\.start\(['"]logout-all['"]/);

const backendAuthRoutes = await read(
  'apps',
  'api',
  'src',
  'routes',
  'auth.routes.ts'
);

assert.match(
  backendAuthRoutes,
  /errorCode:\s*AUTH_ERROR_CODES\.VALIDATION_FAILED/,
  'Auth validation errors must expose a stable backend code'
);

for (const limiter of [
  'loginIpRateLimit',
  'loginAccountIpRateLimit',
  'loginProgressiveDelay',
  'registrationIpRateLimit',
  'registrationAccountRateLimit',
  'passwordResetRequestIpRateLimit',
  'passwordResetAccountRateLimit',
  'passwordResetConfirmIpRateLimit',
  'passwordResetTokenRateLimit',
  'passwordChangeIpRateLimit',
  'passwordChangeAccountRateLimit',
  'passwordChangeProgressiveDelay',
]) {
  assert.match(
    backendAuthRoutes,
    new RegExp(limiter),
    `Missing auth rate-limit dimension: ${limiter}`
  );
}

const logoutAllRouteBlock = backendAuthRoutes.match(
  /authRoutes\.post\(\s*['"]\/logout-all['"][\s\S]*?\);/
);

assert.ok(logoutAllRouteBlock, 'Could not find backend logout-all route');

assert.doesNotMatch(
  logoutAllRouteBlock[0],
  /\bauthenticate\b/,
  'Logout-all must use the refresh token as its browser identity proof.'
);

const backendAuthController = await read(
  'apps',
  'api',
  'src',
  'controllers',
  'auth.controller.ts'
);

assert.match(
  backendAuthController,
  /logoutAllUserSessions[\s\S]*?getRefreshTokensFromCookies\(req\)[\s\S]*?revokeAllUserSessionsByRefreshTokensService/
);

assert.match(
  authService,
  /revokeAllUserSessionsByRefreshTokensService[\s\S]*?const now = new Date\(\)[\s\S]*?revokedAt:\s*undefined[\s\S]*?expiresAt:\s*\{\s*\$gt:\s*now\s*\}[\s\S]*?absoluteExpiresAt/
);

const resetPasswordPage = await read(
  'apps',
  'client',
  'src',
  'app',
  '(public)',
  '(auth)',
  'reset-password',
  'page.tsx'
);

const resetPasswordForm = await read(
  'apps',
  'client',
  'src',
  'components',
  'auth',
  'ResetPasswordForm',
  'ResetPasswordForm.tsx'
);

const clientNextConfig = await read('apps', 'client', 'next.config.ts');

assert.doesNotMatch(
  resetPasswordPage,
  /searchParams|token=/,
  'Reset token must not be serialized from the server page into client props'
);

assert.match(resetPasswordForm, /window\.history\.replaceState/);
assert.doesNotMatch(resetPasswordForm, /localStorage|sessionStorage/);

assert.match(
  clientNextConfig,
  /Referrer-Policy['"],\s*value:\s*['"]no-referrer/
);

assert.match(authService, /createPasswordResetUrl/);

assert.doesNotMatch(
  authService,
  /searchParams\.set\(['"]token['"]/,
  'New reset links must keep raw secrets out of the HTTP query string'
);

console.log('Auth contract parity check passed.');
