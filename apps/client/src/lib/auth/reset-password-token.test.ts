import assert from 'node:assert/strict';
import test from 'node:test';

import { captureResetPasswordToken } from './reset-password-token';

//===================================================================

test('captures a fragment reset token and removes it from the visible URL', () => {
  const result = captureResetPasswordToken(
    'https://client.example.com/reset-password#token=secret-token'
  );

  assert.deepEqual(result, {
    token: 'secret-token',
    sanitizedUrl: '/reset-password',
  });
  assert.equal(result.sanitizedUrl.includes('secret-token'), false);
});

//===================================================================

test('scrubs legacy query tokens while preserving unrelated URL state', () => {
  const result = captureResetPasswordToken(
    'https://client.example.com/reset-password?token=legacy&source=email#section'
  );

  assert.equal(result.token, 'legacy');
  assert.equal(result.sanitizedUrl, '/reset-password?source=email#section');
  assert.equal(result.sanitizedUrl.includes('legacy'), false);
});

//===================================================================

test('prefers the new fragment token and scrubs both token locations', () => {
  const result = captureResetPasswordToken(
    'https://client.example.com/reset-password?token=old#token=new&source=email'
  );

  assert.equal(result.token, 'new');
  assert.equal(result.sanitizedUrl, '/reset-password#source=email');
});
