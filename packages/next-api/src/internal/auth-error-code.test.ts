import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAuthErrorCodeFromBody,
  isInvalidatingAuthErrorCode,
  isRefreshableAuthErrorCode,
  responseInvalidatesAuthSession,
  responseRequiresAuthRefresh,
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
  assert.equal(
    getAuthErrorCodeFromBody(JSON.stringify({ message: 'blocked' })),
    null
  );
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

test('refreshes only stable session-invalid 401 responses', async () => {
  assert.equal(isRefreshableAuthErrorCode('AUTH_SESSION_INVALID'), true);
  assert.equal(isRefreshableAuthErrorCode('AUTH_INVALID_CREDENTIALS'), false);
  assert.equal(isRefreshableAuthErrorCode('AUTH_SESSION_REVOKED'), false);

  const expiredSession = new Response(
    JSON.stringify({ code: 'AUTH_SESSION_INVALID' }),
    { status: 401 }
  );
  const wrongPassword = new Response(
    JSON.stringify({ code: 'AUTH_INVALID_CREDENTIALS' }),
    { status: 401 }
  );
  const misleadingStatus = new Response(
    JSON.stringify({ code: 'AUTH_SESSION_INVALID' }),
    { status: 409 }
  );

  assert.equal(await responseRequiresAuthRefresh(expiredSession), true);
  assert.equal(await responseRequiresAuthRefresh(wrongPassword), false);
  assert.equal(await responseRequiresAuthRefresh(misleadingStatus), false);
});

//===================================================================

test('evaluates backend responses by code rather than HTTP status alone', async () => {
  const blocked = new Response(JSON.stringify({ code: 'AUTH_USER_BLOCKED' }), {
    status: 403,
  });

  const forbiddenOrigin = new Response(
    JSON.stringify({ code: 'AUTH_FORBIDDEN_ORIGIN' }),
    { status: 403 }
  );

  assert.equal(await responseInvalidatesAuthSession(blocked), true);
  assert.equal(await responseInvalidatesAuthSession(forbiddenOrigin), false);
});
