import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  resolve(process.cwd(), 'src/services/auth.service.ts'),
  'utf8'
);

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
  const registration = source.slice(
    source.indexOf('export async function registerUserService'),
    source.indexOf('export async function loginUserService')
  );

  assert.match(registration, /mongoose\.startSession\(\)/);
  assert.match(registration, /withTransaction\(async \(\) =>/);

  assert.match(
    registration,
    /User\.create\([\s\S]*\{ session: mongoSession \}/
  );

  assert.match(registration, /Client\.create\([\s\S]*session: mongoSession/);
  assert.match(registration, /Pharmacy\.create\([\s\S]*session: mongoSession/);

  const transactionEnd = registration.indexOf(
    'await mongoSession.endSession()'
  );

  const authSessionBuild = registration.indexOf('buildAuthSessionResult');
  assert.ok(transactionEnd >= 0 && authSessionBuild > transactionEnd);
  assert.match(registration, /AUTH_ERROR_CODES\.REGISTRATION_SESSION_FAILED/);
});

//===================================================================

test('password change and reset revoke sessions in the same Mongo transaction', () => {
  const reset = source.slice(
    source.indexOf('export async function resetPasswordService'),
    source.indexOf('export async function getUserByIdService')
  );

  const update = source.slice(
    source.indexOf('export async function updateUserPasswordService'),
    source.indexOf('export async function getActiveSessionsService')
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
  const login = source.slice(
    source.indexOf('export async function loginUserService'),
    source.indexOf('export async function refreshAuthSessionService')
  );

  assert.doesNotMatch(login, /getAccountNotFoundMessage/);
  assert.match(login, /AUTH_ERROR_CODES\.INVALID_CREDENTIALS/);
  assert.match(login, /DUMMY_PASSWORD_HASH/);

  const passwordComparison = login.indexOf('comparePassword');
  const blockedBranch = login.indexOf('USER_STATUSES.BLOCKED');
  assert.ok(passwordComparison >= 0 && blockedBranch > passwordComparison);
});

//===================================================================

test('refresh rotates tokens, caps sliding expiry with an absolute lifetime, and keeps stale-cookie fallback safe', () => {
  const refresh = source.slice(
    source.indexOf('export async function refreshAuthSessionService'),
    source.indexOf('export async function revokeSessionByRefreshTokenService')
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
  const requestReset = source.slice(
    source.indexOf('export async function requestPasswordResetService'),
    source.indexOf('export async function resetPasswordService')
  );

  const confirmReset = source.slice(
    source.indexOf('export async function resetPasswordService'),
    source.indexOf('export async function getUserByIdService')
  );

  assert.match(requestReset, /createPasswordResetToken/);
  assert.match(requestReset, /hashPasswordResetToken/);
  assert.match(confirmReset, /resetPasswordTokenHash:\s*tokenHash/);

  assert.doesNotMatch(source, /resetPasswordApplication/);
  assert.doesNotMatch(userModelSource, /resetPasswordApplication/);
  assert.doesNotMatch(userTypeSource, /resetPasswordApplication/);
  assert.doesNotMatch(jwtSource, /PasswordResetJwtPayload/);
  assert.doesNotMatch(jwtSource, /signPasswordResetToken/);
  assert.doesNotMatch(jwtSource, /verifyPasswordResetToken/);
});
