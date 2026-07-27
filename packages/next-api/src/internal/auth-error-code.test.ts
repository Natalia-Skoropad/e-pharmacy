import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAuthErrorCodeFromBody,
  isInvalidatingAuthErrorCode,
  responseInvalidatesAuthSession,
} from './auth-error-code';

//===================================================================

test('reads only structured auth codes from JSON response bodies', () => {
  assert.equal(
    getAuthErrorCodeFromBody(
      JSON.stringify({ code: 'AUTH_SESSION_REVOKED', message: 'Changed copy' })
    ),
    'AUTH_SESSION_REVOKED'
  );
  assert.equal(getAuthErrorCodeFromBody('not-json'), null);
  assert.equal(getAuthErrorCodeFromBody(JSON.stringify({ message: 'blocked' })), null);
});

//===================================================================

test('invalidates cookies only for stable session lifecycle codes', () => {
  assert.equal(isInvalidatingAuthErrorCode('AUTH_SESSION_INVALID'), true);
  assert.equal(isInvalidatingAuthErrorCode('AUTH_SESSION_REVOKED'), true);
  assert.equal(isInvalidatingAuthErrorCode('AUTH_USER_BLOCKED'), true);
  assert.equal(isInvalidatingAuthErrorCode('AUTH_FORBIDDEN_ORIGIN'), false);
  assert.equal(isInvalidatingAuthErrorCode('AUTH_CSRF_FAILED'), false);
  assert.equal(isInvalidatingAuthErrorCode(null), false);
});

//===================================================================

test('evaluates backend responses by code rather than HTTP status alone', async () => {
  const blocked = new Response(
    JSON.stringify({ code: 'AUTH_USER_BLOCKED' }),
    { status: 403 }
  );
  const forbiddenOrigin = new Response(
    JSON.stringify({ code: 'AUTH_FORBIDDEN_ORIGIN' }),
    { status: 403 }
  );

  assert.equal(await responseInvalidatesAuthSession(blocked), true);
  assert.equal(await responseInvalidatesAuthSession(forbiddenOrigin), false);
});
