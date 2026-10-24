import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const root = resolve(process.cwd(), 'src');

const names = [
  'auth-register.service.ts',
  'auth-login.service.ts',
  'auth-sessions.service.ts',
  'auth-password.service.ts',
  'auth-profile.service.ts',
  'auth-session-tokens.ts',
  'auth-user-fields.ts',
] as const;

const pathOf = (name: string) => resolve(root, 'services/auth', name);
const read = (name: string) => readFileSync(pathOf(name), 'utf8');

const controller = readFileSync(
  resolve(root, 'controllers/auth/auth.controller.ts'),
  'utf8'
);

const middleware = readFileSync(
  resolve(root, 'middlewares/auth/auth.middleware.ts'),
  'utf8'
);

//===============================================================

test('S10.4 Auth has no legacy proxy and controllers import canonical services', () => {
  assert.equal(existsSync(pathOf('auth.service.ts')), false);

  assert.equal(
    names.every((name) => existsSync(pathOf(name))),
    true
  );

  assert.doesNotMatch(controller, /services\/auth\/auth\.service['"]/);
  assert.doesNotMatch(middleware, /services\/auth\/auth\.service['"]/);

  for (const name of names.slice(0, 5)) {
    assert.match(
      controller + middleware,
      new RegExp(name.replace(/\.ts$/, ''))
    );
  }

  assert.match(
    read('auth-register.service.ts'),
    /export async function registerUserService/
  );

  assert.match(
    read('auth-login.service.ts'),
    /export async function loginUserService/
  );

  assert.match(
    read('auth-password.service.ts'),
    /export async function resetPasswordService/
  );

  assert.match(
    read('auth-profile.service.ts'),
    /export async function updateUserProfileService/
  );

  assert.match(
    read('auth-sessions.service.ts'),
    /export async function refreshAuthSessionService/
  );
});

//===============================================================

test('S10.4 Auth canonical modules have a cycle-free graph and valid local paths', () => {
  const graph = new Map<string, string[]>();

  for (const name of names) {
    const src = read(name);
    const edges: string[] = [];

    for (const [, specifier] of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = resolve(dirname(pathOf(name)), `${specifier}.ts`);

      assert.ok(existsSync(target), `Missing ${specifier} in ${name}`);

      const base = target.split(/[\\/]/).at(-1) ?? '';

      if (names.some((entry) => entry === base)) edges.push(base);
    }

    graph.set(name, edges);
    assert.doesNotMatch(src, /from\s+['"]\.\/auth\.service['"]/);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (name: string) => {
    assert.ok(!visiting.has(name), `Auth module cycle at ${name}`);

    if (visited.has(name)) return;

    visiting.add(name);

    for (const edge of graph.get(name) ?? []) walk(edge);

    visiting.delete(name);
    visited.add(name);
  };

  for (const name of names) walk(name);
});

//===============================================================

test('S10.4 registration remains atomic while session creation runs after commit', () => {
  const register = read('auth-register.service.ts');
  const transaction = register.indexOf('mongoSession.withTransaction(');
  const ownerDocs = register.indexOf('claimRegistrationOwnerDocuments(');
  const audit = register.indexOf('PHARMACY_OWNER_ACCOUNT_CREATED');
  const end = register.indexOf('await mongoSession.endSession()');
  const session = register.lastIndexOf('buildAuthSessionResult(');

  assert.ok(transaction >= 0 && ownerDocs > transaction && audit > ownerDocs);
  assert.ok(audit < end && session > end);

  assert.match(register, /REGISTRATION_SESSION_FAILED/);
  assert.doesNotMatch(register, /Pharmacy\.create\(/);
});

//===============================================================

test('S10.4 password revocation, anti-enumeration, and refresh reuse protections remain', () => {
  const password = read('auth-password.service.ts');
  const login = read('auth-login.service.ts');
  const sessions = read('auth-sessions.service.ts');

  assert.match(password, /withTransaction\(async \(\) =>/);

  assert.match(
    password,
    /revokeAllUserSessionsService\([\s\S]*?'password_changed'[\s\S]*?session/
  );

  assert.match(
    password,
    /enforcePasswordResetResponseTiming\(responseStartedAt\)/
  );

  assert.match(login, /DUMMY_PASSWORD_HASH/);
  assert.match(login, /comparePassword\(input\.password, passwordHash\)/);
  assert.match(sessions, /REFRESH_TOKEN_ROTATION_GRACE_MS/);
  assert.match(sessions, /previousRefreshTokenValidUntil/);
  assert.match(sessions, /revokedReason: 'token_reuse'/);
  assert.match(sessions, /absoluteExpiresAt/);
});
