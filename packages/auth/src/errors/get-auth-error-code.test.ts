import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorCode } from './get-auth-error-code';

//===================================================================

test('uses stable backend business codes before mutable copy', () => {
  assert.equal(
    getAuthErrorCode({
      status: 403,
      message: 'The word phone appears here but is irrelevant.',
      payload: { code: 'AUTH_USER_BLOCKED' },
    }),
    'account_blocked'
  );

  assert.equal(
    getAuthErrorCode({
      status: 409,
      message: 'Email conflict copy changed.',
      payload: { code: 'AUTH_PHONE_CONFLICT' },
    }),
    'phone_conflict'
  );

  assert.equal(
    getAuthErrorCode({
      status: 500,
      message: 'Automatic sign-in failed.',
      payload: { code: 'AUTH_REGISTRATION_SESSION_FAILED' },
    }),
    'registration_session_failed'
  );
});

//===================================================================

test('classifies stable transport codes', () => {
  assert.equal(getAuthErrorCode({ code: 'GATEWAY_TIMEOUT' }), 'timeout');

  assert.equal(
    getAuthErrorCode({ code: 'INVALID_BACKEND_RESPONSE' }),
    'invalid_response'
  );

  assert.equal(
    getAuthErrorCode({ code: 'BAD_GATEWAY' }),
    'service_unavailable'
  );

  assert.equal(
    getAuthErrorCode({ code: 'CSRF_VALIDATION_FAILED' }),
    'csrf_failed'
  );
});

//===================================================================

test('does not classify arbitrary 403 copy as a blocked session', () => {
  assert.equal(
    getAuthErrorCode({ status: 403, message: 'Role access is forbidden.' }),
    'unknown'
  );

  assert.equal(
    getAuthErrorCode({ status: 403, message: 'Request origin is not allowed' }),
    'forbidden_origin'
  );
});

//===================================================================

test('uses narrow context fallbacks for legacy responses', () => {
  assert.equal(
    getAuthErrorCode({ status: 401, message: 'Wrong password.' }, 'login'),
    'invalid_credentials'
  );

  assert.equal(
    getAuthErrorCode(
      { status: 409, field: 'phone', message: 'Conflict.' },
      'register'
    ),
    'phone_conflict'
  );

  assert.equal(
    getAuthErrorCode(
      { status: 400, message: 'Old reset response.' },
      'reset-password'
    ),
    'invalid_reset_token'
  );
});
