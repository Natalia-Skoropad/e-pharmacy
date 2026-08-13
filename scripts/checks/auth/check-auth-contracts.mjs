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

assert.match(frontendPayloads, /application\?:\s*Extract<AuthApplication/);

assert.match(
  backendAuthSchema,
  /loginSchema[\s\S]*?application:[\s\S]*?\.optional\(\)/
);

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

console.log('Auth contract parity check passed.');
