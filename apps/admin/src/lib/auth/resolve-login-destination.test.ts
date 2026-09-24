import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAdminLoginDestination } from './resolve-login-destination';

//===================================================================

test('uses admin profile as the direct-login destination', () => {
  assert.equal(resolveAdminLoginDestination(null), '/admin/profile');
});

//===================================================================

test('preserves a trusted internal admin redirect', () => {
  assert.equal(
    resolveAdminLoginDestination('/admin/settings/activity?page=2'),
    '/admin/settings/activity?page=2'
  );
});

//===================================================================

test('rejects external and non-admin redirects', () => {
  for (const candidate of [
    'https://evil.example/admin/profile',
    '//evil.example/admin/profile',
    '/login',
    '/password-recovery',
    '/client/profile',
  ]) {
    assert.equal(resolveAdminLoginDestination(candidate), '/admin/profile');
  }
});
