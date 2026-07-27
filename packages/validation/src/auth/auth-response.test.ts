import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InvalidAuthResponseError,
  parseAuthResponse,
} from './auth-response';

//===================================================================

const VALID_RESPONSE = {
  user: {
    id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+380501112233',
    role: 'client',
    status: 'active',
    address: 'Kyiv',
    pictureUrl: 'https://images.example/user.png',
  },
} as const;

//===================================================================

test('parses a complete AuthResponse at the browser boundary', () => {
  assert.deepEqual(parseAuthResponse(VALID_RESPONSE), VALID_RESPONSE);
});

//===================================================================

test('accepts every declared role and status combination', () => {
  for (const role of ['client', 'pharmacy', 'admin'] as const) {
    for (const status of ['active', 'blocked'] as const) {
      const response = parseAuthResponse({
        user: { ...VALID_RESPONSE.user, role, status },
      });

      assert.equal(response.user.role, role);
      assert.equal(response.user.status, status);
    }
  }
});

//===================================================================

test('rejects malformed users before they reach AuthProviderCore', () => {
  const malformedResponses = [
    null,
    {},
    { user: null },
    { user: { ...VALID_RESPONSE.user, id: '' } },
    { user: { ...VALID_RESPONSE.user, email: 42 } },
    { user: { ...VALID_RESPONSE.user, role: 'supplier' } },
    { user: { ...VALID_RESPONSE.user, status: 'pending' } },
    { user: { ...VALID_RESPONSE.user, pictureUrl: false } },
  ];

  for (const response of malformedResponses) {
    assert.throws(
      () => parseAuthResponse(response),
      (error: unknown) =>
        error instanceof InvalidAuthResponseError &&
        error.code === 'AUTH_INVALID_RESPONSE' &&
        error.status === 502
    );
  }
});

//===================================================================

test('does not preserve unverified response fields', () => {
  const parsed = parseAuthResponse({
    ...VALID_RESPONSE,
    user: {
      ...VALID_RESPONSE.user,
      accessToken: 'must-not-reach-the-provider',
      refreshToken: 'must-not-reach-the-provider',
    },
  });

  assert.equal('accessToken' in parsed.user, false);
  assert.equal('refreshToken' in parsed.user, false);
});
