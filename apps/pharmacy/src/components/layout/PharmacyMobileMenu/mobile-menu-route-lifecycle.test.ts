import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldCloseMobileMenuForPathnameChange } from './mobile-menu-route-lifecycle';

//===================================================================

test('pathname navigation and browser Back/Forward close an open mobile menu', () => {
  assert.equal(
    shouldCloseMobileMenuForPathnameChange(
      '/pharmacy/orders/507f1f77bcf86cd799439011',
      '/pharmacy/clients'
    ),
    true
  );

  assert.equal(
    shouldCloseMobileMenuForPathnameChange(
      '/pharmacy/clients',
      '/pharmacy/orders/507f1f77bcf86cd799439011'
    ),
    true
  );
});

//===================================================================

test('same-path navigation does not rely on the pathname effect to close the menu', () => {
  assert.equal(
    shouldCloseMobileMenuForPathnameChange(
      '/pharmacy/orders',
      '/pharmacy/orders'
    ),

    false
  );
});
