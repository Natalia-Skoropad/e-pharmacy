import assert from 'node:assert/strict';
import test from 'node:test';

import {
  captureResetPasswordToken,
  clearResetPasswordTokenFromHistoryState,
} from './reset-password-token';

//===================================================================

test('captures a fragment reset token and removes it from the visible URL', () => {
  const result = captureResetPasswordToken(
    'https://client.example.com/reset-password#token=secret-token'
  );

  assert.equal(result.token, 'secret-token');
  assert.equal(result.sanitizedUrl, '/reset-password');
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

test('prefers the fragment token and scrubs both token locations', () => {
  const result = captureResetPasswordToken(
    'https://client.example.com/reset-password?token=old#token=new&source=email'
  );

  assert.equal(result.token, 'new');
  assert.equal(result.sanitizedUrl, '/reset-password#source=email');
});

//===================================================================

test('keeps the captured token across a reset-page remount after URL cleanup', () => {
  const firstCapture = captureResetPasswordToken(
    'https://client.example.com/reset-password?token=secret-token'
  );

  const remountedCapture = captureResetPasswordToken(
    `https://client.example.com${firstCapture.sanitizedUrl}`,
    firstCapture.historyState
  );

  assert.equal(remountedCapture.token, 'secret-token');
  assert.equal(remountedCapture.sanitizedUrl, '/reset-password');
});

//===================================================================

test('clears the in-memory history token after a successful reset', () => {
  const captured = captureResetPasswordToken(
    'https://client.example.com/reset-password#token=secret-token',
    { nextInternalState: 'preserve-me' }
  );

  const clearedState = clearResetPasswordTokenFromHistoryState(
    captured.historyState
  );
  const afterSuccess = captureResetPasswordToken(
    'https://client.example.com/reset-password',
    clearedState
  );

  assert.equal(afterSuccess.token, '');
  assert.deepEqual(clearedState, { nextInternalState: 'preserve-me' });
});
