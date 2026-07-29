import assert from 'node:assert/strict';
import test from 'node:test';

import { getGuestGuardDecision, getRoleGuardDecision } from './guard-state';

//===================================================================

test('guest guard makes auth-unavailable behavior explicit', () => {
  assert.equal(
    getGuestGuardDecision({
      isBootstrapping: false,
      isUnavailable: true,
      isAuthenticated: false,
      allowGuestContentWhenUnavailable: false,
    }),

    'unavailable-fallback'
  );

  assert.equal(
    getGuestGuardDecision({
      isBootstrapping: false,
      isUnavailable: true,
      isAuthenticated: false,
      allowGuestContentWhenUnavailable: true,
    }),

    'unavailable-guest-content'
  );
});

//===================================================================

test('role guard distinguishes loading, unavailable, login, forbidden, and allowed states', () => {
  const cases = [
    [true, false, false, false, 'loading'],
    [false, true, false, false, 'unavailable'],
    [false, false, false, false, 'redirect-login'],
    [false, false, true, false, 'forbidden'],
    [false, false, true, true, 'allow'],
  ] as const;

  for (const [
    isBootstrapping,
    isUnavailable,
    isAuthenticated,
    hasAllowedRole,
    expected,
  ] of cases) {
    assert.equal(
      getRoleGuardDecision({
        isBootstrapping,
        isUnavailable,
        isAuthenticated,
        hasAllowedRole,
      }),
      expected
    );
  }
});
