import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';

import {
  getClientAuthErrorMessage,
  getClientPasswordChangeErrorMessage,
} from './auth-error-messages';

//===================================================================

test('auth UI copy ignores arbitrary exception messages', () => {
  const error = new Error('MongoServerError: internal topology details');
  const code = getAuthErrorCode(error, 'forgot-password');

  assert.equal(code, 'unknown');
  assert.equal(
    getClientAuthErrorMessage(code),
    'Something went wrong. Please try again.'
  );

  assert.equal(
    getClientAuthErrorMessage(code).includes('MongoServerError'),
    false
  );

  assert.equal(
    getClientAuthErrorMessage(
      getAuthErrorCode({ status: 429, payload: { code: 'AUTH_RATE_LIMITED' } })
    ),
    'Too many attempts. Please try again later.'
  );
});

//===================================================================

test('password change maps stable credential code to allowlisted copy', () => {
  const code = getAuthErrorCode({
    status: 401,
    payload: { code: 'AUTH_INVALID_CREDENTIALS' },
    message: 'Internal password verifier details',
  });

  assert.equal(code, 'invalid_credentials');
  
  assert.equal(
    getClientPasswordChangeErrorMessage(code),
    'Current password is incorrect.'
  );
});
