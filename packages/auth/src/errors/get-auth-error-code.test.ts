import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorCode } from './get-auth-error-code';

//===================================================================

test('uses stable backend business codes before mutable copy or status', () => {
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

test('classifies stable transport codes and infrastructure status fallbacks', () => {
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

  assert.equal(getAuthErrorCode({ status: 429 }), 'rate_limited');
  assert.equal(getAuthErrorCode({ status: 503 }), 'service_unavailable');
  assert.equal(getAuthErrorCode({ status: 504 }), 'timeout');
});

//===================================================================

test('does not infer auth business semantics from legacy messages or statuses', () => {
  assert.equal(
    getAuthErrorCode({ status: 403, message: 'Request origin is not allowed' }),
    'unknown'
  );

  assert.equal(
    getAuthErrorCode({ status: 401, message: 'Wrong password.' }, 'login'),
    'unknown'
  );

  assert.equal(
    getAuthErrorCode(
      { status: 409, field: 'phone', message: 'Conflict.' },
      'register'
    ),
    'unknown'
  );

  assert.equal(
    getAuthErrorCode(
      { status: 400, message: 'Old reset response.' },
      'reset-password'
    ),
    'validation_error'
  );

  assert.equal(
    getAuthErrorCode({
      status: 401,
      message: 'Authorization token is invalid',
    }),
    'unknown'
  );
});

//===================================================================

test('maps explicit validation and resource codes without status inference', () => {
  assert.equal(
    getAuthErrorCode({ status: 400, code: 'AUTH_VALIDATION_FAILED' }),
    'validation_error'
  );

  assert.equal(
    getAuthErrorCode({ status: 404, code: 'AUTH_RESOURCE_NOT_FOUND' }),
    'not_found'
  );
});
