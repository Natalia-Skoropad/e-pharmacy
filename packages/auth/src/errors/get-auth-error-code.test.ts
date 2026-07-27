import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorCode } from './get-auth-error-code';

//===================================================================

test('uses stable backend business codes before mutable messages', () => {
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
});

//===================================================================

test('classifies transport failures by stable transport code', () => {
  assert.equal(getAuthErrorCode({ code: 'TIMEOUT' }), 'timeout');
  assert.equal(
    getAuthErrorCode({ code: 'INVALID_RESPONSE' }),
    'invalid_response'
  );
  assert.equal(getAuthErrorCode({ code: 'NETWORK_ERROR' }), 'network_error');
});

//===================================================================

test('keeps message matching only as a legacy fallback', () => {
  assert.equal(
    getAuthErrorCode({ status: 403, message: 'Account is blocked.' }),
    'account_blocked'
  );
  assert.equal(
    getAuthErrorCode({ status: 401, message: 'Wrong password.' }, 'login'),
    'invalid_credentials'
  );
});
