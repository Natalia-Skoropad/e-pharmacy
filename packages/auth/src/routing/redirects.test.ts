import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSafeApplicationRedirectPath,
  getSafeLocalRedirectPath,
  getTrustedExternalRedirectUrl,
} from './redirects';

//===================================================================

test('accepts normalized local paths with query and hash', () => {
  assert.equal(
    getSafeLocalRedirectPath('/profile/orders?page=2#latest'),
    '/profile/orders?page=2#latest'
  );
});

//===================================================================

test('rejects traversal, protocol-relative and encoded control paths', () => {
  const unsafePaths = [
    '/profile/../admin',
    '/profile/%2e%2e/admin',
    '/profile/%252e%252e/admin',
    '/%0Aprofile',
    '/%250Aprofile',
    '//evil.example',
    '/profile\\admin',
    '/profile%2Fadmin',
    '/profile%252Fadmin',
    '/profile/%',
  ];

  unsafePaths.forEach((path) => {
    assert.equal(getSafeLocalRedirectPath(path, '/fallback'), '/fallback');
  });
});

//===================================================================

test('enforces application route roots without prefix collisions', () => {
  const options = {
    allowedPrefixes: ['/profile', '/checkout'],
    fallbackPath: '/profile',
  } as const;

  assert.equal(
    getSafeApplicationRedirectPath('/profile/orders/1', options),
    '/profile/orders/1'
  );
  assert.equal(
    getSafeApplicationRedirectPath('/profile-admin', options),
    '/profile'
  );
  assert.equal(
    getSafeApplicationRedirectPath('/profile/../admin', options),
    '/profile'
  );
});

//===================================================================

test('allows only trusted external origins and path roots', () => {
  const options = {
    allowedOrigins: ['https://pharmacy.example.com'],
    allowedPathPrefixes: ['/pharmacy'],
  } as const;

  assert.equal(
    getTrustedExternalRedirectUrl(
      'https://pharmacy.example.com/pharmacy/dashboard?tab=orders',
      options
    ),
    'https://pharmacy.example.com/pharmacy/dashboard?tab=orders'
  );

  assert.equal(
    getTrustedExternalRedirectUrl(
      'https://pharmacy.example.com/pharmacy/dashboard?redirect=https%3A%2F%2Fclient.example.com%2Fprofile',
      options
    ),
    'https://pharmacy.example.com/pharmacy/dashboard?redirect=https%3A%2F%2Fclient.example.com%2Fprofile'
  );

  assert.equal(
    getTrustedExternalRedirectUrl(
      'https://evil.example/pharmacy/dashboard',
      options
    ),
    null
  );

  assert.equal(
    getTrustedExternalRedirectUrl(
      'https://pharmacy.example.com/pharmacy/../admin',
      options
    ),
    null
  );

  assert.equal(
    getTrustedExternalRedirectUrl(
      'https://user:password@pharmacy.example.com/pharmacy/dashboard',
      options
    ),
    null
  );
});
