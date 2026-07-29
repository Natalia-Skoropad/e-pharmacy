import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentLocation,
  resolveGuardNavigationDestination,
} from './guard-navigation';

//===================================================================

test('builds the current route including query and hash', () => {
  assert.equal(
    buildCurrentLocation({
      pathname: '/profile',
      queryString: 'tab=sessions',
      hash: '#current',
    }),
    '/profile?tab=sessions#current'
  );
});

//===================================================================

test('keeps local destinations local and normalized', () => {
  assert.deepEqual(
    resolveGuardNavigationDestination({
      candidate: '/profile/orders',
      localFallback: '/',
    }),
    { type: 'local', href: '/profile/orders' }
  );

  assert.deepEqual(
    resolveGuardNavigationDestination({
      candidate: '/profile/../admin',
      localFallback: '/',
    }),

    { type: 'local', href: '/' }
  );
});

//===================================================================

test('requires an application resolver for external navigation', () => {
  const candidate = 'https://pharmacy.example.com/pharmacy/dashboard';

  assert.deepEqual(
    resolveGuardNavigationDestination({ candidate, localFallback: '/' }),
    { type: 'local', href: '/' }
  );

  assert.deepEqual(
    resolveGuardNavigationDestination({
      candidate,
      localFallback: '/',
      resolveExternalRedirect: (value) =>
        value.startsWith('https://pharmacy.example.com/') ? value : null,
    }),

    { type: 'external', href: candidate }
  );
});
