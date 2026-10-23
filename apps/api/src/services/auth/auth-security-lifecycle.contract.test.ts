import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const readAuthModule = (name: string): string =>
  readFileSync(resolve(process.cwd(), 'src/services/auth', name), 'utf8');

const registration = readAuthModule('auth-register.service.ts');
const login = readAuthModule('auth-login.service.ts');
const sessions = readAuthModule('auth-sessions.service.ts');
const passwords = readAuthModule('auth-password.service.ts');

const userModelSource = readFileSync(
  resolve(process.cwd(), 'src/models/user.model.ts'),
  'utf8'
);

const userTypeSource = readFileSync(
  resolve(process.cwd(), 'src/types/user.ts'),
  'utf8'
);

const jwtSource = readFileSync(
  resolve(process.cwd(), 'src/utils/jwt.ts'),
  'utf8'
);

//===================================================================

test('registration commits User and role profile before creating a browser session', () => {
  assert.match(registration, /mongoose\.startSession\(\)/);
  assert.match(registration, /withTransaction\(async \(\) =>/);

  assert.match(
    registration,
    /User\.create\([\s\S]*\{ session: mongoSession \}/
  );

  assert.match(registration, /Client\.create\([\s\S]*session: mongoSession/);
  assert.doesNotMatch(registration, /Pharmacy\.create\(/);
  assert.match(registration, /claimRegistrationOwnerDocuments\(/);
  assert.match(registration, /PHARMACY_OWNER_ACCOUNT_CREATED/);
  assert.match(registration, /PHARMACY_OWNER_REGISTRATION_DOCUMENTS_ATTACHED/);

  assert.match(
    registration,
    /appendAdminAuditLog\([\s\S]*session: mongoSession/
  );

  const transactionEnd = registration.indexOf(
    'await mongoSession.endSession()'
  );

  const accountAudit = registration.indexOf('PHARMACY_OWNER_ACCOUNT_CREATED');

  const documentsAudit = registration.indexOf(
    'PHARMACY_OWNER_REGISTRATION_DOCUMENTS_ATTACHED'
  );

  const authSessionBuild = registration.lastIndexOf('buildAuthSessionResult');

  assert.ok(accountAudit >= 0 && accountAudit < transactionEnd);
  assert.ok(documentsAudit >= 0 && documentsAudit < transactionEnd);
  assert.ok(transactionEnd >= 0 && authSessionBuild > transactionEnd);
  assert.match(registration, /AUTH_ERROR_CODES\.REGISTRATION_SESSION_FAILED/);
});

//===================================================================

test('password change and reset revoke sessions in the same Mongo transaction', () => {
  const reset = passwords.slice(
    passwords.indexOf('export async function resetPasswordService')
  );

  const update = passwords.slice(
    passwords.indexOf('export async function updateUserPasswordService')
  );

  assert.match(reset, /withTransaction/);
  assert.match(reset, /User\.findOneAndUpdate/);
  assert.match(reset, /resetPasswordTokenHash:\s*tokenHash/);
  assert.match(reset, /revokeAllUserSessionsService\([\s\S]*session/);

  assert.match(update, /withTransaction/);
  assert.match(update, /user\.save\(\{ session \}\)/);
  assert.match(update, /revokeAllUserSessionsService\([\s\S]*session/);
});

//===================================================================

test('login does not branch on application-specific copy before credential proof', () => {
  assert.doesNotMatch(login, /getAccountNotFoundMessage/);
  assert.match(login, /AUTH_ERROR_CODES\.INVALID_CREDENTIALS/);
  assert.match(login, /DUMMY_PASSWORD_HASH/);

  const passwordComparison = login.indexOf('comparePassword');
  const blockedBranch = login.indexOf('USER_STATUSES.BLOCKED');

  assert.ok(passwordComparison >= 0 && blockedBranch > passwordComparison);
});

//===================================================================

test('refresh rotates tokens, caps sliding expiry with an absolute lifetime, and keeps stale-cookie fallback safe', () => {
  const refresh = sessions.slice(
    sessions.indexOf('export async function refreshAuthSessionService'),
    sessions.indexOf('export async function revokeSessionByRefreshTokenService')
  );

  assert.match(refresh, /deriveRotatedRefreshToken/);
  assert.match(refresh, /previousRefreshTokenHash/);
  assert.match(refresh, /previousRefreshTokenValidUntil/);
  assert.match(refresh, /absoluteExpiresAt/);
  assert.match(refresh, /revokedReason:\s*'token_reuse'/);
  assert.match(refresh, /!matchesCurrentToken && !matchesPreviousToken/);
  assert.match(refresh, /AUTH_ERROR_CODES\.SESSION_INVALID/);

  assert.doesNotMatch(
    refresh,
    /session\.expiresAt\s*=\s*getRefreshTokenExpiresAt/
  );
});

//===================================================================

test('password reset uses only opaque hashed reset secrets without stale application/JWT semantics', () => {
  const requestReset = passwords.slice(
    passwords.indexOf('export async function requestPasswordResetService'),
    passwords.indexOf('export async function resetPasswordService')
  );

  const confirmReset = passwords.slice(
    passwords.indexOf('export async function resetPasswordService')
  );

  assert.match(requestReset, /createPasswordResetToken/);
  assert.match(requestReset, /hashPasswordResetToken/);
  assert.match(confirmReset, /resetPasswordTokenHash:\s*tokenHash/);

  assert.doesNotMatch(passwords, /resetPasswordApplication/);
  assert.doesNotMatch(userModelSource, /resetPasswordApplication/);
  assert.doesNotMatch(userTypeSource, /resetPasswordApplication/);
  assert.doesNotMatch(jwtSource, /PasswordResetJwtPayload/);
  assert.doesNotMatch(jwtSource, /signPasswordResetToken/);
  assert.doesNotMatch(jwtSource, /verifyPasswordResetToken/);
});
